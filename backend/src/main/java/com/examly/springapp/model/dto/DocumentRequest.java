package com.examly.springapp.model.dto;

import com.examly.springapp.model.Document;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

 


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRequest {

    @NotNull(message = "Vehicle id is required")
    private Long vehicleId;

    @NotNull(message = "Document type is required")
    private String type;

    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;

    public Document.DocumentType resolveType() {
        return Document.DocumentType.valueOf(type.trim().toUpperCase());
    }
}
