import { IconArrowRight, IconUser } from '@tabler/icons-react'
import { Input } from '../input-filed'
import { Button } from '../button'
import { useAuthForm } from '../../hooks/ui/useAuthForm'
import type { AuthMode } from '../../states/ui/authFormState'

type AuthFormProps = {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
}

export function AuthForm({ mode, onModeChange }: AuthFormProps): React.JSX.Element {
  const isLogin = mode === 'login'
  const { values, updateField, handleSubmit, submitState, notice } = useAuthForm(mode)

  return (
    <section className="mx-auto w-full max-w-[440px]">
      <p className="text-sm font-medium text-brand-emphasis">{isLogin ? 'Welcome back' : 'Create your account'}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-neutral-900 sm:text-[34px]">
        {isLogin ? 'Log in to continue' : 'Get started with Shrey AI'}
      </h2>
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        {isLogin
          ? 'Enter your account details to continue.'
          : 'Create an account to make Shrey AI yours.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {!isLogin && (
          <Input
            label="Name"
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Your name"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            icon={<IconUser />}
            tone="light"
            required
          />
        )}
        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(event) => updateField('email', event.target.value)}
          tone="light"
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          placeholder="Enter your password"
          value={values.password}
          onChange={(event) => updateField('password', event.target.value)}
          tone="light"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          width="full"
          loading={submitState === 'loading'}
          feedback={submitState === 'success' ? 'success' : submitState === 'error' ? 'error' : null}
          feedbackText={submitState === 'success' ? 'Success' : 'Try again'}
          className="mt-2"
        >
          {isLogin ? 'Log in' : 'Create account'} <IconArrowRight size={18} aria-hidden="true" className="ml-2" />
        </Button>
        {notice && <p role="status" className="text-center text-sm text-neutral-600">{notice}</p>}
      </form>

      <p className="mt-7 text-center text-sm text-neutral-600">
        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={() => onModeChange(isLogin ? 'register' : 'login')}
          className="font-medium text-brand-emphasis underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-brand"
        >
          {isLogin ? 'Get started' : 'Log in'}
        </button>
      </p>
    </section>
  )
}
