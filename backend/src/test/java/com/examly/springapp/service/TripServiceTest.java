package com.examly.springapp.service;

import com.examly.springapp.exception.BusinessRuleViolationException;
import com.examly.springapp.model.GpsPing;
import com.examly.springapp.model.MaintenanceOrder;
import com.examly.springapp.model.Trip;
import com.examly.springapp.model.User;
import com.examly.springapp.model.Vehicle;
import com.examly.springapp.model.dto.TripRequest;
import com.examly.springapp.repository.GpsPingRepository;
import com.examly.springapp.repository.MaintenanceOrderRepository;
import com.examly.springapp.repository.TripRepository;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

/**
 * Trip assignment enforcing Appendix F rules: DRIVER role, valid licence,
 * no simultaneous trips, no IN_PROGRESS maintenance, compliant documents.
 */
@ExtendWith(MockitoExtension.class)
class TripServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MaintenanceOrderRepository maintenanceOrderRepository;

    @Mock
    private GpsPingRepository gpsPingRepository;

    @Mock
    private DocumentService documentService;

    private TripService tripService;

    @BeforeEach
    void setUp() {
        tripService = new TripService();
        ReflectionTestUtils.setField(tripService, "tripRepository", tripRepository);
        ReflectionTestUtils.setField(tripService, "vehicleRepository", vehicleRepository);
        ReflectionTestUtils.setField(tripService, "userRepository", userRepository);
        ReflectionTestUtils.setField(tripService, "maintenanceOrderRepository", maintenanceOrderRepository);
        ReflectionTestUtils.setField(tripService, "gpsPingRepository", gpsPingRepository);
        ReflectionTestUtils.setField(tripService, "documentService", documentService);
        ReflectionTestUtils.setField(tripService, "gpsStaleMinutes", 5L);
    }

    private Vehicle vehicle(Long id) {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(id);
        vehicle.setRegistrationNo("KA01AB1234");
        vehicle.setCurrentOdometer(1000);
        return vehicle;
    }

    private User driver(Long id) {
        User driver = new User();
        driver.setId(id);
        driver.setRole(User.Role.DRIVER);
        driver.setDrivingLicenceNo("DL-1234");
        driver.setLicenceExpiryDate(LocalDate.now().plusYears(2));
        return driver;
    }

    private TripRequest tripRequest() {
        return new TripRequest(1L, 1L, "Bengaluru", "Mysuru",
                LocalDateTime.now().plusHours(1), new BigDecimal("140"));
    }

    private Trip assignedTrip() {
        Trip trip = new Trip();
        trip.setId(10L);
        trip.setVehicle(vehicle(1L));
        trip.setDriver(driver(1L));
        trip.setStatus(Trip.TripStatus.ASSIGNED);
        return trip;
    }

    private void stubAllChecksPass() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle(1L)));
        when(userRepository.findById(1L)).thenReturn(Optional.of(driver(1L)));
        when(tripRepository.existsByVehicleIdAndStatusIn(anyLong(), any())).thenReturn(false);
        when(maintenanceOrderRepository.existsByVehicleIdAndStatusIn(anyLong(), any())).thenReturn(false);
        when(documentService.isCompliant(1L)).thenReturn(true);
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void createTripAssignsValidDriverAndVehicle() {
        stubAllChecksPass();

        Trip trip = tripService.createTrip(tripRequest());

        assertEquals(Trip.TripStatus.ASSIGNED, trip.getStatus());
        assertEquals("Bengaluru", trip.getOrigin());
        assertEquals("Mysuru", trip.getDestination());
    }

    @Test
    void createTripRejectsNonDriverUser() {
        Vehicle vehicle = vehicle(1L);
        User manager = new User();
        manager.setId(2L);
        manager.setRole(User.Role.LOGISTICS_COORDINATOR);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(userRepository.findById(2L)).thenReturn(Optional.of(manager));

        TripRequest request = new TripRequest(1L, 2L, "A", "B", LocalDateTime.now(), null);
        assertThrows(BusinessRuleViolationException.class, () -> tripService.createTrip(request));
    }

    @Test
    void createTripRejectsDriverWithoutLicence() {
        Vehicle vehicle = vehicle(1L);
        User driver = driver(1L);
        driver.setDrivingLicenceNo(null);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(userRepository.findById(1L)).thenReturn(Optional.of(driver));

        assertThrows(BusinessRuleViolationException.class, () -> tripService.createTrip(tripRequest()));
    }

    @Test
    void createTripRejectsExpiredLicence() {
        Vehicle vehicle = vehicle(1L);
        User driver = driver(1L);
        driver.setLicenceExpiryDate(LocalDate.now().minusDays(1));
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(userRepository.findById(1L)).thenReturn(Optional.of(driver));

        assertThrows(BusinessRuleViolationException.class, () -> tripService.createTrip(tripRequest()));
    }

    @Test
    void createTripRejectsSimultaneousAssignment() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle(1L)));
        when(userRepository.findById(1L)).thenReturn(Optional.of(driver(1L)));
        when(tripRepository.existsByVehicleIdAndStatusIn(anyLong(), any())).thenReturn(true);

        assertThrows(BusinessRuleViolationException.class, () -> tripService.createTrip(tripRequest()));
    }

    @Test
    void createTripRejectsVehicleInMaintenance() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle(1L)));
        when(userRepository.findById(1L)).thenReturn(Optional.of(driver(1L)));
        when(tripRepository.existsByVehicleIdAndStatusIn(anyLong(), any())).thenReturn(false);
        when(maintenanceOrderRepository.existsByVehicleIdAndStatusIn(anyLong(), any())).thenReturn(true);

        assertThrows(BusinessRuleViolationException.class, () -> tripService.createTrip(tripRequest()));
    }

    @Test
    void createTripRejectsNonCompliantVehicle() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle(1L)));
        when(userRepository.findById(1L)).thenReturn(Optional.of(driver(1L)));
        when(tripRepository.existsByVehicleIdAndStatusIn(anyLong(), any())).thenReturn(false);
        when(maintenanceOrderRepository.existsByVehicleIdAndStatusIn(anyLong(), any())).thenReturn(false);
        when(documentService.isCompliant(1L)).thenReturn(false);

        assertThrows(BusinessRuleViolationException.class, () -> tripService.createTrip(tripRequest()));
    }

    @Test
    void startTripRequiresFreshGpsPing() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(assignedTrip()));
        when(gpsPingRepository.findTopByVehicleIdOrderByRecordedAtDesc(1L)).thenReturn(Optional.empty());

        assertThrows(BusinessRuleViolationException.class, () -> tripService.startTrip(10L));
    }

    @Test
    void startTripSucceedsWhenGpsIsOnline() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(assignedTrip()));
        GpsPing ping = new GpsPing();
        ping.setRecordedAt(LocalDateTime.now().minusSeconds(30));
        when(gpsPingRepository.findTopByVehicleIdOrderByRecordedAtDesc(1L)).thenReturn(Optional.of(ping));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));

        Trip started = tripService.startTrip(10L);

        assertEquals(Trip.TripStatus.STARTED, started.getStatus());
    }

    @Test
    void completeTripUpdatesOdometer() {
        Trip trip = assignedTrip();
        trip.setStatus(Trip.TripStatus.STARTED);
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

        Trip completed = tripService.completeTrip(10L, new BigDecimal("150"));

        assertEquals(Trip.TripStatus.COMPLETED, completed.getStatus());
        assertEquals(1150, trip.getVehicle().getCurrentOdometer());
    }

    @Test
    void cancelTripRejectsCompletedTrips() {
        Trip trip = assignedTrip();
        trip.setStatus(Trip.TripStatus.COMPLETED);
        when(tripRepository.findById(10L)).thenReturn(Optional.of(trip));

        assertThrows(BusinessRuleViolationException.class, () -> tripService.cancelTrip(10L));
    }

    @Test
    void cancelTripCancelsAssignedTrip() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(assignedTrip()));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));

        Trip cancelled = tripService.cancelTrip(10L);

        assertEquals(Trip.TripStatus.CANCELLED, cancelled.getStatus());
    }

    @Test
    void getActiveTripsReturnsAssignedAndStarted() {
        when(tripRepository.findByStatusIn(any())).thenReturn(List.of(assignedTrip()));
        assertEquals(1, tripService.getActiveTrips().size());
    }
}
