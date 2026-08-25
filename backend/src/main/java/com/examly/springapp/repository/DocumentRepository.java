package com.examly.springapp.repository;

import com.examly.springapp.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

 


@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByVehicleId(Long vehicleId);

    Optional<Document> findTopByVehicleIdAndTypeOrderByExpiryDateDesc(Long vehicleId, Document.DocumentType type);

    List<Document> findByVehicleIdAndType(Long vehicleId, Document.DocumentType type);

    List<Document> findByExpiryDateBetween(LocalDate from, LocalDate to);

    List<Document> findByExpiryDateBefore(LocalDate date);

    List<Document> findByStatus(Document.DocumentStatus status);
}
