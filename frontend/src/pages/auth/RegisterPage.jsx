import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, ShieldAlert } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import {
  isValidName,
  isValidEmail,
  isValidPhone,
  isValidPassword,
  passwordsMatch,
  getPasswordStrength,
} from '../../utils/validators'
import { REGISTRABLE_ROLES } from '../../constants/roles'
import { ROLE_LABELS } from '../../constants/roles'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const strengthLabels = ['Weak', 'Weak', 'Weak', 'Fair', 'Strong', 'Strong']

const roleOptions = REGISTRABLE_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role] || role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}))

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuthContext()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: REGISTRABLE_ROLES[0],
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const strength = getPasswordStrength(form.password)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (serverError) setServerError('')
  }

  function handleSelectChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (serverError) setServerError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    const next = {}

    if (!form.name) {
      next.name = 'Name is required'
    } else if (!isValidName(form.name)) {
      next.name = 'Enter your full name (letters only)'
    }

    if (!form.email) {
      next.email = 'Email is required'
    } else if (!isValidEmail(form.email)) {
      next.email = 'Enter a valid email address'
    }

    if (!form.phoneNumber) {
      next.phoneNumber = 'Phone number is required'
    } else if (!isValidPhone(form.phoneNumber)) {
      next.phoneNumber = 'Phone number must be exactly 10 digits'
    }

    if (!form.password) {
      next.password = 'Password is required'
    } else if (!isValidPassword(form.password)) {
      next.password = 'Min 8 chars with uppercase, lowercase, number & symbol'
    }

    if (!form.confirmPassword) {
      next.confirmPassword = 'Please confirm your password'
    } else if (!passwordsMatch(form.password, form.confirmPassword)) {
      next.confirmPassword = 'Passwords do not match'
    }

    if (!form.role) {
      next.role = 'Role is required'
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
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        role: form.role,
      })
      navigate('/login', { state: { registered: true, email: form.email.trim() }, replace: true })
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-800">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Join your organisation's FleetTrack workspace.
      </p>

      {serverError && (
        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-danger-200 bg-danger-50 px-3.5 py-3 text-sm text-danger-700">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Full name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Priya Sharma"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />

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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Phone number"
            name="phoneNumber"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel"
            placeholder="9876543210"
            value={form.phoneNumber}
            onChange={handleChange}
            error={errors.phoneNumber}
          />

          <Select
            label="Role"
            name="role"
            options={roleOptions}
            value={form.role}
            onChange={handleSelectChange}
            error={errors.role}
            hint="Determines which modules you can access."
          />
        </div>

        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < strength
                  ? strength <= 2
                    ? 'bg-danger-400'
                    : strength === 3
                      ? 'bg-warning-400'
                      : 'bg-success-500'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        {form.password && (
          <p className="text-xs text-slate-400 -mt-3">
            {strengthLabels[strength]}
          </p>
        )}

        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          icon={<UserPlus className="h-4 w-4" />}
          className="w-full"
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
