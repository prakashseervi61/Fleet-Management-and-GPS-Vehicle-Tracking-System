import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Route, CloudOff, SearchX, Play, CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react'
import { getTrips, startTrip, completeTrip, cancelTrip } from '../../api'
import { formatDateTime } from '../../utils/format'
import { useNotifications } from '../../context/NotificationContext'
import { useAuthContext } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'
import { FLEET_REFRESH_INTERVAL_MS } from '../../constants/businessRules'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { Card } from '../../components/ui/Card'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import TripFormModal from '../../components/trips/TripFormModal'

const PAGE_SIZE = 10

const TRIP_STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'STARTED', label: 'Started' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const CAN_CREATE = [ROLES.LOGISTICS_COORDINATOR, ROLES.FLEET_MANAGER, ROLES.SYSTEM_ADMINISTRATOR]
const CAN_START_COMPLETE = [ROLES.DRIVER, ROLES.FLEET_MANAGER, ROLES.LOGISTICS_COORDINATOR]
const CAN_CANCEL = [ROLES.FLEET_MANAGER, ROLES.LOGISTICS_COORDINATOR, ROLES.SYSTEM_ADMINISTRATOR]

export default function TripsPage() {
  const navigate = useNavigate()
  const { success, error: toastError } = useNotifications()
  const { user, hasRole } = useAuthContext()

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const [showCreate, setShowCreate] = useState(false)
  const [viewTarget, setViewTarget] = useState(null)
  const [completeTarget, setCompleteTarget] = useState(null)
  const [distanceKm, setDistanceKm] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await getTrips()
      setTrips(data || [])
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
    let result = trips
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.origin?.toLowerCase().includes(q) ||
          t.destination?.toLowerCase().includes(q) ||
          t.vehicle?.registrationNo?.toLowerCase().includes(q) ||
          t.registrationNo?.toLowerCase().includes(q) ||
          t.driver?.name?.toLowerCase().includes(q) ||
          t.driverName?.toLowerCase().includes(q)
      )
    }
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter)
    }
    return result
  }, [trips, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  function canStart(trip) {
    if (trip.status !== 'ASSIGNED' && trip.status !== 'PLANNED') return false
    const driverId = trip.driver?.id || trip.driverId
    if (user?.role === ROLES.DRIVER) {
      return hasRole(...CAN_START_COMPLETE) && driverId === user.id
    }
    return hasRole(...CAN_START_COMPLETE)
  }

  function canComplete(trip) {
    if (trip.status !== 'STARTED' && trip.status !== 'IN_PROGRESS') return false
    const driverId = trip.driver?.id || trip.driverId
    if (user?.role === ROLES.DRIVER) {
      return hasRole(...CAN_START_COMPLETE) && driverId === user.id
    }
    return hasRole(...CAN_START_COMPLETE)
  }

  function canCancel(trip) {
    return (
      ['ASSIGNED', 'PLANNED', 'STARTED', 'IN_PROGRESS'].includes(trip.status) &&
      hasRole(...CAN_CANCEL)
    )
  }

  async function handleStart(trip) {
    try {
      await startTrip(trip.id)
      success('Trip started', `Trip from ${trip.origin} is now in progress.`)
      fetchData()
    } catch (err) {
      toastError('Failed to start trip', err?.response?.data?.message || err?.message || 'Could not start trip')
    }
  }

  function openComplete(trip) {
    setCompleteTarget(trip)
    setDistanceKm(trip.distanceKm || '')
  }

  async function confirmComplete() {
    if (!completeTarget) return
    setConfirming(true)
    try {
      await completeTrip(completeTarget.id, distanceKm ? Number(distanceKm) : undefined)
      success('Trip completed', `Trip from ${completeTarget.origin} has been completed.`)
      setCompleteTarget(null)
      fetchData()
    } catch (err) {
      toastError('Failed to complete trip', err?.response?.data?.message || err?.message || 'Could not complete trip')
    } finally {
      setConfirming(false)
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return
    setConfirming(true)
    try {
      await cancelTrip(cancelTarget.id)
      success('Trip cancelled', `Trip from ${cancelTarget.origin} has been cancelled.`)
      setCancelTarget(null)
      fetchData()
    } catch (err) {
      toastError('Failed to cancel trip', err?.response?.data?.message || err?.message || 'Could not cancel trip')
    } finally {
      setConfirming(false)
    }
  }

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Trips</h1>
          <p className="mt-1 text-sm text-slate-500">Track all fleet journeys.</p>
        </div>
        <Card className="p-10">
          <EmptyState
            icon={CloudOff}
            title="Can't reach the server"
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Trips</h1>
          <p className="mt-1 text-sm text-slate-500">Track all fleet journeys.</p>
        </div>
        {hasRole(...CAN_CREATE) && (
          <Button icon={Plus} onClick={() => setShowCreate(true)}>
            New trip
          </Button>
        )}
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search origin, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            options={TRIP_STATUSES}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-44"
          />
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchData}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 && trips.length === 0 ? (
          <EmptyState
            icon={Route}
            title="No trips yet"
            message="Plan your first trip to get started."
            action={
              hasRole(...CAN_CREATE) && (
                <Button icon={Plus} onClick={() => setShowCreate(true)}>
                  Plan first trip
                </Button>
              )
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
                  <TH>Origin</TH>
                  <TH>Destination</TH>
                  <TH>Vehicle</TH>
                  <TH>Driver</TH>
                  <TH>Planned Start</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {paginated.map((t) => (
                  <TR key={t.id}>
                    <TD>
                      <span className="text-sm text-slate-700 font-medium">{t.origin}</span>
                    </TD>
                    <TD>
                      <span className="text-sm text-slate-700 font-medium">{t.destination}</span>
                    </TD>
                    <TD>
                      <span className="font-semibold text-slate-800">
                        {t.vehicle?.registrationNo || t.registrationNo}
                      </span>
                      {(t.vehicle?.make || t.vehicle?.model) && (
                        <span className="block text-xs text-slate-500">
                          {t.vehicle.make} {t.vehicle.model}
                        </span>
                      )}
                    </TD>
                    <TD>
                      <span className={t.driver?.name || t.driverName ? 'text-slate-700' : 'text-slate-400'}>
                        {t.driver?.name || t.driverName || '—'}
                      </span>
                    </TD>
                    <TD>{formatDateTime(t.plannedStart)}</TD>
                    <TD><StatusBadge status={t.status} /></TD>
                    <TD className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          aria-label={`View trip ${t.id}`}
                          onClick={() => setViewTarget(t)}
                        />
                        {canStart(t) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Play}
                            aria-label="Start trip"
                            onClick={() => handleStart(t)}
                          />
                        )}
                        {canComplete(t) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={CheckCircle}
                            aria-label="Complete trip"
                            onClick={() => openComplete(t)}
                          />
                        )}
                        {canCancel(t) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={XCircle}
                            aria-label="Cancel trip"
                            className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                            onClick={() => setCancelTarget(t)}
                          />
                        )}
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

      <TripFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchData}
      />

      {/* Trip Details Modal */}
      <Modal
        open={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        title="Trip Details"
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setViewTarget(null)}>
            Close
          </Button>
        }
      >
        {viewTarget && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-base text-slate-800">
                {viewTarget.origin} → {viewTarget.destination}
              </span>
              <StatusBadge status={viewTarget.status} />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500 text-xs">Vehicle</dt>
                <dd className="font-medium text-slate-800 mt-0.5">
                  {viewTarget.vehicle?.registrationNo || viewTarget.registrationNo || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Driver</dt>
                <dd className="font-medium text-slate-800 mt-0.5">
                  {viewTarget.driver?.name || viewTarget.driverName || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Planned Start</dt>
                <dd className="font-medium text-slate-800 mt-0.5">
                  {formatDateTime(viewTarget.plannedStart)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Actual End</dt>
                <dd className="font-medium text-slate-800 mt-0.5">
                  {viewTarget.actualEnd ? formatDateTime(viewTarget.actualEnd) : 'In progress / Pending'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Distance</dt>
                <dd className="font-medium text-slate-800 mt-0.5">
                  {viewTarget.distanceKm ? `${viewTarget.distanceKm} km` : '—'}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(completeTarget)}
        onClose={() => setCompleteTarget(null)}
        title="Complete trip"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCompleteTarget(null)} disabled={confirming}>
              Cancel
            </Button>
            <Button variant="primary" loading={confirming} onClick={confirmComplete}>
              Complete
            </Button>
          </>
        }
      >
        {completeTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Complete the trip from {completeTarget.origin} to {completeTarget.destination}?
            </p>
            <Input
              label="Distance (km)"
              type="number"
              min="0"
              placeholder="Enter distance"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel trip"
        danger
        confirmLabel="Cancel trip"
        loading={confirming}
        message={
          cancelTarget
            ? `Are you sure you want to cancel the trip from ${cancelTarget.origin} to ${cancelTarget.destination}?`
            : ''
        }
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}
