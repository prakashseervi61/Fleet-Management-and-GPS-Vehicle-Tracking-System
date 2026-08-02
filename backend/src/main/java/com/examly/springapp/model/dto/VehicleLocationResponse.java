package com.examly.springapp.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for a vehicle's latest GPS location (Appendix H GET /api/vehicles/{id}/location).
 */
@Getter
@Setter
public class VehicleLocationResponse {

    private Long vehicleId;
    private String registrationNo;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal speedKmh;
    private LocalDateTime recordedAt;
}
