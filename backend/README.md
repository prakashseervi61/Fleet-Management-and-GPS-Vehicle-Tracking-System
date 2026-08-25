# Fleet Management System — Backend

Spring Boot 3.x backend for the **Fleet Management and GPS Vehicle Tracking System**. Provides REST APIs for vehicle management, trip lifecycle, live GPS tracking, geofencing, maintenance, fuel logging, document expiry tracking, and driver behaviour scoring — secured with JWT and role-based access control (RBAC).

---

## Tech Stack

| Technology | Details |
|---|---|
| Java | 17+ |
| Spring Boot | 3.5.16 (Web, Data JPA, Security, Validation) |
| Database | MySQL 8.0+ (`fleet_management`), H2 for tests |
| Authentication | JWT (jjwt 0.11.5) + Spring Security |
| API Docs | springdoc-openapi 2.8.3 (Swagger UI) |
| Build | Maven |

## What Is Implemented

- **Authentication & Authorization**
  - Register / login / logout with JWT tokens
  - Role-based token expiry: user **8h**, staff **12h**, admin **24h**
  - Token blacklist on logout (`TokenBlacklistService`)
  - BCrypt password hashing
  - RBAC enforced per endpoint via `@PreAuthorize`
  - 7 roles: `GUEST`, `DRIVER`, `MAINTENANCE_MANAGER`, `LOGISTICS_COORDINATOR`, `FLEET_MANAGER`, `FINANCE_OFFICER`, `SYSTEM_ADMINISTRATOR`
- **Vehicle management** — CRUD, duplicate registration number guard, driver assignment, live vehicle location
- **Trip management** — full lifecycle: create → start → complete/cancel, active-trip listing, distance capture
- **GPS tracking** — ping ingestion, per-vehicle history, stale-ping detection (5 min)
- **Fleet map** — aggregated live positions of all vehicles
- **Geofencing** — geofence CRUD + automatic entry/exit alerts (`GeoUtils` point-in-circle math)
- **Maintenance** — order CRUD, completion with cost, odometer-based service triggers (every 10,000 km)
- **Fuel logs** — log fuel fills by vehicle/driver, total cost report with date range filter
- **Documents & expiry** — vehicle document CRUD, expiry alerts bucketed by days remaining (30/60/90), status refresh
- **Driver behaviour score** — speeding events (>80 km/h threshold) factored into a score
- **API documentation** — Swagger UI via OpenAPI 3
- **Global exception handling** — consistent error responses via `@RestControllerAdvice`

---

## Folder / File Structure

