package com.examly.springapp.repository;

import com.examly.springapp.model.GeoFenceAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Spring Data JPA repository for GeoFenceAlert entity.
 */
@Repository
public interface GeoFenceAlertRepository extends JpaRepository<GeoFenceAlert, Long> {

    List<GeoFenceAlert> findAllByOrderByTimestampDesc();

    List<GeoFenceAlert> findByTimestampBetween(LocalDateTime from, LocalDateTime to);

    List<GeoFenceAlert> findByVehicleId(Long vehicleId);

    List<GeoFenceAlert> findByGeofenceId(Long geofenceId);
}
