package com.examly.springapp.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Driver behaviour score response (speeding, braking, idling).
 */
@Getter
@Setter
public class DriverScoreResponse {

    private Long driverId;
    private String driverName;
    private int totalPings;
    private int speedingCount;
    private int harshBrakeCount;
    private int idleCount;
    private int score;
    private LocalDateTime evaluatedAt;
}
