package com.examly.springapp.repository;

import com.examly.springapp.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

 


@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByRegistrationNo(String registrationNo);

    Optional<Vehicle> findByGpsDeviceId(String gpsDeviceId);

    boolean existsByRegistrationNo(String registrationNo);

    boolean existsByGpsDeviceId(String gpsDeviceId);

    List<Vehicle> findByStatus(Vehicle.VehicleStatus status);

    List<Vehicle> findByAssignedDriverId(Long driverId);
}
