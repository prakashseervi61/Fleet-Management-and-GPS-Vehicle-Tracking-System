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

import java.math.BigDecimal;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

 










@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ApiWorkflowIntegrationTest {

    private static final String PASSWORD = "Passw0rd!";
    private static final String VALID_LICENCE = "KA30DL2099001";
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
        return "98" + String.format("%08d", Math.abs(Long.parseLong(suffix)) % 100_000_000);
    }

    private long register(String name, String email, String phone, String role) throws Exception {
        String body = """
                {"name":"%s","email":"%s","phoneNumber":"%s","password":"%s","role":"%s"}
                """.formatted(name, email, phone, PASSWORD, role);
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message", containsString("User registered successfully")))
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

    private long createVehicle(String token, String registrationNo, String gpsDeviceId, Integer odometer) throws Exception {
        String body = """
                {"registrationNo":"%s","make":"Tata","model":"Ace","gpsDeviceId":"%s","currentOdometer":%s}
                """.formatted(registrationNo, gpsDeviceId, odometer == null ? "null" : odometer);
        MvcResult result = mockMvc.perform(post("/api/vehicles")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.registrationNo").value(registrationNo))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private void addDocument(String token, long vehicleId, String type, String expiryDate) throws Exception {
        String body = """
                {"vehicleId":%d,"type":"%s","expiryDate":"%s"}
                """.formatted(vehicleId, type, expiryDate);
        mockMvc.perform(post("/api/documents")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value(type));
    }

    private void sendPing(String token, long vehicleId, double lat, double lon, double speed) throws Exception {
        String body = """
                {"vehicleId":%d,"latitude":%s,"longitude":%s,"speedKmh":%s}
                """.formatted(vehicleId, lat, lon, speed);
        mockMvc.perform(post("/api/gps/ping")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
    }

    

    @Test
    void registerValidationWorkflow() throws Exception {
        String s = suffix();
        String email = "val" + s + "@example.com";
        String phone = uniquePhone(s);

        
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Ravi123","email":"bad1%s@example.com","phoneNumber":"9876500001","password":"%s","role":"DRIVER"}
                                """.formatted(s, PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Name must not contain numbers or special characters"));

        
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Ravi Kumar","email":"bad2%s@example.com","phoneNumber":"12345","password":"%s","role":"DRIVER"}
                                """.formatted(s, PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Phone Number must be exactly 10 digits long"));

        
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Ravi Kumar","email":"bad3%s@example.com","phoneNumber":"9876500002","password":"short","role":"DRIVER"}
                                """.formatted(s)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Password must meet security requirements"));

        
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Ravi Kumar","email":"bad4%s@example.com","phoneNumber":"9876500003","password":"%s","role":"PILOT"}
                                """.formatted(s, PASSWORD)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Invalid role: PILOT"));

        
        register("Ravi Kumar", email, phone, "DRIVER");

        
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Other Name","email":"%s","phoneNumber":"9876500004","password":"%s","role":"DRIVER"}
                                """.formatted(email, PASSWORD)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This email is already registered"));

        
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Other Name","email":"dup%s@example.com","phoneNumber":"%s","password":"%s","role":"DRIVER"}
                                """.formatted(s, phone, PASSWORD)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This phone number is already registered"));

        
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"%s\",\"password\":\"WrongPass1!\"}".formatted(email)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userManagementWorkflow() throws Exception {
        String s = suffix();
        long driverId = register("Anil Kumar", "user" + s + "@example.com", uniquePhone(s), "DRIVER");
        register("Mgr Name", "mgr" + s + "@example.com", uniquePhone(s + "1"), "FLEET_MANAGER");
        AuthSession m = login("mgr" + s + "@example.com");

        
        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", bearer(m.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("mgr" + s + "@example.com"))
                .andExpect(jsonPath("$.role").value("FLEET_MANAGER"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        
        
        
        mockMvc.perform(get("/api/users/{id}", driverId))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/users/{id}", driverId)
                        .header("Authorization", bearer(m.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(driverId))
                .andExpect(jsonPath("$.email").value("user" + s + "@example.com"));

        mockMvc.perform(get("/api/users/email/{email}", "user" + s + "@example.com")
                        .header("Authorization", bearer(m.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("DRIVER"));

        mockMvc.perform(get("/api/users")
                        .header("Authorization", bearer(m.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        
        mockMvc.perform(put("/api/users/{id}", driverId)
                        .header("Authorization", bearer(m.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"drivingLicenceNo":"%s","licenceExpiryDate":"%s","active":true}
                                """.formatted(VALID_LICENCE, FAR_FUTURE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.drivingLicenceNo").value(VALID_LICENCE))
                .andExpect(jsonPath("$.active").value(true));

        
        mockMvc.perform(patch("/api/users/{id}/deactivate", driverId)
                        .header("Authorization", bearer(m.token())))
                .andExpect(status().isOk());

        
        long throwaway = register("Temp User", "tmp" + s + "@example.com", uniquePhone(s + "2"), "GUEST");
        mockMvc.perform(delete("/api/users/{id}", throwaway)
                        .header("Authorization", bearer(m.token())))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/users/{id}", throwaway)
                        .header("Authorization", bearer(m.token())))
                .andExpect(status().isNotFound());

        
        mockMvc.perform(get("/api/users/{id}", 999_999_999L)
                        .header("Authorization", bearer(m.token())))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/users/email/{email}", "missing" + s + "@example.com")
                        .header("Authorization", bearer(m.token())))
                .andExpect(status().isNotFound());
    }

    @Test
    void vehicleManagementWorkflowAndRbac() throws Exception {
        String s = suffix();
        long driverId = register("Veer Driver", "vehdrv" + s + "@example.com", uniquePhone(s), "DRIVER");
        long managerId = register("Veer Mgr", "vehmgr" + s + "@example.com", uniquePhone(s + "1"), "FLEET_MANAGER");
        AuthSession manager = login("vehmgr" + s + "@example.com");
        AuthSession driver = login("vehdrv" + s + "@example.com");

        String regNo = "KA01AB" + s.substring(s.length() - 4);
        String gpsId = "GPS" + s.substring(s.length() - 4);

        
        long vehicleId = createVehicle(manager.token(), regNo, gpsId, 1000);
        mockMvc.perform(get("/api/vehicles/{id}", vehicleId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registrationNo").value(regNo))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.currentOdometer").value(1000));

        
        mockMvc.perform(post("/api/vehicles")
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"registrationNo":"%s","make":"Tata","model":"Ace","gpsDeviceId":"DUP%s","currentOdometer":1000}
                                """.formatted(regNo, s.substring(s.length() - 4))))
                .andExpect(status().isConflict());

        
        mockMvc.perform(get("/api/vehicles")
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        
        mockMvc.perform(put("/api/vehicles/{id}", vehicleId)
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"registrationNo":"%s","make":"Tata","model":"Super Ace","gpsDeviceId":"%s","currentOdometer":1200}
                                """.formatted(regNo, gpsId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.model").value("Super Ace"))
                .andExpect(jsonPath("$.currentOdometer").value(1200));

        
        mockMvc.perform(post("/api/vehicles/{id}/assign-driver", vehicleId)
                        .header("Authorization", bearer(manager.token()))
                        .param("driverId", String.valueOf(driverId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedDriver.id").value(driverId));

        
        
        
        mockMvc.perform(post("/api/vehicles")
                        .header("Authorization", bearer(driver.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"registrationNo":"KA99ZZ%s","make":"Tata","model":"Ace","gpsDeviceId":"GPS9%s","currentOdometer":10}
                                """.formatted(s.substring(s.length() - 4), s.substring(s.length() - 4))))
                .andExpect(status().isForbidden());

        
        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"registrationNo":"KA88YY%s","make":"Tata","model":"Ace","gpsDeviceId":"GPS8%s","currentOdometer":0}
                                """.formatted(s.substring(s.length() - 4), s.substring(s.length() - 4))))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isUnauthorized());

        
        String regNo2 = "KA02CD" + s.substring(s.length() - 4);
        long vehicle2 = createVehicle(manager.token(), regNo2, "GPSD" + s.substring(s.length() - 4), 500);
        mockMvc.perform(delete("/api/vehicles/{id}", vehicle2)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/vehicles/{id}", vehicle2)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isNotFound());
    }

    @Test
    void tripLifecycleWorkflow() throws Exception {
        String s = suffix();
        long driverId = register("Trip Driver", "trpdrv" + s + "@example.com", uniquePhone(s), "DRIVER");
        long mgrId = register("Trip Mgr", "trpmgr" + s + "@example.com", uniquePhone(s + "1"), "FLEET_MANAGER");
        register("Trip Maint", "trpmnt" + s + "@example.com", uniquePhone(s + "2"), "MAINTENANCE_MANAGER");
        AuthSession manager = login("trpmgr" + s + "@example.com");
        AuthSession driver = login("trpdrv" + s + "@example.com");
        AuthSession maintMgr = login("trpmnt" + s + "@example.com");

        
        mockMvc.perform(put("/api/users/{id}", driverId)
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"drivingLicenceNo":"%s","licenceExpiryDate":"%s","active":true}
                                """.formatted(VALID_LICENCE, FAR_FUTURE)))
                .andExpect(status().isOk());

        
        long vehicleId = createVehicle(manager.token(), "KA03EF" + s.substring(s.length() - 4),
                "GPST" + s.substring(s.length() - 4), 1000);
        addDocument(manager.token(), vehicleId, "RC", FAR_FUTURE);
        addDocument(manager.token(), vehicleId, "INSURANCE", FAR_FUTURE);
        addDocument(manager.token(), vehicleId, "PUC", FAR_FUTURE);
        addDocument(manager.token(), vehicleId, "FITNESS", FAR_FUTURE);

        String tripBody = """
                {"vehicleId":%d,"driverId":%d,"origin":"Bengaluru","destination":"Mysuru","plannedStart":"2026-08-01T09:00:00","distanceKm":140}
                """.formatted(vehicleId, driverId);

        
        MvcResult tripResult = mockMvc.perform(post("/api/trips")
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tripBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.vehicleId").value(vehicleId))
                .andExpect(jsonPath("$.driverId").value(driverId))
                .andExpect(jsonPath("$.origin").value("Bengaluru"))
                .andReturn();
        long tripId = objectMapper.readTree(tripResult.getResponse().getContentAsString()).get("id").asLong();

        
        mockMvc.perform(post("/api/trips/{id}/start", tripId)
                        .header("Authorization", bearer(driver.token())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("GPS device must be online before trip can be started"));

        
        mockMvc.perform(post("/api/trips")
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tripBody))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("simultaneous trip")));

        
        sendPing(driver.token(), vehicleId, 12.9716, 77.5946, 45);
        mockMvc.perform(post("/api/trips/{id}/start", tripId)
                        .header("Authorization", bearer(driver.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("STARTED"));

        
        mockMvc.perform(get("/api/trips")
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        mockMvc.perform(get("/api/trips/active")
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        mockMvc.perform(get("/api/trips/{id}", tripId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("STARTED"));

        
        mockMvc.perform(post("/api/trips/{id}/complete", tripId)
                        .header("Authorization", bearer(driver.token()))
                        .param("distanceKm", "75"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
        mockMvc.perform(get("/api/vehicles/{id}", vehicleId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentOdometer").value(1075));

        
        mockMvc.perform(post("/api/trips/{id}/complete", tripId)
                        .header("Authorization", bearer(driver.token())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Only STARTED trips can be completed"));

        
        mockMvc.perform(post("/api/trips/{id}/cancel", tripId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Completed trips cannot be cancelled"));

        
        MvcResult trip2Result = mockMvc.perform(post("/api/trips")
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tripBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andReturn();
        long trip2Id = objectMapper.readTree(trip2Result.getResponse().getContentAsString()).get("id").asLong();
        mockMvc.perform(post("/api/trips/{id}/cancel", trip2Id)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        
        long nonCompliantVehicle = createVehicle(manager.token(), "KA04GH" + s.substring(s.length() - 4),
                "GPSN" + s.substring(s.length() - 4), 200);
        mockMvc.perform(post("/api/trips")
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"driverId":%d,"origin":"A","destination":"B","plannedStart":"2026-08-02T09:00:00","distanceKm":10}
                                """.formatted(nonCompliantVehicle, driverId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("mandatory documents")));

        
        mockMvc.perform(post("/api/trips")
                        .header("Authorization", bearer(driver.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tripBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/trips")
                        .header("Authorization", bearer(maintMgr.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tripBody))
                .andExpect(status().isForbidden());
    }

    @Test
    void gpsAndDriverScoreWorkflow() throws Exception {
        String s = suffix();
        long driverId = register("Score Driver", "scodrv" + s + "@example.com", uniquePhone(s), "DRIVER");
        register("Score Mgr", "scomgr" + s + "@example.com", uniquePhone(s + "1"), "FLEET_MANAGER");
        AuthSession manager = login("scomgr" + s + "@example.com");
        AuthSession driver = login("scodrv" + s + "@example.com");

        long vehicleId = createVehicle(manager.token(), "KA05JK" + s.substring(s.length() - 4),
                "GPSS" + s.substring(s.length() - 4), 800);
        mockMvc.perform(post("/api/vehicles/{id}/assign-driver", vehicleId)
                        .header("Authorization", bearer(manager.token()))
                        .param("driverId", String.valueOf(driverId)))
                .andExpect(status().isOk());

        
        
        
        String[][] pings = {
                {"2026-07-01T10:00:00", "28.6139", "77.2090", "60"},
                {"2026-07-01T10:00:10", "28.6139", "77.2090", "90"},
                {"2026-07-01T10:00:20", "28.6139", "77.2090", "30"},
                {"2026-07-01T10:00:30", "28.6139", "77.2090", "0"},
                {"2026-07-01T10:00:40", "28.6139", "77.2090", "0"}
        };
        for (String[] p : pings) {
            String body = """
                    {"vehicleId":%d,"latitude":%s,"longitude":%s,"speedKmh":%s,"recordedAt":"%s"}
                    """.formatted(vehicleId, Double.parseDouble(p[1]), Double.parseDouble(p[2]), Double.parseDouble(p[3]), p[0]);
            mockMvc.perform(post("/api/gps/ping")
                            .header("Authorization", bearer(driver.token()))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isCreated());
        }

        
        mockMvc.perform(get("/api/gps/history/{vehicleId}", vehicleId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[0].eventType").value("IDLE"));

        
        mockMvc.perform(get("/api/vehicles/{id}/location", vehicleId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vehicleId").value(vehicleId))
                .andExpect(jsonPath("$.speedKmh").value(0.0));

        
        mockMvc.perform(get("/api/drivers/{id}/score", driverId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.driverId").value(driverId))
                .andExpect(jsonPath("$.totalPings").value(5))
                .andExpect(jsonPath("$.speedingCount").value(1))
                .andExpect(jsonPath("$.harshBrakeCount").value(2))
                .andExpect(jsonPath("$.idleCount").value(1))
                .andExpect(jsonPath("$.score").value(73));

        
        mockMvc.perform(post("/api/gps/ping")
                        .header("Authorization", bearer(driver.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"latitude":91.0,"longitude":77.2090,"speedKmh":40}
                                """.formatted(vehicleId)))
                .andExpect(status().isBadRequest());

        
        mockMvc.perform(post("/api/gps/ping")
                        .header("Authorization", bearer(driver.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"latitude":28.6139,"longitude":77.2090,"speedKmh":-5}
                                """.formatted(vehicleId)))
                .andExpect(status().isBadRequest());

        
        mockMvc.perform(get("/api/gps/history/{vehicleId}", 999_999_999L)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isNotFound());

        
        mockMvc.perform(get("/api/gps/history/{vehicleId}", vehicleId)
                        .header("Authorization", bearer(driver.token())))
                .andExpect(status().isForbidden());
    }

    @Test
    void geofenceAndFleetMapWorkflow() throws Exception {
        String s = suffix();
        long driverId = register("Fence Driver", "fendrv" + s + "@example.com", uniquePhone(s), "DRIVER");
        register("Fence Mgr", "fenmgr" + s + "@example.com", uniquePhone(s + "1"), "FLEET_MANAGER");
        AuthSession manager = login("fenmgr" + s + "@example.com");
        AuthSession driver = login("fendrv" + s + "@example.com");

        long vehicleId = createVehicle(manager.token(), "KA06LM" + s.substring(s.length() - 4),
                "GPSF" + s.substring(s.length() - 4), 100);

        
        mockMvc.perform(post("/api/geofence")
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Bengaluru Depot","latitude":28.6139,"longitude":77.2090,"radiusKm":5}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Bengaluru Depot"))
                .andExpect(jsonPath("$.radiusKm").value(5));

        
        mockMvc.perform(get("/api/geofence")
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        
        sendPing(driver.token(), vehicleId, 28.6139, 77.2090, 30);
        mockMvc.perform(post("/api/gps/ping")
                        .header("Authorization", bearer(driver.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"latitude":28.9000,"longitude":77.4000,"speedKmh":30}
                                """.formatted(vehicleId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.eventType").value("GEO_EXIT"));

        
        mockMvc.perform(get("/api/geofence/alerts")
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].alertType").value("EXIT"))
                .andExpect(jsonPath("$[0].vehicle.id").value(vehicleId));

        
        mockMvc.perform(get("/api/fleet/map")
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].registrationNo").value(containsString("KA06LM")))
                .andExpect(jsonPath("$[0].latitude").value(28.9));

        
        mockMvc.perform(post("/api/geofence")
                        .header("Authorization", bearer(driver.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Illegal","latitude":12.0,"longitude":77.0,"radiusKm":1}
                                """))
                .andExpect(status().isForbidden());

        
        MvcResult fenceResult = mockMvc.perform(get("/api/geofence")
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andReturn();
        long fenceId = objectMapper.readTree(fenceResult.getResponse().getContentAsString()).get(0).get("id").asLong();
        mockMvc.perform(delete("/api/geofence/{id}", fenceId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/geofence/{id}", fenceId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isNotFound());
    }

    @Test
    void maintenanceWorkflow() throws Exception {
        String s = suffix();
        register("Maint Mgr", "mtmgr" + s + "@example.com", uniquePhone(s), "MAINTENANCE_MANAGER");
        register("Maint Driver", "mtdrv" + s + "@example.com", uniquePhone(s + "1"), "DRIVER");
        
        register("Maint Fleet Mgr", "mtfm" + s + "@example.com", uniquePhone(s + "2"), "FLEET_MANAGER");
        AuthSession maint = login("mtmgr" + s + "@example.com");
        AuthSession driver = login("mtdrv" + s + "@example.com");
        AuthSession fleetMgr = login("mtfm" + s + "@example.com");

        long vehicleId = createVehicle(fleetMgr.token(), "KA07NP" + s.substring(s.length() - 4),
                "GPSM" + s.substring(s.length() - 4), 1000);

        
        MvcResult orderResult = mockMvc.perform(post("/api/maintenance")
                        .header("Authorization", bearer(maint.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"serviceType":"Oil change","trigger":"SCHEDULE","scheduledDate":"2026-08-15","cost":1500}
                                """.formatted(vehicleId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.serviceType").value("Oil change"))
                .andExpect(jsonPath("$.cost").value(1500))
                .andReturn();
        long orderId = objectMapper.readTree(orderResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/vehicles/{id}", vehicleId)
                        .header("Authorization", bearer(maint.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MAINTENANCE"));

        
        
        
        
        
        MvcResult secondResult = mockMvc.perform(post("/api/maintenance")
                        .header("Authorization", bearer(maint.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"serviceType":"Brake pads","trigger":"SCHEDULE","scheduledDate":"2026-08-16","cost":2000}
                                """.formatted(vehicleId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andReturn();
        long order2Id = objectMapper.readTree(secondResult.getResponse().getContentAsString()).get("id").asLong();

        
        mockMvc.perform(get("/api/maintenance/{id}", orderId)
                        .header("Authorization", bearer(maint.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(orderId));
        mockMvc.perform(get("/api/maintenance")
                        .header("Authorization", bearer(maint.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        mockMvc.perform(get("/api/maintenance/vehicle/{vehicleId}", vehicleId)
                        .header("Authorization", bearer(maint.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        
        
        mockMvc.perform(post("/api/maintenance/{id}/complete", orderId)
                        .header("Authorization", bearer(maint.token()))
                        .param("cost", "2500"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.cost").value(2500));
        mockMvc.perform(get("/api/vehicles/{id}", vehicleId)
                        .header("Authorization", bearer(maint.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MAINTENANCE"));

        
        mockMvc.perform(post("/api/maintenance/{id}/complete", order2Id)
                        .header("Authorization", bearer(maint.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
        mockMvc.perform(get("/api/vehicles/{id}", vehicleId)
                        .header("Authorization", bearer(maint.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        
        
        mockMvc.perform(post("/api/maintenance/{id}/complete", orderId)
                        .header("Authorization", bearer(maint.token())))
                .andExpect(status().isOk());

        
        mockMvc.perform(get("/api/maintenance/{id}", 999_999_999L)
                        .header("Authorization", bearer(maint.token())))
                .andExpect(status().isNotFound());

        
        long highOdo = createVehicle(fleetMgr.token(), "KA08QR" + s.substring(s.length() - 4),
                "GPSO" + s.substring(s.length() - 4), 20_000);
        mockMvc.perform(post("/api/maintenance/triggers/odometer")
                        .header("Authorization", bearer(maint.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        mockMvc.perform(get("/api/maintenance/vehicle/{vehicleId}", highOdo)
                        .header("Authorization", bearer(maint.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].trigger").value("ODOMETER"));

        
        mockMvc.perform(post("/api/maintenance")
                        .header("Authorization", bearer(driver.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"serviceType":"Illegal","trigger":"SCHEDULE","scheduledDate":"2026-08-15","cost":1}
                                """.formatted(vehicleId)))
                .andExpect(status().isForbidden());
    }

    @Test
    void fuelLogWorkflow() throws Exception {
        String s = suffix();
        long driverId = register("Fuel Driver", "fudrv" + s + "@example.com", uniquePhone(s), "DRIVER");
        register("Fuel Fin", "fufin" + s + "@example.com", uniquePhone(s + "1"), "FINANCE_OFFICER");
        
        register("Fuel Fleet Mgr", "fufm" + s + "@example.com", uniquePhone(s + "2"), "FLEET_MANAGER");
        AuthSession driver = login("fudrv" + s + "@example.com");
        AuthSession finance = login("fufin" + s + "@example.com");
        AuthSession fleetMgr = login("fufm" + s + "@example.com");

        long vehicleId = createVehicle(fleetMgr.token(), "KA09ST" + s.substring(s.length() - 4),
                "GPSU" + s.substring(s.length() - 4), 300);

        
        mockMvc.perform(post("/api/fuel/log")
                        .header("Authorization", bearer(driver.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"driverId":%d,"quantityLitres":40,"cost":4000,"date":"2026-07-15"}
                                """.formatted(vehicleId, driverId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantityLitres").value(40))
                .andExpect(jsonPath("$.cost").value(4000));

        
        mockMvc.perform(post("/api/fuel/log")
                        .header("Authorization", bearer(finance.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"driverId":%d,"quantityLitres":50,"cost":5500,"date":"2026-07-20"}
                                """.formatted(vehicleId, driverId)))
                .andExpect(status().isCreated());

        
        mockMvc.perform(get("/api/fuel/log")
                        .header("Authorization", bearer(finance.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
        mockMvc.perform(get("/api/fuel/log/vehicle/{vehicleId}", vehicleId)
                        .header("Authorization", bearer(finance.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
        mockMvc.perform(get("/api/fuel/log/driver/{driverId}", driverId)
                        .header("Authorization", bearer(finance.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        
        MvcResult costResult = mockMvc.perform(get("/api/fuel/log/cost")
                        .header("Authorization", bearer(finance.token())))
                .andExpect(status().isOk())
                .andReturn();
        BigDecimal total = objectMapper.readTree(costResult.getResponse().getContentAsString()).decimalValue();
        assert total.compareTo(new BigDecimal("9500")) == 0 : "Expected total fuel cost 9500 but was " + total;

        
        mockMvc.perform(get("/api/fuel/log/cost")
                        .header("Authorization", bearer(finance.token()))
                        .param("from", "2026-07-01")
                        .param("to", "2026-07-31"))
                .andExpect(status().isOk());

        
        mockMvc.perform(get("/api/fuel/log")
                        .header("Authorization", bearer(driver.token())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/fuel/log"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void documentWorkflow() throws Exception {
        String s = suffix();
        register("Doc Mgr", "docmgr" + s + "@example.com", uniquePhone(s), "FLEET_MANAGER");
        register("Doc Driver", "docdrv" + s + "@example.com", uniquePhone(s + "1"), "DRIVER");
        AuthSession manager = login("docmgr" + s + "@example.com");
        AuthSession driver = login("docdrv" + s + "@example.com");

        long vehicleId = createVehicle(manager.token(), "KA10UV" + s.substring(s.length() - 4),
                "GPSD2" + s.substring(s.length() - 4), 500);

        
        addDocument(manager.token(), vehicleId, "RC", FAR_FUTURE);
        addDocument(manager.token(), vehicleId, "INSURANCE", FAR_FUTURE);

        
        MvcResult soonResult = mockMvc.perform(post("/api/documents")
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"type":"PUC","expiryDate":"2026-08-10"}
                                """.formatted(vehicleId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("PUC"))
                .andExpect(jsonPath("$.status").value("EXPIRING_SOON"))
                .andReturn();
        long docId = objectMapper.readTree(soonResult.getResponse().getContentAsString()).get("id").asLong();

        
        mockMvc.perform(get("/api/documents")
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));
        mockMvc.perform(get("/api/documents/vehicle/{vehicleId}", vehicleId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));

        
        mockMvc.perform(get("/api/documents/expiry")
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$['60']").isArray())
                .andExpect(jsonPath("$['30']").isArray())
                .andExpect(jsonPath("$['7']").isArray());

        
        
        
        mockMvc.perform(post("/api/documents/refresh")
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/documents/vehicle/{vehicleId}", vehicleId)
                        .header("Authorization", bearer(manager.token())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)].status".formatted(docId), org.hamcrest.Matchers.contains("EXPIRING_SOON")));

        
        mockMvc.perform(post("/api/documents")
                        .header("Authorization", bearer(manager.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":999999999,"type":"RC","expiryDate":"%s"}
                                """.formatted(FAR_FUTURE)))
                .andExpect(status().isNotFound());

        
        mockMvc.perform(post("/api/documents")
                        .header("Authorization", bearer(driver.token()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"vehicleId":%d,"type":"RC","expiryDate":"%s"}
                                """.formatted(vehicleId, FAR_FUTURE)))
                .andExpect(status().isForbidden());

        
        mockMvc.perform(post("/api/documents/refresh")
                        .header("Authorization", bearer(driver.token())))
                .andExpect(status().isForbidden());
    }

    @Test
    void logoutBlacklistsTokenWorkflow() throws Exception {
        String s = suffix();
        register("Logout User", "lgout" + s + "@example.com", uniquePhone(s), "DRIVER");
        AuthSession session = login("lgout" + s + "@example.com");

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", bearer(session.token())))
                .andExpect(status().isOk());

        
        mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", bearer(session.token())))
                .andExpect(status().isUnauthorized());
    }
}
