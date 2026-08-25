import { useState, useEffect } from 'react'
import { Pencil, UserX } from 'lucide-react'
import { getProfile } from '../../api/authApi'
import { updateUser } from '../../api/userApi'
import { formatDate, formatDateTime } from '../../utils/format'
import { useNotifications } from '../../context/NotificationContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function roleLabel(role) {
  if (!role) return '—'
  return role
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

export default function ProfilePage() {
  const { success, error: toastError } = useNotifications()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    drivingLicenceNo: '',
    licenceExpiryDate: '',
  })
  const [saving, setSaving] = useState(false)

  async function fetchProfile() {
    setLoading(true)
    setError(false)
    try {
      const data = await getProfile()
      setProfile(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  function startEditing() {
    if (!profile) return
    setForm({
      name: profile.name || '',
      phoneNumber: profile.phoneNumber || '',
      drivingLicenceNo: profile.drivingLicenceNo || '',
      licenceExpiryDate: profile.licenceExpiryDate
        ? profile.licenceExpiryDate.slice(0, 10)
        : '',
    })
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return

    setSaving(true)
    try {
      await updateUser(profile.id, {
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        drivingLicenceNo: form.drivingLicenceNo.trim(),
        licenceExpiryDate: form.licenceExpiryDate || null,
      })
      const updated = await getProfile()
      setProfile(updated)
      setEditing(false)
      success('Profile updated', 'Your profile has been saved.')
    } catch (err) {
      toastError(
        'Update failed',
        err?.response?.data?.message || err?.message || 'Could not update profile.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Your account information.</p>
        </div>
        <Card className="p-6">
          <div className="flex gap-8">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex-1 space-y-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Your account information.</p>
        </div>
        <Card className="p-10">
          <EmptyState
            icon={UserX}
            title="Failed to load profile"
            message="Check your connection and try again."
            action={<Button onClick={fetchProfile}>Retry</Button>}
          />
        </Card>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your account information.</p>
      </div>

      <Card>
        <div className="p-6 flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center md:items-start gap-2 md:min-w-[200px]">
            <div className="h-20 w-20 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold">
              {getInitials(profile.name)}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{profile.name}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ring-brand-600/20">
              {roleLabel(profile.role)}
            </span>
            <p className="text-sm text-slate-600">{profile.email}</p>
            <p className="text-sm text-slate-600">{profile.phoneNumber}</p>
            <p className="text-xs text-slate-500 mt-1">
              Member since {formatDate(profile.createdDate)}
            </p>
            {profile.lastLogin && (
              <p className="text-xs text-slate-500">
                Last login {formatDateTime(profile.lastLogin)}
              </p>
            )}
          </div>

          <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-4 max-w-md">
                <Input
                  label="Name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
                <Input
                  label="Phone"
                  value={form.phoneNumber}
                  onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                />
                <Input
                  label="Driving licence number"
                  value={form.drivingLicenceNo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, drivingLicenceNo: e.target.value }))
                  }
                />
                <Input
                  label="Licence expiry date"
                  type="date"
                  value={form.licenceExpiryDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, licenceExpiryDate: e.target.value }))
                  }
                />
                <div className="flex gap-2 pt-2">
                  <Button type="submit" loading={saving}>
                    Save
                  </Button>
                  <Button type="button" variant="secondary" onClick={cancelEditing} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Profile details</h3>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div className="flex gap-4">
                      <dt className="text-slate-400 w-40 shrink-0">Phone</dt>
                      <dd className="text-slate-700">{profile.phoneNumber || '—'}</dd>
                    </div>
                    <div className="flex gap-4">
                      <dt className="text-slate-400 w-40 shrink-0">Driving licence</dt>
                      <dd className="text-slate-700">{profile.drivingLicenceNo || '—'}</dd>
                    </div>
                    <div className="flex gap-4">
                      <dt className="text-slate-400 w-40 shrink-0">Licence expiry</dt>
                      <dd className="text-slate-700">{formatDate(profile.licenceExpiryDate)}</dd>
                    </div>
                  </dl>
                </div>
                <Button icon={Pencil} variant="secondary" onClick={startEditing}>
                  Edit profile
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
