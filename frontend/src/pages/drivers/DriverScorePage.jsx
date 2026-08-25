import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Award, Gauge, AlertTriangle, Clock, Activity, ShieldAlert, CheckCircle } from 'lucide-react'
import { getDriverScore, getUsers } from '../../api'
import { formatRelativeTime } from '../../utils/format'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

function scoreTone(score) {
  if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', fill: 'bg-emerald-50', label: 'Excellent' }
  if (score >= 60) return { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200', fill: 'bg-blue-50', label: 'Good' }
  if (score >= 40) return { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', fill: 'bg-amber-50', label: 'Fair' }
  return { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-200', fill: 'bg-red-50', label: 'Needs Improvement' }
}

export default function DriverScorePage() {
  const { driverId } = useParams()
  const [scoreData, setScoreData] = useState(null)
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [score, users] = await Promise.all([
          getDriverScore(driverId),
          getUsers().catch(() => []),
        ])
        setScoreData(score)
        const d = (users || []).find((u) => String(u.id) === String(driverId))
        setDriver(d)
      } catch (err) {
        setError(err.message || 'Failed to load driver score')
      } finally {
        setLoading(false)
      }
    }
    if (driverId) load()
  }, [driverId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !scoreData) {
    return (
      <div className="space-y-6">
        <Link to="/drivers">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Back to Drivers
          </Button>
        </Link>
        <Card className="p-8">
          <EmptyState
            icon={ShieldAlert}
            title="Score unavailable"
            message={error || 'No score data found for this driver.'}
          />
        </Card>
      </div>
    )
  }

  const tone = scoreTone(scoreData.score)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/drivers">
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              {scoreData.driverName || driver?.name || 'Driver Performance'}
            </h1>
            <p className="text-sm text-slate-500">
              Behaviour evaluation and safety telemetry
            </p>
          </div>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <Card className={`p-6 border ${tone.border} ${tone.fill}`}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${tone.bg} text-white shadow-lg shadow-black/10 font-black text-3xl`}>
              {scoreData.score}
            </div>
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${tone.bg} text-white`}>
                <Award className="h-3.5 w-3.5" />
                {tone.label}
              </span>
              <h2 className="text-xl font-bold text-slate-800 mt-2">
                Safety & Driving Score
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated: {formatRelativeTime(scoreData.evaluatedAt)}
              </p>
            </div>
          </div>
          {driver && (
            <div className="text-sm text-slate-600 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200/60 space-y-1">
              <p><span className="text-slate-400 font-medium">Licence:</span> {driver.drivingLicenceNo || '—'}</p>
              <p><span className="text-slate-400 font-medium">Phone:</span> {driver.phoneNumber || '—'}</p>
              <p><span className="text-slate-400 font-medium">Email:</span> {driver.email || '—'}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Metrics Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Telemetry Pings</span>
            <Activity className="h-4 w-4 text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{scoreData.totalPings}</p>
          <p className="text-xs text-slate-400 mt-1">Total points tracked</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Speeding</span>
            <Gauge className={`h-4 w-4 ${scoreData.speedingCount > 0 ? 'text-danger-500' : 'text-slate-400'}`} />
          </div>
          <p className={`text-2xl font-bold mt-2 ${scoreData.speedingCount > 0 ? 'text-danger-600' : 'text-slate-800'}`}>
            {scoreData.speedingCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">Speed threshold alerts</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Harsh Braking</span>
            <AlertTriangle className={`h-4 w-4 ${scoreData.harshBrakeCount > 0 ? 'text-warning-500' : 'text-slate-400'}`} />
          </div>
          <p className={`text-2xl font-bold mt-2 ${scoreData.harshBrakeCount > 0 ? 'text-warning-600' : 'text-slate-800'}`}>
            {scoreData.harshBrakeCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">Deceleration events</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Idling</span>
            <Clock className={`h-4 w-4 ${scoreData.idleCount > 0 ? 'text-warning-500' : 'text-slate-400'}`} />
          </div>
          <p className={`text-2xl font-bold mt-2 ${scoreData.idleCount > 0 ? 'text-warning-600' : 'text-slate-800'}`}>
            {scoreData.idleCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">Excessive idle intervals</p>
        </Card>
      </div>
    </div>
  )
}
