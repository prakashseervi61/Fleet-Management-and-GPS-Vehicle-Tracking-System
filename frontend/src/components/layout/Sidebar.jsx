import { NavLink, Link } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, X, Radio } from 'lucide-react'
import { useUI } from '../../context/UIContext'
import { useAuthContext } from '../../context/AuthContext'
import { NAV_ITEMS, filterNavByRole } from '../../routes/navigationConfig'

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) =>
        `group/item relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 select-none ${
          isActive
            ? 'bg-gradient-to-r from-brand-600/25 via-brand-500/15 to-transparent text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-brand-500/25'
            : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-400 to-brand-600 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
          )}
          <item.icon
            className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover/item:scale-110 ${
              isActive
                ? 'text-brand-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]'
                : 'text-slate-400 group-hover/item:text-slate-200'
            }`}
          />
          <span
            className={`whitespace-nowrap transition-all duration-200 tracking-wide ${
              collapsed
                ? 'w-0 overflow-hidden opacity-0'
                : 'ml-0 max-w-[200px] opacity-100'
            }`}
          >
            {item.label}
          </span>
          {collapsed && (
            <div className="pointer-events-none fixed left-[82px] z-50 whitespace-nowrap rounded-lg border border-white/10 bg-navy-900/95 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl shadow-black/40 backdrop-blur-md transition-opacity duration-150 group-hover/item:opacity-100">
              {item.label}
            </div>
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className={`flex h-16 shrink-0 items-center border-b border-white/[0.07] px-4 transition-all duration-200 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <Link
          to="/dashboard"
          className={`whitespace-nowrap text-lg font-extrabold tracking-tight text-white transition-all duration-200 ${
            collapsed ? 'w-0 overflow-hidden opacity-0' : 'opacity-100'
          }`}
        >
          Fleet<span className="text-brand-400">Track</span>
        </Link>

        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section}>
            <div className="relative mb-1.5 h-4 flex items-center">
              <p
                className={`px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap transition-all duration-200 ${
                  collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                {section}
              </p>
              <hr
                className={`absolute inset-x-2 top-1/2 -translate-y-1/2 border-white/[0.08] transition-opacity duration-200 ${
                  collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
            </div>
            <NavSection items={items} collapsed={collapsed} />
          </div>
        ))}
      </nav>

      {/* Footer System Status */}
      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <div
          className={`flex items-center rounded-xl bg-white/[0.03] border border-white/[0.06] transition-all duration-200 ${
            collapsed
              ? 'justify-center p-2.5'
              : 'justify-between px-3.5 py-2.5'
          }`}
          title="Fleet Telemetry: Live & Connected"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span
              className={`truncate text-xs font-medium text-slate-300 transition-all duration-200 ${
                collapsed ? 'w-0 overflow-hidden opacity-0' : 'opacity-100'
              }`}
            >
              Fleet Sync Active
            </span>
          </div>
          {!collapsed && (
            <Radio className="h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
          )}
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ mobile = false }) {
  const { sidebarCollapsed, mobileNavOpen, closeMobileNav } = useUI()

  if (mobile) {
    return (
      <>
        <div
          className={`fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
            mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={closeMobileNav}
          aria-hidden="true"
        />
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden bg-navy-950 shadow-2xl border-r border-white/10 transition-transform duration-300 lg:hidden ${
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
      className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden bg-navy-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.15),rgba(255,255,255,0))] border-r border-white/[0.08] shadow-lg transition-[width] duration-300 lg:flex ${
        sidebarCollapsed ? 'w-[76px]' : 'w-72'
      }`}
    >
      <SidebarContent collapsed={sidebarCollapsed} isMobile={false} />
    </aside>
  )
}
