import { Outlet } from 'react-router-dom'
import { Radio, Gauge, Wrench, FileCheck } from 'lucide-react'

const features = [
  { icon: Radio, label: 'Real-time GPS tracking & geofencing' },
  { icon: Gauge, label: 'Driver behaviour analytics' },
  { icon: Wrench, label: 'Predictive maintenance alerts' },
  { icon: FileCheck, label: 'Document expiry compliance' },
]

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-10 lg:flex">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 h-72 w-72 rounded-full bg-brand-600/10 blur-3xl" />

        <div className="relative z-10">
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
            Command your entire fleet from one screen.
          </h2>
          <p className="mt-3 max-w-md text-sm text-slate-400">
            Monitor vehicles, manage drivers, and optimise operations with
            real-time visibility into every trip.
          </p>

          <ul className="mt-8 space-y-4">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                  <Icon className="h-4 w-4 text-white" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
