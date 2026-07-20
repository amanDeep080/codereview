import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  // Don't show full navbar on login/register pages if not logged in
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
            <span className="text-white font-bold text-xs">AI</span>
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            CodeReview<span className="text-blue-600">Assistant</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {token ? (
            <>
              <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                <Link to="/" className={`transition-colors ${location.pathname === '/' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}>
                  Dashboard
                </Link>
                <Link to="/upload" className={`transition-colors ${location.pathname === '/upload' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}>
                  New Review
                </Link>
              </div>
              <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />
              <button
                onClick={logout}
                className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-md hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : !isAuthPage && (
            <Link
              to="/login"
              className="text-sm font-medium bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all hover:shadow-lg active:scale-95"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