```
backend/
├── pom.xml                          # Maven build config
├── README.md                        # This file
└── src/main/
    ├── java/com/examly/springapp/
    │   ├── FleetManagementApplication.java   # @SpringBootApplication entry point
    │   │
    │   ├── config/                  # Security & app configuration
    │   │   ├── SecurityConfig.java             # Filter chain, CORS, endpoint access rules
    │   │   ├── JwtTokenProvider.java           # Token generation/validation (HS256)
    │   │   ├── JwtAuthTokenFilter.java         # Per-request JWT filter
    │   │   ├── JwtAuthEntryPoint.java          # 401 handling for unauthenticated requests
    │   │   ├── CustomUserDetailsService.java   # Loads users for Spring Security
    │   │   ├── UserPrincipal.java              # Authenticated user principal
    │   │   └── OpenApiConfig.java              # Swagger/OpenAPI setup
    │   │
    │   ├── controller/              # REST API layer (10 controllers)
    │   │   ├── AuthController.java             # /api/auth/**
    │   │   ├── UserController.java             # /api/users/**
    │   │   ├── VehicleController.java          # /api/vehicles/**
    │   │   ├── TripController.java             # /api/trips/**
    │   │   ├── GpsController.java              # /api/gps/**
    │   │   ├── FleetMapController.java         # /api/fleet/map
    │   │   ├── GeoFenceController.java         # /api/geofence/**
    │   │   ├── MaintenanceController.java      # /api/maintenance/**
    │   │   ├── FuelLogController.java          # /api/fuel/log/**
    │   │   ├── DocumentController.java         # /api/documents/**
    │   │   └── DriverController.java           # /api/drivers/{id}/score
    │   │
    │   ├── service/                 # Business logic layer
    │   │   ├── AuthService.java                # Register/login/logout + blacklist
    │   │   ├── TokenBlacklistService.java      # Invalidated JWT store
    │   │   ├── UserService.java
    │   │   ├── VehicleService.java
    │   │   ├── TripService.java
    │   │   ├── GpsPingService.java             # Ping ingestion + history
    │   │   ├── FleetService.java               # Fleet map aggregation
    │   │   ├── GeoFenceService.java            # Geofence CRUD + alert generation
    │   │   ├── GeoUtils.java                   # Haversine distance helpers
    │   │   ├── MaintenanceService.java         # Orders + odometer triggers
    │   │   ├── FleetValidator.java             # Cross-entity business rules
    │   │   ├── FuelLogService.java             # Fuel logs + cost totals
    │   │   ├── DocumentService.java            # Documents + expiry alerts
    │   │   └── DriverBehaviourService.java     # Driver scoring
    │   │
    │   ├── repository/              # Spring Data JPA repositories
    │   │   ├── UserRepository.java
    │   │   ├── VehicleRepository.java
    │   │   ├── TripRepository.java
    │   │   ├── GpsPingRepository.java
    │   │   ├── GeoFenceRepository.java
    │   │   ├── GeoFenceAlertRepository.java
    │   │   ├── MaintenanceOrderRepository.java
    │   │   ├── FuelLogRepository.java
    │   │   └── DocumentRepository.java
    │   │
    │   ├── model/                   # JPA entities
    │   │   ├── User.java                       # + Role enum (7 roles)
    │   │   ├── Vehicle.java
    │   │   ├── Trip.java
    │   │   ├── GpsPing.java
    │   │   ├── GeoFence.java
    │   │   ├── GeoFenceAlert.java
    │   │   ├── MaintenanceOrder.java
    │   │   ├── FuelLog.java
    │   │   ├── Document.java
    │   │   └── dto/                            # Request/response DTOs (18)
    │   │       ├── UserRegistrationDTO.java, LoginRequest.java,
    │   │       │   AuthResponse.java, MessageResponse.java, UserProfileResponse.java
    │   │       ├── VehicleRequest.java, VehicleResponse.java, VehicleLocationResponse.java
    │   │       ├── TripRequest.java, TripResponse.java
    │   │       ├── GpsPingRequest.java
    │   │       ├── GeoFenceRequest.java
    │   │       ├── MaintenanceRequest.java
    │   │       ├── FuelLogRequest.java
    │   │       ├── DocumentRequest.java, ExpiryAlertResponse.java
    │   │       └── DriverScoreResponse.java, FleetMapResponse.java
    │   │
    │   └── exception/               # Error handling
    │       ├── GlobalExceptionHandler.java     # @RestControllerAdvice
    │       ├── ResourceNotFoundException.java  # → 404
    │       ├── DuplicateVehicleException.java  # → 409
    │       ├── UnauthorisedAccessException.java# → 403
    │       ├── BusinessRuleViolationException.java # → 400
    │       ├── InvalidNameException.java       # → 400
    │       └── InvalidPhoneException.java      # → 400
    │
    └── resources/
        └── application.properties    # DB, JPA, JWT, business-rule config
```

---

## API Endpoints

Role abbreviations: **SA** = SYSTEM_ADMINISTRATOR · **FM** = FLEET_MANAGER · **LC** = LOGISTICS_COORDINATOR · **MM** = MAINTENANCE_MANAGER · **FO** = FINANCE_OFFICER · **DR** = DRIVER

All endpoints except `/api/auth/register` and `/api/auth/login` require an `Authorization: Bearer <token>` header.

### Authentication — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login, returns JWT with role-specific expiry |
| POST | `/api/auth/logout` | Public | Blacklists the bearer token |

### Users — `/api/users`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users/profile` | Any authenticated | Current user's profile |
| POST | `/api/users` | Authenticated | Create user |
| GET | `/api/users` | Authenticated | List all users |
| GET | `/api/users/{id}` | Authenticated | Get user by ID |
| GET | `/api/users/email/{email}` | Authenticated | Get user by email |
| PUT | `/api/users/{id}` | Authenticated | Update user |
| DELETE | `/api/users/{id}` | Authenticated | Delete user |
| PATCH | `/api/users/{id}/deactivate` | Authenticated | Deactivate user account |

### Vehicles — `/api/vehicles`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/vehicles` | FM, SA | Register vehicle (rejects duplicates) |
| GET | `/api/vehicles` | FM, LC, MM, FO, SA | List all vehicles |
| GET | `/api/vehicles/{id}` | FM, LC, MM, FO, SA | Vehicle details |
| PUT | `/api/vehicles/{id}` | FM, SA | Update vehicle |
| DELETE | `/api/vehicles/{id}` | FM, SA | Delete vehicle |
| POST | `/api/vehicles/{id}/assign-driver?driverId=` | FM, SA | Assign driver to vehicle |
| GET | `/api/vehicles/{id}/location` | FM, LC, MM, SA | Latest known GPS location |

### Trips — `/api/trips`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/trips` | LC, FM, SA | Create trip |
| GET | `/api/trips` | LC, FM, SA | List all trips |
| GET | `/api/trips/active` | LC, FM, SA | List in-progress trips |
| GET | `/api/trips/{id}` | LC, FM, SA | Trip details |
| POST | `/api/trips/{id}/start` | LC, FM, DR, SA | Mark trip as started |
| POST | `/api/trips/{id}/complete?distanceKm=` | LC, FM, DR, SA | Complete trip (optional distance) |
| POST | `/api/trips/{id}/cancel` | LC, FM, SA | Cancel trip |

