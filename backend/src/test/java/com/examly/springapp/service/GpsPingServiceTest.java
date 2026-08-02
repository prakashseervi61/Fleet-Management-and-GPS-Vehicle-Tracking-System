package com.examly.springapp.service;

import com.examly.springapp.model.GeoFenceAlert;
import com.examly.springapp.model.GpsPing;
import com.examly.springapp.model.Vehicle;
import com.examly.springapp.model.dto.GpsPingRequest;
import com.examly.springapp.repository.GpsPingRepository;
import com.examly.springapp.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * GPS ping ingestion: coordinate bounds, event classification
 * (SPEEDING / HARSH_BRAKE / IDLE / GEO_EXIT) and geofence override.
 */
@ExtendWith(MockitoExtension.class)
class GpsPingServiceTest {

    @Mock
    private GpsPingRepository gpsPingRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private GeoFenceService geoFenceService;

    private GpsPingService gpsPingService;

    @BeforeEach
    void setUp() {
        gpsPingService = new GpsPingService();
        ReflectionTestUtils.setField(gpsPingService, "gpsPingRepository", gpsPingRepository);
        ReflectionTestUtils.setField(gpsPingService, "vehicleRepository", vehicleRepository);
        ReflectionTestUtils.setField(gpsPingService, "geoFenceService", geoFenceService);
        ReflectionTestUtils.setField(gpsPingService, "speedingThresholdKmh", 80);
    }

    private GpsPingRequest ping(BigDecimal lat, BigDecimal lon, BigDecimal speed, LocalDateTime recordedAt) {
        return new GpsPingRequest(1L, lat, lon, speed, recordedAt);
    }

    private void stubVehicleAndSave() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(gpsPingRepository.findTopByVehicleIdOrderByRecordedAtDesc(1L)).thenReturn(Optional.empty());
        when(geoFenceService.detectCrossings(any(), any())).thenReturn(Collections.emptyList());
        when(gpsPingRepository.save(any(GpsPing.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void ingestPingRejectsOutOfRangeLatitude() {
        assertThrows(IllegalArgumentException.class, () -> gpsPingService.ingestPing(
                ping(new BigDecimal("91"), new BigDecimal("77"), new BigDecimal("50"), LocalDateTime.now())));
    }

    @Test
    void ingestPingRejectsOutOfRangeLongitude() {
        assertThrows(IllegalArgumentException.class, () -> gpsPingService.ingestPing(
                ping(new BigDecimal("28"), new BigDecimal("-181"), new BigDecimal("50"), LocalDateTime.now())));
    }

    @Test
    void ingestPingClassifiesSpeeding() {
        stubVehicleAndSave();
        GpsPing stored = gpsPingService.ingestPing(
                ping(new BigDecimal("28.6"), new BigDecimal("77.2"), new BigDecimal("95"), LocalDateTime.now()));
        assertEquals(GpsPing.EventType.SPEEDING, stored.getEventType());
    }

    @Test
    void ingestPingClassifiesHarshBrake() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));

        GpsPing previous = new GpsPing();
        previous.setSpeedKmh(new BigDecimal("90"));
        previous.setRecordedAt(LocalDateTime.now().minusSeconds(10));
        when(gpsPingRepository.findTopByVehicleIdOrderByRecordedAtDesc(1L)).thenReturn(Optional.of(previous));
        when(geoFenceService.detectCrossings(any(), any())).thenReturn(Collections.emptyList());
        when(gpsPingRepository.save(any(GpsPing.class))).thenAnswer(inv -> inv.getArgument(0));

        GpsPing stored = gpsPingService.ingestPing(
                ping(new BigDecimal("28.6"), new BigDecimal("77.2"), new BigDecimal("55"), LocalDateTime.now()));

        assertEquals(GpsPing.EventType.HARSH_BRAKE, stored.getEventType());
    }

    @Test
    void ingestPingClassifiesIdle() {
        stubVehicleAndSave();
        GpsPing stored = gpsPingService.ingestPing(
                ping(new BigDecimal("28.6"), new BigDecimal("77.2"), new BigDecimal("0"), LocalDateTime.now()));
        assertEquals(GpsPing.EventType.IDLE, stored.getEventType());
    }

    @Test
    void ingestPingClassifiesNormal() {
        stubVehicleAndSave();
        GpsPing stored = gpsPingService.ingestPing(
                ping(new BigDecimal("28.6"), new BigDecimal("77.2"), new BigDecimal("50"), LocalDateTime.now()));
        assertEquals(GpsPing.EventType.NORMAL, stored.getEventType());
    }

    @Test
    void geofenceExitOverridesEventType() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(gpsPingRepository.findTopByVehicleIdOrderByRecordedAtDesc(1L)).thenReturn(Optional.empty());

        GeoFenceAlert exitAlert = new GeoFenceAlert();
        exitAlert.setAlertType(GeoFenceAlert.AlertType.EXIT);
        when(geoFenceService.detectCrossings(any(), any())).thenReturn(List.of(exitAlert));
        when(gpsPingRepository.save(any(GpsPing.class))).thenAnswer(inv -> inv.getArgument(0));

        GpsPing stored = gpsPingService.ingestPing(
                ping(new BigDecimal("28.6"), new BigDecimal("77.2"), new BigDecimal("0"), LocalDateTime.now()));

        assertEquals(GpsPing.EventType.GEO_EXIT, stored.getEventType());
    }
}
