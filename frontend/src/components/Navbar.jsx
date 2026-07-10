import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
      <Link to="/" className="text-lg font-semibold text-slate-900">
        AI Code Review Assistant
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link to="/" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
        <Link to="/upload" className="text-slate-600 hover:text-slate-900">New Review</Link>
        <button onClick={logout} className="text-red-600 hover:text-red-700">Logout</button>
      </div>
    </nav>
  )
}
