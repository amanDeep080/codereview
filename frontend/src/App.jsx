import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Upload from './pages/Upload.jsx'
import ReviewDetail from './pages/ReviewDetail.jsx'

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const token = localStorage.getItem('token')

  return (
    <div className="min-h-screen bg-slate-50">
      {token && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/upload" element={<RequireAuth><Upload /></RequireAuth>} />
        <Route path="/reviews/:id" element={<RequireAuth><ReviewDetail /></RequireAuth>} />
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
      </Routes>
    </div>
  )
}
