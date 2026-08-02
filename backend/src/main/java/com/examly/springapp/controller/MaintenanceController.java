package com.examly.springapp.controller;

import com.examly.springapp.model.MaintenanceOrder;
import com.examly.springapp.model.dto.MaintenanceRequest;
import com.examly.springapp.service.MaintenanceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Preventive maintenance orders (SRS FR5, Appendix F): SCHEDULE/ODOMETER/OBD triggers.
 */
@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    @Autowired
    private MaintenanceService maintenanceService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MAINTENANCE_MANAGER', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<MaintenanceOrder> createOrder(@Valid @RequestBody MaintenanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(maintenanceService.createOrder(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MAINTENANCE_MANAGER', 'FLEET_MANAGER', 'FINANCE_OFFICER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<MaintenanceOrder>> getAllOrders() {
        return ResponseEntity.ok(maintenanceService.getAllOrders());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MAINTENANCE_MANAGER', 'FLEET_MANAGER', 'FINANCE_OFFICER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<MaintenanceOrder> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.getOrderEntity(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MAINTENANCE_MANAGER', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<MaintenanceOrder> updateOrder(@PathVariable Long id,
                                                       @Valid @RequestBody MaintenanceRequest request) {
        return ResponseEntity.ok(maintenanceService.updateOrder(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MAINTENANCE_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        maintenanceService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyRole('MAINTENANCE_MANAGER', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<MaintenanceOrder>> getOrdersByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(maintenanceService.getOrdersByVehicle(vehicleId));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('MAINTENANCE_MANAGER', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<MaintenanceOrder> completeOrder(@PathVariable Long id,
                                                          @RequestParam(required = false) BigDecimal cost) {
        return ResponseEntity.ok(maintenanceService.completeOrder(id, cost));
    }

    @PostMapping("/triggers/odometer")
    @PreAuthorize("hasAnyRole('MAINTENANCE_MANAGER', 'LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<MaintenanceOrder>> generateOdometerTriggers() {
        return ResponseEntity.ok(maintenanceService.generateOdometerTriggers());
    }
}
