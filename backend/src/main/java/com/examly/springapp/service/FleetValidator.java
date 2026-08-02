package com.examly.springapp.service;

import com.examly.springapp.exception.InvalidNameException;
import com.examly.springapp.exception.InvalidPhoneException;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Server-side validation for Appendix C rules:
 * Name = alphabetic + spaces only, 2-100 chars; Phone = exactly 10 digits.
 */
@Component
public class FleetValidator {

    private static final Pattern NAME_PATTERN = Pattern.compile("^[A-Za-z ]{2,100}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\d{10}$");

    public void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new InvalidNameException("Name is required");
        }
        if (!NAME_PATTERN.matcher(name).matches()) {
            throw new InvalidNameException("Name must not contain numbers or special characters");
        }
    }

    public void validatePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new InvalidPhoneException("Phone Number is required");
        }
        if (!PHONE_PATTERN.matcher(phone).matches()) {
            throw new InvalidPhoneException("Phone Number must be exactly 10 digits long");
        }
    }
}
