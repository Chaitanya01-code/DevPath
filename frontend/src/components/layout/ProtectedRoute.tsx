import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500" role="status">
        Loading your Skillora account…
      </div>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}
