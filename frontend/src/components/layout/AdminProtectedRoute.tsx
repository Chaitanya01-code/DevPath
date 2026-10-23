import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminProtectedRoute() {
  const { admin, loading } = useAdminAuth()
  const { user, loading: userLoading } = useAuth()
  const location = useLocation()

  if (loading || userLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted" role="status">
        Loading the admin workspace…
      </div>
    )
  }

  if (admin) return <Outlet />
  if (user) return <Navigate to="/dashboard" replace />
  return <Navigate to="/login" replace state={{ from: location }} />
}
