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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

 



@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CrudCompletenessIntegrationTest {

    private static final String PASSWORD = "Passw0rd!";
    private static final String FAR_FUTURE = "2099-12-31";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private record AuthSession(String token, Long userId, String role, String name, String email) {}

    private String suffix() {
        return String.valueOf(System.nanoTime());
    }

    private String uniquePhone(String suffix) {
        return "97" + String.format("%08d", Math.abs(Long.parseLong(suffix)) % 100_000_000);
    }

    private long register(String name, String email, String phone, String role) throws Exception {
        String body = """
                {"name":"%s","email":"%s","phoneNumber":"%s","password":"%s","role":"%s"}
                """.formatted(name, email, phone, PASSWORD, role);
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        String message = objectMapper.readTree(result.getResponse().getContentAsString()).get("message").asText();
        return Long.parseLong(message.replaceAll("\\D+", ""));
    }

    private AuthSession login(String identifier) throws Exception {
        String body = "{\"identifier\":\"%s\",\"password\":\"%s\"}".formatted(identifier, PASSWORD);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return new AuthSession(node.get("token").asText(), node.get("userId").asLong(),
                node.get("role").asText(), node.get("name").asText(), node.get("email").asText());
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private long createVehicle(String token, String registrationNo, String gpsDeviceId) throws Exception {
        String body = """
                {"registrationNo":"%s","make":"Tata","model":"Ace","gpsDeviceId":"%s","currentOdometer":1000}
                """.formatted(registrationNo, gpsDeviceId);
        MvcResult result = mockMvc.perform(post("/api/vehicles")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void geofenceUpdateAndDelete() throws Exception {
        String s = suffix();
        register("Fence CRUD Mgr", "fcrudmgr" + s + "@example.com", uniquePhone(s), "FLEET_MANAGER");
        AuthSession manager = login("fcrudmgr" + s + "@example.com");

        MvcResult created = mockMvc.perform(post("/api/geofence")
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Initial Depot","latitude":28.6139,"longitude":77.2090,"radiusKm":5}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.radiusKm").value(5))
                .andReturn();
        long fenceId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        
        mockMvc.perform(put("/api/geofence/{id}", fenceId)
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Renamed Depot","latitude":28.6139,"longitude":77.2090,"radiusKm":12}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed Depot"))
                .andExpect(jsonPath("$.radiusKm").value(12));

        
        mockMvc.perform(put("/api/geofence/{id}", 999_999_999L)
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Ghost","latitude":28.6139,"longitude":77.2090,"radiusKm":1}
                                """))
                .andExpect(status().isNotFound());

        
        mockMvc.perform(delete("/api/geofence/{id}", fenceId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/geofence/{id}", fenceId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isNotFound());
    }

    @Test
    void documentUpdateAndDelete() throws Exception {
        String s = suffix();
        register("Doc CRUD Mgr", "docrudmgr" + s + "@example.com", uniquePhone(s), "FLEET_MANAGER");
        register("Doc CRUD Driver", "docruddrv" + s + "@example.com", uniquePhone(s + "1"), "DRIVER");
        AuthSession manager = login("docrudmgr" + s + "@example.com");
        AuthSession driver = login("docruddrv" + s + "@example.com");

        long vehicleId = createVehicle(manager.token(), "KA20AB" + s.substring(s.length() - 4),
                "GPSCRUD" + s.substring(s.length() - 4));

        MvcResult created = mockMvc.perform(post("/api/documents")
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"type":"RC","expiryDate":"%s"}
                                """.formatted(vehicleId, FAR_FUTURE)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("RC"))
                .andReturn();
        long docId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        
        mockMvc.perform(put("/api/documents/{id}", docId)
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"type":"INSURANCE","expiryDate":"%s"}
                                """.formatted(vehicleId, FAR_FUTURE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("INSURANCE"))
                .andExpect(jsonPath("$.status").value("VALID"));

        
        mockMvc.perform(put("/api/documents/{id}", 999_999_999L)
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"type":"RC","expiryDate":"%s"}
                                """.formatted(vehicleId, FAR_FUTURE)))
                .andExpect(status().isNotFound());

        
        mockMvc.perform(put("/api/documents/{id}", docId)
                        .header("Authorization", bearer(driver.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"type":"RC","expiryDate":"%s"}
                                """.formatted(vehicleId, FAR_FUTURE)))
                .andExpect(status().isForbidden());

        
        mockMvc.perform(delete("/api/documents/{id}", docId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/documents/{id}", docId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isNotFound());
    }

    @Test
    void fuelLogGetByIdAndDelete() throws Exception {
        String s = suffix();
        long driverId = register("Fuel CRUD Driver", "fcruddrv" + s + "@example.com", uniquePhone(s), "DRIVER");
        register("Fuel CRUD Fin", "fcrudfin" + s + "@example.com", uniquePhone(s + "1"), "FINANCE_OFFICER");
        register("Fuel CRUD Mgr", "fcrudmgr2" + s + "@example.com", uniquePhone(s + "2"), "FLEET_MANAGER");
        AuthSession driver = login("fcruddrv" + s + "@example.com");
        AuthSession finance = login("fcrudfin" + s + "@example.com");
        AuthSession manager = login("fcrudmgr2" + s + "@example.com");

        long vehicleId = createVehicle(manager.token(), "KA21CD" + s.substring(s.length() - 4),
                "GPSFUEL" + s.substring(s.length() - 4));

        MvcResult created = mockMvc.perform(post("/api/fuel/log")
                        .header("Authorization", bearer(driver.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"driverId":%d,"quantityLitres":40,"cost":4000,"date":"2026-07-15"}
                                """.formatted(vehicleId, driverId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantityLitres").value(40))
                .andReturn();
        long logId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        
        mockMvc.perform(get("/api/fuel/log/{id}", logId)
                        .header("Authorization", bearer(finance.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(logId));

        
        mockMvc.perform(get("/api/fuel/log/{id}", 999_999_999L)
                        .header("Authorization", bearer(finance.token())))
                .andExpect(status().isNotFound());

        
        mockMvc.perform(delete("/api/fuel/log/{id}", logId)
                        .header("Authorization", bearer(finance.token())))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/fuel/log/{id}", logId)
                        .header("Authorization", bearer(finance.token())))
                .andExpect(status().isNotFound());

        
        mockMvc.perform(delete("/api/fuel/log/{id}", logId)
                        .header("Authorization", bearer(driver.token())))
                .andExpect(status().isForbidden());
    }

    @Test
    void maintenanceUpdateAndDelete() throws Exception {
        String s = suffix();
        register("Maint CRUD Mgr", "mcrudmgr" + s + "@example.com", uniquePhone(s), "MAINTENANCE_MANAGER");
        register("Maint CRUD Fleet", "mcrudfm" + s + "@example.com", uniquePhone(s + "1"), "FLEET_MANAGER");
        AuthSession maint = login("mcrudmgr" + s + "@example.com");
        AuthSession fleetMgr = login("mcrudfm" + s + "@example.com");

        long vehicleId = createVehicle(fleetMgr.token(), "KA22EF" + s.substring(s.length() - 4),
                "GPSMNT" + s.substring(s.length() - 4));

        MvcResult created = mockMvc.perform(post("/api/maintenance")
                        .header("Authorization", bearer(maint.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"serviceType":"Oil change","trigger":"SCHEDULE","scheduledDate":"2026-08-15","cost":1500}
                                """.formatted(vehicleId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andReturn();
        long orderId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        
        mockMvc.perform(get("/api/vehicles/{id}", vehicleId)
                        .header("Authorization", bearer(fleetMgr.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MAINTENANCE"));

        
        mockMvc.perform(put("/api/maintenance/{id}", orderId)
                        .header("Authorization", bearer(maint.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"serviceType":"Brake pads","trigger":"SCHEDULE","scheduledDate":"2026-08-20","cost":2500}
                                """.formatted(vehicleId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.serviceType").value("Brake pads"))
                .andExpect(jsonPath("$.scheduledDate").value("2026-08-20"));

        
        mockMvc.perform(put("/api/maintenance/{id}", 999_999_999L)
                        .header("Authorization", bearer(maint.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"serviceType":"X","trigger":"SCHEDULE","scheduledDate":"2026-08-20","cost":1}
                                """.formatted(vehicleId)))
                .andExpect(status().isNotFound());

        
        mockMvc.perform(delete("/api/maintenance/{id}", orderId)
                        .header("Authorization", bearer(maint.token())))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/vehicles/{id}", vehicleId)
                        .header("Authorization", bearer(fleetMgr.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        mockMvc.perform(delete("/api/maintenance/{id}", orderId)
                        .header("Authorization", bearer(maint.token())))
                .andExpect(status().isNotFound());
    }
}
