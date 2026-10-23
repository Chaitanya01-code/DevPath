import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { getAdminMe } from '../api/auth'
import {
  clearStoredAdminToken,
  clearStoredAuthTokens,
  clearStoredToken,
  authLogoutEventName,
  getStoredAdminToken,
  getStoredToken,
  notifyAuthLogout,
  setAdminUnauthorizedHandler,
  storeAdminToken,
} from '../api/client'
import type { Admin } from '../types'

interface AdminAuthContextValue {
  admin: Admin | null
  loading: boolean
  refreshSession: () => Promise<void>
  loginWithToken: (token: string) => Promise<void>
  clearSession: () => void
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshSequence = useRef(0)
  const refreshRequest = useRef<{ id: number; token: string; promise: Promise<void> } | null>(null)

  const logout = useCallback(() => {
    clearStoredAuthTokens()
    setAdmin(null)
    setLoading(false)
    notifyAuthLogout()
  }, [])

  const clearSession = useCallback(() => {
    clearStoredAdminToken()
    setAdmin(null)
    setLoading(false)
  }, [])

  const refreshSession = useCallback((): Promise<void> => {
    const token = getStoredAdminToken()
    if (token && getStoredToken()) {
      clearStoredAuthTokens()
      setAdmin(null)
      setLoading(false)
      return Promise.resolve()
    }
    if (!token) {
      setAdmin(null)
      setLoading(false)
      return Promise.resolve()
    }

    if (refreshRequest.current?.token === token) {
      return refreshRequest.current.promise
    }

    setLoading(true)
    const requestId = ++refreshSequence.current
    const promise = getAdminMe()
      .then((currentAdmin) => {
        if (getStoredAdminToken() === token) setAdmin(currentAdmin)
      })
      .catch((error: unknown) => {
        if (getStoredAdminToken() === token) {
          setAdmin(null)
          console.error('Unable to validate the signed-in admin.', error)
        }
      })
      .finally(() => {
        if (refreshRequest.current?.id === requestId) {
          setLoading(false)
          refreshRequest.current = null
        }
      })
    refreshRequest.current = { id: requestId, token, promise }
    return promise
  }, [])

  useEffect(() => {
    setAdminUnauthorizedHandler(logout)
    return () => setAdminUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    const handleLogout = () => {
      setAdmin(null)
      setLoading(false)
    }
    window.addEventListener(authLogoutEventName, handleLogout)
    return () => window.removeEventListener(authLogoutEventName, handleLogout)
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void refreshSession()
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [refreshSession])

  const loginWithToken = useCallback(async (token: string) => {
    clearStoredToken()
    storeAdminToken(token)
    try {
      const currentAdmin = await getAdminMe()
      if (getStoredAdminToken() !== token) {
        throw new Error('The administrator session changed during login.')
      }
      setAdmin(currentAdmin)
      setLoading(false)
    } catch (error: unknown) {
      if (getStoredAdminToken() === token) {
        clearStoredAdminToken()
        setAdmin(null)
      }
      setLoading(false)
      throw error
    }
  }, [])

  const value = useMemo(
    () => ({ admin, loading, refreshSession, loginWithToken, clearSession, logout }),
    [admin, loading, refreshSession, loginWithToken, clearSession, logout],
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
