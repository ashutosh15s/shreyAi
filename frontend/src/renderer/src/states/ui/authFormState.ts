export type AuthMode = 'login' | 'register'
export type AuthSubmitState = 'idle' | 'loading' | 'success' | 'error'

export type AuthFormValues = {
  name: string
  email: string
  password: string
}

export function createAuthFormValues(): AuthFormValues {
  return {
    name: '',
    email: '',
    password: '',
  }
}
