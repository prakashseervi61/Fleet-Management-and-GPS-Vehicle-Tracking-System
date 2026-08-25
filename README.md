# 🚛 Fleet Management & GPS Vehicle Tracking System

A full-stack, enterprise-grade **Fleet Management and Real-Time GPS Tracking System** designed to streamline fleet logistics, vehicle maintenance, telemetry monitoring, document compliance, and driver safety scoring.

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.16-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Key Features

- 🗺️ **Live Fleet Map & Real-Time Tracking**: Interactive Leaflet maps displaying live vehicle coordinates, direction heading, speed, and real-time route polyline playback.
- 📡 **Telemetry & GPS Simulator**: Real-time GPS ping ingestion, speed limit threshold detection, and telemetry event streaming (`NORMAL`, `SPEEDING`, `IDLE`, `GEO_EXIT`, `HARSH_BRAKE`).
- 🚚 **Trip Management & Automated Compliance Checks**: Strict rule validation before trip dispatch—enforces vehicle document compliance (`RC`, `INSURANCE`, `PUC`, `FITNESS`), non-expired driver licences, and checks against ongoing maintenance or overlapping active trips.
- 🎯 **Geofencing & Alerts**: Define radial virtual boundaries and automatically log vehicle `ENTER` and `EXIT` breach alerts.
- 🔧 **Maintenance & Service Tracking**: Manage service schedules triggered by time (`SCHEDULE`), distance (`ODOMETER`), or on-board diagnostics (`OBD`).
- ⛽ **Fuel Logging & Cost Analytics**: Record fuel refills, track quantity and spend, and view date-range aggregated cost summaries.
- 📑 **Vehicle Document Expiry Tracking**: Monitor compliance certificates with automated status transitions (`VALID`, `EXPIRING_SOON`, `EXPIRED`) and countdown alert banners.
- 🏆 **Driver Safety & Performance Scorecard**: Behaviour evaluation algorithm calculating safety scores (0–100) based on telemetry pings, speeding incidents, harsh braking, and idle intervals.
- 🔐 **Role-Based Access Control (RBAC)**: Fine-grained permissions and distinct dashboard experiences tailored for 6 organizational roles.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Java 17 / 24, Spring Boot 3.5.16
- **Security**: Spring Security 6 with stateless JWT (JSON Web Tokens) & BCrypt password hashing
- **Persistence**: Spring Data JPA / Hibernate
- **Database**: MySQL 8.0
- **Build Tool**: Apache Maven 3.9+

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Maps & Geospatial**: Leaflet & React-Leaflet
- **Charts & Visualizations**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router v6

---

## 🔐 Role-Based Access Control (RBAC)

The system includes pre-configured test users with password: `Password@123`

| Role | Test Email | Key Permissions |
| :--- | :--- | :--- |
| **System Administrator** | `admin@fleet.com` | Full administrative control, user provisioning, role management, all modules |
| **Fleet Manager** | `fm@fleet.com` | Vehicle fleet, trip dispatch, geofences, maintenance, fuel logs, driver scores |
| **Logistics Coordinator** | `logistics@fleet.com` | Trip creation, live dispatch tracking, geofence monitoring, driver scores |
| **Maintenance Manager** | `maintenance@fleet.com` | Vehicle inventory, maintenance work orders, odometer maintenance triggers, fuel logs |
| **Finance Officer** | `finance@fleet.com` | Maintenance expenditure, fuel expense records, cost aggregation reports |
| **Driver** | `ravi.driver@fleet.com` | Personal shift dashboard, assigned trip start/complete actions, fuel logging |

### RBAC Permission Matrix

| Feature / Route | Admin | Fleet Mgr | Logistics | Maintenance | Finance | Driver |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Overview Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ *(Driver View)* |
| **Live Fleet Map** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Vehicles Management** | ✅ | ✅ | ✅ | ✅ | ✅ *(Read)* | ❌ |
| **Trips Management** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ *(Assigned)* |
| **GPS Tracking & History** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ *(Ping)* |
| **Geofences & Alerts** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Maintenance Orders** | ✅ | ✅ | ❌ | ✅ | ✅ *(Cost)* | ❌ |
| **Fuel Logs & Costs** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ *(Log)* |
| **Compliance Documents**| ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Driver Safety Score** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ *(Self)* |
| **User Administration** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🚀 Getting Started

