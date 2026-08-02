package com.examly.springapp.service;

import com.examly.springapp.model.GpsPing;
import com.examly.springapp.model.Vehicle;
import com.examly.springapp.model.dto.FleetMapResponse;
import com.examly.springapp.repository.GpsPingRepository;
import com.examly.springapp.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

 


@Service
public class FleetService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private GpsPingRepository gpsPingRepository;

    public List<FleetMapResponse> getFleetMap() {
        List<FleetMapResponse> result = new ArrayList<>();
        for (Vehicle vehicle : vehicleRepository.findAll()) {
            FleetMapResponse entry = new FleetMapResponse();
            entry.setVehicleId(vehicle.getId());
            entry.setRegistrationNo(vehicle.getRegistrationNo());
            entry.setMake(vehicle.getMake());
            entry.setModel(vehicle.getModel());
            entry.setStatus(vehicle.getStatus() == null ? null : vehicle.getStatus().name());
            GpsPing latest = gpsPingRepository.findTopByVehicleIdOrderByRecordedAtDesc(vehicle.getId()).orElse(null);
            if (latest != null) {
                entry.setLatitude(latest.getLatitude());
                entry.setLongitude(latest.getLongitude());
                entry.setSpeedKmh(latest.getSpeedKmh());
                entry.setRecordedAt(latest.getRecordedAt());
            }
            result.add(entry);
        }
        return result;
    }
}
