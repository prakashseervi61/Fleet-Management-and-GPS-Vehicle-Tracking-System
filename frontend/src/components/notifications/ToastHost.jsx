import { useNotifications } from '../../context/NotificationContext'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../../utils/cn'

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    iconClasses: 'text-success-600 bg-success-50',
    barClasses: 'bg-success-500',
  },
  error: {
    icon: XCircle,
    iconClasses: 'text-danger-600 bg-danger-50',
    barClasses: 'bg-danger-500',
  },
  warning: {
    icon: AlertTriangle,
    iconClasses: 'text-warning-600 bg-warning-50',
    barClasses: 'bg-warning-500',
  },
  info: {
    icon: Info,
    iconClasses: 'text-brand-600 bg-brand-50',
    barClasses: 'bg-brand-500',
  },
}

export default function ToastHost() {
  const { notifications, dismiss } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 pointer-events-none">
      {notifications.map((toast) => {
        const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info
        const Icon = config.icon

        return (
          <div
            key={toast.id}
            className="pointer-events-auto relative overflow-hidden flex items-start gap-3 bg-white rounded-xl shadow-card-hover border border-slate-200/60 p-4"
          >
            <span
              className={cn(
                'absolute left-0 inset-y-0 w-1 rounded-l-xl',
                config.barClasses
              )}
            />

            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                config.iconClasses
              )}
            >
              <Icon className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-slate-800">{toast.title}</p>
              {toast.message && (
                <p className="mt-0.5 text-xs text-slate-500">{toast.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
