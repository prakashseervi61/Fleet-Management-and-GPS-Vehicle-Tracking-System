package com.examly.springapp.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

 


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpiryAlertResponse {

    private String documentType;
    private Long vehicleId;
    private String registrationNo;
    private LocalDate expiryDate;
    private long daysLeft;
}
