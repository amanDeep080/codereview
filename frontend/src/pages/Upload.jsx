import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectApi } from '../services/api.js'

export default function Upload() {
  const [mode, setMode] = useState('file') // 'file' | 'snippet'
  const [projectName, setProjectName] = useState('')
  const [file, setFile] = useState(null)
  const [snippet, setSnippet] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = mode === 'file'
        ? await projectApi.uploadFile(projectName, file)
        : await projectApi.submitSnippet(projectName, snippet)
      navigate(`/reviews/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">New Analysis</h1>
        <p className="text-slate-500">Submit your code to get an AI-powered quality report</p>
      </div>

      <div className="flex justify-center p-1 bg-slate-100 rounded-2xl mb-8 w-fit mx-auto">
        <button
          onClick={() => setMode('file')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'file' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          File / ZIP
        </button>
        <button
          onClick={() => setMode('snippet')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'snippet' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Snippet
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Project Name</label>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Authentication Module"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
            required
            disabled={loading}
          />
        </div>

        {mode === 'file' ? (
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Source Code (.java or .zip)</label>
            <div className="relative group">
              <input
                type="file"
                accept=".java,.zip"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="file-upload"
                required
                disabled={loading}
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-48 px-4 transition bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl appearance-none cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 focus:outline-none group"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-600">
                    {file ? file.name : "Click to select a file"}
                  </span>
                  <span className="text-xs text-slate-400">Supported: .java, .zip (Max 25MB)</span>
                </div>
              </label>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Paste Code</label>
            <textarea
              value={snippet}
              onChange={(e) => setSnippet(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none"
              placeholder="public class Example { ... }"
              required
              disabled={loading}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing code...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Analysis
            </>
          )}
        </button>
      </form>
    </div>
  )
}
