import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LogIn, ShieldAlert } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { isValidEmail } from '../../utils/validators'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthContext()

  const from = location.state?.from

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (serverError) setServerError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    const next = {}
    if (!form.email) {
      next.email = 'Email is required'
    } else if (!isValidEmail(form.email)) {
      next.email = 'Enter a valid email address'
    }
    if (!form.password) {
      next.password = 'Password is required'
    }

    if (Object.keys(next).length > 0) {
      setErrors(next)
      const firstField = Object.keys(next)[0]
      const el = e.target.elements[firstField]
      if (el) el.focus()
      return
    }

    setSubmitting(true)
    try {
      await login({ email: form.email.trim(), password: form.password })
      navigate(from || '/dashboard', { replace: true })
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-800">
        Sign in
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Welcome back. Enter your credentials to continue.
      </p>

      {serverError && (
        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-danger-200 bg-danger-50 px-3.5 py-3 text-sm text-danger-700">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />

        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          icon={<LogIn className="h-4 w-4" />}
          className="w-full"
        >
          Sign in to FleetTrack
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Create account
        </Link>
      </p>

      <p className="mt-10 text-center text-xs text-slate-400">
        Protected by role-based access control &middot; FleetTrack SIH 2026
      </p>
    </div>
  )
}
