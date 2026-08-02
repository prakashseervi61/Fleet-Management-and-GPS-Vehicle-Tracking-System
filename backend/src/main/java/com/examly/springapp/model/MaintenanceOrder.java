package com.examly.springapp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Maintenance order entity. Based on Appendix B: MaintenanceOrders Table in SRS.
 */
@Entity
@Getter
@Setter
@Table(name = "maintenance_orders", indexes = {
        @Index(name = "idx_maint_vehicle", columnList = "vehicle_id")
})
public class MaintenanceOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "service_type", nullable = false, length = 120)
    private String serviceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false)
    private MaintenanceTrigger trigger;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(precision = 12, scale = 2)
    private BigDecimal cost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaintenanceStatus status;

    public enum MaintenanceTrigger {
        SCHEDULE, ODOMETER, OBD
    }

    public enum MaintenanceStatus {
        SCHEDULED, IN_PROGRESS, COMPLETED
    }
}
