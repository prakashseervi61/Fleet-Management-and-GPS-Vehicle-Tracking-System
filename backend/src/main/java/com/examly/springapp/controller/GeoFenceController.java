package com.examly.springapp.controller;

import com.examly.springapp.model.GeoFence;
import com.examly.springapp.model.GeoFenceAlert;
import com.examly.springapp.model.dto.GeoFenceRequest;
import com.examly.springapp.service.GeoFenceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

 


@RestController
@RequestMapping("/api/geofence")
public class GeoFenceController {

    @Autowired
    private GeoFenceService geoFenceService;

    @PostMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<GeoFence> createGeoFence(@Valid @RequestBody GeoFenceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(geoFenceService.createGeoFence(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<GeoFence>> getAllGeoFences() {
        return ResponseEntity.ok(geoFenceService.getAllGeoFences());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<Void> deleteGeoFence(@PathVariable Long id) {
        geoFenceService.deleteGeoFence(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<GeoFence> updateGeoFence(@PathVariable Long id,
                                                   @Valid @RequestBody GeoFenceRequest request) {
        return ResponseEntity.ok(geoFenceService.updateGeoFence(id, request));
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<GeoFenceAlert>> getAllAlerts() {
        return ResponseEntity.ok(geoFenceService.getAllAlerts());
    }
}
