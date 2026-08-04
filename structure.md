**Root Path:** `d:\AD_-Project\backend`

```
├── src
│   ├── main
│   │   ├── java
│   │   │   └── com
│   │   │       └── examly
│   │   │           └── springapp
│   │   │               ├── config
│   │   │               │   ├── CustomUserDetailsService.java
│   │   │               │   ├── JwtAuthEntryPoint.java
│   │   │               │   ├── JwtAuthTokenFilter.java
│   │   │               │   ├── JwtTokenProvider.java
│   │   │               │   ├── OpenApiConfig.java
│   │   │               │   ├── SecurityConfig.java
│   │   │               │   └── UserPrincipal.java
│   │   │               ├── controller
│   │   │               │   ├── AuthController.java
│   │   │               │   ├── DocumentController.java
│   │   │               │   ├── DriverController.java
│   │   │               │   ├── FleetMapController.java
│   │   │               │   ├── FuelLogController.java
│   │   │               │   ├── GeoFenceController.java
│   │   │               │   ├── GpsController.java
│   │   │               │   ├── MaintenanceController.java
│   │   │               │   ├── TripController.java
│   │   │               │   ├── UserController.java
│   │   │               │   └── VehicleController.java
│   │   │               ├── exception
│   │   │               │   ├── BusinessRuleViolationException.java
│   │   │               │   ├── DuplicateVehicleException.java
│   │   │               │   ├── GlobalExceptionHandler.java
│   │   │               │   ├── InvalidNameException.java
│   │   │               │   ├── InvalidPhoneException.java
│   │   │               │   ├── ResourceNotFoundException.java
│   │   │               │   └── UnauthorisedAccessException.java
│   │   │               ├── model
│   │   │               │   ├── dto
│   │   │               │   │   ├── AuthResponse.java
│   │   │               │   │   ├── DocumentRequest.java
│   │   │               │   │   ├── DriverScoreResponse.java
│   │   │               │   │   ├── ExpiryAlertResponse.java
│   │   │               │   │   ├── FleetMapResponse.java
│   │   │               │   │   ├── FuelLogRequest.java
│   │   │               │   │   ├── GeoFenceRequest.java
│   │   │               │   │   ├── GpsPingRequest.java
│   │   │               │   │   ├── LoginRequest.java
│   │   │               │   │   ├── MaintenanceRequest.java
│   │   │               │   │   ├── MessageResponse.java
│   │   │               │   │   ├── TripRequest.java
│   │   │               │   │   ├── TripResponse.java
│   │   │               │   │   ├── UserProfileResponse.java
│   │   │               │   │   ├── UserRegistrationDTO.java
│   │   │               │   │   ├── VehicleLocationResponse.java
│   │   │               │   │   ├── VehicleRequest.java
│   │   │               │   │   └── VehicleResponse.java
│   │   │               │   ├── Document.java
│   │   │               │   ├── FuelLog.java
│   │   │               │   ├── GeoFence.java
│   │   │               │   ├── GeoFenceAlert.java
│   │   │               │   ├── GpsPing.java
│   │   │               │   ├── MaintenanceOrder.java
│   │   │               │   ├── Trip.java
│   │   │               │   ├── User.java
│   │   │               │   └── Vehicle.java
│   │   │               ├── repository
│   │   │               │   ├── DocumentRepository.java
│   │   │               │   ├── FuelLogRepository.java
│   │   │               │   ├── GeoFenceAlertRepository.java
│   │   │               │   ├── GeoFenceRepository.java
│   │   │               │   ├── GpsPingRepository.java
│   │   │               │   ├── MaintenanceOrderRepository.java
│   │   │               │   ├── TripRepository.java
│   │   │               │   ├── UserRepository.java
│   │   │               │   └── VehicleRepository.java
│   │   │               ├── service
│   │   │               │   ├── AuthService.java
│   │   │               │   ├── DocumentService.java
│   │   │               │   ├── DriverBehaviourService.java
│   │   │               │   ├── FleetService.java
│   │   │               │   ├── FleetValidator.java
│   │   │               │   ├── FuelLogService.java
│   │   │               │   ├── GeoFenceService.java
│   │   │               │   ├── GeoUtils.java
│   │   │               │   ├── GpsPingService.java
│   │   │               │   ├── MaintenanceService.java
│   │   │               │   ├── TokenBlacklistService.java
│   │   │               │   ├── TripService.java
│   │   │               │   ├── UserService.java
│   │   │               │   └── VehicleService.java
│   │   │               └── FleetManagementApplication.java
│   │   └── resources
│   │       └── application.properties
│   └── test
│       ├── java
│       │   └── com
│       │       └── examly
│       │           └── springapp
│       │               ├── service
│       │               │   ├── AuthServiceTest.java
│       │               │   ├── FleetValidatorTest.java
│       │               │   ├── GeoUtilsTest.java
│       │               │   ├── GpsPingServiceTest.java
│       │               │   ├── TripServiceTest.java
│       │               │   ├── UserServiceTest.java
│       │               │   └── VehicleServiceTest.java
│       │               ├── ApiWorkflowIntegrationTest.java
│       │               ├── AuthFlowIntegrationTest.java
│       │               ├── CrudCompletenessIntegrationTest.java
│       │               └── FleetManagementApplicationTests.java
│       └── resources
│           └── application-test.properties
├── README.md
└── pom.xml
```
