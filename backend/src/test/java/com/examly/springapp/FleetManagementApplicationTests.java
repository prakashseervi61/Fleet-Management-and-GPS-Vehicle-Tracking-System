package com.examly.springapp;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verifies the Spring context (all beans, JPA mappings, security wiring)
 * starts successfully against the H2 test database.
 */
@SpringBootTest
@ActiveProfiles("test")
class FleetManagementApplicationTests {

    @Test
    void contextLoads() {
    }
}
