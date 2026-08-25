import { cn } from '../../utils/cn'

export function Table({ children, className }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  )
}

export function THead({ children }) {
  return <thead className="bg-slate-50/80 border-b border-slate-200">{children}</thead>
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>
}

export function TR({ children, className, onClick }) {
  return (
    <tr
      className={cn(
        'hover:bg-slate-50/70 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function TH({ children, className }) {
  return (
    <th className={cn('px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap', className)}>
      {children}
    </th>
  )
}

export function TD({ children, className, colSpan }) {
  return (
    <td colSpan={colSpan} className={cn('px-5 py-3.5 text-slate-600 align-middle', className)}>
      {children}
    </td>
  )
}
