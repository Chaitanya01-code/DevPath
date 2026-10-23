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

import { getMe, login as loginRequest } from '../api/auth'
import {
  clearStoredAdminToken,
  clearStoredAuthTokens,
  clearStoredToken,
  authLogoutEventName,
  getStoredAdminToken,
  getStoredToken,
  notifyAuthLogout,
  setUnauthorizedHandler,
  storeToken,
} from '../api/client'
import type { LoginPayload, User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  refreshSession: () => Promise<void>
  login: (
    credentials: LoginPayload,
  ) => Promise<{ accessToken: string; role: 'user' | 'admin' }>
  updateUser: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshSequence = useRef(0)
  const refreshRequest = useRef<{ id: number; token: string; promise: Promise<void> } | null>(null)

  const logout = useCallback(() => {
    clearStoredAuthTokens()
    setUser(null)
    setLoading(false)
    notifyAuthLogout()
  }, [])

  const refreshSession = useCallback((): Promise<void> => {
    const token = getStoredToken()
    if (token && getStoredAdminToken()) {
      clearStoredAuthTokens()
      setUser(null)
      setLoading(false)
      return Promise.resolve()
    }
    if (!token) {
      setUser(null)
      setLoading(false)
      return Promise.resolve()
    }

    if (refreshRequest.current?.token === token) {
      return refreshRequest.current.promise
    }

    setLoading(true)
    const requestId = ++refreshSequence.current
    const promise = getMe()
      .then((currentUser) => {
        if (getStoredToken() === token) setUser(currentUser)
      })
      .catch((error: unknown) => {
        if (getStoredToken() === token) {
          setUser(null)
          console.error('Unable to validate the signed-in user.', error)
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
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    const handleLogout = () => {
      setUser(null)
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

  const login = useCallback(async (credentials: LoginPayload) => {
    const tokenResponse = await loginRequest(credentials)
    if (tokenResponse.role === 'admin') {
      clearStoredToken()
      setUser(null)
      setLoading(false)
      return { accessToken: tokenResponse.access_token, role: 'admin' as const }
    }

    clearStoredAdminToken()
    storeToken(tokenResponse.access_token)
    try {
      const currentUser = await getMe()
      if (getStoredToken() !== tokenResponse.access_token) {
        throw new Error('The student session changed during login.')
      }
      setUser(currentUser)
      setLoading(false)
      return { accessToken: tokenResponse.access_token, role: 'user' as const }
    } catch (error: unknown) {
      if (getStoredToken() === tokenResponse.access_token) {
        clearStoredToken()
        setUser(null)
      }
      setLoading(false)
      throw error
    }
  }, [])

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser)
  }, [])

  const value = useMemo(
    () => ({ user, loading, refreshSession, login, updateUser, logout }),
    [user, loading, refreshSession, login, updateUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
