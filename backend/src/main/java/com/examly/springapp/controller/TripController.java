package com.examly.springapp.controller;

import com.examly.springapp.model.Trip;
import com.examly.springapp.model.dto.TripRequest;
import com.examly.springapp.model.dto.TripResponse;
import com.examly.springapp.service.TripService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

 


@RestController
@RequestMapping("/api/trips")
public class TripController {

    @Autowired
    private TripService tripService;

    @PostMapping
    @PreAuthorize("hasAnyRole('LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<TripResponse> createTrip(@Valid @RequestBody TripRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(TripResponse.from(tripService.createTrip(request)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<TripResponse>> getAllTrips() {
        return ResponseEntity.ok(tripService.getAllTrips().stream().map(TripResponse::from).toList());
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<TripResponse>> getActiveTrips() {
        return ResponseEntity.ok(tripService.getActiveTrips().stream().map(TripResponse::from).toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<TripResponse> getTrip(@PathVariable Long id) {
        return ResponseEntity.ok(TripResponse.from(tripService.getTripEntity(id)));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'DRIVER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<TripResponse> startTrip(@PathVariable Long id) {
        return ResponseEntity.ok(TripResponse.from(tripService.startTrip(id)));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'DRIVER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<TripResponse> completeTrip(@PathVariable Long id,
                                                     @RequestParam(required = false) BigDecimal distanceKm) {
        return ResponseEntity.ok(TripResponse.from(tripService.completeTrip(id, distanceKm)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<TripResponse> cancelTrip(@PathVariable Long id) {
        return ResponseEntity.ok(TripResponse.from(tripService.cancelTrip(id)));
    }
}
