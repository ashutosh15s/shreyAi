import { Button } from '../button'

type WelcomeActionsProps = {
  className?: string
}

export function WelcomeActions({ className = '' }: WelcomeActionsProps): React.JSX.Element {
  return (
    <div className={`flex flex-wrap justify-center gap-3 ${className}`}>
      <Button
        variant="primary"
        size="md"
        onClick={() => { window.location.hash = '/login' }}
      >
        Get logged in
      </Button>
      <Button
        variant="secondary"
        size="md"
        onClick={() => { window.location.hash = '/register' }}
        className="!text-brand-ink"
      >
        Get started
      </Button>
    </div>
  )
}
