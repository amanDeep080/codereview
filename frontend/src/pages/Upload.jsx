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
      // review starts PENDING; detail page polls until COMPLETED
      navigate(`/reviews/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Submit code for review</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('file')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${mode === 'file' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
        >
          Upload file / ZIP
        </button>
        <button
          onClick={() => setMode('snippet')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${mode === 'snippet' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
        >
          Paste snippet
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <label className="block text-sm font-medium text-slate-700 mb-1">Project name</label>
        <input
          value={projectName} onChange={(e) => setProjectName(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          required
        />

        {mode === 'file' ? (
          <>
            <label className="block text-sm font-medium text-slate-700 mb-1">.java file or .zip project</label>
            <input
              type="file" accept=".java,.zip"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full mb-4 text-sm"
              required
            />
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code snippet</label>
            <textarea
              value={snippet} onChange={(e) => setSnippet(e.target.value)}
              rows={12}
              className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              placeholder="public class Example { ... }"
              required
            />
          </>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Submit for review'}
        </button>
      </form>
    </div>
  )
}
