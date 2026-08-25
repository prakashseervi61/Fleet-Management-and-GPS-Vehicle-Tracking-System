import { NavLink } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { NAV_ITEMS, filterNavByRole } from '../../routes/navigationConfig'

export default function MobileBottomNav() {
  const { user } = useAuthContext()
  const allItems = filterNavByRole(NAV_ITEMS, user?.role)

  const dashboardItem = allItems.find((i) => i.path === '/dashboard') || {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  }

  const others = allItems.filter((i) => i.path !== '/dashboard')
  const items = [dashboardItem, ...others].slice(0, 4)

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              isActive ? 'text-brand-600' : 'text-slate-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className="h-5 w-5" />
              <span className="truncate px-1">{item.label}</span>
              {isActive && (
                <span className="h-1 w-1 rounded-full bg-brand-600" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
