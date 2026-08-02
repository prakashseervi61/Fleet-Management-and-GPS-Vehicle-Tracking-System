package com.examly.springapp.repository;

import com.examly.springapp.model.GpsPing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

 


@Repository
public interface GpsPingRepository extends JpaRepository<GpsPing, Long> {

    List<GpsPing> findByVehicleIdOrderByRecordedAtDesc(Long vehicleId);

    List<GpsPing> findTop100ByVehicleIdOrderByRecordedAtDesc(Long vehicleId);

    Optional<GpsPing> findTopByVehicleIdOrderByRecordedAtDesc(Long vehicleId);

    List<GpsPing> findByVehicleIdAndRecordedAtBetween(Long vehicleId, LocalDateTime from, LocalDateTime to);
}
