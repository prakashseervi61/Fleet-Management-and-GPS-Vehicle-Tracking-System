import { Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import DashboardLayout from '../layouts/DashboardLayout'
import { ROLES } from '../constants/roles'

import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import FleetMapPage from '../pages/fleet/FleetMapPage'
import VehiclesPage from '../pages/vehicles/VehiclesPage'
import VehicleDetailPage from '../pages/vehicles/VehicleDetailPage'
import TripsPage from '../pages/trips/TripsPage'
import GpsTrackingPage from '../pages/gps/GpsTrackingPage'
import GpsHistoryPage from '../pages/gps/GpsHistoryPage'
import GeofencesPage from '../pages/geofences/GeofencesPage'
import MaintenancePage from '../pages/maintenance/MaintenancePage'
import FuelLogsPage from '../pages/fuel/FuelLogsPage'
import DocumentsPage from '../pages/documents/DocumentsPage'
import DriversPage from '../pages/drivers/DriversPage'
import DriverScorePage from '../pages/drivers/DriverScorePage'
import UsersPage from '../pages/system/UsersPage'
import ProfilePage from '../pages/profile/ProfilePage'
import SettingsPage from '../pages/settings/SettingsPage'
import NotFoundPage from '../pages/system/NotFoundPage'

const ALL_ROLES = Object.values(ROLES)

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route
          path="dashboard"
          element={
            <RoleRoute roles={ALL_ROLES}>
              <DashboardPage />
            </RoleRoute>
          }
        />

        <Route
          path="fleet"
          element={
            <RoleRoute
              roles={[
                ROLES.LOGISTICS_COORDINATOR,
                ROLES.FLEET_MANAGER,
                ROLES.MAINTENANCE_MANAGER,
                ROLES.SYSTEM_ADMINISTRATOR,
              ]}
            >
              <FleetMapPage />
            </RoleRoute>
          }
        />

        <Route
          path="vehicles"
          element={
            <RoleRoute
              roles={[
                ROLES.FLEET_MANAGER,
                ROLES.LOGISTICS_COORDINATOR,
                ROLES.MAINTENANCE_MANAGER,
                ROLES.FINANCE_OFFICER,
                ROLES.SYSTEM_ADMINISTRATOR,
              ]}
            >
              <VehiclesPage />
            </RoleRoute>
          }
        />

        <Route
          path="vehicles/:id"
          element={
            <RoleRoute
              roles={[
                ROLES.FLEET_MANAGER,
                ROLES.LOGISTICS_COORDINATOR,
                ROLES.MAINTENANCE_MANAGER,
                ROLES.FINANCE_OFFICER,
                ROLES.SYSTEM_ADMINISTRATOR,
              ]}
            >
              <VehicleDetailPage />
            </RoleRoute>
          }
        />

        <Route
          path="trips"
          element={
            <RoleRoute
              roles={[
                ROLES.LOGISTICS_COORDINATOR,
                ROLES.FLEET_MANAGER,
                ROLES.DRIVER,
                ROLES.SYSTEM_ADMINISTRATOR,
              ]}
            >
              <TripsPage />
            </RoleRoute>
          }
        />

        <Route
          path="gps"
          element={
            <RoleRoute
              roles={[
                ROLES.LOGISTICS_COORDINATOR,
                ROLES.FLEET_MANAGER,
                ROLES.MAINTENANCE_MANAGER,
                ROLES.SYSTEM_ADMINISTRATOR,
              ]}
            >
              <GpsTrackingPage />
            </RoleRoute>
          }
        />

        <Route
          path="gps/:vehicleId/history"
          element={
            <RoleRoute
              roles={[
                ROLES.LOGISTICS_COORDINATOR,
                ROLES.FLEET_MANAGER,
                ROLES.MAINTENANCE_MANAGER,
                ROLES.SYSTEM_ADMINISTRATOR,
              ]}
            >
              <GpsHistoryPage />
            </RoleRoute>
          }
        />

        <Route
          path="geofences"
          element={
            <RoleRoute
              roles={[
                ROLES.LOGISTICS_COORDINATOR,
                ROLES.FLEET_MANAGER,
                ROLES.SYSTEM_ADMINISTRATOR,
              ]}
            >
              <GeofencesPage />
            </RoleRoute>
          }
        />

        <Route
          path="maintenance"
          element={
            <RoleRoute
              roles={[
                ROLES.MAINTENANCE_MANAGER,
                ROLES.FLEET_MANAGER,
                ROLES.FINANCE_OFFICER,
                ROLES.SYSTEM_ADMINISTRATOR,
              ]}
            >
              <MaintenancePage />
            </RoleRoute>
          }
        />

        <Route
          path="fuel"
          element={
            <RoleRoute
              roles={[
                ROLES.FINANCE_OFFICER,
                ROLES.FLEET_MANAGER,
                ROLES.MAINTENANCE_MANAGER,
                ROLES.DRIVER,
                ROLES.SYSTEM_ADMINISTRATOR,
              ]}
            >
              <FuelLogsPage />
            </RoleRoute>
          }
        />

        <Route
          path="documents"
          element={
            <RoleRoute
              roles={[
                ROLES.FLEET_MANAGER,
                ROLES.MAINTENANCE_MANAGER,
                ROLES.LOGISTICS_COORDINATOR,
                ROLES.SYSTEM_ADMINISTRATOR,
              ]}
            >
              <DocumentsPage />
            </RoleRoute>
          }
        />

        <Route
          path="drivers"
          element={
            <RoleRoute
              roles={[
                ROLES.FLEET_MANAGER,
                ROLES.LOGISTICS_COORDINATOR,
                ROLES.SYSTEM_ADMINISTRATOR,
              ]}
            >
              <DriversPage />
            </RoleRoute>
          }
        />

        <Route
          path="drivers/:driverId/score"
          element={
            <RoleRoute
              roles={[
                ROLES.FLEET_MANAGER,
                ROLES.LOGISTICS_COORDINATOR,
                ROLES.SYSTEM_ADMINISTRATOR,
              ]}
            >
              <DriverScorePage />
            </RoleRoute>
          }
        />

        <Route
          path="users"
          element={
            <RoleRoute roles={[ROLES.SYSTEM_ADMINISTRATOR]}>
              <UsersPage />
            </RoleRoute>
          }
        />

        <Route
          path="profile"
          element={
            <RoleRoute roles={ALL_ROLES}>
              <ProfilePage />
            </RoleRoute>
          }
        />

        <Route
          path="settings"
          element={
            <RoleRoute roles={ALL_ROLES}>
              <SettingsPage />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
