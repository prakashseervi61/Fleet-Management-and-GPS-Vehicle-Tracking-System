package com.examly.springapp.repository;

import com.examly.springapp.model.GeoFence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for GeoFence entity.
 */
@Repository
public interface GeoFenceRepository extends JpaRepository<GeoFence, Long> {
}
