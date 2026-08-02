package com.examly.springapp.model.dto;

import com.examly.springapp.model.Trip;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for trip records.
 */
@Getter
@Setter
public class TripResponse {

    private Long id;
    private Long vehicleId;
    private String registrationNo;
    private Long driverId;
    private String driverName;
    private String origin;
    private String destination;
    private LocalDateTime plannedStart;
    private LocalDateTime actualEnd;
    private BigDecimal distanceKm;
    private String status;

    public static TripResponse from(Trip trip) {
        TripResponse response = new TripResponse();
        response.setId(trip.getId());
        if (trip.getVehicle() != null) {
            response.setVehicleId(trip.getVehicle().getId());
            response.setRegistrationNo(trip.getVehicle().getRegistrationNo());
        }
        if (trip.getDriver() != null) {
            response.setDriverId(trip.getDriver().getId());
            response.setDriverName(trip.getDriver().getName());
        }
        response.setOrigin(trip.getOrigin());
        response.setDestination(trip.getDestination());
        response.setPlannedStart(trip.getPlannedStart());
        response.setActualEnd(trip.getActualEnd());
        response.setDistanceKm(trip.getDistanceKm());
        response.setStatus(trip.getStatus() == null ? null : trip.getStatus().name());
        return response;
    }
}
