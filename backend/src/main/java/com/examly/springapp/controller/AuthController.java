package com.examly.springapp.controller;

import com.examly.springapp.model.User;
import com.examly.springapp.model.dto.AuthResponse;
import com.examly.springapp.model.dto.LoginRequest;
import com.examly.springapp.model.dto.MessageResponse;
import com.examly.springapp.model.dto.UserRegistrationDTO;
import com.examly.springapp.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication endpoints: register, login, logout (SRS FR1/FR2, Appendix H).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * Register a new user with Appendix C validation.
     * @param dto registration payload
     * @return 201 with success message
     */
    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody UserRegistrationDTO dto) {
        User user = authService.register(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageResponse("User registered successfully with id: " + user.getId()));
    }

    /**
     * Multi-credential login (user id, email or mobile).
     * @param request login payload
     * @return JWT auth response
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Logout: blacklists the presented token.
     * @param authHeader Authorization header
     * @return success message
     */
    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        authService.logout(token);
        return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
    }
}
