import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { cn } from '../../utils/cn'

function timeAgo(isoString) {
  const seconds = Math.floor(
    (Date.now() - new Date(isoString).getTime()) / 1000
  )
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const DOT_CLASSES = {
  success: 'bg-success-500',
  error: 'bg-danger-500',
  warning: 'bg-warning-500',
  info: 'bg-brand-500',
}

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-400 opacity-75" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-card-hover border border-slate-200 z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No notifications yet
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex gap-3 border-b border-slate-100 px-4 py-3 last:border-0',
                  !n.read && 'bg-brand-50/50'
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    DOT_CLASSES[n.type] || DOT_CLASSES.info
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  {n.message && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {n.message}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-400">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
