import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'

export default function Submit() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // We need the active cycle id — load it from portal status
  const [cycleId, setCycleId] = useState(null)
  useState(() => {
    api.get('/portal/status').then(s => {
      if (s?.active) setCycleId(s.cycle.id)
    }).catch(() => {})
  })

  async function submit() {
    if (!cycleId) { setError('No active cycle found.'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await api.post(`/cycles/${cycleId}/submit`)
      setResult(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">Report Submitted!</h2>
        <p className="text-gray-600 mb-1">Your submission number: <span className="font-bold text-indigo-700 text-xl">#{result.submission_position}</span></p>
        <p className="text-gray-400 text-sm mb-6">Submitted at {new Date(result.submitted_at).toLocaleTimeString()}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit Your Report</h1>
      <p className="text-gray-500 text-sm mb-8">
        Confirm that you've completed your weekly report. Your submission order is recorded — the earlier you submit, the lower your position number (but the winning number is secret, so there's no advantage to any specific time).
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-gray-700 mb-6">
          By clicking below, you confirm that your weekly report has been completed and submitted.
        </p>
        <button
          onClick={submit}
          disabled={submitting || !cycleId}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg text-lg cursor-pointer transition"
        >
          {submitting ? 'Submitting…' : 'Confirm Submission'}
        </button>
      </div>
    </div>
  )
}
