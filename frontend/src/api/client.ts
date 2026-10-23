import axios from 'axios'

const tokenKey = 'skillora_access_token'
let unauthorizedHandler: (() => void) | null = null

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler
}

export const clearStoredToken = (): void => {
  localStorage.removeItem(tokenKey)
}

export const storeToken = (token: string): void => {
  localStorage.setItem(tokenKey, token)
}

export const getStoredToken = (): string | null => localStorage.getItem(tokenKey)

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearStoredToken()
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  },
)

export default apiClient
