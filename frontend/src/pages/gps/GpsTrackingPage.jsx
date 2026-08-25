import { useState, useEffect, useCallback } from 'react'
import {
  Gauge,
  AlertTriangle,
  Moon,
  ShieldAlert,
  RadioOff,
  Send,
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../components/ui'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import EmptyState from '../../components/ui/EmptyState'
import FleetMap from '../../components/map/FleetMap'
import { getFleetMap } from '../../api/fleetApi'
import { pingLocation } from '../../api/gpsApi'
import { getVehicles } from '../../api/vehicleApi'
import { useNotifications } from '../../context/NotificationContext'
import { BUSINESS_RULES, FLEET_REFRESH_INTERVAL_MS } from '../../constants/businessRules'
import { formatRelativeTime } from '../../utils/format'

const EVENT_ICON = {
  NORMAL: Gauge,
  SPEEDING: AlertTriangle,
  IDLE: Moon,
  GEO_EXIT: ShieldAlert,
  HARSH_BRAKE: ShieldAlert,
}

const EVENT_COLOR = {
  NORMAL: 'text-brand-600',
  SPEEDING: 'text-danger-600',
  IDLE: 'text-slate-500',
  GEO_EXIT: 'text-warning-600',
  HARSH_BRAKE: 'text-danger-600',
}

export default function GpsTrackingPage() {
  const { success: toastSuccess, error: toastError } = useNotifications()

  const [fleet, setFleet] = useState([])
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [simVehicleId, setSimVehicleId] = useState('')
  const [simLat, setSimLat] = useState(() => (20 + Math.random() * 15).toFixed(4))
  const [simLng, setSimLng] = useState(() => (75 + Math.random() * 15).toFixed(4))
  const [simSpeed, setSimSpeed] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchFleet = useCallback(async () => {
    try {
      const data = await getFleetMap()
      setFleet(Array.isArray(data) ? data : [])
    } catch {
      setFleet([])
    }
  }, [])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchFleet(), getVehicles().then((v) => { if (active) setVehicles(Array.isArray(v) ? v : []) }).catch(() => {})])
      if (active) setLoading(false)
    }
    load()
    const id = setInterval(fetchFleet, FLEET_REFRESH_INTERVAL_MS)
    return () => { active = false; clearInterval(id) }
  }, [fetchFleet])

  const totalTracked = fleet.length
  const movingCount = fleet.filter((p) => (p.speedKmh ?? 0) > 5).length
  const speedingCount = fleet.filter((p) => (p.speedKmh ?? 0) > BUSINESS_RULES.SPEED_LIMIT_KMH).length
  const staleCount = fleet.filter((p) => {
    if (!p.recordedAt) return false
    return (Date.now() - new Date(p.recordedAt).getTime()) > BUSINESS_RULES.GPS_STALE_MS
  }).length

  const sorted = [...fleet].sort((a, b) => new Date(b.recordedAt || 0) - new Date(a.recordedAt || 0))

  const handleSendPing = async (e) => {
    e.preventDefault()
    if (!simVehicleId) return
    setSending(true)
    try {
      await pingLocation({
        vehicleId: Number(simVehicleId),
        latitude: Number(simLat),
        longitude: Number(simLng),
        speedKmh: Number(simSpeed) || 0,
      })
      toastSuccess('Ping ingested')
      await fetchFleet()
    } catch {
      toastError('Ping failed', 'Could not send GPS ping to the server.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GPS Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">Live telemetry feed across the fleet.</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
          <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse-dot" />
          Auto-refreshing every 30s
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/20">
          Total tracked: {totalTracked}
        </span>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-success-50 text-success-700 ring-1 ring-inset ring-success-600/20">
          Moving: {movingCount}
        </span>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-600/20">
          Speeding: {speedingCount}
        </span>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-600/20">
          Stale: {staleCount}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader title="Live positions" subtitle="Select a vehicle to focus" />
          <CardBody className="p-0">
            <FleetMap
              points={fleet}
              height="420px"
              selectedId={selectedVehicleId}
              onSelect={setSelectedVehicleId}
            />
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Event stream" subtitle="Latest positions by recency" />
            <CardBody className="p-0">
              {sorted.length === 0 ? (
                <EmptyState icon={RadioOff} title="No events" message="Waiting for fleet data." />
              ) : (
                <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                  {sorted.map((ping) => {
                    const Icon = EVENT_ICON[ping.eventType] || Gauge
                    const color = EVENT_COLOR[ping.eventType] || 'text-slate-500'
                    return (
                      <div
                        key={ping.id || ping.vehicleId}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 cursor-pointer"
                        onClick={() => setSelectedVehicleId(ping.vehicleId)}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {ping.registrationNo}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {Math.round(ping.speedKmh ?? 0)} km/h
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={ping.eventType} />
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">
                            {formatRelativeTime(ping.recordedAt)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Simulate GPS ping" subtitle="Developer tools" />
            <CardBody>
              <form onSubmit={handleSendPing} className="space-y-3">
                <Select
                  label="Vehicle"
                  value={simVehicleId}
                  onChange={(e) => setSimVehicleId(e.target.value)}
                  options={[
                    { value: '', label: 'Select vehicle' },
                    ...vehicles.map((v) => ({ value: v.id, label: v.registrationNo })),
                  ]}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Latitude"
                    type="number"
                    step="0.0001"
                    value={simLat}
                    onChange={(e) => setSimLat(e.target.value)}
                  />
                  <Input
                    label="Longitude"
                    type="number"
                    step="0.0001"
                    value={simLng}
                    onChange={(e) => setSimLng(e.target.value)}
                  />
                </div>
                <Input
                  label="Speed (km/h)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={simSpeed}
                  onChange={(e) => setSimSpeed(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={sending}
                  disabled={!simVehicleId}
                  icon={Send}
                  className="w-full"
                >
                  Send ping
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
