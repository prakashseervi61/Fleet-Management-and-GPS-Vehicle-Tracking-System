package com.examly.springapp.model.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

 


@Getter
@Setter
@NoArgsConstructor
public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private long expiresIn;
    private Long userId;
    private String name;
    private String email;
    private String role;

    public AuthResponse(String token, long expiresIn, Long userId, String name, String email, String role) {
        this.token = token;
        this.expiresIn = expiresIn;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
    }
}
