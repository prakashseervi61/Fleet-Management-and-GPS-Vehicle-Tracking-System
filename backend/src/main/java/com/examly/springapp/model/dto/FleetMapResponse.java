package com.examly.springapp.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

 


@Getter
@Setter
public class FleetMapResponse {

    private Long vehicleId;
    private String registrationNo;
    private String make;
    private String model;
    private String status;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal speedKmh;
    private LocalDateTime recordedAt;
}
