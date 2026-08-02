# Fleet Management System - Backend

This is the backend component of the Fleet Management and GPS Vehicle Tracking System built with Spring Boot 3.x.

## Project Structure

```
src/main/java/com/examly/springapp/
├── controller/     # REST API controllers
├── service/        # Business logic services
├── repository/     # Data access repositories (Spring Data JPA)
├── model/          # Entity classes (JPA entities)
├── exception/      # Custom exception classes
├── config/         # Configuration classes
└── FleetManagementApplication.java  # Main application class

src/main/resources/
├── application.properties          # Main configuration
├── application-dev.properties      # Development profile
├── application-prod.properties     # Production profile
└── static/                       # Static resources (if any)
```

## Key Features Based on SRS Requirements

- Spring Boot 3.x with Java 17+
- Spring Security with JWT authentication
- JPA/Hibernate for ORM
- RESTful API design
- Role-based access control (RBAC)
- Exception handling with custom exceptions
- Support for MySQL 8.0+ and PostgreSQL 14+
- Docker ready for containerization

## API Endpoints (as per Appendix I in SRS)

- Vehicle Management: `/api/vehicles`
- Trip Management: `/api/trips`
- GPS Ping: `/api/gps/ping`
- Geofence Alerts: `/api/geofence/alerts`
- Fleet Map: `/api/fleet/map`
- Maintenance: `/api/maintenance`
- Fuel Log: `/api/fuel/log`
- Document Expiry: `/api/documents/expiry`
- Authentication: `/api/auth/*`
- User Profile: `/api/users/profile`

## Custom Exceptions (as per Appendix E in SRS)

- `InvalidNameException`
- `InvalidPhoneException`
- `DuplicateVehicleException`
- `UnauthorisedAccessException`
- `ResourceNotFoundException`

## Build and Run

```bash
# Using Maven
mvn spring-boot:run

# Or build jar and run
mvn clean package
java -jar target/fleet-management-backend.jar
```

## Environment Variables

For production deployment, configure the following environment variables:
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET_KEY`
- Any other sensitive configuration

## Database Schema

Refer to Appendix B in SRS.txt for detailed database schema including:
- Users Table
- Vehicles Table
- Trips Table
- GPSPings Table
- MaintenanceOrders Table

## Security Features

- JWT-based authentication with role-specific tokens
- Password encoding using BCrypt
- Role-based access control at API level
- AES-256 encryption for sensitive data at rest
- TLS 1.3 for all communications
- Input validation and sanitization
- Audit logging for all data access/modification