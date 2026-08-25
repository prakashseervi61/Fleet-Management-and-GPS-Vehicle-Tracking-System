import { useState, useEffect, useCallback, useRef } from 'react'
import { Users, CloudOff } from 'lucide-react'
import { getDriverScore, getUsers } from '../../api'
import { formatRelativeTime } from '../../utils/format'
import { FLEET_REFRESH_INTERVAL_MS } from '../../constants/businessRules'
import { Card } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import Button from '../../components/ui/Button'

function scoreBadgeColor(score) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function scoreLabel(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Poor'
}

function DriverCard({ score }) {
  const data = score
  if (!data) {
    return (
      <Card className="p-5">
        <div className="text-sm text-slate-400 italic">Score unavailable</div>
      </Card>
    )
  }
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">{data.driverName}</h3>
        <span className={`text-white rounded-full px-3 py-1 text-sm font-bold ${scoreBadgeColor(data.score)}`}>
          {data.score} — {scoreLabel(data.score)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-xl font-bold text-slate-800">{data.totalPings}</span>
          <span className="block text-xs text-slate-500">Total pings</span>
        </div>
        <div>
          <span className={`text-xl font-bold ${data.speedingCount > 0 ? 'text-danger-600' : 'text-slate-800'}`}>
            {data.speedingCount}
          </span>
          <span className="block text-xs text-slate-500">Speeding</span>
        </div>
        <div>
          <span className={`text-xl font-bold ${data.harshBrakeCount > 0 ? 'text-warning-600' : 'text-slate-800'}`}>
            {data.harshBrakeCount}
          </span>
          <span className="block text-xs text-slate-500">Harsh braking</span>
        </div>
        <div>
          <span className={`text-xl font-bold ${data.idleCount > 0 ? 'text-warning-600' : 'text-slate-800'}`}>
            {data.idleCount}
          </span>
          <span className="block text-xs text-slate-500">Idle</span>
        </div>
      </div>
      <div className="text-xs text-slate-400">Last evaluated: {formatRelativeTime(data.evaluatedAt)}</div>
    </Card>
  )
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState([])
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const mountedRef = useRef(true)

  const fetchScores = useCallback(async (driverList) => {
    const results = await Promise.allSettled(
      driverList.map((d) => getDriverScore(d.id))
    )
    if (!mountedRef.current) return
    setScores((prev) => {
      const next = { ...prev }
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          next[driverList[i].id] = r.value
        }
      })
      return next
    })
  }, [])

  const fetchDrivers = useCallback(async () => {
    try {
      const allUsers = await getUsers()
      const driverList = (allUsers || []).filter((u) => u.role === 'DRIVER')
      if (!mountedRef.current) return
      setDrivers(driverList)
      setError(false)
      setLoading(false)
      fetchScores(driverList)
    } catch {
      if (mountedRef.current) {
        setError(true)
        setLoading(false)
      }
    }
  }, [fetchScores])

  useEffect(() => {
    mountedRef.current = true
    fetchDrivers()
    return () => { mountedRef.current = false }
  }, [fetchDrivers])

  useEffect(() => {
    if (drivers.length === 0) return
    const id = setInterval(() => fetchScores(drivers), FLEET_REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [drivers, fetchScores])

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Drivers</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor driver performance and behaviour scores.</p>
        </div>
        <Card className="p-10">
          <EmptyState
            icon={CloudOff}
            title="Failed to load drivers"
            message="Check your connection and try again."
            action={<Button onClick={fetchDrivers}>Retry</Button>}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Drivers</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor driver performance and behaviour scores.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <Card className="p-10">
          <EmptyState
            icon={Users}
            title="No drivers registered"
            message="Add drivers to see their performance scores here."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {drivers.map((d) => (
            <DriverCard key={d.id} score={scores[d.id]} />
          ))}
        </div>
      )}
    </div>
  )
}
