package com.examly.springapp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

 



@Entity
@Getter
@Setter
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 10)
    private String phoneNumber;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(name = "created_date", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(name = "driving_licence_no")
    private String drivingLicenceNo;

    @Column(name = "licence_expiry_date")
    private LocalDate licenceExpiryDate;

     


    public enum Role {
        GUEST,
        DRIVER,
        MAINTENANCE_MANAGER,
        LOGISTICS_COORDINATOR,
        FLEET_MANAGER,
        FINANCE_OFFICER,
        SYSTEM_ADMINISTRATOR
    }
}