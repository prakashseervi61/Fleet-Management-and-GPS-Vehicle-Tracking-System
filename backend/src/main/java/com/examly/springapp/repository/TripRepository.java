package com.examly.springapp.repository;

import com.examly.springapp.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

 


@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    List<Trip> findByStatusIn(Collection<Trip.TripStatus> statuses);

    List<Trip> findByVehicleIdAndStatusIn(Long vehicleId, Collection<Trip.TripStatus> statuses);

    boolean existsByVehicleIdAndStatusIn(Long vehicleId, Collection<Trip.TripStatus> statuses);

    List<Trip> findByVehicleId(Long vehicleId);

    List<Trip> findByDriverId(Long driverId);

    Optional<Trip> findTopByVehicleIdOrderByPlannedStartDesc(Long vehicleId);
}
