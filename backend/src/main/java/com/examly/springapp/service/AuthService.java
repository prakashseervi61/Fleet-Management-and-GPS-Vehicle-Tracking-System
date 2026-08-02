package com.examly.springapp.service;

import com.examly.springapp.config.JwtTokenProvider;
import com.examly.springapp.config.UserPrincipal;
import com.examly.springapp.exception.BusinessRuleViolationException;
import com.examly.springapp.model.User;
import com.examly.springapp.model.dto.AuthResponse;
import com.examly.springapp.model.dto.LoginRequest;
import com.examly.springapp.model.dto.UserRegistrationDTO;
import com.examly.springapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

 


@Service
public class AuthService {

    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @Autowired
    private FleetValidator fleetValidator;

     




    public User register(UserRegistrationDTO dto) {
        fleetValidator.validateName(dto.getName());
        fleetValidator.validatePhone(dto.getPhoneNumber());
        validatePassword(dto.getPassword());

        if (userRepository.existsByEmailIgnoreCase(dto.getEmail())) {
            throw new BusinessRuleViolationException("This email is already registered");
        }
        if (userRepository.existsByPhoneNumber(dto.getPhoneNumber())) {
            throw new BusinessRuleViolationException("This phone number is already registered");
        }

        User user = new User();
        user.setName(dto.getName().trim());
        user.setEmail(dto.getEmail().trim().toLowerCase());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setPasswordHash(dto.getPassword());
        user.setRole(resolveRole(dto.getRole()));
        return userService.createUser(user);
    }

     




    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getIdentifier(), request.getPassword()));
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            userService.updateLastLogin(principal.getId());
            User user = userRepository.findById(principal.getId())
                    .orElseThrow(() -> new BusinessRuleViolationException("User account not found"));
            String token = jwtTokenProvider.generateToken(user);
            long expiresIn = jwtTokenProvider.getExpirationMillis(user.getRole());
            return new AuthResponse(token, expiresIn, user.getId(), user.getName(),
                    user.getEmail(), user.getRole().name());
        } catch (AuthenticationException e) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "Invalid credentials. Please check your email and password.");
        }
    }

     



    public void logout(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        if (jwtTokenProvider.validateToken(token)) {
            long expiresAt = jwtTokenProvider.getExpirationFromToken(token).getTime();
            tokenBlacklistService.blacklist(token, expiresAt);
        }
    }

    private void validatePassword(String password) {
        if (password == null || !PASSWORD_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException("Password must meet security requirements");
        }
    }

    private User.Role resolveRole(String role) {
        if (role == null || role.isBlank()) {
            return User.Role.GUEST;
        }
        try {
            return User.Role.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleViolationException("Invalid role: " + role);
        }
    }
}
