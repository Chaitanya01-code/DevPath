import { Navigate, Outlet } from 'react-router-dom'

import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminProtectedRoute() {
  const { admin, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted" role="status">
        Loading the admin workspace…
      </div>
    )
  }

  return admin ? <Outlet /> : <Navigate to="/admin/login" replace />
}
