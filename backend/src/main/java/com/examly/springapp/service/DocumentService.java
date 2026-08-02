package com.examly.springapp.service;

import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.model.Document;
import com.examly.springapp.model.Vehicle;
import com.examly.springapp.model.dto.DocumentRequest;
import com.examly.springapp.model.dto.ExpiryAlertResponse;
import com.examly.springapp.repository.DocumentRepository;
import com.examly.springapp.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

 



@Service
public class DocumentService {

    private static final int[] ALERT_WINDOWS_DAYS = {60, 30, 7};
    private static final Document.DocumentType[] REQUIRED_TYPES =
            {Document.DocumentType.RC, Document.DocumentType.INSURANCE,
                    Document.DocumentType.PUC, Document.DocumentType.FITNESS};

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Transactional
    public Document addDocument(DocumentRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));
        Document document = new Document();
        document.setVehicle(vehicle);
        document.setType(request.resolveType());
        document.setExpiryDate(request.getExpiryDate());
        document.setStatus(resolveStatus(request.getExpiryDate()));
        return documentRepository.save(document);
    }

    public List<Document> getDocumentsExpiringWithin(int days) {
        LocalDate today = LocalDate.now();
        return documentRepository.findByExpiryDateBetween(today, today.plusDays(days));
    }

    public List<Document> getExpiredDocuments() {
        return documentRepository.findByExpiryDateBefore(LocalDate.now());
    }

    public List<Document> getAllDocuments() {
        return documentRepository.findAll();
    }

    public Document getDocumentById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));
    }

    public List<Document> getDocumentsByVehicle(Long vehicleId) {
        return documentRepository.findByVehicleId(vehicleId);
    }

    @Transactional
    public Document updateDocument(Long id, DocumentRequest request) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));
        if (request.getVehicleId() != null && !request.getVehicleId().equals(document.getVehicle().getId())) {
            Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));
            document.setVehicle(vehicle);
        }
        if (request.getType() != null) {
            document.setType(request.resolveType());
        }
        if (request.getExpiryDate() != null) {
            document.setExpiryDate(request.getExpiryDate());
            document.setStatus(resolveStatus(request.getExpiryDate()));
        }
        return documentRepository.save(document);
    }

    @Transactional
    public void deleteDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));
        documentRepository.delete(document);
    }

     


    public Map<Integer, List<ExpiryAlertResponse>> getExpiryAlerts() {
        Map<Integer, List<ExpiryAlertResponse>> result = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();
        for (int days : ALERT_WINDOWS_DAYS) {
            List<ExpiryAlertResponse> bucket = new ArrayList<>();
            for (Document doc : documentRepository.findByExpiryDateBetween(today, today.plusDays(days))) {
                long daysLeft = ChronoUnit.DAYS.between(today, doc.getExpiryDate());
                bucket.add(new ExpiryAlertResponse(
                        doc.getType().name(),
                        doc.getVehicle().getId(),
                        doc.getVehicle().getRegistrationNo(),
                        doc.getExpiryDate(),
                        daysLeft));
            }
            result.put(days, bucket);
        }
        return result;
    }

     



    public boolean isCompliant(Long vehicleId) {
        for (Document.DocumentType type : REQUIRED_TYPES) {
            Document doc = documentRepository.findByVehicleIdAndType(vehicleId, type).orElse(null);
            if (doc == null || doc.getExpiryDate().isBefore(LocalDate.now())) {
                return false;
            }
        }
        return true;
    }

     


    @Transactional
    public void refreshDocumentStatuses() {
        for (Document doc : documentRepository.findAll()) {
            doc.setStatus(resolveStatus(doc.getExpiryDate()));
            documentRepository.save(doc);
        }
    }

    private Document.DocumentStatus resolveStatus(LocalDate expiryDate) {
        if (expiryDate.isBefore(LocalDate.now())) {
            return Document.DocumentStatus.EXPIRED;
        }
        if (expiryDate.isBefore(LocalDate.now().plusDays(60))) {
            return Document.DocumentStatus.EXPIRING_SOON;
        }
        return Document.DocumentStatus.VALID;
    }
}
