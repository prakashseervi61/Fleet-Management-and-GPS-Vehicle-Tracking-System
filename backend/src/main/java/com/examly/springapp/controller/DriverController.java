package com.examly.springapp.controller;

import com.examly.springapp.model.dto.DriverScoreResponse;
import com.examly.springapp.service.DriverBehaviourService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

 


@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    @Autowired
    private DriverBehaviourService driverBehaviourService;

    @GetMapping("/{id}/score")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'LOGISTICS_COORDINATOR', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<DriverScoreResponse> getDriverScore(@PathVariable Long id) {
        return ResponseEntity.ok(driverBehaviourService.scoreDriver(id));
    }
}
