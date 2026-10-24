import axios from 'axios'

interface ApiErrorPayload {
  detail?: unknown
}

const userTokenKey = 'skillora_access_token'
const adminTokenKey = 'skillora_admin_access_token'
export const authLogoutEventName = 'skillora:logout'
let unauthorizedHandler: (() => void) | null = null
let adminUnauthorizedHandler: (() => void) | null = null

export const notifyAuthLogout = (): void => {
  window.dispatchEvent(new Event(authLogoutEventName))
}

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return fallback
  }

  if (!error.response && error.code === 'ERR_NETWORK') {
    return 'Unable to reach the backend API. Check that it is running, VITE_API_URL is correct, and CORS_ORIGINS allows this frontend.'
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'The backend request timed out. Please retry in a moment.'
  }

  const detail = error.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (Array.isArray(detail)) {
    const messages = detail.flatMap((issue: unknown) => {
      if (typeof issue !== 'object' || issue === null || !('msg' in issue)) {
        return []
      }
      return typeof issue.msg === 'string' ? [issue.msg] : []
    })
    if (messages.length > 0) {
      return messages.join('; ')
    }
  }

  if (error.response?.status === 401) {
    return 'Your session has expired. Please sign in again.'
  }
  if (error.response?.status === 403) {
    return 'You do not have permission to access this information.'
  }
  if (error.response && error.response.status >= 500) {
    return 'The backend could not complete this request. Please retry in a moment.'
  }

  return fallback
}

const createApiClient = (
  tokenKey: string,
  onUnauthorized: () => (() => void) | null,
) => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
    headers: { 'Content-Type': 'application/json' },
  })

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenKey)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const requestUrl = error.config?.url ?? ''
        const isAuthenticationRequest =
          requestUrl.includes('/auth/login') ||
          requestUrl.includes('/auth/admin/login') ||
          requestUrl.includes('/auth/signup')
        const authorization = error.config?.headers?.get('Authorization')
        const requestToken =
          typeof authorization === 'string'
            ? authorization.replace(/^Bearer\s+/i, '')
            : null
        if (
          !isAuthenticationRequest &&
          requestToken &&
          localStorage.getItem(tokenKey) === requestToken
        ) {
          localStorage.removeItem(tokenKey)
          onUnauthorized()?.()
        }
      }
      return Promise.reject(error)
    },
  )

  return client
}

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler
}

export const setAdminUnauthorizedHandler = (handler: (() => void) | null): void => {
  adminUnauthorizedHandler = handler
}

export const clearStoredToken = (): void => {
  localStorage.removeItem(userTokenKey)
}

export const clearStoredAuthTokens = (): void => {
  localStorage.removeItem(userTokenKey)
  localStorage.removeItem(adminTokenKey)
}

export const storeToken = (token: string): void => {
  localStorage.setItem(userTokenKey, token)
}

export const getStoredToken = (): string | null => localStorage.getItem(userTokenKey)

export const clearStoredAdminToken = (): void => {
  localStorage.removeItem(adminTokenKey)
}

export const storeAdminToken = (token: string): void => {
  localStorage.setItem(adminTokenKey, token)
}

export const getStoredAdminToken = (): string | null => localStorage.getItem(adminTokenKey)

export const apiClient = createApiClient(userTokenKey, () => unauthorizedHandler)
export const adminApiClient = createApiClient(adminTokenKey, () => adminUnauthorizedHandler)

export default apiClient
