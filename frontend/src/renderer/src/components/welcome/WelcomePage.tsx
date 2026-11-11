import { Logo } from '../Logo'
import { WelcomeActions } from './WelcomeActions'
import { WelcomeBackground } from './WelcomeBackground'
import { WelcomeTabs } from './WelcomeTabs'

export function WelcomePage(): React.JSX.Element {
  return (
    <main className="relative flex min-h-dvh w-full flex-col overflow-y-auto bg-page font-mono text-copy">
      <WelcomeBackground />

      <div className="relative z-10 px-7 pt-6 sm:px-10 sm:pt-8">
        <Logo size={40} className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand" />
      </div>

      <section id="home" className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-14 pt-12 text-center sm:px-8 sm:pt-10">
        <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center">
          <h1 className="max-w-[940px] font-display text-[clamp(2.8rem,6.2vw,5.8rem)] font-semibold leading-[1.04] tracking-[-0.055em] text-neutral-950 [text-shadow:0_2px_22px_rgba(255,255,255,0.72)]">
            A virtual assistant for your whole desktop.
          </h1>
          <p className="mt-6 max-w-[740px] text-base leading-7 text-neutral-800 [text-shadow:0_1px_14px_rgba(255,255,255,0.85)] sm:text-lg sm:leading-8">
            Shrey AI can search the web, open apps, work with files and your clipboard, control media, and take care of everyday desktop tasks from one conversation.
          </p>
          <WelcomeActions className="mt-8" />
        </div>

        <div className="mt-12 w-full sm:mt-14">
          <WelcomeTabs />
        </div>
      </section>
    </main>
  )
}