### GPS Tracking — `/api/gps`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/gps/ping` | DR, LC, FM, SA | Ingest a GPS ping |
| GET | `/api/gps/history/{vehicleId}` | LC, FM, MM, SA | Location history for a vehicle |

### Fleet Map — `/api/fleet`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/fleet/map` | LC, FM, MM, SA | Live positions of all vehicles |

### Geofences — `/api/geofence`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/geofence` | FM, SA | Create geofence |
| GET | `/api/geofence` | LC, FM, SA | List all geofences |
| PUT | `/api/geofence/{id}` | FM, SA | Update geofence |
| DELETE | `/api/geofence/{id}` | FM, SA | Delete geofence |
| GET | `/api/geofence/alerts` | LC, FM, SA | Entry/exit breach alerts |

### Maintenance — `/api/maintenance`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/maintenance` | MM, FM, SA | Create maintenance order |
| GET | `/api/maintenance` | MM, FM, FO, SA | List all orders |
| GET | `/api/maintenance/{id}` | MM, FM, FO, SA | Order details |
| PUT | `/api/maintenance/{id}` | MM, FM, SA | Update order |
| DELETE | `/api/maintenance/{id}` | MM, SA | Delete order |
| GET | `/api/maintenance/vehicle/{vehicleId}` | MM, FM, SA | Orders for a vehicle |
| POST | `/api/maintenance/{id}/complete?cost=` | MM, FM, SA | Complete order with final cost |
| POST | `/api/maintenance/triggers/odometer` | MM, LC, FM, SA | Generate odometer-based service orders |

### Fuel Logs — `/api/fuel/log`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/fuel/log` | DR, FO, FM, SA | Log a fuel fill |
| GET | `/api/fuel/log` | FO, FM, MM, SA | List all logs |
| GET | `/api/fuel/log/{id}` | FO, FM, SA | Log details |
| GET | `/api/fuel/log/vehicle/{vehicleId}` | FO, FM, SA | Logs for a vehicle |
| GET | `/api/fuel/log/driver/{driverId}` | FO, FM, SA | Logs by driver |
| DELETE | `/api/fuel/log/{id}` | FO, FM, SA | Delete a log |
| GET | `/api/fuel/log/cost?from=&to=` | FO, FM, SA | Total fuel cost (optional date range) |

### Documents — `/api/documents`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/documents` | FM, MM, SA | Add vehicle document |
| GET | `/api/documents` | FM, MM, LC, SA | List all documents |
| GET | `/api/documents/{id}` | FM, MM, LC, SA | Document details |
| GET | `/api/documents/expiry` | FM, MM, LC, SA | Expiry alerts grouped by days remaining |
| GET | `/api/documents/vehicle/{vehicleId}` | FM, MM, SA | Documents for a vehicle |
| PUT | `/api/documents/{id}` | FM, MM, SA | Update/renew document |
| DELETE | `/api/documents/{id}` | FM, SA | Delete document |
| POST | `/api/documents/refresh` | LC, FM, SA | Recompute document statuses |

### Driver Behaviour — `/api/drivers`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/drivers/{id}/score` | FM, LC, SA | Behaviour score from GPS events |

---

## Configuration

`src/main/resources/application.properties`:

```properties
# MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/fleet_management
spring.datasource.username=root
spring.datasource.password=root

# Hibernate
spring.jpa.hibernate.ddl-auto=update

# JWT (HS256, role-specific expiry)
jwt.secret=<change-in-production>
jwt.expiration-ms-user=28800000      # 8 h
jwt.expiration-ms-staff=43200000     # 12 h
jwt.expiration-ms-admin=86400000     # 24 h

# Fleet business rules (SRS Appendix F)
fleet.maintenance.odometer-interval-km=10000
fleet.speeding-threshold-kmh=80
fleet.gps.stale-minutes=5
```

> ⚠️ The default DB credentials and JWT secret are development-only. Override them in production via environment variables.

## Build & Run

```bash
# Prerequisite: MySQL running with database `fleet_management` created

mvn spring-boot:run

# Or build and run the jar
mvn clean package
java -jar target/fleet-management-backend-0.0.1-SNAPSHOT.jar
```

The server starts on **http://localhost:8080**.

- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

Run tests:

```bash
mvn test        # uses in-memory H2
```

## Environment Variables (Production)

| Variable | Purpose |
|---|---|
| `SPRING_DATASOURCE_URL` | JDBC connection URL |
| `SPRING_DATASOURCE_USERNAME` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `JWT_SECRET_KEY` | JWT signing secret |

## Security Features

- JWT authentication (HS256) with role-based token lifetimes
- Logout token invalidation via blacklist checked in the auth filter
- BCrypt password hashing
- Role-based access control at every endpoint (`@PreAuthorize`)
- Bean Validation on all request DTOs
- Centralized error responses via global exception handler
