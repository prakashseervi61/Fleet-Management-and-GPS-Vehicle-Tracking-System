package com.examly.springapp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;

 


@Entity
@Getter
@Setter
@Table(name = "fuel_logs", indexes = {
        @Index(name = "idx_fuel_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_fuel_driver", columnList = "driver_id")
})
public class FuelLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "driver_id")
    private User driver;

    @Column(name = "quantity_litres", precision = 10, scale = 2, nullable = false)
    private BigDecimal quantityLitres;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal cost;

    @Column(nullable = false)
    private LocalDate date;
}
