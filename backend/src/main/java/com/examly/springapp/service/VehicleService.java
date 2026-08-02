package com.examly.springapp.service;

import com.examly.springapp.exception.BusinessRuleViolationException;
import com.examly.springapp.exception.DuplicateVehicleException;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.model.GpsPing;
import com.examly.springapp.model.User;
import com.examly.springapp.model.Vehicle;
import com.examly.springapp.model.dto.VehicleLocationResponse;
import com.examly.springapp.model.dto.VehicleRequest;
import com.examly.springapp.model.dto.VehicleResponse;
import com.examly.springapp.repository.GpsPingRepository;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Vehicle registration and management (SRS FR4) with duplicate detection.
 */
@Service
public class VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GpsPingRepository gpsPingRepository;

    /**
     * Register a vehicle, rejecting duplicate registration numbers or GPS device ids.
     * @param request vehicle payload
     * @return the created vehicle
     */
    @Transactional
    public Vehicle createVehicle(VehicleRequest request) {
        if (vehicleRepository.existsByRegistrationNo(request.getRegistrationNo())) {
            throw new DuplicateVehicleException(
                    "A vehicle with registration number " + request.getRegistrationNo() + " already exists");
        }
        if (vehicleRepository.existsByGpsDeviceId(request.getGpsDeviceId())) {
            throw new DuplicateVehicleException(
                    "A vehicle with GPS device id " + request.getGpsDeviceId() + " already exists");
        }

        Vehicle vehicle = new Vehicle();
        vehicle.setRegistrationNo(request.getRegistrationNo());
        vehicle.setMake(request.getMake());
        vehicle.setModel(request.getModel());
        vehicle.setGpsDeviceId(request.getGpsDeviceId());
        vehicle.setStatus(request.resolveStatus());
        vehicle.setCurrentOdometer(request.getCurrentOdometer() != null ? request.getCurrentOdometer() : 0);
        if (request.getAssignedDriverId() != null) {
            vehicle.setAssignedDriver(resolveDriver(request.getAssignedDriverId()));
        }
        return vehicleRepository.save(vehicle);
    }

    /**
     * Assign a driver (role DRIVER) to a vehicle.
     * @param vehicleId the vehicle id
     * @param driverId the driver user id
     * @return the updated vehicle
     */
    @Transactional
    public Vehicle assignDriver(Long vehicleId, Long driverId) {
        Vehicle vehicle = getVehicleEntity(vehicleId);
        vehicle.setAssignedDriver(resolveDriver(driverId));
        return vehicleRepository.save(vehicle);
    }

    private User resolveDriver(Long driverId) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + driverId));
        if (driver.getRole() != User.Role.DRIVER) {
            throw new BusinessRuleViolationException("Assigned user is not a DRIVER");
        }
        return driver;
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Vehicle getVehicleEntity(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
    }

    public VehicleResponse getVehicle(Long id) {
        return VehicleResponse.from(getVehicleEntity(id));
    }

    @Transactional
    public Vehicle updateVehicle(Long id, VehicleRequest request) {
        Vehicle vehicle = getVehicleEntity(id);
        if (request.getRegistrationNo() != null) {
            vehicleRepository.findByRegistrationNo(request.getRegistrationNo())
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new DuplicateVehicleException(
                                "A vehicle with registration number " + request.getRegistrationNo() + " already exists");
                    });
            vehicle.setRegistrationNo(request.getRegistrationNo());
        }
        if (request.getMake() != null) {
            vehicle.setMake(request.getMake());
        }
        if (request.getModel() != null) {
            vehicle.setModel(request.getModel());
        }
        if (request.getGpsDeviceId() != null) {
            vehicleRepository.findByGpsDeviceId(request.getGpsDeviceId())
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new DuplicateVehicleException(
                                "A vehicle with GPS device id " + request.getGpsDeviceId() + " already exists");
                    });
            vehicle.setGpsDeviceId(request.getGpsDeviceId());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            vehicle.setStatus(request.resolveStatus());
        }
        if (request.getCurrentOdometer() != null) {
            vehicle.setCurrentOdometer(request.getCurrentOdometer());
        }
        if (request.getAssignedDriverId() != null) {
            vehicle.setAssignedDriver(resolveDriver(request.getAssignedDriverId()));
        }
        return vehicleRepository.save(vehicle);
    }

    public void deleteVehicle(Long id) {
        Vehicle vehicle = getVehicleEntity(id);
        vehicleRepository.delete(vehicle);
    }

    /**
     * Latest GPS location for a vehicle (Appendix H GET /api/vehicles/{id}/location).
     * @param vehicleId the vehicle id
     * @return location response
     */
    public VehicleLocationResponse getVehicleLocation(Long vehicleId) {
        Vehicle vehicle = getVehicleEntity(vehicleId);
        GpsPing latest = gpsPingRepository.findTopByVehicleIdOrderByRecordedAtDesc(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No GPS data available for vehicle id: " + vehicleId));
        VehicleLocationResponse response = new VehicleLocationResponse();
        response.setVehicleId(vehicle.getId());
        response.setRegistrationNo(vehicle.getRegistrationNo());
        response.setLatitude(latest.getLatitude());
        response.setLongitude(latest.getLongitude());
        response.setSpeedKmh(latest.getSpeedKmh());
        response.setRecordedAt(latest.getRecordedAt());
        return response;
    }
}
