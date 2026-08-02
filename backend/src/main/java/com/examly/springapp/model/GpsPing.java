package com.examly.springapp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * GPS ping entity. Based on Appendix B: GPSPings Table in SRS.
 */
@Entity
@Getter
@Setter
@Table(name = "gps_pings", indexes = {
        @Index(name = "idx_ping_vehicle_time", columnList = "vehicle_id, recorded_at")
})
public class GpsPing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(precision = 9, scale = 6, nullable = false)
    private BigDecimal latitude;

    @Column(precision = 9, scale = 6, nullable = false)
    private BigDecimal longitude;

    @Column(name = "speed_kmh", precision = 8, scale = 2)
    private BigDecimal speedKmh;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    public enum EventType {
        NORMAL, SPEEDING, GEO_EXIT, IDLE, HARSH_BRAKE
    }
}
