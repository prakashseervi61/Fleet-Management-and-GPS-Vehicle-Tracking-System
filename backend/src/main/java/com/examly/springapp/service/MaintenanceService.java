package com.examly.springapp.service;

import com.examly.springapp.exception.BusinessRuleViolationException;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.model.MaintenanceOrder;
import com.examly.springapp.model.Vehicle;
import com.examly.springapp.model.dto.MaintenanceRequest;
import com.examly.springapp.repository.MaintenanceOrderRepository;
import com.examly.springapp.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

 



@Service
public class MaintenanceService {

    @Autowired
    private MaintenanceOrderRepository maintenanceOrderRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Value("${fleet.maintenance.odometer-interval-km:10000}")
    private int odometerIntervalKm;

    @Transactional
    public MaintenanceOrder createOrder(MaintenanceRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));
        if (maintenanceOrderRepository.existsByVehicleIdAndStatusIn(vehicle.getId(),
                List.of(MaintenanceOrder.MaintenanceStatus.IN_PROGRESS))) {
            throw new BusinessRuleViolationException("Vehicle already has a maintenance order IN_PROGRESS");
        }

        MaintenanceOrder order = new MaintenanceOrder();
        order.setVehicle(vehicle);
        order.setServiceType(request.getServiceType());
        order.setTrigger(request.resolveTrigger());
        order.setScheduledDate(request.getScheduledDate() != null ? request.getScheduledDate() : LocalDate.now());
        order.setCost(request.getCost());
        order.setStatus(MaintenanceOrder.MaintenanceStatus.SCHEDULED);

        vehicle.setStatus(Vehicle.VehicleStatus.MAINTENANCE);
        vehicleRepository.save(vehicle);
        return maintenanceOrderRepository.save(order);
    }

    @Transactional
    public MaintenanceOrder completeOrder(Long orderId, BigDecimal cost) {
        MaintenanceOrder order = getOrderEntity(orderId);
        order.setStatus(MaintenanceOrder.MaintenanceStatus.COMPLETED);
        if (cost != null) {
            order.setCost(cost);
        }

        boolean hasOpenOrders = maintenanceOrderRepository.existsByVehicleIdAndStatusIn(order.getVehicle().getId(),
                List.of(MaintenanceOrder.MaintenanceStatus.SCHEDULED, MaintenanceOrder.MaintenanceStatus.IN_PROGRESS));
        if (!hasOpenOrders) {
            Vehicle vehicle = order.getVehicle();
            vehicle.setStatus(Vehicle.VehicleStatus.ACTIVE);
            vehicleRepository.save(vehicle);
        }
        return maintenanceOrderRepository.save(order);
    }

     




    @Transactional
    public List<MaintenanceOrder> generateOdometerTriggers() {
        List<MaintenanceOrder> created = new java.util.ArrayList<>();
        for (Vehicle vehicle : vehicleRepository.findAll()) {
            Integer odometer = vehicle.getCurrentOdometer();
            if (odometer == null || odometer < odometerIntervalKm) {
                continue;
            }
            if (maintenanceOrderRepository.existsByVehicleIdAndStatusIn(vehicle.getId(),
                    List.of(MaintenanceOrder.MaintenanceStatus.SCHEDULED, MaintenanceOrder.MaintenanceStatus.IN_PROGRESS))) {
                continue;
            }
            MaintenanceOrder order = new MaintenanceOrder();
            order.setVehicle(vehicle);
            order.setServiceType("Periodic service (odometer)");
            order.setTrigger(MaintenanceOrder.MaintenanceTrigger.ODOMETER);
            order.setScheduledDate(LocalDate.now());
            order.setStatus(MaintenanceOrder.MaintenanceStatus.SCHEDULED);
            vehicle.setStatus(Vehicle.VehicleStatus.MAINTENANCE);
            vehicleRepository.save(vehicle);
            created.add(maintenanceOrderRepository.save(order));
        }
        return created;
    }

     





    @Transactional
    public MaintenanceOrder createObdTriggeredOrder(Long vehicleId, String faultCode) {
        MaintenanceRequest request = new MaintenanceRequest(
                vehicleId, "OBD fault: " + faultCode, "OBD", LocalDate.now(), null);
        return createOrder(request);
    }

    public List<MaintenanceOrder> getAllOrders() {
        return maintenanceOrderRepository.findAll();
    }

    public MaintenanceOrder getOrderEntity(Long id) {
        return maintenanceOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance order not found with id: " + id));
    }

    @Transactional
    public MaintenanceOrder updateOrder(Long id, MaintenanceRequest request) {
        MaintenanceOrder order = getOrderEntity(id);
        if (request.getServiceType() != null) {
            order.setServiceType(request.getServiceType());
        }
        if (request.getTrigger() != null) {
            order.setTrigger(request.resolveTrigger());
        }
        if (request.getScheduledDate() != null) {
            order.setScheduledDate(request.getScheduledDate());
        }
        if (request.getCost() != null) {
            order.setCost(request.getCost());
        }
        return maintenanceOrderRepository.save(order);
    }

    @Transactional
    public void deleteOrder(Long id) {
        MaintenanceOrder order = getOrderEntity(id);
        boolean hasOtherOpenOrders = maintenanceOrderRepository.existsByVehicleIdAndStatusIn(order.getVehicle().getId(),
                List.of(MaintenanceOrder.MaintenanceStatus.SCHEDULED, MaintenanceOrder.MaintenanceStatus.IN_PROGRESS))
                && maintenanceOrderRepository.findByVehicleId(order.getVehicle().getId()).stream()
                .filter(o -> !o.getId().equals(id))
                .anyMatch(o -> o.getStatus() == MaintenanceOrder.MaintenanceStatus.SCHEDULED
                        || o.getStatus() == MaintenanceOrder.MaintenanceStatus.IN_PROGRESS);
        maintenanceOrderRepository.delete(order);
        if (!hasOtherOpenOrders) {
            Vehicle vehicle = order.getVehicle();
            vehicle.setStatus(Vehicle.VehicleStatus.ACTIVE);
            vehicleRepository.save(vehicle);
        }
    }

    public List<MaintenanceOrder> getOrdersByVehicle(Long vehicleId) {
        return maintenanceOrderRepository.findByVehicleId(vehicleId);
    }
}
