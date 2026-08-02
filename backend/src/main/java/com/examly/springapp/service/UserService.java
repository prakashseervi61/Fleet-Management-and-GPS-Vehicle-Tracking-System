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

 


@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private FleetValidator fleetValidator;

     




    public User createUser(User user) {
        fleetValidator.validateName(user.getName());
        fleetValidator.validatePhone(user.getPhoneNumber());
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setCreatedDate(LocalDateTime.now());
        user.setActive(true);
        return userRepository.save(user);
    }

     




    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

     




    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

     



    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

     





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

     



    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
    }

     



    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setActive(false);
        userRepository.save(user);
    }

     



    public void updateLastLogin(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });
    }
}
