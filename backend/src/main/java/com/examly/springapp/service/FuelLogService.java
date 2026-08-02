package com.examly.springapp.service;

import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.model.FuelLog;
import com.examly.springapp.model.User;
import com.examly.springapp.model.Vehicle;
import com.examly.springapp.model.dto.FuelLogRequest;
import com.examly.springapp.repository.FuelLogRepository;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Fuel log management and cost tracking (SRS 1.2 fuel card reconciliation).
 */
@Service
public class FuelLogService {

    @Autowired
    private FuelLogRepository fuelLogRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public FuelLog logFuel(FuelLogRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));
        User driver = userRepository.findById(request.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + request.getDriverId()));

        FuelLog log = new FuelLog();
        log.setVehicle(vehicle);
        log.setDriver(driver);
        log.setQuantityLitres(request.getQuantityLitres());
        log.setCost(request.getCost());
        log.setDate(request.getDate() != null ? request.getDate() : LocalDate.now());
        return fuelLogRepository.save(log);
    }

    public List<FuelLog> getAllLogs() {
        return fuelLogRepository.findAll();
    }

    public FuelLog getLogById(Long id) {
        return fuelLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fuel log not found with id: " + id));
    }

    @Transactional
    public void deleteLog(Long id) {
        fuelLogRepository.delete(getLogById(id));
    }

    public List<FuelLog> getLogsByVehicle(Long vehicleId) {
        return fuelLogRepository.findByVehicleId(vehicleId);
    }

    public List<FuelLog> getLogsByDriver(Long driverId) {
        return fuelLogRepository.findByDriverId(driverId);
    }

    /**
     * Total fuel cost across a date range for finance reporting.
     */
    public BigDecimal getTotalFuelCost(LocalDate from, LocalDate to) {
        LocalDate start = from != null ? from : LocalDate.of(1900, 1, 1);
        LocalDate end = to != null ? to : LocalDate.now();
        return fuelLogRepository.findByDateBetween(start, end).stream()
                .map(FuelLog::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
