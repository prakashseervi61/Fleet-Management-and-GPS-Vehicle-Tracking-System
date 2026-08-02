package com.examly.springapp.model.dto;

import com.examly.springapp.model.Vehicle;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request DTO for vehicle registration (SRS FR4).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRequest {

    @NotBlank(message = "Registration number is required")
    private String registrationNo;

    @NotBlank(message = "Make is required")
    private String make;

    @NotBlank(message = "Model is required")
    private String model;

    @NotBlank(message = "GPS device id is required")
    private String gpsDeviceId;

    private String status;

    @Positive(message = "Odometer must be positive")
    private Integer currentOdometer;

    private Long assignedDriverId;

    public Vehicle.VehicleStatus resolveStatus() {
        if (status == null || status.isBlank()) {
            return Vehicle.VehicleStatus.ACTIVE;
        }
        return Vehicle.VehicleStatus.valueOf(status.trim().toUpperCase());
    }
}
