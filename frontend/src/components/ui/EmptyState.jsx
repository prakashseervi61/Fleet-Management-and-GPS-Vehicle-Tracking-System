export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-6">
      {Icon && (
        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <Icon className="h-6 w-6 text-slate-400" />
        </div>
      )}
      {title && <h3 className="mt-4 text-sm font-semibold text-slate-700">{title}</h3>}
      {message && <p className="mt-1 text-xs text-slate-400 max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
