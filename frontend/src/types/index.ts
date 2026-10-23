export type UserRole = 'student' | 'admin'

export interface User {
  id: string
  full_name: string
  email: string
  github_username: string | null
  role: UserRole
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface SignupPayload {
  full_name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}
