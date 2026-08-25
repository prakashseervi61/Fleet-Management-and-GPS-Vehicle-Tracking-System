import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Fuel, Trash2, RefreshCw, CloudOff } from 'lucide-react'
import { getFuelLogs, getFuelCostSummary, deleteFuelLog } from '../../api/fuelApi'
import { getVehicles } from '../../api/vehicleApi'
import { formatDate, formatCurrency, formatLiters } from '../../utils/format'
import { useNotifications } from '../../context/NotificationContext'
import { FLEET_REFRESH_INTERVAL_MS } from '../../constants/businessRules'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { Card } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import FuelLogFormModal from '../../components/fuel/FuelLogFormModal'

const PAGE_SIZE = 10

function getFirstDayOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

export default function FuelLogsPage() {
  const { success, error: toastError } = useNotifications()

  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [search, setSearch] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [costFrom, setCostFrom] = useState(getFirstDayOfMonth)
  const [costTo, setCostTo] = useState(getToday)
  const [totalCost, setTotalCost] = useState(null)
  const [costLoading, setCostLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [logData, vehicleData] = await Promise.all([
        getFuelLogs(),
        getVehicles(),
      ])
      setLogs(logData || [])
      setVehicles(vehicleData || [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCost = useCallback(async (from, to) => {
    setCostLoading(true)
    try {
      const total = await getFuelCostSummary(from, to)
      setTotalCost(total)
    } catch {
      setTotalCost(null)
    } finally {
      setCostLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchCost(costFrom, costTo)
  }, [fetchData, fetchCost, costFrom, costTo])

  useEffect(() => {
    const id = setInterval(() => {
      fetchData()
      fetchCost(costFrom, costTo)
    }, FLEET_REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchData, fetchCost, costFrom, costTo])

  const vehicleOptions = useMemo(() => [
    { value: '', label: 'All vehicles' },
    ...vehicles.map((v) => ({ value: v.id, label: v.registrationNo })),
  ], [vehicles])

  const filtered = useMemo(() => {
    let result = logs
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.vehicle?.registrationNo?.toLowerCase().includes(q) ||
          l.driver?.name?.toLowerCase().includes(q)
      )
    }
    if (vehicleFilter) {
      result = result.filter((l) => String(l.vehicle?.id) === vehicleFilter)
    }
    return result
  }, [logs, search, vehicleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, vehicleFilter])

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteFuelLog(deleteTarget.id)
      success('Fuel log deleted', 'The fuel entry has been removed.')
      setDeleteTarget(null)
      fetchData()
      fetchCost(costFrom, costTo)
    } catch (err) {
      toastError('Delete failed', err?.response?.data?.message || err?.message || 'Could not delete fuel log')
    } finally {
      setDeleting(false)
    }
  }

  function handleUpdateCost() {
    fetchCost(costFrom, costTo)
  }

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Fuel Logs</h1>
          <p className="mt-1 text-sm text-slate-500">Track fuel purchases and consumption.</p>
        </div>
        <Card className="p-10">
          <EmptyState
            icon={CloudOff}
            title="Failed to load fuel logs"
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Fuel Logs</h1>
          <p className="mt-1 text-sm text-slate-500">Track fuel purchases and consumption.</p>
        </div>
        <Button icon={Plus} onClick={() => setFormOpen(true)}>
          Log fuel
        </Button>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs font-medium text-slate-500 mb-1">Cost summary</p>
            <div className="text-2xl font-bold text-slate-800">
              {costLoading ? (
                <Skeleton className="h-8 w-32 inline-block" />
              ) : (
                formatCurrency(totalCost)
              )}
            </div>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <Input
              label="From"
              type="date"
              value={costFrom}
              onChange={(e) => setCostFrom(e.target.value)}
              className="w-40"
            />
            <Input
              label="To"
              type="date"
              value={costTo}
              onChange={(e) => setCostTo(e.target.value)}
              className="w-40"
            />
            <Button variant="secondary" onClick={handleUpdateCost} disabled={costLoading}>
              Update
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search registration or driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            options={vehicleOptions}
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
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
        ) : filtered.length === 0 && logs.length === 0 ? (
          <EmptyState
            icon={Fuel}
            title="No fuel logs"
            message="Record your first fuel entry to get started."
            action={<Button icon={Plus} onClick={() => setFormOpen(true)}>Log fuel</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Fuel}
            title="No matches"
            message="Try adjusting your search or filter criteria."
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Vehicle</TH>
                  <TH>Driver</TH>
                  <TH>Quantity</TH>
                  <TH>Cost</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {paginated.map((log) => (
                  <TR key={log.id}>
                    <TD>{formatDate(log.date)}</TD>
                    <TD>
                      <span className="font-semibold text-slate-800">
                        {log.vehicle?.registrationNo || '—'}
                      </span>
                    </TD>
                    <TD>
                      <span className={log.driver?.name ? 'text-slate-700' : 'text-slate-400'}>
                        {log.driver?.name || '—'}
                      </span>
                    </TD>
                    <TD>{formatLiters(log.quantityLitres)}</TD>
                    <TD>{formatCurrency(log.cost)}</TD>
                    <TD className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        aria-label="Delete fuel log"
                        className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                        onClick={() => setDeleteTarget(log)}
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </Card>

      <FuelLogFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={() => {
          fetchData()
          fetchCost(costFrom, costTo)
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete fuel log"
        danger
        confirmLabel="Delete"
        loading={deleting}
        message={
          deleteTarget
            ? `Are you sure you want to delete this fuel entry for ${deleteTarget.vehicle?.registrationNo || '—'}?`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
