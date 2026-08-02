package com.examly.springapp.controller;

import com.examly.springapp.model.Vehicle;
import com.examly.springapp.model.dto.VehicleLocationResponse;
import com.examly.springapp.model.dto.VehicleRequest;
import com.examly.springapp.model.dto.VehicleResponse;
import com.examly.springapp.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

 



@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    @PostMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<Vehicle> createVehicle(@Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.createVehicle(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'LOGISTICS_COORDINATOR', 'MAINTENANCE_MANAGER', 'FINANCE_OFFICER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'LOGISTICS_COORDINATOR', 'MAINTENANCE_MANAGER', 'FINANCE_OFFICER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<VehicleResponse> getVehicle(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicle(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long id, @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.ok(vehicleService.updateVehicle(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/assign-driver")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<Vehicle> assignDriver(@PathVariable Long id, @RequestParam Long driverId) {
        return ResponseEntity.ok(vehicleService.assignDriver(id, driverId));
    }

    @GetMapping("/{id}/location")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'LOGISTICS_COORDINATOR', 'MAINTENANCE_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<VehicleLocationResponse> getVehicleLocation(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicleLocation(id));
    }
}
