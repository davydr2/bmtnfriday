import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Admin() {
  const [cycles, setCycles] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [activeCycle, setActiveCycle] = useState(null)
  const [newCycle, setNewCycle] = useState({ name: '', starts_at: '', ends_at: '', eligible_count: '' })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('cycles')

  async function load() {
    try {
      const [cs, status] = await Promise.all([
        api.get('/cycles'),
        api.get('/portal/status'),
      ])
      setCycles(cs)
      if (status.active) {
        setActiveCycle(status.cycle)
        const subs = await api.get(`/cycles/${status.cycle.id}/submissions`)
        setSubmissions(subs)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createCycle(e) {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      await api.post('/cycles', { ...newCycle, eligible_count: parseInt(newCycle.eligible_count) })
      setNewCycle({ name: '', starts_at: '', ends_at: '', eligible_count: '' })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="text-center text-gray-400 py-20">Loading…</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="flex gap-2 mb-6">
        {['cycles', 'submissions', 'new-cycle'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer ${tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t === 'new-cycle' ? 'New Cycle' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'cycles' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Starts</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ends</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Eligible</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-indigo-700">Win #</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map(c => (
                <tr key={c.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(c.starts_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(c.ends_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{c.eligible_count}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      c.status === 'active' ? 'bg-green-100 text-green-700' :
                      c.status === 'closed' ? 'bg-gray-100 text-gray-500' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">
                    {c.secret_winning_position ?? '—'}
                  </td>
                </tr>
              ))}
              {!cycles.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No cycles yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'submissions' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {!activeCycle ? (
            <div className="px-4 py-8 text-center text-gray-400">No active cycle</div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-200 text-sm text-gray-600 font-medium">
                {activeCycle.name} — {submissions.length} submissions
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Position</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Employee</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(s => (
                    <tr key={s.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">#{s.submission_position}</td>
                      <td className="px-4 py-3 text-gray-700">{s.employee_id}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(s.submitted_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {!submissions.length && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No submissions yet</td></tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {tab === 'new-cycle' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
          <h2 className="font-bold text-gray-900 mb-4">Create New Cycle</h2>
          {error && <div className="text-red-600 text-sm mb-4 bg-red-50 rounded p-3">{error}</div>}
          <form onSubmit={createCycle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newCycle.name}
                onChange={e => setNewCycle(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Q4 Cycle 1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newCycle.starts_at}
                  onChange={e => setNewCycle(p => ({ ...p, starts_at: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newCycle.ends_at}
                  onChange={e => setNewCycle(p => ({ ...p, ends_at: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eligible Employee Count</label>
              <input
                type="number"
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newCycle.eligible_count}
                onChange={e => setNewCycle(p => ({ ...p, eligible_count: e.target.value }))}
                placeholder="e.g. 40"
                required
              />
            </div>
            <p className="text-xs text-gray-400">A secret winning position (1–N) will be randomly generated when you create this cycle. It cannot be changed afterward.</p>
            <button
              type="submit"
              disabled={creating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-2 rounded-lg cursor-pointer"
            >
              {creating ? 'Creating…' : 'Create Cycle'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
