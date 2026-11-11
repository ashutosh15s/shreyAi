import axios from 'axios'

type ApiErrorEnvelope = {
  message?: string
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    const message = error.response?.data?.message?.trim()
    if (message) return message
    if (!error.response) return 'Could not connect to Shrey AI. Check that the backend is running.'
  }

  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong. Please try again.'
}
