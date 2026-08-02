package com.examly.springapp.repository;

import com.examly.springapp.model.MaintenanceOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

/**
 * Spring Data JPA repository for MaintenanceOrder entity.
 */
@Repository
public interface MaintenanceOrderRepository extends JpaRepository<MaintenanceOrder, Long> {

    List<MaintenanceOrder> findByVehicleId(Long vehicleId);

    List<MaintenanceOrder> findByVehicleIdAndStatus(Long vehicleId, MaintenanceOrder.MaintenanceStatus status);

    List<MaintenanceOrder> findByStatus(MaintenanceOrder.MaintenanceStatus status);

    boolean existsByVehicleIdAndStatusIn(Long vehicleId, Collection<MaintenanceOrder.MaintenanceStatus> statuses);
}
