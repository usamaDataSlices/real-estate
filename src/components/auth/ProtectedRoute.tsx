import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute() {
  const { sessionState } = useAuth()
  const location = useLocation()

  if (sessionState === 'loading') {
    return <div className="container py-10"><div className="card text-neutral-600">Loading session...</div></div>
  }

  if (sessionState === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
