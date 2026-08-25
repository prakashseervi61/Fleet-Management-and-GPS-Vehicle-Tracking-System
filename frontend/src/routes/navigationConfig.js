import {
  LayoutDashboard,
  Radio,
  Truck,
  Route,
  MapPin,
  Map,
  Wrench,
  Fuel,
  FileText,
  Users,
  UserCircle,
  Settings,
} from 'lucide-react'
import { ROLES } from '../constants/roles'

const ALL_ROLES = [
  ROLES.GUEST,
  ROLES.DRIVER,
  ROLES.MAINTENANCE_MANAGER,
  ROLES.LOGISTICS_COORDINATOR,
  ROLES.FLEET_MANAGER,
  ROLES.FINANCE_OFFICER,
  ROLES.SYSTEM_ADMINISTRATOR,
]

export const NAV_ITEMS = [
  {
    section: 'Overview',
    label: 'Dashboard',
    path: '/dashboard',
    end: true,
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },

  {
    section: 'Operations',
    label: 'Live Fleet Map',
    path: '/fleet',
    icon: Map,
    roles: [
      ROLES.LOGISTICS_COORDINATOR,
      ROLES.FLEET_MANAGER,
      ROLES.MAINTENANCE_MANAGER,
      ROLES.SYSTEM_ADMINISTRATOR,
    ],
  },
  {
    section: 'Operations',
    label: 'Vehicles',
    path: '/vehicles',
    icon: Truck,
    roles: [
      ROLES.FLEET_MANAGER,
      ROLES.LOGISTICS_COORDINATOR,
      ROLES.MAINTENANCE_MANAGER,
      ROLES.FINANCE_OFFICER,
      ROLES.SYSTEM_ADMINISTRATOR,
    ],
  },
  {
    section: 'Operations',
    label: 'Trips',
    path: '/trips',
    icon: Route,
    roles: [
      ROLES.LOGISTICS_COORDINATOR,
      ROLES.FLEET_MANAGER,
      ROLES.DRIVER,
      ROLES.SYSTEM_ADMINISTRATOR,
    ],
  },
  {
    section: 'Operations',
    label: 'GPS Tracking',
    path: '/gps',
    icon: Radio,
    roles: [
      ROLES.LOGISTICS_COORDINATOR,
      ROLES.FLEET_MANAGER,
      ROLES.MAINTENANCE_MANAGER,
      ROLES.SYSTEM_ADMINISTRATOR,
    ],
  },
  {
    section: 'Operations',
    label: 'Geofences',
    path: '/geofences',
    icon: MapPin,
    roles: [
      ROLES.LOGISTICS_COORDINATOR,
      ROLES.FLEET_MANAGER,
      ROLES.SYSTEM_ADMINISTRATOR,
    ],
  },

  {
    section: 'Management',
    label: 'Maintenance',
    path: '/maintenance',
    icon: Wrench,
    roles: [
      ROLES.MAINTENANCE_MANAGER,
      ROLES.FLEET_MANAGER,
      ROLES.FINANCE_OFFICER,
      ROLES.SYSTEM_ADMINISTRATOR,
    ],
  },
  {
    section: 'Management',
    label: 'Fuel Logs',
    path: '/fuel',
    icon: Fuel,
    roles: [
      ROLES.FINANCE_OFFICER,
      ROLES.FLEET_MANAGER,
      ROLES.MAINTENANCE_MANAGER,
      ROLES.DRIVER,
      ROLES.SYSTEM_ADMINISTRATOR,
    ],
  },
  {
    section: 'Management',
    label: 'Documents',
    path: '/documents',
    icon: FileText,
    roles: [
      ROLES.FLEET_MANAGER,
      ROLES.MAINTENANCE_MANAGER,
      ROLES.LOGISTICS_COORDINATOR,
      ROLES.SYSTEM_ADMINISTRATOR,
    ],
  },
  {
    section: 'Management',
    label: 'Drivers',
    path: '/drivers',
    icon: Users,
    roles: [
      ROLES.FLEET_MANAGER,
      ROLES.LOGISTICS_COORDINATOR,
      ROLES.SYSTEM_ADMINISTRATOR,
    ],
  },

  {
    section: 'Administration',
    label: 'User Management',
    path: '/users',
    icon: Users,
    roles: [ROLES.SYSTEM_ADMINISTRATOR],
  },

  {
    section: 'Account',
    label: 'My Profile',
    path: '/profile',
    icon: UserCircle,
    roles: ALL_ROLES,
  },
  {
    section: 'Account',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    roles: ALL_ROLES,
  },
]

export function filterNavByRole(items, role) {
  if (!role) return []
  return items.filter((item) => item.roles.includes(role))
}
