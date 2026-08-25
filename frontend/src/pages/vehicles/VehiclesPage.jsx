import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, CloudOff, Truck, SearchX } from 'lucide-react'
import { getVehicles, getUsers, deleteVehicle } from '../../api'
import { formatKm } from '../../utils/format'
import { useNotifications } from '../../context/NotificationContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { Card } from '../../components/ui/Card'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import VehicleFormModal from '../../components/vehicles/VehicleFormModal'

const PAGE_SIZE = 10

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'BREAKDOWN', label: 'Breakdown' },
  { value: 'RETIRED', label: 'Retired' },
]

export default function VehiclesPage() {
  const navigate = useNavigate()
  const { success, error: toastError } = useNotifications()

  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [vehicleData, userData] = await Promise.all([
        getVehicles(),
        getUsers(),
      ])
      setVehicles(vehicleData || [])
      setDrivers((userData || []).filter((u) => u.role === 'DRIVER'))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = useMemo(() => {
    let result = vehicles
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (v) =>
          v.registrationNo?.toLowerCase().includes(q) ||
          v.make?.toLowerCase().includes(q) ||
          v.model?.toLowerCase().includes(q)
      )
    }
    if (statusFilter) {
      result = result.filter((v) => v.status === statusFilter)
    }
    return result
  }, [vehicles, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  function handleRowClick(id, e) {
    if (e.defaultPrevented) return
    navigate(`/vehicles/${id}`)
  }

  function openCreate() {
    setEditVehicle(null)
    setFormOpen(true)
  }

  function openEdit(vehicle, e) {
    e.stopPropagation()
    setEditVehicle(vehicle)
    setFormOpen(true)
  }

  function handleSaved() {
    fetchData()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteVehicle(deleteTarget.id)
      success('Vehicle deleted', `${deleteTarget.registrationNo} has been removed.`)
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      toastError('Delete failed', err?.response?.data?.message || err?.message || 'Could not delete vehicle')
    } finally {
      setDeleting(false)
    }
  }

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Vehicles</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your vehicle inventory.</p>
        </div>
        <Card className="p-10">
          <EmptyState
            icon={CloudOff}
            title="Failed to load vehicles"
            message="Check your connection and try again."
            action={<Button onClick={fetchData}>Retry</Button>}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Vehicles</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your vehicle inventory.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          Add vehicle
        </Button>
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search registration, make, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-44"
          />
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 && vehicles.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No vehicles yet"
            message="Add your first vehicle to get started."
            action={<Button icon={Plus} onClick={openCreate}>Add vehicle</Button>}
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
                  <TH>Registration</TH>
                  <TH>GPS Device</TH>
                  <TH>Odometer</TH>
                  <TH>Assigned Driver</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {paginated.map((v) => (
                  <TR key={v.id} onClick={(e) => handleRowClick(v.id, e)}>
                    <TD>
                      <span className="font-semibold text-slate-800">{v.registrationNo}</span>
                      <span className="block text-xs text-slate-500">{v.make} {v.model}</span>
                    </TD>
                    <TD>
                      <span className="font-mono text-xs text-slate-500">{v.gpsDeviceId}</span>
                    </TD>
                    <TD>{formatKm(v.currentOdometer)}</TD>
                    <TD>
                      <span className={v.assignedDriver ? 'text-slate-700' : 'text-slate-400'}>
                        {v.assignedDriver?.name || '—'}
                      </span>
                    </TD>
                    <TD><StatusBadge status={v.status} /></TD>
                    <TD className="text-right">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          aria-label={`View ${v.registrationNo}`}
                          onClick={() => navigate(`/vehicles/${v.id}`)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Pencil}
                          aria-label={`Edit ${v.registrationNo}`}
                          onClick={(e) => openEdit(v, e)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          aria-label={`Delete ${v.registrationNo}`}
                          className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget(v)
                          }}
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

      <VehicleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        vehicle={editVehicle}
        onSaved={handleSaved}
        drivers={drivers}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete vehicle"
        danger
        confirmLabel="Delete"
        loading={deleting}
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.registrationNo}? This will unlink all associated trips and logs.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
