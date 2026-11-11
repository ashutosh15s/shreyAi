import type { CSSProperties } from 'react'

export type LogoProps = {
  showName?: boolean
  size?: number
  className?: string
}

export function Logo({ showName = true, size = 40, className }: LogoProps) {
  const tileStyle: CSSProperties = {
    display: 'grid',
    width: size,
    height: size,
    flex: '0 0 auto',
    placeItems: 'center',
    borderRadius: Math.round(size * 0.27),
    backgroundColor: '#2563EB',
  }

  return (
    <a
      href="/"
      aria-label="Shrey AI home"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.round(size * 0.25),
        color: '#172B4D',
        textDecoration: 'none',
        borderRadius: Math.round(size * 0.2),
      }}
    >
      <span style={tileStyle} aria-hidden="true">
        <svg
          width={size * 0.68}
          height={size * 0.68}
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7.5 31.5 18.7 8.5c.5-1 2-1 2.5 0l8.1 16.6"
            stroke="white"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m21.8 28.2 4.1 4.1 8-9.2"
            stroke="#67D6F5"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showName && (
        <span
          style={{
            color: '#172B4D',
            fontFamily: 'Geologica, Inter, sans-serif',
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
