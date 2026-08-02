package com.examly.springapp.service;

import com.examly.springapp.exception.InvalidNameException;
import com.examly.springapp.exception.InvalidPhoneException;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.model.User;
import com.examly.springapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * UserService applies Appendix C validation and encodes passwords.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService();
        ReflectionTestUtils.setField(userService, "userRepository", userRepository);
        ReflectionTestUtils.setField(userService, "passwordEncoder", passwordEncoder);
        ReflectionTestUtils.setField(userService, "fleetValidator", new FleetValidator());
    }

    private User validUser() {
        User user = new User();
        user.setName("Ravi Kumar");
        user.setEmail("ravi@example.com");
        user.setPhoneNumber("9876543210");
        user.setPasswordHash("rawPassword");
        user.setRole(User.Role.DRIVER);
        return user;
    }

    @Test
    void createUserEncodesPasswordAndActivatesAccount() {
        when(passwordEncoder.encode("rawPassword")).thenReturn("$2a$encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User created = userService.createUser(validUser());

        assertEquals("$2a$encoded", created.getPasswordHash());
        assertTrue(created.isActive());
        verify(userRepository).save(created);
    }

    @Test
    void createUserRejectsNameWithNumbers() {
        User user = validUser();
        user.setName("Ravi123");
        assertThrows(InvalidNameException.class, () -> userService.createUser(user));
        verify(userRepository, never()).save(any());
    }

    @Test
    void createUserRejectsInvalidPhone() {
        User user = validUser();
        user.setPhoneNumber("12345");
        assertThrows(InvalidPhoneException.class, () -> userService.createUser(user));
        verify(userRepository, never()).save(any());
    }

    @Test
    void getUserByIdReturnsUserWhenPresent() {
        User user = validUser();
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertTrue(userService.getUserById(1L).isPresent());
        assertEquals("ravi@example.com", userService.getUserById(1L).get().getEmail());
    }

    @Test
    void deactivateUserSoftDeletes() {
        User user = validUser();
        user.setActive(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.deactivateUser(1L);

        assertFalse(user.isActive());
    }

    @Test
    void deleteUserThrowsWhenMissing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.deleteUser(99L));
    }
}
