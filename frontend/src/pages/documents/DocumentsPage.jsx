import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, RefreshCw, Pencil, Trash2, FileText, SearchX, CloudOff, CheckCircle, AlertTriangle } from 'lucide-react'
import {
  getDocuments,
  deleteDocument,
  getExpiringDocuments,
  refreshDocumentStatuses,
} from '../../api'
import { formatDate } from '../../utils/format'
import { FLEET_REFRESH_INTERVAL_MS } from '../../constants/businessRules'
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
import DocumentFormModal from '../../components/documents/DocumentFormModal'

const PAGE_SIZE = 10

const DOCUMENT_TYPES = [
  { value: '', label: 'All types' },
  { value: 'RC', label: 'RC' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'PUC', label: 'PUC' },
  { value: 'FITNESS', label: 'Fitness' },
]

const DOCUMENT_STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'VALID', label: 'Valid' },
  { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
  { value: 'EXPIRED', label: 'Expired' },
]

function humanize(str) {
  if (!str) return '—'
  return str
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

function daysLeftBadgeClass(days) {
  if (days <= 7) return 'bg-danger-100 text-danger-700 ring-danger-600/20'
  if (days <= 30) return 'bg-warning-100 text-warning-700 ring-warning-600/20'
  return 'bg-success-100 text-success-700 ring-success-600/20'
}

function flattenAlerts(alertMap) {
  if (!alertMap) return []
  const flat = []
  for (const [daysLeft, alerts] of Object.entries(alertMap)) {
    if (Array.isArray(alerts)) {
      for (const a of alerts) {
        flat.push({ ...a, daysLeft: Number(daysLeft) })
      }
    }
  }
  return flat.sort((a, b) => a.daysLeft - b.daysLeft)
}

export default function DocumentsPage() {
  const { success, error: toastError } = useNotifications()

  const [documents, setDocuments] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editDoc, setEditDoc] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [docs, alertData] = await Promise.all([
        getDocuments(),
        getExpiringDocuments(),
      ])
      setDocuments(docs || [])
      setAlerts(flattenAlerts(alertData))
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
    let result = documents
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.vehicle?.registrationNo?.toLowerCase().includes(q) ||
          d.type?.toLowerCase().includes(q)
      )
    }
    if (statusFilter) {
      result = result.filter((d) => d.status === statusFilter)
    }
    if (typeFilter) {
      result = result.filter((d) => d.type === typeFilter)
    }
    return result
  }, [documents, search, statusFilter, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, typeFilter])

  function openCreate() {
    setEditDoc(null)
    setFormOpen(true)
  }

  function openEdit(doc, e) {
    e.stopPropagation()
    setEditDoc(doc)
    setFormOpen(true)
  }

  function handleSaved() {
    fetchData()
  }

  async function handleRefreshAlerts() {
    try {
      const alertData = await refreshDocumentStatuses()
      setAlerts(flattenAlerts(alertData))
      success('Alerts refreshed', 'Document expiry alerts have been updated.')
    } catch (err) {
      toastError('Refresh failed', err?.response?.data?.message || err?.message || 'Could not refresh alerts')
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteDocument(deleteTarget.id)
      success('Document deleted', `${humanize(deleteTarget.type)} has been removed.`)
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      toastError('Delete failed', err?.response?.data?.message || err?.message || 'Could not delete document')
    } finally {
      setDeleting(false)
    }
  }

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">Manage vehicle documents and expiry tracking.</p>
        </div>
        <Card className="p-10">
          <EmptyState
            icon={CloudOff}
            title="Failed to load documents"
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">Manage vehicle documents and expiry tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={handleRefreshAlerts}>
            Refresh alerts
          </Button>
          <Button icon={Plus} onClick={openCreate}>
            Add document
          </Button>
        </div>
      </div>

      <Card>
        <div className="px-5 py-4">
          {alerts.length === 0 ? (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-success-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-success-700">All documents up to date</p>
                <p className="text-xs text-slate-500">No documents are expiring soon.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-warning-50 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {alerts.length} document{alerts.length !== 1 ? 's' : ''} expiring soon
                    </p>
                    <p className="text-xs text-slate-500">Review and renew before expiry.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {alerts.map((a, idx) => (
                  <div
                    key={`${a.vehicleId}-${a.documentType}-${a.expiryDate}-${idx}`}
                    className="flex items-center justify-between rounded-lg px-4 py-2.5 bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-800">{a.registrationNo}</span>
                      <span className="text-sm text-slate-500">{humanize(a.documentType)}</span>
                      <span className="text-xs text-slate-400">{formatDate(a.expiryDate)}</span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${daysLeftBadgeClass(a.daysLeft)}`}
                    >
                      {a.daysLeft} day{a.daysLeft !== 1 ? 's' : ''} left
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search registration, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            options={DOCUMENT_TYPES}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-44"
          />
          <Select
            options={DOCUMENT_STATUSES}
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
        ) : filtered.length === 0 && documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents"
            message="Add your first vehicle document to get started."
            action={
              <Button icon={Plus} onClick={openCreate}>
                Add document
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
                  <TH>Vehicle</TH>
                  <TH>Document Type</TH>
                  <TH>Expiry Date</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {paginated.map((doc) => {
                  const daysLeft = daysUntil(doc.expiryDate)
                  const showDaysLeft = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0
                  const expired = daysLeft !== null && daysLeft < 0
                  return (
                    <TR key={doc.id}>
                      <TD>
                        <span className="font-semibold text-slate-800">
                          {doc.vehicle?.registrationNo || '—'}
                        </span>
                        {(doc.vehicle?.make || doc.vehicle?.model) && (
                          <span className="block text-xs text-slate-500">
                            {doc.vehicle.make} {doc.vehicle.model}
                          </span>
                        )}
                      </TD>
                      <TD>
                        <span className="text-sm text-slate-700">{humanize(doc.type)}</span>
                      </TD>
                      <TD>
                        <span className="text-sm text-slate-600">{formatDate(doc.expiryDate)}</span>
                        {showDaysLeft && (
                          <span className="block text-xs text-warning-600 font-medium">
                            {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                          </span>
                        )}
                        {expired && (
                          <span className="block text-xs text-danger-600 font-medium">
                            Expired
                          </span>
                        )}
                      </TD>
                      <TD>
                        <StatusBadge status={doc.status} />
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Pencil}
                            aria-label={`Edit document ${doc.id}`}
                            onClick={(e) => openEdit(doc, e)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            aria-label={`Delete document ${doc.id}`}
                            className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget(doc)
                            }}
                          />
                        </div>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </Card>

      <DocumentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        document={editDoc}
        onCreated={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete document"
        danger
        confirmLabel="Delete"
        loading={deleting}
        message={
          deleteTarget
            ? `Are you sure you want to delete the ${humanize(deleteTarget.type)} document? This cannot be undone.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
