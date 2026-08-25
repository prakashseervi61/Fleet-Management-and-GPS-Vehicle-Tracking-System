import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <p className="text-5xl font-extrabold text-slate-200">404</p>
      <h1 className="mt-4 text-xl font-bold text-slate-800">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        The page you are looking for does not exist or has been moved.
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
