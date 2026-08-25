import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Search, ChevronDown, UserCircle, Settings, LogOut } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { useUI } from '../../context/UIContext'
import { ROLE_SHORT_LABELS } from '../../constants/roles'
import NotificationDropdown from '../notifications/NotificationDropdown'
import UserAvatar from '../ui/UserAvatar'
import Breadcrumbs from './Breadcrumbs'

export default function Topbar() {
  const { user, logout } = useAuthContext()
  const { openMobileNav } = useUI()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('keydown', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('keydown', handle)
    }
  }, [open])

  async function handleSignOut() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={openMobileNav}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden sm:block">
        <Breadcrumbs />
      </div>

      <div className="flex-1" />

      <div className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 md:flex md:w-64 focus-within:ring-2 focus-within:ring-brand-500/40">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="text"
          placeholder="Search vehicles, trips..."
          readOnly
          className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      <NotificationDropdown />

      <div className="h-6 w-px bg-slate-200" />

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-slate-100"
        >
          <UserAvatar name={user?.name || ''} size="sm" className="ring-2 ring-white/20" />
          <div className="hidden text-left xl:block">
            <p className="text-sm font-medium leading-tight text-slate-800">
              {user?.name || 'User'}
            </p>
            <p className="text-[11px] text-slate-500">
              {ROLE_SHORT_LABELS[user?.role] || ''}
            </p>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-slate-400 xl:block" />
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-card-hover">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <UserCircle className="h-4 w-4 text-slate-400" />
              My Profile
            </Link>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Settings
            </Link>
            <hr className="my-1 border-slate-100" />
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-danger-600 transition-colors hover:bg-danger-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
