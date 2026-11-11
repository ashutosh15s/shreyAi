import landscapeUrl from '../../assets/beautiful-landscape.webp'
import { Logo } from '../Logo'

type AuthImagePanelProps = {
  className?: string
  mode?: 'login' | 'register'
}

export function AuthImagePanel({ className = '', mode = 'login' }: AuthImagePanelProps): React.JSX.Element {
  return (
    <section className={`relative flex flex-col justify-between overflow-hidden px-7 py-7 sm:px-10 sm:py-9 lg:px-12 lg:py-10 ${className}`}>
      <img
        src={landscapeUrl}
        alt=""
        aria-hidden="true"
        style={{ objectPosition: 'left bottom' }}
        className="absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] object-cover blur-[1.5px] brightness-[0.86] saturate-[0.82]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-white/25" />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_44%,rgba(23,43,77,0.16)_100%)]" />
      <div className="relative z-10">
        <Logo size={38} className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand" />
      </div>
      <div className="relative z-10 mt-10 hidden max-w-[520px] pb-3 lg:block">
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-[-0.04em] text-neutral-950 [text-shadow:0_2px_18px_rgba(255,255,255,0.78)] xl:text-5xl">
          {mode === 'login' ? 'Your desktop assistant, ready to help.' : 'Make your desktop more capable.'}
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-neutral-800 [text-shadow:0_1px_14px_rgba(255,255,255,0.85)]">
          Search the web, work with files, open apps, and handle everyday tasks from one place.
        </p>
      </div>
    </section>
  )
}
