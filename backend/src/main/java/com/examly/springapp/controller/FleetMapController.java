package com.examly.springapp.controller;

import com.examly.springapp.model.dto.FleetMapResponse;
import com.examly.springapp.service.FleetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Live fleet map aggregation (SRS 3.1.1, Appendix H GET /api/fleet/map).
 */
@RestController
@RequestMapping("/api/fleet")
public class FleetMapController {

    @Autowired
    private FleetService fleetService;

    @GetMapping("/map")
    @PreAuthorize("hasAnyRole('LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'MAINTENANCE_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<FleetMapResponse>> getFleetMap() {
        return ResponseEntity.ok(fleetService.getFleetMap());
    }
}
