package com.examly.springapp.exception;

/**
 * Custom exception thrown when a fleet management name field contains
 * non-alphabetic characters or digits.
 *
 * As defined in Appendix E of SRS.
 */
public class InvalidNameException extends RuntimeException {

    public InvalidNameException(String message) {
        super(message);
    }
}