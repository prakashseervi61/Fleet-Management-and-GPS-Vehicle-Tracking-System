package com.examly.springapp.service;

import com.examly.springapp.exception.BusinessRuleViolationException;
import com.examly.springapp.exception.DuplicateVehicleException;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.model.GpsPing;
import com.examly.springapp.model.User;
import com.examly.springapp.model.Vehicle;
import com.examly.springapp.model.dto.VehicleLocationResponse;
import com.examly.springapp.model.dto.VehicleRequest;
import com.examly.springapp.repository.GpsPingRepository;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

 


@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GpsPingRepository gpsPingRepository;

    private VehicleService vehicleService;

    @BeforeEach
    void setUp() {
        vehicleService = new VehicleService();
        ReflectionTestUtils.setField(vehicleService, "vehicleRepository", vehicleRepository);
        ReflectionTestUtils.setField(vehicleService, "userRepository", userRepository);
        ReflectionTestUtils.setField(vehicleService, "gpsPingRepository", gpsPingRepository);
    }

    private VehicleRequest validRequest() {
        return new VehicleRequest("KA01AB1234", "Tata", "Ace", "GPS-001", null, null, null);
    }

    private Vehicle vehicleWithId(Long id) {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(id);
        vehicle.setRegistrationNo("KA01AB1234");
        vehicle.setGpsDeviceId("GPS-001");
        return vehicle;
    }

    @Test
    void createVehicleRejectsDuplicateRegistrationNumber() {
        when(vehicleRepository.existsByRegistrationNo("KA01AB1234")).thenReturn(true);
        assertThrows(DuplicateVehicleException.class, () -> vehicleService.createVehicle(validRequest()));
    }

    @Test
    void createVehicleRejectsDuplicateGpsDeviceId() {
        when(vehicleRepository.existsByRegistrationNo("KA01AB1234")).thenReturn(false);
        when(vehicleRepository.existsByGpsDeviceId("GPS-001")).thenReturn(true);
        assertThrows(DuplicateVehicleException.class, () -> vehicleService.createVehicle(validRequest()));
    }

    @Test
    void createVehicleDefaultsToActiveAndZeroOdometer() {
        when(vehicleRepository.existsByRegistrationNo("KA01AB1234")).thenReturn(false);
        when(vehicleRepository.existsByGpsDeviceId("GPS-001")).thenReturn(false);
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

        Vehicle created = vehicleService.createVehicle(validRequest());

        assertEquals(Vehicle.VehicleStatus.ACTIVE, created.getStatus());
        assertEquals(0, created.getCurrentOdometer());
        assertEquals("KA01AB1234", created.getRegistrationNo());
    }

    @Test
    void assignDriverRejectsNonDriverRole() {
        Vehicle vehicle = vehicleWithId(1L);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        User manager = new User();
        manager.setRole(User.Role.FLEET_MANAGER);
        when(userRepository.findById(9L)).thenReturn(Optional.of(manager));

        assertThrows(BusinessRuleViolationException.class, () -> vehicleService.assignDriver(1L, 9L));
    }

    @Test
    void getVehicleLocationThrowsWhenNoGpsData() {
        Vehicle vehicle = vehicleWithId(1L);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(gpsPingRepository.findTopByVehicleIdOrderByRecordedAtDesc(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> vehicleService.getVehicleLocation(1L));
    }

    @Test
    void getVehicleLocationReturnsLatestPing() {
        Vehicle vehicle = vehicleWithId(1L);
        vehicle.setRegistrationNo("KA01AB1234");
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));

        GpsPing ping = new GpsPing();
        ping.setLatitude(new BigDecimal("28.6139"));
        ping.setLongitude(new BigDecimal("77.2090"));
        ping.setSpeedKmh(new BigDecimal("60"));
        ping.setRecordedAt(LocalDateTime.of(2026, 7, 31, 10, 0));
        when(gpsPingRepository.findTopByVehicleIdOrderByRecordedAtDesc(1L)).thenReturn(Optional.of(ping));

        VehicleLocationResponse response = vehicleService.getVehicleLocation(1L);

        assertEquals(1L, response.getVehicleId());
        assertEquals("KA01AB1234", response.getRegistrationNo());
        assertEquals(0, new BigDecimal("28.6139").compareTo(response.getLatitude()));
        assertEquals(0, new BigDecimal("77.2090").compareTo(response.getLongitude()));
    }

    @Test
    void updateVehicleRejectsRegistrationOwnedByAnotherVehicle() {
        Vehicle existing = vehicleWithId(1L);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(existing));
        Vehicle other = vehicleWithId(2L);
        other.setRegistrationNo("KA01CD5678");
        when(vehicleRepository.findByRegistrationNo("KA01CD5678")).thenReturn(Optional.of(other));

        VehicleRequest update = validRequest();
        update.setRegistrationNo("KA01CD5678");

        assertThrows(DuplicateVehicleException.class, () -> vehicleService.updateVehicle(1L, update));
    }
}
