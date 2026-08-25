import { useState, useEffect, useCallback } from 'react'
import {
  getVehicles,
  getActiveTrips,
  getMaintenanceRecords,
  getGeofenceAlerts,
  getFuelLogs,
} from '../../api'
import { useAuthContext } from '../../context/AuthContext'
import { FLEET_REFRESH_INTERVAL_MS } from '../../constants/businessRules'
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatCurrency,
  formatKm,
} from '../../utils/format'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import StatusBadge from '../../components/ui/StatusBadge'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import StatCard from '../../components/charts/StatCard'
import {
  Truck,
  Route,
  Wrench,
  MapPin,
  ShieldAlert,
  BellOff,
  CheckCircle2,
  CloudOff,
  Fuel,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const PIE_COLORS = ['#2563eb', '#f59e0b', '#ef4444', '#94a3b8']

function OpsDashboard() {
  const [vehicles, setVehicles] = useState([])
  const [activeTrips, setActiveTrips] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [alerts, setAlerts] = useState([])
  const [fuelLogs, setFuelLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [allFailed, setAllFailed] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [vRes, tRes, mRes, aRes, fRes] = await Promise.allSettled([
      getVehicles(),
      getActiveTrips(),
      getMaintenanceRecords(),
      getGeofenceAlerts(),
      getFuelLogs(),
    ])

    const failed = [vRes, tRes, mRes, aRes, fRes].every(
      (r) => r.status === 'rejected'
    )
    setAllFailed(failed)

    if (vRes.status === 'fulfilled') setVehicles(vRes.value || [])
    if (tRes.status === 'fulfilled') setActiveTrips(tRes.value || [])
    if (mRes.status === 'fulfilled') setMaintenance(mRes.value || [])
    if (aRes.status === 'fulfilled') setAlerts(aRes.value || [])
    if (fRes.status === 'fulfilled') setFuelLogs(fRes.value || [])

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, FLEET_REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  const activeCount = vehicles.filter((v) => v.status === 'ACTIVE').length
  const openMaintenance = maintenance.filter(
    (m) => m.status !== 'COMPLETED'
  ).length

  const statusCounts = vehicles.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1
    return acc
  }, {})
  const pieData = [
    { name: 'Active', value: statusCounts.ACTIVE || 0 },
    { name: 'Maintenance', value: statusCounts.MAINTENANCE || 0 },
    { name: 'Breakdown', value: statusCounts.BREAKDOWN || 0 },
    { name: 'Retired', value: statusCounts.RETIRED || 0 },
  ]

  const fuelTrend = [...fuelLogs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-15)

  const attentionItems = []
  const seenVehicleIds = new Set()
  vehicles.forEach((v) => {
    if (v.status === 'BREAKDOWN' || v.status === 'MAINTENANCE') {
      attentionItems.push({
        id: `v-${v.id}`,
        registrationNo: v.registrationNo,
        status: v.status,
        detail: formatKm(v.currentOdometer),
      })
      seenVehicleIds.add(v.id)
    }
  })
  maintenance.forEach((m) => {
    if (
      m.status !== 'COMPLETED' &&
      m.vehicle &&
      !seenVehicleIds.has(m.vehicle.id)
    ) {
      attentionItems.push({
        id: `m-${m.id}`,
        registrationNo: m.vehicle.registrationNo,
        status: m.status,
        detail: formatDate(m.scheduledDate),
      })
    }
  })

  if (allFailed && !loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-sm w-full text-center p-8">
          <CloudOff className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            Can't reach the server
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Check your connection and try again.
          </p>
          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Retry
          </button>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Vehicles"
          value={vehicles.length}
          icon={Truck}
          tone="brand"
          hint={`${activeCount} active now`}
          loading={loading}
        />
        <StatCard
          label="Active Trips"
          value={activeTrips.length}
          icon={Route}
          tone="success"
          hint="in progress"
          loading={loading}
        />
        <StatCard
          label="Maintenance Open"
          value={openMaintenance}
          icon={Wrench}
          tone="warning"
          hint="scheduled / in progress"
          loading={loading}
        />
        <StatCard
          label="Geofence Alerts"
          value={alerts.length}
          icon={MapPin}
          tone="danger"
          hint="recent breaches"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-800">
              Fleet status
            </h3>
          </CardHeader>
          <CardBody>
            <div className="relative">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="80%"
                    stroke="none"
                    paddingAngle={3}
                    cornerRadius={6}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-800">
                  {vehicles.length}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-800">
              Fuel spend trend
            </h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={fuelTrend}>
                <defs>
                  <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="#3b82f6"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="#3b82f6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#2563eb"
                  fill="url(#fuelGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-800">
              Recent geofence alerts
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="divide-y divide-slate-100">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="px-5 py-3">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={BellOff}
                  title="No geofence breaches"
                  message="All vehicles are within their designated zones."
                />
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="h-9 w-9 rounded-lg bg-danger-50 flex items-center justify-center shrink-0">
                      <ShieldAlert className="h-5 w-5 text-danger-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-800">
                        {alert.vehicle?.registrationNo}
                      </p>
                      <p className="text-xs text-slate-500">
                        {alert.geofence?.name}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatRelativeTime(alert.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-800">
              Vehicles needing attention
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="divide-y divide-slate-100">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-5 py-3">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : attentionItems.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={CheckCircle2}
                  title="All vehicles healthy"
                  message="No vehicles are in breakdown or maintenance status."
                />
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {attentionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                      <Truck className="h-5 w-5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-800">
                        {item.registrationNo}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-slate-400">
                          {item.detail}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}

function DriverDashboard() {
  const { user } = useAuthContext()
  const [activeTrips, setActiveTrips] = useState([])
  const [fuelLogs, setFuelLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [allFailed, setAllFailed] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [tRes, fRes] = await Promise.allSettled([
      getActiveTrips(),
      getFuelLogs(),
    ])

    setAllFailed(tRes.status === 'rejected' && fRes.status === 'rejected')

    if (tRes.status === 'fulfilled') setActiveTrips(tRes.value || [])
    if (fRes.status === 'fulfilled') setFuelLogs(fRes.value || [])

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, FLEET_REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  const activeTrip = activeTrips.find((t) => t.driverId === user.id)
  const myFuelLogs = fuelLogs.filter(
    (f) => f.driverId === user.id
  )

  if (allFailed && !loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-sm w-full text-center p-8">
          <CloudOff className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            Can't reach the server
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Check your connection and try again.
          </p>
          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Retry
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 text-white rounded-xl shadow-card p-6">
        <p className="text-xs uppercase tracking-wider text-slate-400">
          Your shift
        </p>
        <p className="text-xl font-bold mt-2">
          {activeTrip
            ? `${activeTrip.origin} → ${activeTrip.destination}`
            : 'No active trip'}
        </p>
        {activeTrip && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="bg-white/10 rounded-md px-2 py-0.5 text-xs">
              {activeTrip.registrationNo}
            </span>
            <span className="text-sm text-slate-300">
              {formatDateTime(activeTrip.plannedStart)}
            </span>
            <span className="text-sm text-slate-300">
              {formatKm(activeTrip.distanceKm)}
            </span>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-4">
          Start/complete actions live in Trips.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Assigned Vehicle"
          value={activeTrip?.registrationNo || '—'}
          icon={Truck}
          tone="brand"
          loading={loading}
        />
        <StatCard
          label="Trip Distance"
          value={formatKm(activeTrip?.distanceKm || 0)}
          icon={Route}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="My Fuel Logs"
          value={myFuelLogs.length}
          icon={Fuel}
          tone="warning"
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-800">
            My recent fuel entries
          </h3>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-3">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : myFuelLogs.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Fuel}
                title="No fuel entries"
                message="Your fuel logs will appear here."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myFuelLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <span className="text-sm text-slate-800">
                    {formatDate(log.date)}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600">
                      {log.quantityLitres} L
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {formatCurrency(log.cost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  const { user, hasRole } = useAuthContext()

  const hour = new Date().getHours()
  const daypart = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Good {daypart}, {user.name.split(' ')[0]} — here's your fleet at a
          glance.
        </p>
      </div>
      {hasRole('DRIVER') ? <DriverDashboard /> : <OpsDashboard />}
    </div>
  )
}
