import { Construction } from 'lucide-react'

export default function PagePlaceholder({ title, subtitle }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="bg-white rounded-xl shadow-card border border-slate-200/60 p-10 text-center">
        <Construction className="h-10 w-10 mx-auto text-slate-300" />
        <p className="mt-3 text-sm text-slate-400">
          This module ships in an upcoming phase.
        </p>
      </div>
    </div>
  )
}
