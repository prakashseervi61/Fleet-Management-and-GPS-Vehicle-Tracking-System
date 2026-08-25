import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, MapPin, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { getGeofences, deleteGeofence, getGeofenceAlerts } from '../../api'
import { FLEET_REFRESH_INTERVAL_MS } from '../../constants/businessRules'
import { formatRelativeTime } from '../../utils/format'
import { useNotifications } from '../../context/NotificationContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import GeofenceFormModal from '../../components/geofences/GeofenceFormModal'

const PAGE_SIZE = 10

function alertIcon(alertType) {
  if (alertType === 'EXIT') return <AlertCircle className="h-4 w-4 text-danger-500" />
  if (alertType === 'ENTER') return <CheckCircle className="h-4 w-4 text-success-500" />
  return <AlertTriangle className="h-4 w-4 text-warning-500" />
}

export default function GeofencesPage() {
  const { success, error: toastError } = useNotifications()

  const [geofences, setGeofences] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [geoData, alertData] = await Promise.all([
        getGeofences(),
        getGeofenceAlerts(),
      ])
      setGeofences(geoData || [])
      setAlerts(alertData || [])
    } catch {
      // silent on poll refresh
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
    if (!search.trim()) return geofences
    const q = search.toLowerCase()
    return geofences.filter((g) => g.name?.toLowerCase().includes(q))
  }, [geofences, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search])

  function openCreate() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function openEdit(geofence) {
    setEditTarget(geofence)
    setFormOpen(true)
  }

  function handleSaved() {
    fetchData()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteGeofence(deleteTarget.id)
      success('Geofence deleted', `${deleteTarget.name} has been removed.`)
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      toastError('Delete failed', err?.response?.data?.message || err?.message || 'Could not delete geofence')
    } finally {
      setDeleting(false)
    }
  }

  if (loading && geofences.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Geofences</h1>
          <p className="mt-1 text-sm text-slate-500">Define and monitor virtual boundaries.</p>
        </div>
        <Card>
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Geofences</h1>
          <p className="mt-1 text-sm text-slate-500">Define and monitor virtual boundaries.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          Add Geofence
        </Button>
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-slate-100">
          <Input
            placeholder="Search geofences..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {geofences.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No geofences defined"
            message="Create a geofence to start monitoring virtual boundaries."
            action={<Button icon={Plus} onClick={openCreate}>Add Geofence</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No matches"
            message="Try adjusting your search criteria."
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Radius</TH>
                  <TH>Location</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {paginated.map((g) => (
                  <TR key={g.id}>
                    <TD>
                      <span className="text-slate-800 font-medium">{g.name}</span>
                    </TD>
                    <TD>
                      <span className="text-sm">{g.radiusKm} km</span>
                    </TD>
                    <TD>
                      <span className="font-mono text-xs">
                        {Number(g.latitude).toFixed(4)}, {Number(g.longitude).toFixed(4)}
                      </span>
                    </TD>
                    <TD className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Pencil}
                          aria-label={`Edit ${g.name}`}
                          onClick={() => openEdit(g)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          aria-label={`Delete ${g.name}`}
                          className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                          onClick={() => setDeleteTarget(g)}
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

      <Card>
        <CardHeader
          title="Recent alerts"
          action={
            alerts.length > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                {alerts.length}
              </span>
            )
          }
        />
        <CardBody className="p-0">
          {alerts.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No alerts yet"
              message="Alerts will appear when vehicles enter or exit geofences."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  {alertIcon(a.alertType)}
                  <span className="font-semibold text-sm text-slate-800">
                    {a.vehicle?.registrationNo}
                  </span>
                  <span className="text-sm text-slate-500">
                    {a.alertType === 'EXIT' ? 'exited' : a.alertType === 'ENTER' ? 'entered' : 'triggered'}{' '}
                    {a.geofence?.name}
                  </span>
                  <span className="ml-auto text-xs text-slate-400 whitespace-nowrap">
                    {formatRelativeTime(a.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <GeofenceFormModal
        open={formOpen}
        geofence={editTarget}
        onClose={() => setFormOpen(false)}
        onCreated={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete geofence"
        danger
        confirmLabel="Delete"
        loading={deleting}
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
