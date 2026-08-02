package com.examly.springapp.model.dto;

import com.examly.springapp.model.User;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Profile DTO exposing user data without the password hash.
 */
@Getter
@Setter
public class UserProfileResponse {

    private Long id;
    private String name;
    private String phoneNumber;
    private String email;
    private String role;
    private LocalDateTime createdDate;
    private LocalDateTime lastLogin;
    private boolean active;
    private String drivingLicenceNo;
    private LocalDate licenceExpiryDate;

    public static UserProfileResponse from(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole() == null ? null : user.getRole().name());
        response.setCreatedDate(user.getCreatedDate());
        response.setLastLogin(user.getLastLogin());
        response.setActive(user.isActive());
        response.setDrivingLicenceNo(user.getDrivingLicenceNo());
        response.setLicenceExpiryDate(user.getLicenceExpiryDate());
        return response;
    }
}
