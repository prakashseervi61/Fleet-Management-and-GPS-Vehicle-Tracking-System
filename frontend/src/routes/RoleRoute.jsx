import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { useAuthContext } from '../context/AuthContext'

export default function RoleRoute({ roles, children }) {
  const { hasRole } = useAuthContext()

  if (hasRole(...roles)) {
    return children
  }

  return (
    <div className="max-w-md mx-auto mt-24 bg-white rounded-xl shadow-card border border-slate-200/60 p-8 text-center">
      <ShieldX className="h-12 w-12 mx-auto text-danger-500" />
      <h2 className="text-lg font-bold text-slate-800 mt-4">
        Access restricted
      </h2>
      <p className="text-sm text-slate-500 mt-2">
        Your role doesn&apos;t have permission to view this page.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
