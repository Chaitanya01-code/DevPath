import apiClient from './client'
import { adminApiClient } from './client'
import type {
  Admin,
  AdminLoginPayload,
  Domain,
  LoginPayload,
  SignupPayload,
  TokenResponse,
  User,
} from '../types'

export const signup = async (payload: SignupPayload): Promise<User> => {
  const response = await apiClient.post<User>('/auth/signup', payload)
  return response.data
}

export const login = async (payload: LoginPayload): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>('/auth/login', payload)
  return response.data
}

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me')
  return response.data
}

export const getDomains = async (): Promise<Domain[]> => {
  const response = await apiClient.get<Domain[]>('/domains')
  return response.data
}

export const updateMyDomain = async (domainId: number): Promise<User> => {
  const response = await apiClient.patch<User>('/users/me/domain', {
    domain_id: domainId,
  })
  return response.data
}

export const adminLogin = async (payload: AdminLoginPayload): Promise<TokenResponse> => {
  const response = await adminApiClient.post<TokenResponse>('/auth/admin/login', payload)
  return response.data
}

export const getAdminMe = async (): Promise<Admin> => {
  const response = await adminApiClient.get<Admin>('/admin/me')
  return response.data
}
