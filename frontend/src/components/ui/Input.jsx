import { forwardRef, useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../utils/cn'

const Input = forwardRef(function Input({ label, error, hint, id, className, ...props }, ref) {
  const autoId = useId()
  const inputId = id || autoId

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'w-full h-10 rounded-lg border bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 transition-colors',
          'focus:outline-none focus:ring-2',
          error
            ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/30'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
          className
        )}
        {...props}
      />
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

export default Input
