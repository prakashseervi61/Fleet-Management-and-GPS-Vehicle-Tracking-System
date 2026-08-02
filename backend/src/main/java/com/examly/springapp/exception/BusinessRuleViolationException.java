package com.examly.springapp.exception;

/**
 * Thrown when a SRS Appendix F business rule is violated,
 * e.g. vehicle double-assignment, trip while maintenance in progress,
 * or expired documents blocking operations.
 * Maps to HTTP 409 Conflict.
 */
public class BusinessRuleViolationException extends RuntimeException {

    public BusinessRuleViolationException(String message) {
        super(message);
    }
}
