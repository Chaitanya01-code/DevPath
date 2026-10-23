import axios from 'axios'

interface ApiErrorPayload {
  detail?: unknown
}

const userTokenKey = 'skillora_access_token'
const adminTokenKey = 'skillora_admin_access_token'
let unauthorizedHandler: (() => void) | null = null
let adminUnauthorizedHandler: (() => void) | null = null

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return fallback
  }

  if (!error.response && error.code === 'ERR_NETWORK') {
    return 'Unable to reach the backend API. Check that it is running, VITE_API_URL is correct, and CORS_ORIGINS allows this frontend.'
  }

  const detail = error.response?.data.detail
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
        localStorage.removeItem(tokenKey)
        onUnauthorized()?.()
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
