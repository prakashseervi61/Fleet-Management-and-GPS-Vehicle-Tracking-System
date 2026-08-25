import { Truck, Radio, ShieldCheck, Gauge } from 'lucide-react'

const features = [
  { icon: Radio, label: 'Live GPS Tracking' },
  { icon: Gauge, label: 'Driver Analytics' },
  { icon: ShieldCheck, label: 'Role-Based Access' },
]

export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.18),_transparent_55%)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-card backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30">
          <Truck className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Fleet<span className="text-brand-400">Track</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Fleet Management &amp; GPS Vehicle Tracking System
        </p>

        <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-success-500/30 bg-success-500/10 px-3 py-1 text-xs font-medium text-success-400">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-success-400" aria-hidden="true" />
          Phase 0 · Scaffold ready
        </span>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:border-brand-500/40"
            >
              <Icon className="mx-auto mb-1.5 h-4 w-4 text-brand-400" aria-hidden="true" />
              <p className="text-[11px] leading-tight text-slate-300">{label}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-500">
          API proxy → <code className="text-slate-400">localhost:8080</code>
        </p>
      </div>
    </div>
  )
}
