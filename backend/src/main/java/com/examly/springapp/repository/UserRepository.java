package com.examly.springapp.repository;

import com.examly.springapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for User entity.
 * Provides CRUD operations without needing to write implementation.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by email.
     * @param email the email address
     * @return Optional containing user if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Find user by phone number.
     * @param phoneNumber the phone number
     * @return Optional containing user if found
     */
    Optional<User> findByPhoneNumber(String phoneNumber);

    /**
     * Check if user exists by email.
     * @param email the email address
     * @return true if user exists
     */
    boolean existsByEmail(String email);

    /**
     * Check if user exists by phone number.
     * @param phoneNumber the phone number
     * @return true if user exists
     */
    boolean existsByPhoneNumber(String phoneNumber);

    /**
     * Check if user exists by email, ignoring case.
     * @param email the email address
     * @return true if user exists
     */
    boolean existsByEmailIgnoreCase(String email);
}