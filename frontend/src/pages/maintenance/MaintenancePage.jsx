import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, Wrench, RefreshCw, CloudOff, SearchX, CheckCircle2 } from 'lucide-react'
import { getMaintenanceRecords, deleteMaintenance, completeMaintenance, triggerOdometerMaintenance } from '../../api'
import { formatDate, formatCurrency } from '../../utils/format'
import { useNotifications } from '../../context/NotificationContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { Card } from '../../components/ui/Card'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import Modal from '../../components/ui/Modal'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import MaintenanceFormModal from '../../components/maintenance/MaintenanceFormModal'
import { FLEET_REFRESH_INTERVAL_MS } from '../../constants/businessRules'

const PAGE_SIZE = 10

const MAINTENANCE_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

const MAINTENANCE_SERVICE_TYPES = [
  'OIL_CHANGE',
  'TIRE_ROTATION',
  'BRAKE_INSPECTION',
  'ENGINE_SERVICE',
  'TRANSMISSION_SERVICE',
  'GENERAL_SERVICE',
]

function humanize(str) {
  if (!str) return '—'
  return str
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...MAINTENANCE_STATUSES.map((s) => ({ value: s, label: humanize(s) })),
]

const SERVICE_FILTER_OPTIONS = [
  { value: '', label: 'All service types' },
  ...MAINTENANCE_SERVICE_TYPES.map((s) => ({ value: s, label: humanize(s) })),
]

export default function MaintenancePage() {
  const navigate = useNavigate()
  const { success, error: toastError } = useNotifications()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editOrder, setEditOrder] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [completeTarget, setCompleteTarget] = useState(null)
  const [completeCost, setCompleteCost] = useState('')
  const [completing, setCompleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await getMaintenanceRecords()
      setOrders(data || [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const id = setInterval(fetchData, FLEET_REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchData])

  const filtered = useMemo(() => {
    let result = orders
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.vehicle?.registrationNo?.toLowerCase().includes(q) ||
          humanize(o.serviceType).toLowerCase().includes(q)
      )
    }
    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter)
    }
    if (serviceFilter) {
      result = result.filter((o) => o.serviceType === serviceFilter)
    }
    return result
  }, [orders, search, statusFilter, serviceFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, serviceFilter])

  function openCreate() {
    setEditOrder(null)
    setFormOpen(true)
  }

  function openEdit(order) {
    setEditOrder(order)
    setFormOpen(true)
  }

  function handleSaved() {
    fetchData()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMaintenance(deleteTarget.id)
      success('Order deleted', 'Maintenance order has been removed.')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      toastError('Delete failed', err?.response?.data?.message || err?.message || 'Could not delete order')
    } finally {
      setDeleting(false)
    }
  }

  function openComplete(order) {
    setCompleteTarget(order)
    setCompleteCost('')
  }

  async function confirmComplete() {
    if (!completeTarget) return
    setCompleting(true)
    try {
      const cost = completeCost !== '' ? Number(completeCost) : undefined
      await completeMaintenance(completeTarget.id, cost)
      success('Order completed', 'Maintenance order marked as completed.')
      setCompleteTarget(null)
      fetchData()
    } catch (err) {
      toastError('Complete failed', err?.response?.data?.message || err?.message || 'Could not complete order')
    } finally {
      setCompleting(false)
    }
  }

  async function handleTriggerOdometer() {
    try {
      await triggerOdometerMaintenance()
      success('Trigger complete', 'Odometer maintenance triggered successfully.')
      fetchData()
    } catch (err) {
      toastError('Trigger failed', err?.response?.data?.message || err?.message || 'Could not trigger odometer maintenance')
    }
  }

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Maintenance</h1>
          <p className="mt-1 text-sm text-slate-500">Manage vehicle service schedules.</p>
        </div>
        <Card className="p-10">
          <EmptyState
            icon={CloudOff}
            title="Failed to load maintenance orders"
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Maintenance</h1>
          <p className="mt-1 text-sm text-slate-500">Manage vehicle service schedules.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={handleTriggerOdometer}>
            Trigger odometer
          </Button>
          <Button icon={Plus} onClick={openCreate}>
            New order
          </Button>
        </div>
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search registration or service type..."
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
          <Select
            options={SERVICE_FILTER_OPTIONS}
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-48"
          />
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 && orders.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No maintenance orders"
            message="Create your first maintenance order to get started."
            action={<Button icon={Plus} onClick={openCreate}>New order</Button>}
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
                  <TH>Vehicle</TH>
                  <TH>Service type</TH>
                  <TH>Trigger</TH>
                  <TH>Scheduled date</TH>
                  <TH>Cost</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {paginated.map((o) => (
                  <TR key={o.id}>
                    <TD>
                      <span className="font-semibold text-slate-800">{o.vehicle?.registrationNo || '—'}</span>
                      <span className="block text-xs text-slate-500">{o.vehicle?.make} {o.vehicle?.model}</span>
                    </TD>
                    <TD>{humanize(o.serviceType)}</TD>
                    <TD>{humanize(o.trigger)}</TD>
                    <TD>{formatDate(o.scheduledDate)}</TD>
                    <TD>{o.cost != null ? formatCurrency(o.cost) : '—'}</TD>
                    <TD><StatusBadge status={o.status} /></TD>
                    <TD className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          aria-label={`View order ${o.id}`}
                          onClick={() => navigate(`/maintenance/${o.id}`)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Pencil}
                          aria-label={`Edit order ${o.id}`}
                          onClick={() => openEdit(o)}
                        />
                        {o.status === 'OPEN' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={CheckCircle2}
                            aria-label={`Complete order ${o.id}`}
                            className="text-success-600 hover:text-success-700 hover:bg-success-50"
                            onClick={() => openComplete(o)}
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          aria-label={`Delete order ${o.id}`}
                          className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                          onClick={() => setDeleteTarget(o)}
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

      <MaintenanceFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maintenanceOrder={editOrder}
        onCreated={handleSaved}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete order"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>
          {deleteTarget
            ? `Are you sure you want to delete this maintenance order for ${deleteTarget.vehicle?.registrationNo || 'this vehicle'}?`
            : ''}
        </p>
      </Modal>

      <Modal
        open={Boolean(completeTarget)}
        onClose={() => setCompleteTarget(null)}
        title="Complete order"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCompleteTarget(null)} disabled={completing}>
              Cancel
            </Button>
            <Button variant="primary" loading={completing} onClick={confirmComplete}>
              Complete
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Mark this maintenance order as completed
            {completeTarget?.vehicle?.registrationNo ? ` for ${completeTarget.vehicle.registrationNo}` : ''}.
          </p>
          <Input
            label="Cost (optional)"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={completeCost}
            onChange={(e) => setCompleteCost(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
