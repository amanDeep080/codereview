import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { reviewApi } from '../services/api.js'

const STATUS_LABELS = {
  PENDING: 'Queued',
  RUNNING_STATIC_ANALYSIS: 'Analyzing patterns...',
  RUNNING_AI_REVIEW: 'AI is reviewing...',
  COMPLETED: 'Review Ready',
  FAILED: 'Analysis Failed'
}

function scoreColor(score) {
  if (score == null) return 'bg-slate-100 text-slate-400'
  if (score >= 80) return 'bg-emerald-50 text-emerald-600 border-emerald-100'
  if (score >= 60) return 'bg-amber-50 text-amber-600 border-amber-100'
  return 'bg-rose-50 text-rose-600 border-rose-100'
}

export default function Dashboard() {
  const [reviews, setReviews] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchReviews()
  }, [])

  async function fetchReviews() {
    try {
      const { data } = await reviewApi.list()
      setReviews(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this review?')) return

    setDeletingId(id)
    try {
      await reviewApi.delete(id)
      setReviews((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      alert('Failed to delete review')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = reviews.filter((r) =>
    query.trim() === '' ||
    String(r.id).includes(query) ||
    (r.projectName || '').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Reviews</h1>
          <p className="text-slate-500 mt-1">Manage and track your code quality reports</p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-95"
        >
          <span className="mr-2 text-lg">+</span> New Analysis
        </Link>
      </div>

      <div className="relative mb-8 group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          placeholder="Search by ID or project name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm animate-pulse">Loading your reviews...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No reviews found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
            {query ? "Try adjusting your search terms" : "Upload your first project to see analysis results here"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((r, index) => (
            <div
              key={r.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
            >
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${r.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                   {r.status === 'COMPLETED' ? (
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   ) : (
                     <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                   )}
                </div>
                <div>
                  <Link to={`/reviews/${r.id}`} className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block">
                    {r.projectName || `Review #${r.id}`}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      ID: {r.id}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0">
                {r.reviewScore != null && (
                  <div className={`flex flex-col items-center px-4 py-1.5 rounded-xl border ${scoreColor(r.reviewScore)}`}>
                    <span className="text-lg font-bold leading-none">{r.reviewScore}</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">Score</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Link
                    to={`/reviews/${r.id}`}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="View details"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                    title="Delete review"
                  >
                    {deletingId === r.id ? (
                      <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
