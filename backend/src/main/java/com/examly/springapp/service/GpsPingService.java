package com.examly.springapp.service;

import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.model.GeoFenceAlert;
import com.examly.springapp.model.GpsPing;
import com.examly.springapp.model.Vehicle;
import com.examly.springapp.model.dto.GpsPingRequest;
import com.examly.springapp.repository.GpsPingRepository;
import com.examly.springapp.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * GPS ping ingestion with outlier rejection and event classification
 * (SPEEDING, IDLE, HARSH_BRAKE, GEO_EXIT; SRS 1.2 driver behaviour monitoring).
 */
@Service
public class GpsPingService {

    private static final BigDecimal HARSH_BRAKE_SPEED_DROP_KMH = new BigDecimal("25");
    private static final BigDecimal IDLE_SPEED_KMH = new BigDecimal("0.5");

    @Autowired
    private GpsPingRepository gpsPingRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private GeoFenceService geoFenceService;

    @Value("${fleet.speeding-threshold-kmh:80}")
    private int speedingThresholdKmh;

    /**
     * Ingest a ping: validate bounds, classify the event, detect geofence crossings.
     * Outlier coordinates are rejected before storage (SRS 2.5).
     * @param request ping payload
     * @return the stored ping
     */
    @Transactional
    public GpsPing ingestPing(GpsPingRequest request) {
        validateCoordinates(request);

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));

        LocalDateTime recordedAt = request.getRecordedAt() != null ? request.getRecordedAt() : LocalDateTime.now();
        Optional<GpsPing> previous = gpsPingRepository.findTopByVehicleIdOrderByRecordedAtDesc(vehicle.getId());

        GpsPing ping = new GpsPing();
        ping.setVehicle(vehicle);
        ping.setLatitude(request.getLatitude());
        ping.setLongitude(request.getLongitude());
        ping.setSpeedKmh(request.getSpeedKmh() != null ? request.getSpeedKmh() : BigDecimal.ZERO);
        ping.setRecordedAt(recordedAt);
        ping.setEventType(classifyEvent(request.getSpeedKmh() != null ? request.getSpeedKmh() : BigDecimal.ZERO,
                previous, recordedAt));

        List<GeoFenceAlert> alerts = geoFenceService.detectCrossings(ping, vehicle);
        boolean exitedFence = alerts.stream().anyMatch(a -> a.getAlertType() == GeoFenceAlert.AlertType.EXIT);
        if (exitedFence) {
            ping.setEventType(GpsPing.EventType.GEO_EXIT);
        }

        return gpsPingRepository.save(ping);
    }

    /**
     * Reject out-of-range coordinates before storage (SRS 2.5).
     */
    private void validateCoordinates(GpsPingRequest request) {
        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new IllegalArgumentException("Latitude and longitude are required");
        }
        if (request.getLatitude().compareTo(BigDecimal.valueOf(-90)) < 0
                || request.getLatitude().compareTo(BigDecimal.valueOf(90)) > 0) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        if (request.getLongitude().compareTo(BigDecimal.valueOf(-180)) < 0
                || request.getLongitude().compareTo(BigDecimal.valueOf(180)) > 0) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
        if (request.getSpeedKmh() != null && request.getSpeedKmh().signum() < 0) {
            throw new IllegalArgumentException("Speed must be positive");
        }
    }

    /**
     * Classify event type from current speed, previous speed and time delta.
     */
    GpsPing.EventType classifyEvent(BigDecimal speedKmh, Optional<GpsPing> previous, LocalDateTime recordedAt) {
        if (speedKmh.compareTo(BigDecimal.valueOf(speedingThresholdKmh)) >= 0) {
            return GpsPing.EventType.SPEEDING;
        }
        if (previous.isPresent() && previous.get().getRecordedAt() != null) {
            GpsPing prev = previous.get();
            long seconds = Duration.between(prev.getRecordedAt(), recordedAt).getSeconds();
            BigDecimal speedDrop = prev.getSpeedKmh().subtract(speedKmh);
            if (seconds > 0 && speedDrop.compareTo(HARSH_BRAKE_SPEED_DROP_KMH) >= 0) {
                return GpsPing.EventType.HARSH_BRAKE;
            }
        }
        if (speedKmh.compareTo(IDLE_SPEED_KMH) <= 0) {
            return GpsPing.EventType.IDLE;
        }
        return GpsPing.EventType.NORMAL;
    }

    public List<GpsPing> getHistory(Long vehicleId) {
        if (!vehicleRepository.existsById(vehicleId)) {
            throw new ResourceNotFoundException("Vehicle not found with id: " + vehicleId);
        }
        return gpsPingRepository.findByVehicleIdOrderByRecordedAtDesc(vehicleId);
    }

    public GpsPing getLatestPing(Long vehicleId) {
        return gpsPingRepository.findTopByVehicleIdOrderByRecordedAtDesc(vehicleId).orElse(null);
    }
}
