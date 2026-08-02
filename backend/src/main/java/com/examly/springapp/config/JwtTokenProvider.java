package com.examly.springapp.config;

import com.examly.springapp.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

 



@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long userExpirationMs;
    private final long staffExpirationMs;
    private final long adminExpirationMs;

    public JwtTokenProvider(@Value("${jwt.secret}") String secret,
                            @Value("${jwt.expiration-ms-user:28800000}") long userExpirationMs,
                            @Value("${jwt.expiration-ms-staff:43200000}") long staffExpirationMs,
                            @Value("${jwt.expiration-ms-admin:86400000}") long adminExpirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.userExpirationMs = userExpirationMs;
        this.staffExpirationMs = staffExpirationMs;
        this.adminExpirationMs = adminExpirationMs;
    }

     





    public String generateToken(User user) {
        Date issuedAt = new Date();
        Date expiration = new Date(issuedAt.getTime() + getExpirationMillis(user.getRole()));
        return Jwts.builder()
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .claim("email", user.getEmail())
                .setSubject(user.getEmail())
                .setIssuedAt(issuedAt)
                .setExpiration(expiration)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

     




    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

     




    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

     




    public Long getUserIdFromToken(String token) {
        Object userId = parseClaims(token).get("userId");
        if (userId instanceof Number number) {
            return number.longValue();
        }
        return Long.valueOf(String.valueOf(userId));
    }

     




    public String getRoleFromToken(String token) {
        return String.valueOf(parseClaims(token).get("role"));
    }

     




    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

     




    public Date getExpirationFromToken(String token) {
        return parseClaims(token).getExpiration();
    }

     




    public long getExpirationMillis(User.Role role) {
        if (role == User.Role.SYSTEM_ADMINISTRATOR || role == User.Role.FLEET_MANAGER) {
            return adminExpirationMs;
        }
        if (role == User.Role.MAINTENANCE_MANAGER || role == User.Role.LOGISTICS_COORDINATOR
                || role == User.Role.FINANCE_OFFICER) {
            return staffExpirationMs;
        }
        return userExpirationMs;
    }
}
