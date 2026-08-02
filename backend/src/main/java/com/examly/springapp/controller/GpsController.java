package com.examly.springapp.controller;

import com.examly.springapp.model.GpsPing;
import com.examly.springapp.model.dto.GpsPingRequest;
import com.examly.springapp.service.GpsPingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * GPS telemetry ingestion and history (SRS 2.2/2.5, Appendix H).
 */
@RestController
@RequestMapping("/api/gps")
public class GpsController {

    @Autowired
    private GpsPingService gpsPingService;

    @PostMapping("/ping")
    @PreAuthorize("hasAnyRole('DRIVER', 'LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<GpsPing> ingestPing(@Valid @RequestBody GpsPingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gpsPingService.ingestPing(request));
    }

    @GetMapping("/history/{vehicleId}")
    @PreAuthorize("hasAnyRole('LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'MAINTENANCE_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<GpsPing>> getHistory(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(gpsPingService.getHistory(vehicleId));
    }
}
