package com.examly.springapp.service;

import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.model.GpsPing;
import com.examly.springapp.model.User;
import com.examly.springapp.model.Vehicle;
import com.examly.springapp.model.dto.DriverScoreResponse;
import com.examly.springapp.repository.GpsPingRepository;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Driver behaviour scoring from speeding, harsh braking and idling events
 * (SRS 1.2 driver behaviour scoring).
 */
@Service
public class DriverBehaviourService {

    private static final int SPEEDING_PENALTY = 5;
    private static final int HARSH_BRAKE_PENALTY = 10;
    private static final int IDLE_PENALTY = 2;
    private static final int SPEEDING_CAP = 40;
    private static final int HARSH_BRAKE_CAP = 40;
    private static final int IDLE_CAP = 20;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private GpsPingRepository gpsPingRepository;

    public DriverScoreResponse scoreDriver(Long driverId) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + driverId));

        DriverScoreResponse response = new DriverScoreResponse();
        response.setDriverId(driverId);
        response.setDriverName(driver.getName());
        response.setEvaluatedAt(LocalDateTime.now());

        int speeding = 0;
        int harshBrakes = 0;
        int idle = 0;
        int total = 0;

        for (Vehicle vehicle : vehicleRepository.findByAssignedDriverId(driverId)) {
            List<GpsPing> pings = gpsPingRepository.findTop100ByVehicleIdOrderByRecordedAtDesc(vehicle.getId());
            total += pings.size();
            for (GpsPing ping : pings) {
                if (ping.getEventType() == GpsPing.EventType.SPEEDING) {
                    speeding++;
                } else if (ping.getEventType() == GpsPing.EventType.HARSH_BRAKE) {
                    harshBrakes++;
                } else if (ping.getEventType() == GpsPing.EventType.IDLE) {
                    idle++;
                }
            }
        }

        response.setTotalPings(total);
        response.setSpeedingCount(speeding);
        response.setHarshBrakeCount(harshBrakes);
        response.setIdleCount(idle);

        int penalty = Math.min(speeding * SPEEDING_PENALTY, SPEEDING_CAP)
                + Math.min(harshBrakes * HARSH_BRAKE_PENALTY, HARSH_BRAKE_CAP)
                + Math.min(idle * IDLE_PENALTY, IDLE_CAP);
        response.setScore(Math.max(0, 100 - penalty));
        return response;
    }
}
