import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

export default function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted" role="status">
        Loading your Skillora account…
      </div>
    )
  }
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />
}
