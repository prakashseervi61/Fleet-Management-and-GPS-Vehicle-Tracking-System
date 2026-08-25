import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Gauge,
  Satellite,
  UserRound,
  Pencil,
  Trash2,
  CalendarDays,
  Wrench,
  FileText,
  Fuel,
} from 'lucide-react'
import {
  getVehicleById,
  assignDriver,
  deleteVehicle,
  getUsers,
} from '../../api'
import { getMaintenanceByVehicle } from '../../api/maintenanceApi'
import { getDocumentsByVehicle } from '../../api/documentApi'
import { getFuelLogsByVehicle } from '../../api/fuelApi'
import { getHistory } from '../../api/gpsApi'
import { useAuthContext } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { formatKm, formatDate, formatDateTime, formatCurrency } from '../../utils/format'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import { Card, CardBody } from '../../components/ui/Card'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import VehicleFormModal from '../../components/vehicles/VehicleFormModal'

export default function VehicleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuthContext()
  const { success, error: toastError } = useNotifications()

  const [vehicle, setVehicle] = useState(null)
  const [maintenance, setMaintenance] = useState([])
  const [documents, setDocuments] = useState([])
  const [fuelLogs, setFuelLogs] = useState([])
  const [gpsPings, setGpsPings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [drivers, setDrivers] = useState([])
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignDriverId, setAssignDriverId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const canManage = hasRole('FLEET_MANAGER', 'SUPER_ADMIN')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const results = await Promise.allSettled([
        getVehicleById(id),
        getMaintenanceByVehicle(id),
        getDocumentsByVehicle(id),
        getFuelLogsByVehicle(id),
        getHistory(id),
      ])

      if (results[0].status === 'rejected') {
        setError(true)
        return
      }

      setVehicle(results[0].value)
      if (results[1].status === 'fulfilled') setMaintenance(results[1].value || [])
      if (results[2].status === 'fulfilled') setDocuments(results[2].value || [])
      if (results[3].status === 'fulfilled') setFuelLogs(results[3].value || [])
      if (results[4].status === 'fulfilled') setGpsPings(results[4].value || [])

      if (canManage) {
        try {
          const userData = await getUsers()
          setDrivers((userData || []).filter((u) => u.role === 'DRIVER'))
        } catch {
          /* non-critical */
        }
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [id, canManage])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleAssign() {
    if (!assignDriverId) return
    setAssigning(true)
    try {
      await assignDriver(id, assignDriverId)
      success('Driver assigned', 'The driver has been assigned to this vehicle.')
      setAssignOpen(false)
      setAssignDriverId('')
      fetchData()
    } catch (err) {
      toastError('Assign failed', err?.response?.data?.message || err?.message || 'Could not assign driver')
    } finally {
      setAssigning(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteVehicle(id)
      success('Vehicle deleted', `${vehicle.registrationNo} has been removed.`)
      navigate('/vehicles')
    } catch (err) {
      toastError('Delete failed', err?.response?.data?.message || err?.message || 'Could not delete vehicle')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/vehicles')}
          className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to vehicles
        </button>
        <Card className="p-10 text-center">
          <EmptyState
            icon={Satellite}
            title="Vehicle not found"
            message="This vehicle may have been deleted or is unavailable."
            action={<Button onClick={() => navigate('/vehicles')}>Back to vehicles</Button>}
          />
        </Card>
      </div>
    )
  }

  const recentPings = [...gpsPings].reverse().slice(0, 10)
  const assignDriverOptions = [
    { value: '', label: 'Select a driver...' },
    ...drivers.map((d) => ({ value: d.id, label: d.name })),
  ]

  function daysUntil(dateStr) {
    if (!dateStr) return null
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return null
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  function expiryColor(dateStr) {
    const days = daysUntil(dateStr)
    if (days === null) return 'text-slate-500'
    if (days < 0) return 'text-danger-600'
    if (days < 30) return 'text-warning-600'
    return 'text-slate-500'
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/vehicles')}
        className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to vehicles
      </button>

      <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-xl shadow-card overflow-hidden">
        <div className="p-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{vehicle.registrationNo}</h1>
            <p className="text-sm text-slate-300 mt-1">{vehicle.make} {vehicle.model}</p>
          </div>
          <StatusBadge status={vehicle.status} />
        </div>
        <div className="bg-white/5 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Gauge className="h-5 w-5 text-slate-300" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Odometer</p>
                <p className="text-sm font-semibold text-white">{formatKm(vehicle.currentOdometer)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Satellite className="h-5 w-5 text-slate-300" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">GPS Device</p>
                <p className="text-sm font-semibold text-white font-mono">{vehicle.gpsDeviceId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <UserRound className="h-5 w-5 text-slate-300" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Driver</p>
                <p className="text-sm font-semibold text-white">{vehicle.assignedDriver?.name || 'Unassigned'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <CalendarDays className="h-5 w-5 text-slate-300" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Added</p>
                <p className="text-sm font-semibold text-white">—</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {canManage && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={UserRound} onClick={() => {
            setAssignDriverId(vehicle.assignedDriver?.id || '')
            setAssignOpen(true)
          }}>
            Assign driver
          </Button>
          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" icon={Trash2} className="text-danger-600 hover:text-danger-700 hover:bg-danger-50" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      )}

      <Card>
        <div className="px-5 pt-5 pb-0">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-slate-400" /> Maintenance history
          </h3>
        </div>
        <CardBody className="p-0">
          {maintenance.length === 0 ? (
            <EmptyState icon={Wrench} title="No maintenance records" message="Maintenance history will appear here." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Service Type</TH>
                  <TH>Status</TH>
                  <TH>Scheduled</TH>
                  <TH className="text-right">Cost</TH>
                </TR>
              </THead>
              <TBody>
                {maintenance.map((m) => (
                  <TR key={m.id}>
                    <TD className="font-medium text-slate-800">{m.serviceType || '—'}</TD>
                    <TD><StatusBadge status={m.status} /></TD>
                    <TD>{formatDate(m.scheduledDate)}</TD>
                    <TD className="text-right">{m.cost != null ? formatCurrency(m.cost) : '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <div className="px-5 pt-5 pb-0">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" /> Documents
          </h3>
        </div>
        <CardBody className="p-0">
          {documents.length === 0 ? (
            <EmptyState icon={FileText} title="No documents" message="Uploaded documents will appear here." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Type</TH>
                  <TH>Status</TH>
                  <TH>Expiry Date</TH>
                  <TH>Days Left</TH>
                </TR>
              </THead>
              <TBody>
                {documents.map((doc) => {
                  const days = daysUntil(doc.expiryDate)
                  return (
                    <TR key={doc.id}>
                      <TD className="font-medium text-slate-800">{doc.type || '—'}</TD>
                      <TD><StatusBadge status={doc.status || 'PENDING'} /></TD>
                      <TD>{formatDate(doc.expiryDate)}</TD>
                      <TD className={expiryColor(doc.expiryDate)}>
                        {days !== null ? (days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d`) : '—'}
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <div className="px-5 pt-5 pb-0">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Fuel className="h-4 w-4 text-slate-400" /> Recent fuel logs
          </h3>
        </div>
        <CardBody className="p-0">
          {fuelLogs.length === 0 ? (
            <EmptyState icon={Fuel} title="No fuel logs" message="Refuel records will appear here." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Quantity</TH>
                  <TH className="text-right">Cost</TH>
                </TR>
              </THead>
              <TBody>
                {fuelLogs.map((log) => (
                  <TR key={log.id}>
                    <TD>{formatDate(log.date || log.createdAt)}</TD>
                    <TD>{log.quantityLitres != null ? `${log.quantityLitres} L` : '—'}</TD>
                    <TD className="text-right">{log.cost != null ? formatCurrency(log.cost) : '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <div className="px-5 pt-5 pb-0">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Satellite className="h-4 w-4 text-slate-400" /> Recent GPS pings
          </h3>
        </div>
        <CardBody className="p-0">
          {recentPings.length === 0 ? (
            <EmptyState icon={Satellite} title="No GPS data" message="GPS pings will appear here." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Recorded At</TH>
                  <TH>Location</TH>
                  <TH>Speed</TH>
                  <TH>Event Type</TH>
                </TR>
              </THead>
              <TBody>
                {recentPings.map((ping) => (
                  <TR key={ping.id}>
                    <TD>{formatDateTime(ping.recordedAt)}</TD>
                    <TD className="font-mono text-xs">
                      {ping.latitude?.toFixed(4)}, {ping.longitude?.toFixed(4)}
                    </TD>
                    <TD>{ping.speed != null ? `${ping.speed} km/h` : '—'}</TD>
                    <TD>{ping.eventType ? <StatusBadge status={ping.eventType} /> : '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign driver"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignOpen(false)} disabled={assigning}>
              Cancel
            </Button>
            <Button variant="primary" loading={assigning} onClick={handleAssign} disabled={!assignDriverId}>
              Assign
            </Button>
          </>
        }
      >
        <Select
          label="Select driver"
          options={assignDriverOptions}
          value={assignDriverId}
          onChange={(e) => setAssignDriverId(e.target.value)}
        />
      </Modal>

      <VehicleFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        vehicle={vehicle}
        onSaved={fetchData}
        drivers={drivers}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete vehicle"
        danger
        confirmLabel="Delete"
        loading={deleting}
        message={`Are you sure you want to delete ${vehicle.registrationNo}? This will unlink all associated trips and logs.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
