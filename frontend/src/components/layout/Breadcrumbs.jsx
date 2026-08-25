import { Link, useLocation } from 'react-router-dom'
import { Home, ChevronRight } from 'lucide-react'

const SEGMENT_MAP = {
  dashboard: 'Dashboard',
  fleet: 'Live Fleet Map',
  vehicles: 'Vehicles',
  trips: 'Trips',
  gps: 'GPS Tracking',
  geofences: 'Geofences',
  maintenance: 'Maintenance',
  fuel: 'Fuel Logs',
  documents: 'Documents',
  drivers: 'Drivers',
  users: 'User Management',
  profile: 'My Profile',
  settings: 'Settings',
}

const SKIP_SEGMENTS = new Set(['score', 'history'])

export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  const trail = segments.reduce((acc, seg) => {
    if (/^\d+$/.test(seg) || SKIP_SEGMENTS.has(seg)) return acc
    const label = SEGMENT_MAP[seg]
    if (!label) return acc
    acc.push({ segment: seg, label, path: '/' + acc.map((t) => t.segment).concat(seg).join('/') })
    return acc
  }, [])

  if (trail.length === 0) return null

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm">
        <li>
          <Link
            to="/dashboard"
            className="flex items-center text-slate-500 transition-colors hover:text-brand-600"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1
          return (
            <li key={crumb.path} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
              {isLast ? (
                <span className="font-medium text-slate-800">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-slate-500 transition-colors hover:text-brand-600"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
