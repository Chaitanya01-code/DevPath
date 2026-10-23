import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAdminAuth } from '../../context/AdminAuthContext'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { admin, loading: adminLoading } = useAdminAuth()
  const location = useLocation()

  if (loading || adminLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted" role="status">
        Loading your Skillora account…
      </div>
    )
  }

  if (admin) return <Navigate to="/admin/dashboard" replace />
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}
