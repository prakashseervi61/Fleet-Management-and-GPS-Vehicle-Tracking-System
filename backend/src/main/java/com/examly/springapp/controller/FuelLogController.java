package com.examly.springapp.controller;

import com.examly.springapp.model.FuelLog;
import com.examly.springapp.model.dto.FuelLogRequest;
import com.examly.springapp.service.FuelLogService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Fuel log entries and finance reporting (SRS 1.2 fuel card reconciliation).
 */
@RestController
@RequestMapping("/api/fuel/log")
public class FuelLogController {

    @Autowired
    private FuelLogService fuelLogService;

    @PostMapping
    @PreAuthorize("hasAnyRole('DRIVER', 'FINANCE_OFFICER', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<FuelLog> logFuel(@Valid @RequestBody FuelLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fuelLogService.logFuel(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'FLEET_MANAGER', 'MAINTENANCE_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<FuelLog>> getAllLogs() {
        return ResponseEntity.ok(fuelLogService.getAllLogs());
    }

    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<FuelLog>> getLogsByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(fuelLogService.getLogsByVehicle(vehicleId));
    }

    @GetMapping("/driver/{driverId}")
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<FuelLog>> getLogsByDriver(@PathVariable Long driverId) {
        return ResponseEntity.ok(fuelLogService.getLogsByDriver(driverId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<FuelLog> getLogById(@PathVariable Long id) {
        return ResponseEntity.ok(fuelLogService.getLogById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<Void> deleteLog(@PathVariable Long id) {
        fuelLogService.deleteLog(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cost")
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<BigDecimal> getTotalCost(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(fuelLogService.getTotalFuelCost(from, to));
    }
}
