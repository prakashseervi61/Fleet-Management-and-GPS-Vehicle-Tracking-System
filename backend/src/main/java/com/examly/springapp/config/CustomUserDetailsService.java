package com.examly.springapp.config;

import com.examly.springapp.model.User;
import com.examly.springapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

 


@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user = findByIdentifier(identifier)
                .orElseThrow(() -> new UsernameNotFoundException("User not found for identifier: " + identifier));
        return new UserPrincipal(user);
    }

     




    public Optional<User> findByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return Optional.empty();
        }
        String trimmed = identifier.trim();
        if (trimmed.contains("@")) {
            return userRepository.findByEmail(trimmed);
        }
        if (trimmed.matches("\\d{10}")) {
            return userRepository.findByPhoneNumber(trimmed);
        }
        if (trimmed.matches("\\d+")) {
            try {
                return userRepository.findById(Long.parseLong(trimmed));
            } catch (NumberFormatException ignored) {
                
            }
        }
        return userRepository.findByEmail(trimmed);
    }
}
