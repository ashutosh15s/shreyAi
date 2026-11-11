import { apiClient } from './client'

export type UserProfile = {
  id: string
  name: string
  email: string
  role: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type AuditLogEntry = {
  id: string
  userId: string
  action: string
  provider?: string
  model?: string
  details?: string
  timestamp: string
}

export type ActionConfirmationPayload = {
  actionId: string
  actionType: string
  params?: Record<string, unknown>
  approved: boolean
  reason?: string
}

export type ActionConfirmationResult = {
  action_id: string
  action_type: string
  status: 'executed' | 'cancelled' | 'error'
  response: string
  voice_script: string
  tools_executed: string[]
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await apiClient.get<ApiEnvelope<UserProfile>>('/auth/me')
  return res.data.data
}

export async function updateUserProfile(name: string, email: string): Promise<UserProfile> {
  const res = await apiClient.put<ApiEnvelope<UserProfile>>('/auth/profile', { name, email })
  return res.data.data
}

export async function changeUserPassword(oldPassword: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/change-password', { oldPassword, newPassword })
}

export async function fetchUserAuditLogs(): Promise<AuditLogEntry[]> {
  const res = await apiClient.get<ApiEnvelope<{ content: AuditLogEntry[] }>>('/audit-logs/my')
  return res.data.data?.content || []
}

export async function resolveActionConfirmation(
  payload: ActionConfirmationPayload
): Promise<ActionConfirmationResult> {
  const res = await apiClient.post<ActionConfirmationResult>('/ai/confirm', payload)
  return res.data
}
