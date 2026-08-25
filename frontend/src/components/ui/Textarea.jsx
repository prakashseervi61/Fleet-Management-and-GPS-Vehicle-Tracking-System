import { forwardRef, useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../utils/cn'

const Textarea = forwardRef(function Textarea({ label, error, rows = 3, id, className, ...props }, ref) {
  const autoId = useId()
  const textareaId = id || autoId

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={cn(
          'w-full min-h-[80px] rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors resize-y',
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
    </div>
  )
})

export default Textarea
