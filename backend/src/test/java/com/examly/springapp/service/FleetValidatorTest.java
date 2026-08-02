package com.examly.springapp.service;

import com.examly.springapp.exception.InvalidNameException;
import com.examly.springapp.exception.InvalidPhoneException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

 



class FleetValidatorTest {

    private final FleetValidator validator = new FleetValidator();

    @Test
    void validNamesAreAccepted() {
        assertDoesNotThrow(() -> validator.validateName("Ravi Kumar"));
        assertDoesNotThrow(() -> validator.validateName("AB"));
    }

    @Test
    void nameWithNumbersOrSpecialCharactersIsRejected() {
        InvalidNameException ex = assertThrows(InvalidNameException.class,
                () -> validator.validateName("Ravi123"));
        assertEquals("Name must not contain numbers or special characters", ex.getMessage());
    }

    @Test
    void tooShortNameIsRejected() {
        assertThrows(InvalidNameException.class, () -> validator.validateName("A"));
    }

    @Test
    void nullOrBlankNameIsRejected() {
        assertThrows(InvalidNameException.class, () -> validator.validateName(null));
        assertThrows(InvalidNameException.class, () -> validator.validateName("   "));
    }

    @Test
    void validPhoneIsAccepted() {
        assertDoesNotThrow(() -> validator.validatePhone("9876543210"));
    }

    @Test
    void phoneShorterThanTenDigitsIsRejected() {
        InvalidPhoneException ex = assertThrows(InvalidPhoneException.class,
                () -> validator.validatePhone("12345"));
        assertEquals("Phone Number must be exactly 10 digits long", ex.getMessage());
    }

    @Test
    void phoneWithLettersIsRejected() {
        assertThrows(InvalidPhoneException.class, () -> validator.validatePhone("987654321A"));
    }

    @Test
    void nullPhoneIsRejected() {
        assertThrows(InvalidPhoneException.class, () -> validator.validatePhone(null));
    }
}
