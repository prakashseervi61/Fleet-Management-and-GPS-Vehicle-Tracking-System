package com.examly.springapp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

 


@Entity
@Getter
@Setter
@Table(name = "geo_fence_alerts", indexes = {
        @Index(name = "idx_gfa_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_gfa_time", columnList = "timestamp")
})
public class GeoFenceAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "geofence_id")
    private GeoFence geofence;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false)
    private AlertType alertType;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public enum AlertType {
        ENTRY, EXIT
    }
}
