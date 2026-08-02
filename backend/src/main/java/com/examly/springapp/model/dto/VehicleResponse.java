package com.examly.springapp.model.dto;

import com.examly.springapp.model.Vehicle;
import lombok.Getter;
import lombok.Setter;

 


@Getter
@Setter
public class VehicleResponse {

    private Long id;
    private String registrationNo;
    private String make;
    private String model;
    private String gpsDeviceId;
    private String status;
    private Integer currentOdometer;
    private Long assignedDriverId;
    private String assignedDriverName;

    public static VehicleResponse from(Vehicle vehicle) {
        VehicleResponse response = new VehicleResponse();
        response.setId(vehicle.getId());
        response.setRegistrationNo(vehicle.getRegistrationNo());
        response.setMake(vehicle.getMake());
        response.setModel(vehicle.getModel());
        response.setGpsDeviceId(vehicle.getGpsDeviceId());
        response.setStatus(vehicle.getStatus() == null ? null : vehicle.getStatus().name());
        response.setCurrentOdometer(vehicle.getCurrentOdometer());
        if (vehicle.getAssignedDriver() != null) {
            response.setAssignedDriverId(vehicle.getAssignedDriver().getId());
            response.setAssignedDriverName(vehicle.getAssignedDriver().getName());
        }
        return response;
    }
}
