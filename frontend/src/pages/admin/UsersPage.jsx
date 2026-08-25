import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, Users, SearchX } from 'lucide-react'
import { getUsers, createUser, updateUser, deleteUser } from '../../api/userApi'
import { ALL_ROLES } from '../../constants/roles'
import { FLEET_REFRESH_INTERVAL_MS } from '../../constants/businessRules'
import { formatDate } from '../../utils/format'
import { useNotifications } from '../../context/NotificationContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { Card } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'

const PAGE_SIZE = 10

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  ...ALL_ROLES.map((r) => ({
    value: r,
    label: r
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' '),
  })),
]

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

function humanizeRole(role) {
  if (!role) return '—'
  return role
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

function UserFormModal({ user, onClose, onCreated }) {
  const { success, error: toastError } = useNotifications()
  const isEdit = Boolean(user)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        password: '',
        role: user.role || '',
      })
    } else {
      setForm({ name: '', email: '', phoneNumber: '', password: '', role: '' })
    }
    setErrors({})
  }, [user])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    if (!form.phoneNumber.trim()) errs.phoneNumber = 'Phone is required'
    if (!isEdit && !form.password.trim()) errs.password = 'Password is required'
    if (!form.role) errs.role = 'Role is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      if (isEdit) {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          role: form.role,
        }
        if (form.password.trim()) payload.password = form.password.trim()
        await updateUser(user.id, payload)
        success('User updated', `${form.name} has been updated.`)
      } else {
        await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          password: form.password.trim(),
          role: form.role,
        })
        success('User created', `${form.name} has been added.`)
      }
      onCreated()
      onClose()
    } catch (err) {
      toastError(
        isEdit ? 'Update failed' : 'Create failed',
        err?.response?.data?.message || err?.message || 'Something went wrong.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit user' : 'Add user'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button loading={submitting} onClick={handleSubmit}>
            {isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
        />
        <Input
          label="Email"
          type="email"
          placeholder="user@example.com"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
        />
        <Input
          label="Phone"
          placeholder="Phone number"
          value={form.phoneNumber}
          onChange={(e) => handleChange('phoneNumber', e.target.value)}
          error={errors.phoneNumber}
        />
        <Input
          label="Password"
          type="password"
          placeholder={isEdit ? 'Leave blank to keep current' : 'Set a password'}
          value={form.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={errors.password}
          hint={isEdit ? 'Leave blank to keep the current password.' : undefined}
        />
        <Select
          label="Role"
          options={ROLE_OPTIONS.filter((o) => o.value !== '')}
          value={form.role}
          onChange={(e) => handleChange('role', e.target.value)}
          error={errors.role}
        />
      </form>
    </Modal>
  )
}

export default function UsersPage() {
  const { success, error: toastError } = useNotifications()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await getUsers()
      setUsers(data || [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    const interval = setInterval(fetchUsers, FLEET_REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchUsers])

  const filtered = useMemo(() => {
    let result = users
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      )
    }
    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter)
    }
    if (statusFilter) {
      result = result.filter((u) =>
        statusFilter === 'active' ? u.active : !u.active
      )
    }
    return result
  }, [users, search, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, statusFilter])

  function openCreate() {
    setEditUser(null)
    setFormOpen(true)
  }

  function openEdit(user) {
    setEditUser(user)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteUser(deleteTarget.id)
      success('User deleted', `${deleteTarget.name} has been removed.`)
      setDeleteTarget(null)
      fetchUsers()
    } catch (err) {
      toastError(
        'Delete failed',
        err?.response?.data?.message || err?.message || 'Could not delete user.'
      )
    } finally {
      setDeleting(false)
    }
  }

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Users</h1>
          <p className="mt-1 text-sm text-slate-500">Manage system users and access.</p>
        </div>
        <Card className="p-10">
          <EmptyState
            icon={Users}
            title="Failed to load users"
            message="Check your connection and try again."
            action={<Button onClick={fetchUsers}>Retry</Button>}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Users</h1>
          <p className="mt-1 text-sm text-slate-500">Manage system users and access.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          Add user
        </Button>
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            options={ROLE_OPTIONS}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-48"
          />
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          />
          <Button variant="ghost" size="sm" onClick={fetchUsers}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 && users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users yet"
            message="Add your first user to get started."
            action={
              <Button icon={Plus} onClick={openCreate}>
                Add user
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No matches"
            message="Try adjusting your search or filter criteria."
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {paginated.map((u) => (
                  <TR key={u.id}>
                    <TD>
                      <span className="font-semibold text-slate-800">{u.name}</span>
                      <span className="block text-xs text-slate-500">{u.phoneNumber}</span>
                    </TD>
                    <TD>{u.email}</TD>
                    <TD>{humanizeRole(u.role)}</TD>
                    <TD>
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            u.active ? 'bg-success-500' : 'bg-slate-400'
                          }`}
                        />
                        <span className="text-sm">{u.active ? 'Active' : 'Inactive'}</span>
                      </span>
                    </TD>
                    <TD>{formatDate(u.createdDate)}</TD>
                    <TD className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Pencil}
                          aria-label={`Edit ${u.name}`}
                          onClick={() => openEdit(u)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          aria-label={`Delete ${u.name}`}
                          className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                          onClick={() => setDeleteTarget(u)}
                        />
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </Card>

      {formOpen && (
        <UserFormModal
          user={editUser}
          onClose={() => setFormOpen(false)}
          onCreated={fetchUsers}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        danger
        confirmLabel="Delete"
        loading={deleting}
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
