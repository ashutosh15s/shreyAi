import landscapeUrl from '../../assets/beautiful-landscape.webp'
import { AuthImagePanel } from './AuthImagePanel'
import { AuthForm } from './AuthForm'
import { Logo } from '../Logo'
import type { AuthMode } from '../../states/ui/authFormState'

type AuthPageProps = {
  mode: AuthMode
}

export function AuthPage({ mode }: AuthPageProps): React.JSX.Element {
  const setMode = (nextMode: AuthMode): void => {
    window.location.hash = nextMode === 'login' ? '/login' : '/register'
  }

  return (
    <main className="relative h-dvh w-full overflow-y-auto bg-surface font-mono text-copy lg:grid lg:grid-cols-2">
      <AuthImagePanel mode={mode} className="hidden min-h-dvh lg:flex" />

      <img
        src={landscapeUrl}
        alt=""
        aria-hidden="true"
        style={{ objectPosition: 'left bottom' }}
        className="fixed inset-0 z-0 h-dvh w-screen object-cover blur-[1px] brightness-[0.82] saturate-[0.82] lg:hidden"
      />
      <div aria-hidden="true" className="fixed inset-0 z-0 bg-white/38 lg:hidden" />
      <div aria-hidden="true" className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_34%,rgba(23,43,77,0.12)_100%)] lg:hidden" />

      <section className="relative z-10 flex min-h-[560px] items-center justify-center px-5 py-10 lg:col-start-2 lg:min-h-dvh lg:px-14">
        <div className="w-full max-w-[440px] px-1 py-3 sm:px-3 lg:max-w-none lg:px-0">
          <div className="mb-8 flex items-center justify-between">
            <Logo size={32} className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand lg:hidden" />
            <a href="/" className="ml-auto text-sm text-neutral-600 transition-colors hover:text-neutral-900 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-brand">
              Back to welcome
            </a>
          </div>
          <AuthForm key={mode} mode={mode} onModeChange={setMode} />
        </div>
      </section>
    </main>
  )
}
