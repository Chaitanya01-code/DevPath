import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAdminAuth } from '../../context/AdminAuthContext'
import { useAuth } from '../../context/AuthContext'

export default function GuestRoute() {
  const { user, loading, refreshSession } = useAuth()
  const { admin, loading: adminLoading, refreshSession: refreshAdminSession } = useAdminAuth()
  const { pathname } = useLocation()
  const [validatedPath, setValidatedPath] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([refreshSession(), refreshAdminSession()]).finally(() => {
      if (active) setValidatedPath(pathname)
    })
    return () => {
      active = false
    }
  }, [pathname, refreshSession, refreshAdminSession])

  if (validatedPath !== pathname || loading || adminLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted" role="status">
        Loading your Skillora account…
      </div>
    )
  }
  if (admin) return <Navigate to="/admin/dashboard" replace />
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />
}
