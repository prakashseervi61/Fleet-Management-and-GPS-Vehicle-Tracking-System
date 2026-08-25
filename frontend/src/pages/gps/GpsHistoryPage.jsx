import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPinOff } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet'
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardHeader, CardBody } from '../../components/ui'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { getHistory } from '../../api/gpsApi'
import { getVehicles } from '../../api/vehicleApi'
import { BUSINESS_RULES } from '../../constants/businessRules'
import { formatDateTime } from '../../utils/format'

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] })
    }
  }, [map, points])
  return null
}

export default function GpsHistoryPage() {
  const { vehicleId } = useParams()
  const [pings, setPings] = useState([])
  const [registrationNo, setRegistrationNo] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('ALL')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const [historyData, vehiclesData] = await Promise.all([
          getHistory(vehicleId),
          getVehicles().catch(() => []),
        ])
        if (!active) return
        const pingsArr = Array.isArray(historyData) ? historyData : []
        setPings(pingsArr)
        const vehiclesArr = Array.isArray(vehiclesData) ? vehiclesData : []
        const vehicle = vehiclesArr.find((v) => String(v.id) === String(vehicleId))
        setRegistrationNo(vehicle?.registrationNo || `Vehicle #${vehicleId}`)
      } catch {
        if (active) {
          setPings([])
          setRegistrationNo(`Vehicle #${vehicleId}`)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [vehicleId])

  const sorted = useMemo(
    () => [...pings].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)),
    [pings]
  )

  const points = useMemo(
    () => sorted.map((p) => [p.latitude, p.longitude]),
    [sorted]
  )

  const chartData = useMemo(
    () => sorted.map((p, i) => ({ index: i, speedKmh: p.speedKmh ?? 0 })),
    [sorted]
  )

  const eventTypes = useMemo(() => {
    const types = [...new Set(pings.map((p) => p.eventType).filter(Boolean))]
    types.sort()
    return types
  }, [pings])

  const filteredPings = useMemo(() => {
    if (activeFilter === 'ALL') return sorted
    return sorted.filter((p) => p.eventType === activeFilter)
  }, [sorted, activeFilter])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="xl:col-span-2 h-[420px] rounded-xl" />
          <Skeleton className="h-[560px] rounded-xl" />
        </div>
      </div>
    )
  }

  if (pings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            to="/gps"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to GPS Tracking
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Route history</h1>
        </div>
        <EmptyState
          icon={MapPinOff}
          title="No GPS history for this vehicle yet"
          message="GPS pings will appear here once the device starts reporting."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/gps"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to GPS Tracking
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Route history</h1>
            <p className="text-sm text-slate-500 mt-1">
              {registrationNo} &middot; {pings.length} pings recorded
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Route" subtitle={`${points.length} points`} />
            <CardBody className="p-0">
              <div className="h-[420px]">
                <MapContainer
                  center={points[0] || [20.5, 78.9]}
                  zoom={12}
                  className="h-full w-full rounded-b-xl"
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FitBounds points={points} />
                  <Polyline
                    positions={points}
                    pathOptions={{ color: '#2563eb', weight: 3, opacity: 0.8 }}
                  />
                  {points.length > 0 && (
                    <>
                      <CircleMarker
                        center={points[0]}
                        radius={7}
                        pathOptions={{ color: '#16a34a', fillColor: '#16a34a', fillOpacity: 1, weight: 2 }}
                      />
                      {points.length > 1 && (
                        <CircleMarker
                          center={points[points.length - 1]}
                          radius={7}
                          pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 1, weight: 2 }}
                        />
                      )}
                      {points.slice(1, -1).map((pt, i) => (
                        <CircleMarker
                          key={i}
                          center={pt}
                          radius={3}
                          pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.5, weight: 0 }}
                        />
                      ))}
                    </>
                  )}
                </MapContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Speed profile" subtitle="km/h over route points" />
            <CardBody>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="index"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(val) => [`${val} km/h`, 'Speed']}
                    labelFormatter={(label) => `Point #${label}`}
                  />
                  <ReferenceLine
                    y={BUSINESS_RULES.SPEED_LIMIT_KMH}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Limit',
                      position: 'right',
                      fill: '#dc2626',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="speedKmh"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#speedGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Ping log" subtitle={`${filteredPings.length} entries`} />
          <CardBody className="p-0">
            <div className="px-5 pt-4 pb-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition-colors ${
                  activeFilter === 'ALL'
                    ? 'bg-brand-50 text-brand-700 ring-brand-600/20'
                    : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              {eventTypes.map((et) => (
                <button
                  key={et}
                  onClick={() => setActiveFilter(et)}
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition-colors ${
                    activeFilter === et
                      ? 'bg-brand-50 text-brand-700 ring-brand-600/20'
                      : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {et.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <div className="max-h-[560px] overflow-y-auto divide-y divide-slate-100">
              {filteredPings.length === 0 ? (
                <EmptyState title="No matching pings" message="Try a different filter." />
              ) : (
                filteredPings.map((ping) => (
                  <div key={ping.id} className="px-5 py-3">
                    <p className="text-xs text-slate-500">{formatDateTime(ping.recordedAt)}</p>
                    <p className="font-mono text-xs text-slate-600 mt-0.5">
                      {ping.latitude.toFixed(4)}, {ping.longitude.toFixed(4)}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span
                        className={`text-sm font-semibold ${
                          (ping.speedKmh ?? 0) > BUSINESS_RULES.SPEED_LIMIT_KMH
                            ? 'text-danger-600'
                            : 'text-slate-800'
                        }`}
                      >
                        {Math.round(ping.speedKmh ?? 0)} km/h
                      </span>
                      <StatusBadge status={ping.eventType} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
