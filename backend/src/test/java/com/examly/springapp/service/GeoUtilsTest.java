package com.examly.springapp.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

 


class GeoUtilsTest {

    @Test
    void distanceBetweenSamePointIsZero() {
        assertTrue(GeoUtils.distanceKm(28.6139, 77.2090, 28.6139, 77.2090) < 0.001);
    }

    @Test
    void oneDegreeOfLatitudeIsAboutOneHundredElevenKm() {
        double distance = GeoUtils.distanceKm(28.0, 77.0, 29.0, 77.0);
        assertTrue(distance > 100 && distance < 120, "Expected ~111km, got " + distance);
    }

    @Test
    void pointInsideFenceIsContained() {
        assertTrue(GeoUtils.isInside(
                new BigDecimal("28.6139"), new BigDecimal("77.2090"),
                new BigDecimal("5.0"),
                new BigDecimal("28.6200"), new BigDecimal("77.2150")));
    }

    @Test
    void pointFarOutsideFenceIsNotContained() {
        assertFalse(GeoUtils.isInside(
                new BigDecimal("28.6139"), new BigDecimal("77.2090"),
                new BigDecimal("1.0"),
                new BigDecimal("28.7000"), new BigDecimal("77.3000")));
    }
}
