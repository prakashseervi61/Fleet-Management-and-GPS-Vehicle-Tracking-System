package com.examly.springapp.exception;

public class DuplicateVehicleException extends RuntimeException {

    public DuplicateVehicleException(String message) {
        super(message);
    }
}
