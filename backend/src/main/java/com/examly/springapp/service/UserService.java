package com.examly.springapp.service;

import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.model.User;
import com.examly.springapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service class for User management.
 */
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private FleetValidator fleetValidator;

    /**
     * Create a new user applying Appendix C validation.
     * @param user the user to create
     * @return the created user
     */
    public User createUser(User user) {
        fleetValidator.validateName(user.getName());
        fleetValidator.validatePhone(user.getPhoneNumber());
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setCreatedDate(LocalDateTime.now());
        user.setActive(true);
        return userRepository.save(user);
    }

    /**
     * Get user by ID.
     * @param id the user ID
     * @return Optional containing the user if found
     */
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Get user by email.
     * @param email the email to search for
     * @return Optional containing the user if found
     */
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Get all users.
     * @return list of all users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Update user information.
     * @param id the user ID
     * @param userDetails the updated user details
     * @return the updated user
     */
    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (userDetails.getName() != null) {
            fleetValidator.validateName(userDetails.getName());
            user.setName(userDetails.getName());
        }
        if (userDetails.getPhoneNumber() != null) {
            fleetValidator.validatePhone(userDetails.getPhoneNumber());
            user.setPhoneNumber(userDetails.getPhoneNumber());
        }
        if (userDetails.getEmail() != null) {
            user.setEmail(userDetails.getEmail());
        }
        if (userDetails.getRole() != null) {
            user.setRole(userDetails.getRole());
        }
        if (userDetails.getDrivingLicenceNo() != null) {
            user.setDrivingLicenceNo(userDetails.getDrivingLicenceNo());
        }
        if (userDetails.getLicenceExpiryDate() != null) {
            user.setLicenceExpiryDate(userDetails.getLicenceExpiryDate());
        }
        user.setActive(userDetails.isActive());

        return userRepository.save(user);
    }

    /**
     * Delete user by ID.
     * @param id the user ID
     */
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
    }

    /**
     * Deactivate user (soft delete).
     * @param id the user ID
     */
    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setActive(false);
        userRepository.save(user);
    }

    /**
     * Record the last login timestamp.
     * @param userId the user ID
     */
    public void updateLastLogin(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });
    }
}
