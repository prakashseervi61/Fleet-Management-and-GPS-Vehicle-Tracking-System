package com.examly.springapp.service;

import com.examly.springapp.exception.BusinessRuleViolationException;
import com.examly.springapp.exception.ResourceNotFoundException;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Trip assignment and lifecycle (SRS FR6) enforcing Appendix F business rules.
 */
@Service
public class TripService {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MaintenanceOrderRepository maintenanceOrderRepository;

    @Autowired
    private GpsPingRepository gpsPingRepository;

    @Autowired
    private DocumentService documentService;

    @Value("${fleet.gps.stale-minutes:5}")
    private long gpsStaleMinutes;

    /**
     * Assign a trip enforcing: driver role + valid licence, no double-assignment,
     * no IN_PROGRESS maintenance, and valid vehicle documents (Appendix F).
     * @param request trip payload
     * @return the created trip with status ASSIGNED
     */
    @Transactional
    public Trip createTrip(TripRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));
        User driver = userRepository.findById(request.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + request.getDriverId()));

        if (driver.getRole() != User.Role.DRIVER) {
            throw new BusinessRuleViolationException("Trip driver must have the DRIVER role");
        }
        validateDriverLicence(driver);
        validateNoSimultaneousTrip(vehicle.getId());
        validateNoMaintenanceInProgress(vehicle.getId());
        validateVehicleCompliance(vehicle.getId());

        Trip trip = new Trip();
        trip.setVehicle(vehicle);
        trip.setDriver(driver);
        trip.setOrigin(request.getOrigin());
        trip.setDestination(request.getDestination());
        trip.setPlannedStart(request.getPlannedStart());
        trip.setDistanceKm(request.getDistanceKm());
        trip.setStatus(Trip.TripStatus.ASSIGNED);
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip startTrip(Long tripId) {
        Trip trip = getTripEntity(tripId);
        if (trip.getStatus() != Trip.TripStatus.ASSIGNED) {
            throw new BusinessRuleViolationException("Only ASSIGNED trips can be started");
        }
        validateGpsOnline(trip.getVehicle().getId());
        trip.setStatus(Trip.TripStatus.STARTED);
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip completeTrip(Long tripId, BigDecimal distanceKm) {
        Trip trip = getTripEntity(tripId);
        if (trip.getStatus() != Trip.TripStatus.STARTED) {
            throw new BusinessRuleViolationException("Only STARTED trips can be completed");
        }
        trip.setStatus(Trip.TripStatus.COMPLETED);
        trip.setActualEnd(LocalDateTime.now());
        if (distanceKm != null) {
            trip.setDistanceKm(distanceKm);
            Vehicle vehicle = trip.getVehicle();
            int odometer = vehicle.getCurrentOdometer() != null ? vehicle.getCurrentOdometer() : 0;
            vehicle.setCurrentOdometer(odometer + distanceKm.intValue());
            vehicleRepository.save(vehicle);
        }
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip cancelTrip(Long tripId) {
        Trip trip = getTripEntity(tripId);
        if (trip.getStatus() == Trip.TripStatus.COMPLETED) {
            throw new BusinessRuleViolationException("Completed trips cannot be cancelled");
        }
        trip.setStatus(Trip.TripStatus.CANCELLED);
        return tripRepository.save(trip);
    }

    public List<Trip> getActiveTrips() {
        return tripRepository.findByStatusIn(List.of(Trip.TripStatus.ASSIGNED, Trip.TripStatus.STARTED));
    }

    public List<Trip> getAllTrips() {
        return tripRepository.findAll();
    }

    public Trip getTripEntity(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));
    }

    public List<Trip> getTripsByDriver(Long driverId) {
        return tripRepository.findByDriverId(driverId);
    }

    private void validateDriverLicence(User driver) {
        if (driver.getDrivingLicenceNo() == null || driver.getDrivingLicenceNo().isBlank()) {
            throw new BusinessRuleViolationException("Driver licence is mandatory before trip assignment");
        }
        if (driver.getLicenceExpiryDate() != null && driver.getLicenceExpiryDate().isBefore(java.time.LocalDate.now())) {
            throw new BusinessRuleViolationException("Driver licence has expired; driver is suspended");
        }
    }

    private void validateNoSimultaneousTrip(Long vehicleId) {
        boolean doubleAssigned = tripRepository.existsByVehicleIdAndStatusIn(vehicleId,
                List.of(Trip.TripStatus.ASSIGNED, Trip.TripStatus.STARTED));
        if (doubleAssigned) {
            throw new BusinessRuleViolationException(
                    "Vehicle is already assigned to a simultaneous trip (Appendix F)");
        }
    }

    private void validateNoMaintenanceInProgress(Long vehicleId) {
        boolean inProgress = maintenanceOrderRepository.existsByVehicleIdAndStatusIn(vehicleId,
                List.of(MaintenanceOrder.MaintenanceStatus.IN_PROGRESS));
        if (inProgress) {
            throw new BusinessRuleViolationException(
                    "Vehicle has a maintenance order IN_PROGRESS; no trip can be assigned (Appendix F)");
        }
    }

    private void validateVehicleCompliance(Long vehicleId) {
        if (!documentService.isCompliant(vehicleId)) {
            throw new BusinessRuleViolationException(
                    "Vehicle has expired or missing mandatory documents (RC, insurance, PUC, fitness)");
        }
    }

    private void validateGpsOnline(Long vehicleId) {
        GpsPing latest = gpsPingRepository.findTopByVehicleIdOrderByRecordedAtDesc(vehicleId)
                .orElseThrow(() -> new BusinessRuleViolationException(
                        "GPS device must be online before trip can be started"));
        if (latest.getRecordedAt() == null
                || Duration.between(latest.getRecordedAt(), LocalDateTime.now()).toMinutes() > gpsStaleMinutes) {
            throw new BusinessRuleViolationException("GPS device must be online before trip can be started");
        }
    }
}
