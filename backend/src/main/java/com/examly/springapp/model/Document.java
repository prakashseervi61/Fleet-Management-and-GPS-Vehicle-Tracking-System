package com.examly.springapp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

 



@Entity
@Getter
@Setter
@Table(name = "documents", indexes = {
        @Index(name = "idx_doc_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_doc_expiry", columnList = "expiry_date")
})
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentType type;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentStatus status;

    public enum DocumentType {
        RC, INSURANCE, PUC, FITNESS
    }

    public enum DocumentStatus {
        VALID, EXPIRING_SOON, EXPIRED
    }
}
