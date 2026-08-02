package com.examly.springapp.controller;

import com.examly.springapp.model.Document;
import com.examly.springapp.model.dto.DocumentRequest;
import com.examly.springapp.model.dto.ExpiryAlertResponse;
import com.examly.springapp.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

 


@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'MAINTENANCE_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<Document> addDocument(@Valid @RequestBody DocumentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.addDocument(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'MAINTENANCE_MANAGER', 'LOGISTICS_COORDINATOR', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<Document>> getAllDocuments() {
        return ResponseEntity.ok(documentService.getAllDocuments());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'MAINTENANCE_MANAGER', 'LOGISTICS_COORDINATOR', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<Document> getDocumentById(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocumentById(id));
    }

    @GetMapping("/expiry")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'MAINTENANCE_MANAGER', 'LOGISTICS_COORDINATOR', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<Map<Integer, List<ExpiryAlertResponse>>> getExpiryAlerts() {
        return ResponseEntity.ok(documentService.getExpiryAlerts());
    }

    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'MAINTENANCE_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<List<Document>> getDocumentsByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(documentService.getDocumentsByVehicle(vehicleId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'MAINTENANCE_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<Document> updateDocument(@PathVariable Long id,
                                                  @Valid @RequestBody DocumentRequest request) {
        return ResponseEntity.ok(documentService.updateDocument(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh")
    @PreAuthorize("hasAnyRole('LOGISTICS_COORDINATOR', 'FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    public ResponseEntity<Void> refreshStatuses() {
        documentService.refreshDocumentStatuses();
        return ResponseEntity.ok().build();
    }
}
