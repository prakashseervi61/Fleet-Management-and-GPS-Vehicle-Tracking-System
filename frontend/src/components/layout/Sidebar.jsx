import { NavLink, Link } from 'react-router-dom'
import { Truck, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { useUI } from '../../context/UIContext'
import { useAuthContext } from '../../context/AuthContext'
import { NAV_ITEMS, filterNavByRole } from '../../routes/navigationConfig'
import { ROLE_SHORT_LABELS } from '../../constants/roles'
import UserAvatar from '../ui/UserAvatar'

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) =>
        `group/item relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-brand-600/15 text-white'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />
          )}
          <item.icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md bg-navy-800 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-card-hover transition-opacity group-hover/item:visible group-hover/item:opacity-100">
              {item.label}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function NavSection({ items, collapsed }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.path}>
          <NavItem item={item} collapsed={collapsed} />
        </li>
      ))}
    </ul>
  )
}

function SidebarContent({ collapsed, onCloseMobile, isMobile }) {
  const { user } = useAuthContext()
  const { toggleSidebar } = useUI()
  const filtered = filterNavByRole(NAV_ITEMS, user?.role)

  const sections = filtered.reduce((acc, item) => {
    const sec = item.section || 'default'
    if (!acc[sec]) acc[sec] = []
    acc[sec].push(item)
    return acc
  }, {})

  return (
    <>
      <div className="flex h-16 items-center gap-3 px-5">
        <Link
          to="/dashboard"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30"
        >
          <Truck className="h-5 w-5 text-white" />
        </Link>
        {!collapsed && (
          <span className="text-lg font-extrabold tracking-tight text-white">
            Fleet<span className="text-brand-400">Track</span>
          </span>
        )}
        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="ml-auto rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className="ml-auto rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section}>
            {collapsed ? (
              <hr className="mx-3 border-white/10" />
            ) : (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section}
              </p>
            )}
            <NavSection items={items} collapsed={collapsed} />
          </div>
        ))}
      </nav>

      {user && (
        collapsed ? (
          <div className="flex justify-center p-3">
            <Link to="/profile">
              <UserAvatar name={user.name} size="sm" className="ring-2 ring-white/20" />
            </Link>
          </div>
        ) : (
          <Link
            to="/profile"
            className="m-3 flex items-center gap-3 rounded-xl bg-white/5 p-3"
          >
            <UserAvatar name={user.name} size="sm" className="ring-2 ring-white/20" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="text-[11px] text-slate-400">
                {ROLE_SHORT_LABELS[user.role] || user.role}
              </p>
            </div>
          </Link>
        )
      )}
    </>
  )
}

export default function Sidebar({ mobile = false }) {
  const { sidebarCollapsed, mobileNavOpen, closeMobileNav } = useUI()

  if (mobile) {
    return (
      <>
        <div
          className={`fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
            mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={closeMobileNav}
          aria-hidden="true"
        />
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-navy-950 transition-transform duration-300 lg:hidden ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent
            collapsed={false}
            onCloseMobile={closeMobileNav}
            isMobile
          />
        </aside>
      </>
    )
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-navy-950 bg-[linear-gradient(180deg,rgba(37,99,235,0.08),transparent_40%)] border-r border-white/5 transition-[width] duration-200 lg:flex ${
        sidebarCollapsed ? 'w-[76px]' : 'w-72'
      }`}
    >
      <SidebarContent collapsed={sidebarCollapsed} isMobile={false} />
    </aside>
  )
}
