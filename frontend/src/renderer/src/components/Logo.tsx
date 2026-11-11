import pipSymbolUrl from '../assets/pip-symbol.svg'

export type LogoProps = {
  showName?: boolean
  size?: number
  className?: string
}

export function Logo({ showName = true, size = 40, className }: LogoProps) {
  return (
    <a
      href="/"
      aria-label="Shrey AI home"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.round(size * 0.24),
        color: 'var(--logo-ink, #172B4D)',
        textDecoration: 'none',
        borderRadius: Math.round(size * 0.2),
      }}
    >
      <img
        src={pipSymbolUrl}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={{ display: 'block', width: size, height: size, flex: '0 0 auto', objectFit: 'contain' }}
      />
      {showName && (
        <span
          style={{
            color: 'var(--logo-ink, #172B4D)',
            fontFamily: 'var(--font-display, Geologica, sans-serif)',
            fontSize: size * 0.58,
            fontWeight: 700,
            letterSpacing: '-0.055em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          Shrey AI
        </span>
      )}
    </a>
  )
}

export default Logo
