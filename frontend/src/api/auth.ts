import apiClient from './client'
import type { LoginPayload, SignupPayload, TokenResponse, User } from '../types'

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
