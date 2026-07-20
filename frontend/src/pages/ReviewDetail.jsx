import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { reviewApi } from '../services/api.js'

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#10b981', INFO: '#64748b'
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
    pollRef.current = setInterval(fetchReview, 3000)
    return () => clearInterval(pollRef.current)
  }, [id])

  if (error) return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
      <p className="text-slate-500 mb-6">{error}</p>
      <Link to="/" className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all">
        Back to Dashboard
      </Link>
    </div>
  )

  if (!review) return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-center">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-500 text-sm">Loading analysis...</p>
    </div>
  )

  if (IN_PROGRESS_STATUSES.includes(review.status)) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center animate-in fade-in duration-1000">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-blue-50 rounded-3xl animate-pulse" />
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-3xl animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-3">Analysis in progress</h2>
        <div className="space-y-2">
           <p className="text-blue-600 font-medium animate-pulse">
            {review.status === 'PENDING' && 'Waiting in queue...'}
            {review.status === 'RUNNING_STATIC_ANALYSIS' && 'Running static analysis...'}
            {review.status === 'RUNNING_AI_REVIEW' && 'AI is generating insights...'}
          </p>
          <p className="text-slate-400 text-xs tracking-wide uppercase font-bold">Please stay on this page</p>
        </div>
      </div>
    )
  }

  const severityCounts = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => ({
    severity: sev,
    count: review.findings.filter((f) => f.severity === sev).length
  }))

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <Link to="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
             </Link>
             <h1 className="text-3xl font-bold text-slate-900">{review.projectName || `Review #${review.id}`}</h1>
          </div>
          <p className="text-slate-500 max-w-2xl">{review.summary}</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 rounded-3xl border border-slate-200 shadow-sm pr-6">
          <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 ${review.reviewScore >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
            <span className="text-xl font-bold leading-none">{review.reviewScore}</span>
            <span className="text-[8px] uppercase font-bold tracking-widest mt-1 opacity-70">Score</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Final Grade</p>
            <p className="text-xs text-slate-500">Based on {review.findings.length} findings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <Metric label="Classes" value={review.numClasses} icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        <Metric label="Methods" value={review.numMethods} icon="M4 6h16M4 12h16m-7 6h7" />
        <Metric label="Lines" value={review.linesOfCode} icon="M12 4v16m8-8H4" />
        <Metric label="Avg Method" value={review.averageMethodLength} icon="M3 12h18" />
        <Metric label="Complexity" value={review.cyclomaticComplexity} icon="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <Metric label="Maintainability" value={review.maintainabilityIndex} icon="M13 10V3L4 14h7v7l9-11h-7z" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Severity Distribution</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityCounts}>
                <XAxis dataKey="severity" fontSize={11} fontWeight="600" axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 6, 6]} barSize={40}>
                  {severityCounts.map((entry) => (
                    <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
           <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest mb-6">Quick Stats</h3>
           <div className="space-y-6">
             <div className="flex items-center justify-between">
               <span className="text-slate-400">Total Issues</span>
               <span className="text-2xl font-bold">{review.findings.length}</span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-slate-400">Critical Issues</span>
               <span className={`text-2xl font-bold ${severityCounts[0].count > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                 {severityCounts[0].count}
               </span>
             </div>
             <div className="pt-6 border-t border-slate-800">
               <p className="text-sm text-slate-400 leading-relaxed italic">
                 "Success is the sum of small efforts, repeated day in and day out."
                 Keep refining your code quality!
               </p>
             </div>
           </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
        Detailed Findings
        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
          {review.findings.length}
        </span>
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {review.findings.map((f, index) => (
          <div
            key={f.id}
            style={{ animationDelay: `${index * 50}ms` }}
            className="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg"
                style={{ color: SEVERITY_COLORS[f.severity], backgroundColor: `${SEVERITY_COLORS[f.severity]}15` }}
              >
                {f.severity}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400">
                {f.source}
              </span>
              {f.fileName && (
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 ml-auto">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {f.fileName}:{f.lineNumber}
                </span>
              )}
            </div>

            <h4 className="text-lg font-bold text-slate-900 mb-2">{f.issue}</h4>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">{f.explanation}</p>

            {f.suggestion && (
              <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-slate-200 group-hover:border-blue-500 transition-colors">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Recommendation</p>
                <p className="text-sm text-slate-700 italic">"{f.suggestion}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Metric({ label, value, icon }) {
  return (
    <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col items-center text-center group hover:border-blue-100 hover:shadow-md transition-all">
      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <p className="text-xl font-bold text-slate-900">{value ?? '—'}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}
