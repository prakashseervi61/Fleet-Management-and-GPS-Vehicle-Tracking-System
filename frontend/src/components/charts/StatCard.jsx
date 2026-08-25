import Skeleton from '../ui/Skeleton'

const toneMap = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
}

export default function StatCard({ label, value, icon: Icon, tone = 'brand', hint, loading }) {
  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200/60 p-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {loading ? (
          <div className="mt-2">
            <Skeleton className="h-8 w-16" />
          </div>
        ) : (
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-800">{value}</p>
        )}
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
      {Icon && (
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
            toneMap[tone] || toneMap.brand
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
  )
}
