import { cn } from '../../utils/cn'

const statusStyles = {
  ACTIVE: 'bg-success-50 text-success-700 ring-success-600/20',
  STARTED: 'bg-success-50 text-success-700 ring-success-600/20',
  NORMAL: 'bg-success-50 text-success-700 ring-success-600/20',
  COMPLETED: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  ASSIGNED: 'bg-warning-50 text-warning-700 ring-warning-600/20',
  MAINTENANCE: 'bg-warning-50 text-warning-700 ring-warning-600/20',
  SCHEDULED: 'bg-warning-50 text-warning-700 ring-warning-600/20',
  PENDING: 'bg-warning-50 text-warning-700 ring-warning-600/20',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  BREAKDOWN: 'bg-danger-50 text-danger-700 ring-danger-600/20',
  CANCELLED: 'bg-danger-50 text-danger-700 ring-danger-600/20',
  GEO_EXIT: 'bg-danger-50 text-danger-700 ring-danger-600/20',
  HARSH_BRAKE: 'bg-danger-50 text-danger-700 ring-danger-600/20',
  SPEEDING: 'bg-danger-50 text-danger-700 ring-danger-600/20',
  EXPIRED: 'bg-danger-50 text-danger-700 ring-danger-600/20',
  RETIRED: 'bg-slate-50 text-slate-600 ring-slate-500/20',
  IDLE: 'bg-slate-50 text-slate-600 ring-slate-500/20',
}

function getStyle(status) {
  const key = (status || '').toUpperCase()
  return statusStyles[key] || 'bg-slate-50 text-slate-600 ring-slate-500/20'
}

function humanize(status) {
  return (status || 'Unknown')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        getStyle(status)
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {humanize(status)}
    </span>
  )
}
