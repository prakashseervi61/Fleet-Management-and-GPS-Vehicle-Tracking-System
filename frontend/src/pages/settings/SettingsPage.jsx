import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { formatDateTime } from '../../utils/format'
import Button from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'

function roleLabel(role) {
  if (!role) return '—'
  return role
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

const FONT_SIZES = ['Small', 'Default', 'Large']

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()

  const [darkMode, setDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState('Default')

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Application preferences and account actions.</p>
      </div>

      <Card>
        <CardHeader title="Appearance" subtitle="Customize how the dashboard looks." />
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Dark mode</p>
              <p className="text-xs text-slate-500">Enable dark theme for the dashboard.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={darkMode}
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 ${
                darkMode ? 'bg-brand-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">Font size</p>
            <p className="text-xs text-slate-500 mb-3">Adjust the text size across the dashboard.</p>
            <div className="flex gap-2">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontSize(size)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    fontSize === size
                      ? 'bg-brand-50 border-brand-300 text-brand-700 font-medium'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Account" subtitle="Your current account information." />
        <CardBody>
          <dl className="space-y-3 text-sm">
            <div className="flex gap-4">
              <dt className="text-slate-400 w-32 shrink-0">Name</dt>
              <dd className="text-slate-700 font-medium">{user?.name || '—'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-slate-400 w-32 shrink-0">Email</dt>
              <dd className="text-slate-700">{user?.email || '—'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-slate-400 w-32 shrink-0">Role</dt>
              <dd className="text-slate-700">{roleLabel(user?.role)}</dd>
            </div>
            {user?.lastLogin && (
              <div className="flex gap-4">
                <dt className="text-slate-400 w-32 shrink-0">Last login</dt>
                <dd className="text-slate-700">{formatDateTime(user.lastLogin)}</dd>
              </div>
            )}
          </dl>
        </CardBody>
      </Card>

      <Card className="border-danger-200">
        <CardHeader
          title="Danger zone"
          subtitle="Irreversible account actions."
        />
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Sign out</p>
              <p className="text-xs text-slate-500">
                Sign out of your account on this device.
              </p>
            </div>
            <Button variant="danger" icon={LogOut} onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
