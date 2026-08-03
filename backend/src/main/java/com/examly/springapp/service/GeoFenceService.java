package com.examly.springapp.service;

import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.model.GeoFence;
import com.examly.springapp.model.GeoFenceAlert;
import com.examly.springapp.model.GpsPing;
import com.examly.springapp.model.Vehicle;
import com.examly.springapp.model.dto.GeoFenceRequest;
import com.examly.springapp.repository.GeoFenceAlertRepository;
import com.examly.springapp.repository.GeoFenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

 


@Service
public class GeoFenceService {

    private final Map<Long, Map<Long, Boolean>> insideState = new ConcurrentHashMap<>();

    @Autowired
    private GeoFenceRepository geoFenceRepository;

    @Autowired
    private GeoFenceAlertRepository geoFenceAlertRepository;

    @Transactional
    public GeoFence createGeoFence(GeoFenceRequest request) {
        GeoFence fence = new GeoFence();
        fence.setName(request.getName());
        fence.setLatitude(request.getLatitude());
        fence.setLongitude(request.getLongitude());
        fence.setRadiusKm(request.getRadiusKm());
        return geoFenceRepository.save(fence);
    }

    public List<GeoFence> getAllGeoFences() {
        return geoFenceRepository.findAll();
    }

    public GeoFence getGeoFence(Long id) {
        return geoFenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GeoFence not found with id: " + id));
    }

    @Transactional
    public GeoFence updateGeoFence(Long id, GeoFenceRequest request) {
        GeoFence fence = getGeoFence(id);
        fence.setName(request.getName());
        fence.setLatitude(request.getLatitude());
        fence.setLongitude(request.getLongitude());
        fence.setRadiusKm(request.getRadiusKm());
        return geoFenceRepository.save(fence);
    }

    @Transactional
    public void deleteGeoFence(Long id) {
        GeoFence fence = getGeoFence(id);
        geoFenceAlertRepository.deleteByGeofenceId(id);
        geoFenceRepository.delete(fence);
    }

     






    @Transactional
    public List<GeoFenceAlert> detectCrossings(GpsPing ping, Vehicle vehicle) {
        List<GeoFenceAlert> alerts = new ArrayList<>();
        List<GeoFence> fences = geoFenceRepository.findAll();
        if (fences.isEmpty()) {
            return alerts;
        }
        LocalDateTime now = ping.getRecordedAt() != null ? ping.getRecordedAt() : LocalDateTime.now();
        Map<Long, Boolean> vehicleState = insideState.computeIfAbsent(vehicle.getId(), k -> new ConcurrentHashMap<>());

        for (GeoFence fence : fences) {
            boolean inside = GeoUtils.isInside(fence.getLatitude(), fence.getLongitude(),
                    fence.getRadiusKm(), ping.getLatitude(), ping.getLongitude());
            Boolean previous = vehicleState.put(fence.getId(), inside);
            if (previous == null) {
                continue;
            }
            if (inside && !previous) {
                GeoFenceAlert alert = new GeoFenceAlert();
                alert.setVehicle(vehicle);
                alert.setGeofence(fence);
                alert.setAlertType(GeoFenceAlert.AlertType.ENTRY);
                alert.setTimestamp(now);
                alerts.add(geoFenceAlertRepository.save(alert));
            } else if (!inside && previous) {
                GeoFenceAlert alert = new GeoFenceAlert();
                alert.setVehicle(vehicle);
                alert.setGeofence(fence);
                alert.setAlertType(GeoFenceAlert.AlertType.EXIT);
                alert.setTimestamp(now);
                alerts.add(geoFenceAlertRepository.save(alert));
            }
        }
        return alerts;
    }

    public List<GeoFenceAlert> getAllAlerts() {
        return geoFenceAlertRepository.findAllByOrderByTimestampDesc();
    }

    public List<GeoFenceAlert> getAlertsBetween(LocalDateTime from, LocalDateTime to) {
        return geoFenceAlertRepository.findByTimestampBetween(from, to);
    }

    public List<GeoFenceAlert> getAlertsByVehicle(Long vehicleId) {
        return geoFenceAlertRepository.findByVehicleId(vehicleId);
    }
}
