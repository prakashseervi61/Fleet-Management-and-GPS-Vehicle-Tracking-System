import { forwardRef, useId } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '../../utils/cn'

const Select = forwardRef(function Select({ label, error, hint, options = [], id, className, children, ...props }, ref) {
  const autoId = useId()
  const selectId = id || autoId

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'appearance-none w-full h-10 rounded-lg border bg-white pr-9 pl-3 text-sm text-slate-800 transition-colors',
            'focus:outline-none focus:ring-2',
            error
              ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/30'
              : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>
      {error && (
        <p className="text-xs text-danger-600 mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-xs text-slate-400 mt-1">{hint}</p>
      )}
    </div>
  )
})

export default Select
