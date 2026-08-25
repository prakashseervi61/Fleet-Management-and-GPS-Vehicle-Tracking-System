import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gauge, RefreshCw, Satellite } from 'lucide-react'
import { getFleetMap } from '../../api/fleetApi'
import { Card, CardHeader, CardBody, StatusBadge, Button, EmptyState, Skeleton } from '../../components/ui'
import FleetMap from '../../components/map/FleetMap'
import { formatRelativeTime } from '../../utils/format'
import { BUSINESS_RULES, FLEET_REFRESH_INTERVAL_MS } from '../../constants/businessRules'

export default function FleetMapPage() {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load(silent = false) {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await getFleetMap()
      setPoints(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(() => load(true), FLEET_REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const selected = points.find((p) => p.vehicleId === selectedId) || null
  const staleCount = points.filter(
    (p) => Date.now() - new Date(p.recordedAt).getTime() > BUSINESS_RULES.GPS_STALE_MS
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Live Fleet Map</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time vehicle positions across your operations.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} loading={refreshing} onClick={() => load(true)}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-[480px] w-full rounded-xl" />
      ) : error ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={Satellite}
              title="Can't reach the server"
              message={error}
              action={
                <Button size="sm" onClick={() => load()}>
                  Retry
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3">
            <FleetMap
              points={points}
              height="480px"
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Selected vehicle" subtitle="Click a pin to inspect" />
              <CardBody>
                {selected ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-bold text-slate-800">{selected.registrationNo}</p>
                      <StatusBadge status={selected.status} />
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Speed</dt>
                        <dd className="font-medium text-slate-800 inline-flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5 text-slate-400" />
                          {Math.round(Number(selected.speedKmh ?? 0))} km/h
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Position</dt>
                        <dd className="font-mono text-xs text-slate-600">
                          {Number(selected.latitude).toFixed(4)}, {Number(selected.longitude).toFixed(4)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Last ping</dt>
                        <dd className="text-slate-600">{formatRelativeTime(selected.recordedAt)}</dd>
                      </div>
                    </dl>
                    <Link
                      to={`/gps/${selected.vehicleId}/history`}
                      className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      View route history →
                    </Link>
                  </div>
                ) : (
                  <EmptyState
                    icon={Satellite}
                    title="No vehicle selected"
                    message="Select a marker on the map to see live details."
                  />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Vehicles tracked</span>
                  <span className="font-semibold text-slate-800">{points.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Stale signals</span>
                  <span className={`font-semibold ${staleCount > 0 ? 'text-warning-600' : 'text-slate-800'}`}>
                    {staleCount}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                  {['ACTIVE', 'MAINTENANCE', 'BREAKDOWN', 'RETIRED'].map((s) => (
                    <div key={s} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-500">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            s === 'ACTIVE' ? 'bg-success-500' : s === 'MAINTENANCE' ? 'bg-warning-500' : s === 'BREAKDOWN' ? 'bg-danger-500' : 'bg-slate-400'
                          }`}
                        />
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </span>
                      <span className="font-medium text-slate-700">
                        {points.filter((p) => p.status === s).length}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
