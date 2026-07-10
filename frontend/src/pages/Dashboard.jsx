import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { reviewApi } from '../services/api.js'

const STATUS_LABELS = {
  PENDING: 'Queued',
  RUNNING_STATIC_ANALYSIS: 'Running static analysis…',
  RUNNING_AI_REVIEW: 'Running AI review…',
  COMPLETED: 'Completed',
  FAILED: 'Failed'
}

function scoreColor(score) {
  if (score == null) return 'bg-slate-200 text-slate-600'
  if (score >= 80) return 'bg-low/10 text-low'
  if (score >= 60) return 'bg-medium/10 text-medium'
  return 'bg-critical/10 text-critical'
}

export default function Dashboard() {
  const [reviews, setReviews] = useState([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    reviewApi.list().then(({ data }) => setReviews(data)).catch(() => {})
  }, [])

  async function handleDelete(id) {
    await reviewApi.delete(id)
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  const filtered = reviews.filter((r) =>
    query.trim() === '' || String(r.id).includes(query) || (r.summary || '').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Your Reviews</h1>
        <Link to="/upload" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium">
          + New Review
        </Link>
      </div>

      <input
        placeholder="Search reviews…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full mb-6 px-3 py-2 border border-slate-300 rounded-lg text-sm"
      />

      {filtered.length === 0 && (
        <p className="text-slate-500 text-sm">No reviews yet. Upload some code to get started.</p>
      )}

      <div className="space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
            <div>
              <Link to={`/reviews/${r.id}`} className="font-medium text-slate-900 hover:underline">
                Review #{r.id}
              </Link>
              <p className="text-sm text-slate-500">{STATUS_LABELS[r.status] || r.status}</p>
            </div>
            <div className="flex items-center gap-4">
              {r.reviewScore != null && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${scoreColor(r.reviewScore)}`}>
                  {r.reviewScore}/100
                </span>
              )}
              <button onClick={() => handleDelete(r.id)} className="text-sm text-red-600 hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
