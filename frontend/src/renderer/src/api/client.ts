import axios from 'axios'
import { useAuthSession } from '../states/auth/sessionState'

const baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthSession.getState().session?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
