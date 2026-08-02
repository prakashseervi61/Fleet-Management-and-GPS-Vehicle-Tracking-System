package com.examly.springapp.service;

import com.examly.springapp.config.JwtTokenProvider;
import com.examly.springapp.config.UserPrincipal;
import com.examly.springapp.exception.BusinessRuleViolationException;
import com.examly.springapp.exception.InvalidNameException;
import com.examly.springapp.model.User;
import com.examly.springapp.model.dto.AuthResponse;
import com.examly.springapp.model.dto.LoginRequest;
import com.examly.springapp.model.dto.UserRegistrationDTO;
import com.examly.springapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

 


@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService();
        ReflectionTestUtils.setField(authService, "userRepository", userRepository);
        ReflectionTestUtils.setField(authService, "userService", userService);
        ReflectionTestUtils.setField(authService, "authenticationManager", authenticationManager);
        ReflectionTestUtils.setField(authService, "jwtTokenProvider", jwtTokenProvider);
        ReflectionTestUtils.setField(authService, "tokenBlacklistService", tokenBlacklistService);
        ReflectionTestUtils.setField(authService, "fleetValidator", new FleetValidator());
    }

    private UserRegistrationDTO validDto() {
        UserRegistrationDTO dto = new UserRegistrationDTO();
        dto.setName("Ravi Kumar");
        dto.setEmail("Ravi@Example.com");
        dto.setPhoneNumber("9876543210");
        dto.setPassword("Passw0rd!");
        dto.setRole("DRIVER");
        return dto;
    }

    @Test
    void registerNormalizesEmailAndDelegatesToUserService() {
        when(userRepository.existsByEmailIgnoreCase("Ravi@Example.com")).thenReturn(false);
        when(userRepository.existsByPhoneNumber("9876543210")).thenReturn(false);
        when(userService.createUser(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User created = authService.register(validDto());

        assertEquals("ravi@example.com", created.getEmail());
        assertEquals(User.Role.DRIVER, created.getRole());
    }

    @Test
    void registerRejectsWeakPassword() {
        UserRegistrationDTO dto = validDto();
        dto.setPassword("short");
        assertThrows(IllegalArgumentException.class, () -> authService.register(dto));
    }

    @Test
    void registerRejectsInvalidName() {
        UserRegistrationDTO dto = validDto();
        dto.setName("Ravi123");
        assertThrows(InvalidNameException.class, () -> authService.register(dto));
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(userRepository.existsByEmailIgnoreCase("Ravi@Example.com")).thenReturn(true);
        assertThrows(BusinessRuleViolationException.class, () -> authService.register(validDto()));
    }

    @Test
    void registerDefaultsRoleToGuestWhenBlank() {
        UserRegistrationDTO dto = validDto();
        dto.setRole("");
        when(userRepository.existsByEmailIgnoreCase("Ravi@Example.com")).thenReturn(false);
        when(userRepository.existsByPhoneNumber("9876543210")).thenReturn(false);
        when(userService.createUser(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User created = authService.register(dto);

        assertEquals(User.Role.GUEST, created.getRole());
    }

    @Test
    void loginAuthenticatesAndReturnsToken() {
        User user = new User();
        user.setId(1L);
        user.setName("Ravi Kumar");
        user.setEmail("ravi@example.com");
        user.setPasswordHash("encoded");
        user.setRole(User.Role.DRIVER);
        UserPrincipal principal = new UserPrincipal(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(userRepository.findById(1L)).thenReturn(java.util.Optional.of(user));
        when(jwtTokenProvider.generateToken(user)).thenReturn("jwt-token");
        when(jwtTokenProvider.getExpirationMillis(User.Role.DRIVER)).thenReturn(28_800_000L);

        LoginRequest request = new LoginRequest();
        request.setIdentifier("ravi@example.com");
        request.setPassword("Passw0rd!");

        AuthResponse response = authService.login(request);

        assertEquals("jwt-token", response.getToken());
        assertEquals("ravi@example.com", response.getEmail());
        assertEquals("DRIVER", response.getRole());
        verify(userService).updateLastLogin(1L);
    }

    @Test
    void loginWithBadCredentialsThrows() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("bad"));

        LoginRequest request = new LoginRequest();
        request.setIdentifier("ravi@example.com");
        request.setPassword("wrong");

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void logoutBlacklistsValidToken() {
        Date expiry = new Date(System.currentTimeMillis() + 60_000);
        when(jwtTokenProvider.validateToken("jwt-token")).thenReturn(true);
        when(jwtTokenProvider.getExpirationFromToken("jwt-token")).thenReturn(expiry);

        authService.logout("jwt-token");

        verify(tokenBlacklistService).blacklist("jwt-token", expiry.getTime());
    }
}
