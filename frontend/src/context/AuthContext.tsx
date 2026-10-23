import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { getMe, login as loginRequest } from '../api/auth'
import {
  clearStoredToken,
  getStoredToken,
  setUnauthorizedHandler,
  storeToken,
} from '../api/client'
import type { LoginPayload, User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (credentials: LoginPayload) => Promise<void>
  updateUser: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    clearStoredToken()
    setUser(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setLoading(false)
      return
    }

    getMe()
      .then(setUser)
      .catch((error: unknown) => {
        if (getStoredToken()) {
          clearStoredToken()
          console.error('Unable to load the signed-in user.', error)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (credentials: LoginPayload) => {
    const tokenResponse = await loginRequest(credentials)
    storeToken(tokenResponse.access_token)
    try {
      const currentUser = await getMe()
      setUser(currentUser)
    } catch (error: unknown) {
      clearStoredToken()
      setUser(null)
      throw error
    }
  }, [])

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, updateUser, logout }),
    [user, loading, login, updateUser, logout],
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
