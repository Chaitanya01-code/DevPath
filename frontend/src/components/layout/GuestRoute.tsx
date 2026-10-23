import { Navigate, Outlet } from 'react-router-dom'

import { useAdminAuth } from '../../context/AdminAuthContext'
import { useAuth } from '../../context/AuthContext'

export default function GuestRoute() {
  const { user, loading } = useAuth()
  const { admin, loading: adminLoading } = useAdminAuth()
  if (loading || adminLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted" role="status">
        Loading your Skillora account…
      </div>
    )
  }
  if (admin) return <Navigate to="/admin/dashboard" replace />
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />
}
