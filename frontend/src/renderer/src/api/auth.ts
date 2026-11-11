import { apiClient } from './client'

export type AuthResponse = {
  token: string
  refreshToken: string
  tokenType: string
  id: string
  name: string
  email: string
  role: string
  expiresIn: number
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
  timestamp: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = LoginPayload & {
  name: string
}

async function unwrapAuthResponse(response: Promise<{ data: ApiEnvelope<AuthResponse> }>): Promise<AuthResponse> {
  const result = await response
  if (!result.data.success || !result.data.data) {
    throw new Error(result.data.message || 'Authentication failed.')
  }
  return result.data.data
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return unwrapAuthResponse(apiClient.post<ApiEnvelope<AuthResponse>>('/auth/login', payload))
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return unwrapAuthResponse(apiClient.post<ApiEnvelope<AuthResponse>>('/auth/register', payload))
}
