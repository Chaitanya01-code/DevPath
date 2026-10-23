export interface User {
  id: string
  name: string
  email: string
  domain: Domain
  github_username: string | null
  created_at: string
}

export interface Domain {
  id: number
  name: string
}

export interface Admin {
  username: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface SignupPayload {
  name: string
  email: string
  password: string
  domain_id?: number
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AdminLoginPayload {
  username: string
  password: string
}
