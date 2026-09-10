import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

// 9:00 AM – 9:30 PM Eastern time on Fridays
function isFridayWindow() {
  const eastern = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = eastern.getDay()
  const mins = eastern.getHours() * 60 + eastern.getMinutes()
  return day === 5 && mins >= 9 * 60 && mins < 21 * 60 + 30
}

function Countdown({ deadlineUtc }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    function tick() {
      const diff = new Date(deadlineUtc) - new Date()
      if (diff <= 0) { setLabel('Deadline passed'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setLabel(`${h}h ${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadlineUtc])
  return <span>{label}</span>
}

function NagBanner({ cycleId, onClaimed }) {
  const [nag, setNag] = useState(null)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(null)

  useEffect(() => {
    if (!cycleId) return
    const load = () => api.get(`/cycles/${cycleId}/nag`).then(setNag).catch(() => {})
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [cycleId])

  async function claim() {
    setClaiming(true)
    try {
      const res = await api.post(`/cycles/${cycleId}/nag/claim`)
      setClaimed(res)
      onClaimed?.()
    } catch (e) { alert(e.message) }
    finally { setClaiming(false) }
  }

  if (claimed) {
    return (
      <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-4">
        <p className="font-bold text-yellow-800 mb-1">You claimed the Nag!</p>
        <p className="text-gray-700 mb-2 text-sm">Post this exact message in Slack:</p>
        <p className="font-mono bg-white border border-yellow-200 rounded px-3 py-2 text-sm">
          {claimed.message} <span className="text-indigo-600 font-bold">[{claimed.verification_code}]</span>
        </p>
        <p className="text-xs text-yellow-700 mt-2">+5 tokens after verification</p>
      </div>
    )
  }
  if (!nag?.available) return null
  return (
    <div className="bg-amber-400 rounded-xl p-4 mb-4 flex items-center justify-between">
      <div>
        <p className="font-bold text-amber-900 text-lg">NAG IS LIVE</p>
        <p className="text-amber-800 text-sm">First to claim gets the message + 5 tokens</p>
      </div>
      <button onClick={claim} disabled={claiming}
        className="bg-amber-900 hover:bg-amber-950 text-white font-bold px-5 py-2 rounded-lg cursor-pointer disabled:opacity-60">
        {claiming ? 'Claiming…' : 'Claim It'}
      </button>
    </div>
  )
}

function PtoBonus({ cycleId }) {
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState('')

  async function claim() {
    setClaiming(true); setError('')
    try { await api.post(`/cycles/${cycleId}/pto`); setClaimed(true) }
    catch (e) { setError(e.message) }
    finally { setClaiming(false) }
  }

  if (claimed) return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-700 font-medium">
      +2 PTO tokens added for this week.
    </div>
  )
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-800">Taking 3+ days off this week?</p>
        <p className="text-xs text-gray-400">+2 tokens · once per week</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <button onClick={claim} disabled={claiming}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-60 shrink-0 ml-4">
        {claiming ? 'Claiming…' : 'Claim PTO Bonus'}
      </button>
    </div>
  )
}

// ── Friday mode ───────────────────────────────────────────────────────────────
function FridayPortal({ status, onRefresh }) {
  const navigate = useNavigate()
  const { cycle, eligible, submitted, participation_percent, current_weekly_pool, total_pool, deadline_utc, previous_cycle } = status
  const barWidth = Math.min(Math.round(participation_percent), 100)
  const remaining = eligible - submitted

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-block bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-widest uppercase">
          Friday Challenge is Live
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">{cycle.name}</h1>
      </div>

      <NagBanner cycleId={cycle.id} onClaimed={onRefresh} />
      <PtoBonus cycleId={cycle.id} />

      {/* Live submission counter */}
      <div className="bg-indigo-600 rounded-2xl p-6 text-white text-center mb-4">
        <p className="text-indigo-200 text-sm font-medium mb-1">Reports submitted</p>
        <p className="text-7xl font-black tracking-tight">{submitted}<span className="text-3xl text-indigo-300">/{eligible}</span></p>
        <div className="mt-3 bg-indigo-500 rounded-full h-3">
          <div className="h-3 bg-white rounded-full transition-all" style={{ width: `${barWidth}%` }} />
        </div>
        <p className="text-indigo-200 text-sm mt-2">
          {participation_percent}% participation
          {remaining > 0 ? ` · ${remaining} still out` : ' · Everyone in!'}
        </p>
      </div>

      {/* Prize + countdown */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">This week's pool</p>
          <p className="text-2xl font-bold text-gray-900">${current_weekly_pool.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">of ${total_pool.toFixed(2)} total</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Deadline</p>
          <p className="text-xl font-mono font-bold text-indigo-700"><Countdown deadlineUtc={deadline_utc} /></p>
          <p className="text-xs text-gray-400 mt-1">9 PM ET · 7 PM = $35 base</p>
        </div>
      </div>

      <div className="text-center mb-6">
        <button onClick={() => navigate('/submit')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl text-lg cursor-pointer">
          Submit My Report
        </button>
      </div>

      {/* Previous cycle recap */}
      {previous_cycle && <PreviousCycle data={previous_cycle} />}
    </div>
  )
}

// ── Normal (boring) mode ──────────────────────────────────────────────────────
function NormalPortal({ status, onRefresh }) {
  const navigate = useNavigate()
  const { cycle, eligible, submitted, participation_percent, current_weekly_pool, total_pool, deadline_utc, previous_cycle } = status
  const barWidth = Math.min(Math.round(participation_percent), 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{cycle.name}</h1>
          <p className="text-gray-500 text-sm">Weekly Report Challenge</p>
        </div>
        <button onClick={() => navigate('/submit')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg cursor-pointer">
          Submit Report
        </button>
      </div>

      <NagBanner cycleId={cycle.id} onClaimed={onRefresh} />
      <PtoBonus cycleId={cycle.id} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Submitted" value={`${submitted} / ${eligible}`} />
        <StatCard label="Participation" value={`${participation_percent}%`} highlight={participation_percent >= 50} />
        <StatCard label="This Week's Pool" value={`$${current_weekly_pool.toFixed(2)}`} />
        <StatCard label="Cycle Prize" value={`$${total_pool.toFixed(2)}`} highlight />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Participation</span><span>{participation_percent}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all ${participation_percent >= 50 ? 'bg-indigo-500' : 'bg-gray-300'}`}
            style={{ width: `${barWidth}%` }} />
        </div>
        {participation_percent < 50 && (
          <p className="text-xs text-gray-400 mt-2">Need 50% for the pool to count</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 text-center mb-6">
        <p className="text-sm text-gray-500 mb-1">Time until deadline</p>
        <p className="text-3xl font-mono font-bold text-indigo-700"><Countdown deadlineUtc={deadline_utc} /></p>
        <p className="text-xs text-gray-400 mt-1">100% by 8 PM = $30 base · by 7 PM = $35 base</p>
      </div>

      {previous_cycle && <PreviousCycle data={previous_cycle} />}
    </div>
  )
}

// ── Previous cycle recap (shared) ─────────────────────────────────────────────
function PreviousCycle({ data }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Last Cycle — {data.name}</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Participation</p>
          <p className="text-xl font-bold text-gray-800">{data.participation_percent}%</p>
          <p className="text-xs text-gray-400">{data.submitted} / {data.eligible}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Prize Pool</p>
          <p className="text-xl font-bold text-gray-800">${data.total_pool.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Winner</p>
          <p className="text-sm font-bold text-indigo-700">{data.winner_name || '—'}</p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${highlight ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-indigo-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Portal() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [friday, setFriday] = useState(isFridayWindow())

  async function load() {
    try { setStatus(await api.get('/portal/status')) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    // Refresh data every 60s
    const dataId = setInterval(load, 60000)
    // Re-check Friday window every minute
    const modeId = setInterval(() => setFriday(isFridayWindow()), 60000)
    return () => { clearInterval(dataId); clearInterval(modeId) }
  }, [])

  if (loading) return <div className="text-center text-gray-400 py-20">Loading…</div>

  if (!status?.active) {
    return (
      <div>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No Active Cycle</h2>
          <p className="text-gray-500">Check back when the next cycle kicks off.</p>
        </div>
        {status?.previous_cycle && <PreviousCycle data={status.previous_cycle} />}
      </div>
    )
  }

  return friday
    ? <FridayPortal status={status} onRefresh={load} />
    : <NormalPortal status={status} onRefresh={load} />
}
