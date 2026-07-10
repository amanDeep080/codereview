import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { reviewApi } from '../services/api.js'

const SEVERITY_COLORS = {
  CRITICAL: '#dc2626', HIGH: '#ea580c', MEDIUM: '#ca8a04', LOW: '#65a30d', INFO: '#64748b'
}

const IN_PROGRESS_STATUSES = ['PENDING', 'RUNNING_STATIC_ANALYSIS', 'RUNNING_AI_REVIEW']

export default function ReviewDetail() {
  const { id } = useParams()
  const [review, setReview] = useState(null)
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  useEffect(() => {
    async function fetchReview() {
      try {
        const { data } = await reviewApi.get(id)
        setReview(data)
        if (!IN_PROGRESS_STATUSES.includes(data.status)) {
          clearInterval(pollRef.current)
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load review')
        clearInterval(pollRef.current)
      }
    }

    fetchReview()
    // Poll every 3s while the pipeline (static analysis + AI review) is running
    pollRef.current = setInterval(fetchReview, 3000)
    return () => clearInterval(pollRef.current)
  }, [id])

  if (error) return <div className="max-w-4xl mx-auto px-6 py-8 text-red-600">{error}</div>
  if (!review) return <div className="max-w-4xl mx-auto px-6 py-8 text-slate-500">Loading…</div>

  if (IN_PROGRESS_STATUSES.includes(review.status)) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="animate-pulse text-slate-500 text-sm mb-2">
          {review.status === 'PENDING' && 'Queued…'}
          {review.status === 'RUNNING_STATIC_ANALYSIS' && 'Running Checkstyle + PMD analysis…'}
          {review.status === 'RUNNING_AI_REVIEW' && 'Running AI-powered review…'}
        </div>
        <p className="text-slate-400 text-xs">This page updates automatically.</p>
      </div>
    )
  }

  if (review.status === 'FAILED') {
    return <div className="max-w-4xl mx-auto px-6 py-8 text-red-600">Review failed to complete.</div>
  }

  const severityCounts = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => ({
    severity: sev,
    count: review.findings.filter((f) => f.severity === sev).length
  }))

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold text-slate-900">Review #{review.id}</h1>
        <span className="px-4 py-1 rounded-full bg-slate-900 text-white text-sm font-semibold">
          {review.reviewScore}/100
        </span>
      </div>
      <p className="text-slate-600 mb-6">{review.summary}</p>

      {/* Complexity Analysis */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Metric label="Classes" value={review.numClasses} />
        <Metric label="Methods" value={review.numMethods} />
        <Metric label="Lines of Code" value={review.linesOfCode} />
        <Metric label="Avg Method Length" value={review.averageMethodLength} />
        <Metric label="Cyclomatic Complexity" value={review.cyclomaticComplexity} />
        <Metric label="Maintainability Index" value={review.maintainabilityIndex} />
      </div>

      {/* Severity breakdown chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={severityCounts}>
            <XAxis dataKey="severity" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {severityCounts.map((entry) => (
                <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Findings list */}
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Findings ({review.findings.length})</h2>
      <div className="space-y-3">
        {review.findings.map((f) => (
          <div key={f.id} className="p-4 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ color: SEVERITY_COLORS[f.severity], backgroundColor: `${SEVERITY_COLORS[f.severity]}1a` }}
              >
                {f.severity}
              </span>
              <span className="text-xs text-slate-400">{f.source}</span>
              {f.fileName && <span className="text-xs text-slate-400">{f.fileName}:{f.lineNumber}</span>}
            </div>
            <p className="font-medium text-slate-900">{f.issue}</p>
            <p className="text-sm text-slate-600 mt-1">{f.explanation}</p>
            {f.suggestion && <p className="text-sm text-slate-500 mt-1 italic">Suggestion: {f.suggestion}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
      <p className="text-lg font-semibold text-slate-900">{value ?? '—'}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
