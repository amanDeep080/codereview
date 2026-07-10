import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api.js'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const { data } = await authApi.register({ name, email, password })
      localStorage.setItem('token', data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 bg-white rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-xl font-semibold mb-6 text-slate-900">Create account</h1>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <input
          type="text" placeholder="Name" value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          required
        />
        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          required
        />
        <input
          type="password" placeholder="Password (min 8 characters)" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          required
        />
        <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
          Create account
        </button>
        <p className="mt-4 text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-slate-900 underline">Log in</Link>
        </p>
      </form>
    </div>
  )
}