### Prerequisites
- **JDK 17+** installed and added to `PATH`
- **Node.js 18+** and `npm`
- **MySQL Server 8.0+** running locally on port `3306`
- **Apache Maven 3.9+**

---

### 1. Database Setup

Create the MySQL database:

```sql
CREATE DATABASE fleet_management;
```

Update your database credentials in `backend/src/main/resources/application.properties` if needed:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/fleet_management?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
spring.jpa.hibernate.ddl-auto=update
```

---

### 2. Backend Setup

```bash
cd backend
mvn clean compile
mvn spring-boot:run
```

The Spring Boot backend will start on **`http://localhost:8080`**.

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The React + Vite frontend will start on **`http://localhost:5173`**.

---

## 📡 REST API Overview

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & receive JWT |
| | `POST` | `/api/auth/register` | Register new user account |
| **Vehicles** | `GET` | `/api/vehicles` | List all vehicles with filter/search |
| | `POST` | `/api/vehicles` | Register new fleet vehicle |
| | `GET` | `/api/vehicles/{id}` | Get vehicle details |
| | `PUT` | `/api/vehicles/{id}` | Update vehicle specifications |
| | `DELETE` | `/api/vehicles/{id}` | Remove vehicle from fleet |
| **Trips** | `GET` | `/api/trips` | List all scheduled trips |
| | `POST` | `/api/trips` | Dispatch new trip (validates compliance) |
| | `GET` | `/api/trips/active` | Retrieve ongoing active trips |
| | `POST` | `/api/trips/{id}/start` | Start assigned trip |
| | `POST` | `/api/trips/{id}/complete`| Complete trip with distance logged |
| **GPS & Telemetry**| `POST` | `/api/gps/ping` | Ingest vehicle location ping |
| | `GET` | `/api/gps/history/{vehicleId}` | Historical GPS route points |
| | `GET` | `/api/fleet/map` | Latest live GPS coordinate per vehicle |
| **Geofences** | `GET` | `/api/geofence` | List configured geofences |
| | `POST` | `/api/geofence` | Create new circular geofence boundary |
| | `GET` | `/api/geofence/alerts` | List entry/exit breach alerts |
| **Maintenance** | `GET` | `/api/maintenance` | List maintenance work orders |
| | `POST` | `/api/maintenance` | Create new maintenance schedule |
| | `PUT` | `/api/maintenance/{id}/complete` | Mark maintenance as complete |
| | `POST` | `/api/maintenance/trigger/odometer` | Trigger scheduled odometer services |
| **Fuel Logs** | `GET` | `/api/fuel/log` | List fuel purchase entries |
| | `POST` | `/api/fuel/log` | Log new fuel refill |
| | `GET` | `/api/fuel/log/cost` | Get aggregated fuel expenditure |
| **Documents** | `GET` | `/api/documents` | List compliance certificates |
| | `POST` | `/api/documents` | Upload new vehicle document |
| | `GET` | `/api/documents/expiry`| Fetch expiring document alerts |
| **Driver Score** | `GET` | `/api/drivers/{id}/score` | Calculate driver safety & behaviour score |
| **Users** | `GET` | `/api/users` | List users *(Admin only)* |
| | `GET` | `/api/users/profile` | Current authenticated user profile |

---

## 📂 Project Structure

```text
AD_-Project/
├── backend/
│   ├── src/main/java/com/examly/springapp/
│   │   ├── config/          # Security, JWT filters, WebMvc configuration
│   │   ├── controller/      # REST API Controllers (11 controllers)
│   │   ├── exception/       # Global exception handling & custom errors
│   │   ├── model/           # JPA Entities & Enums
│   │   ├── model/dto/       # Data Transfer Objects & Requests/Responses
│   │   ├── repository/      # Spring Data JPA Repositories
│   │   └── service/         # Business logic & validation services
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client modules
│   │   ├── components/      # UI components, modals, maps, tables
│   │   │   ├── layout/      # Sidebar, Header, Navbar
│   │   │   ├── map/         # Leaflet fleet map & history markers
│   │   │   └── ui/          # Buttons, Cards, Inputs, Modals, Badges
│   │   ├── context/         # AuthContext & NotificationContext
│   │   ├── layouts/         # DashboardLayout & AuthLayout
│   │   ├── pages/           # Application views (14 pages)
│   │   ├── routes/          # RoleRoute guards & AppRouter
│   │   └── utils/           # Formatters, date & currency helpers
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 📄 License

This project is licensed under the **MIT License**.
