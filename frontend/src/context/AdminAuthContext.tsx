import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { adminLogin as adminLoginRequest, getAdminMe } from '../api/auth'
import {
  clearStoredAdminToken,
  getStoredAdminToken,
  setAdminUnauthorizedHandler,
  storeAdminToken,
} from '../api/client'
import type { Admin, AdminLoginPayload } from '../types'

interface AdminAuthContextValue {
  admin: Admin | null
  loading: boolean
  login: (credentials: AdminLoginPayload) => Promise<void>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    clearStoredAdminToken()
    setAdmin(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    setAdminUnauthorizedHandler(logout)
    return () => setAdminUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    if (!getStoredAdminToken()) {
      setLoading(false)
      return
    }
    getAdminMe()
      .then(setAdmin)
      .catch((error: unknown) => {
        if (getStoredAdminToken()) {
          clearStoredAdminToken()
          console.error('Unable to load the signed-in admin.', error)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (credentials: AdminLoginPayload) => {
    const tokenResponse = await adminLoginRequest(credentials)
    storeAdminToken(tokenResponse.access_token)
    try {
      setAdmin(await getAdminMe())
    } catch (error: unknown) {
      clearStoredAdminToken()
      setAdmin(null)
      throw error
    }
  }, [])

  const value = useMemo(
    () => ({ admin, loading, login, logout }),
    [admin, loading, login, logout],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
