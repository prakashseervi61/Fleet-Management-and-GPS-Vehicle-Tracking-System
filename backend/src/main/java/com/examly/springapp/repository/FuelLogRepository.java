package com.examly.springapp.repository;

import com.examly.springapp.model.FuelLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

 


@Repository
public interface FuelLogRepository extends JpaRepository<FuelLog, Long> {

    List<FuelLog> findByVehicleId(Long vehicleId);

    List<FuelLog> findByDriverId(Long driverId);

    List<FuelLog> findByDateBetween(LocalDate from, LocalDate to);
}
