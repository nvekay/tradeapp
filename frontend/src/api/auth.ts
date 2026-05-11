import client from './client'

export interface AuthPayload {
  email: string
  password: string
}

export interface GoogleAuthPayload {
  credential?: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UserResponse {
  id: number
  email: string
}

export const login = (data: AuthPayload) =>
  client.post<TokenResponse>('/auth/login', data).then(r => r.data)

export const register = (data: AuthPayload) =>
  client.post<TokenResponse>('/auth/register', data).then(r => r.data)

export const googleLogin = (data: GoogleAuthPayload) =>
  client.post<TokenResponse>('/auth/google', data).then(r => r.data)

export const getMe = () =>
  client.get<UserResponse>('/auth/me').then(r => r.data)
