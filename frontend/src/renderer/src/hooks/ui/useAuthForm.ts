import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  createAuthFormValues,
  type AuthMode,
  type AuthFormValues,
  type AuthSubmitState,
} from '../../states/ui/authFormState'
import { getApiErrorMessage } from '../../api/errors'
import { login, register } from '../../api/auth'
import { useAuthSession } from '../../states/auth/sessionState'

export function useAuthForm(mode: AuthMode) {
  const [values, setValues] = useState<AuthFormValues>(createAuthFormValues)
  const [submitState, setSubmitState] = useState<AuthSubmitState>('idle')
  const [notice, setNotice] = useState('')
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
  }, [])

  const updateField = (field: keyof AuthFormValues, value: string): void => {
    setValues((current) => ({ ...current, [field]: value }))
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    setSubmitState('idle')
    setNotice('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    setSubmitState('loading')
    setNotice('')

    try {
      const session = mode === 'login'
        ? await login({ email: values.email, password: values.password })
        : await register({ name: values.name, email: values.email, password: values.password })

      useAuthSession.getState().setSession(session)
      setSubmitState('success')
      timeoutRef.current = window.setTimeout(() => {
        window.location.hash = '/dashboard'
      }, 450)
    } catch (error) {
      setSubmitState('error')
      setNotice(getApiErrorMessage(error))
    }
  }

  return { values, updateField, handleSubmit, submitState, notice }
}
