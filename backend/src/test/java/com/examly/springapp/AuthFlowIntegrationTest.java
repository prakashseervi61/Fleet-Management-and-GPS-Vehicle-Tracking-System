package com.examly.springapp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end flows against the real context (H2): registration, JWT login,
 * RBAC-protected endpoints, duplicate detection and GPS ingestion.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthFlowIntegrationTest {

    private static final String PASSWORD = "Passw0rd!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String register(String email, String phone, String role) throws Exception {
        String body = """
                {"name":"Ravi Kumar","email":"%s","phoneNumber":"%s","password":"%s","role":"%s"}
                """.formatted(email, phone, PASSWORD, role);
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("message").asText();
    }

    private String login(String identifier) throws Exception {
        String body = "{\"identifier\":\"%s\",\"password\":\"%s\"}".formatted(identifier, PASSWORD);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("token").asText();
    }

    @Test
    void fullDriverVehicleGpsFlow() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        String driverEmail = "driver" + suffix + "@example.com";
        String managerEmail = "manager" + suffix + "@example.com";

        register(driverEmail, "9876500001", "DRIVER");
        register(managerEmail, "9876500002", "FLEET_MANAGER");
        String managerToken = login(managerEmail);
        String driverToken = login(driverEmail);

        // Fleet manager registers a vehicle
        String vehicleBody = """
                {"registrationNo":"KA01XY%s","make":"Tata","model":"Ace","gpsDeviceId":"GPS%s","currentOdometer":1000}
                """.formatted(suffix.substring(suffix.length() - 4), suffix.substring(suffix.length() - 4));
        MvcResult vehicleResult = mockMvc.perform(post("/api/vehicles")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vehicleBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.registrationNo").value(containsString("KA01XY")))
                .andReturn();
        long vehicleId = objectMapper.readTree(vehicleResult.getResponse().getContentAsString()).get("id").asLong();

        // Duplicate registration number is rejected with 409
        mockMvc.perform(post("/api/vehicles")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vehicleBody))
                .andExpect(status().isConflict());

        // Driver reports a GPS ping for the vehicle
        String pingBody = """
                {"vehicleId":%d,"latitude":28.6139,"longitude":77.2090,"speedKmh":60}
                """.formatted(vehicleId);
        mockMvc.perform(post("/api/gps/ping")
                        .header("Authorization", "Bearer " + driverToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pingBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.eventType").value("NORMAL"));

        // Manager fetches the live location
        mockMvc.perform(get("/api/vehicles/{id}/location", vehicleId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.speedKmh").value(60.0));
    }

    @Test
    void profileRequiresValidToken() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        String email = "prof" + suffix + "@example.com";
        register(email, "9876500003", "DRIVER");
        String token = login(email);

        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("DRIVER"));
    }

    @Test
    void registerWithInvalidNameReturns400() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        String body = """
                {"name":"Ravi123","email":"bad%s@example.com","phoneNumber":"9876500004","password":"%s","role":"DRIVER"}
                """.formatted(suffix, PASSWORD);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Name must not contain numbers or special characters"));
    }

    @Test
    void loginWithWrongPasswordReturns401() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        String email = "wrong" + suffix + "@example.com";
        register(email, "9876500005", "DRIVER");

        String body = "{\"identifier\":\"%s\",\"password\":\"WrongPass1!\"}".formatted(email);
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedFleetEndpointReturns401() throws Exception {
        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isUnauthorized());
    }
}
