'use client'

import * as React from 'react'
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '../lib/utils'

/**
 * Every variant reads the brand colour from the `--brand` CSS variable,
 * which the component sets from the `color` prop. Shades (lighter top,
 * darker border) are derived with color-mix, so one hex is enough.
 */
const variants = {

  primary:
    'text-white border-[color:color-mix(in_oklab,var(--brand)_78%,black)] ' +
    'bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--brand)_86%,white),var(--brand))] ' +
    'shadow-[inset_0_0_0_1.5px_var(--effect-white-24),inset_0_3px_0_var(--effect-white-10)] ' +
    'hover:brightness-105',

  
  secondary:
    'text-neutral-950 border-[var(--button-border)] ' +
    'bg-[linear-gradient(to_bottom,var(--button-surface-top),var(--button-surface-bottom))] ' +
    'shadow-[inset_0_0_0_1px_var(--effect-white-full)] ' +
    'hover:bg-surface hover:border-[var(--button-border-hover)]',

  // Brand-coloured border and text, transparent face
  outline:
    'bg-transparent text-[color:var(--brand)] border-[color:var(--brand)] ' +
    'shadow-[inset_0_-2px_0_color-mix(in_srgb,var(--brand)_25%,transparent)] ' +
    'hover:bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]',

  // No chrome until hovered
  ghost:
    'bg-transparent text-[color:var(--brand)] border-transparent ' +
    'hover:bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]',
} as const

const sizes = {
  sm: 'h-9 px-4 text-sm rounded-xl border-2',
  md: 'h-12 px-6 text-lg rounded-2xl border-[3px]',
  lg: 'h-[72px] px-10 text-3xl rounded-[24px] border-[3px]',
} as const

export type ButtonVariant = keyof typeof variants
export type ButtonSize = keyof typeof sizes

export type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children?: React.ReactNode
  /** Brand colour (any CSS colour, hex recommended). Drives bg, border, glow. */
  color?: string
  /** Shows an inline spinner and temporarily disables the button. */
  loading?: boolean
  /** Shows a brief success or error indicator when the action completes. */
  feedback?: 'success' | 'error' | null
  /** Optional replacement label while completion feedback is visible. */
  feedbackText?: string
  variant?: ButtonVariant
  size?: ButtonSize
  /** number = px, string = any CSS width, 'full' = 100% */
  width?: number | string | 'full'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      style,
      children,
      color = 'var(--brand-primary)',
      loading = false,
      feedback = null,
      feedbackText,
      variant = 'primary',
      size = 'md',
      width,
      type = 'button',
      disabled,
      ...props
    },
    ref,
  ) => {
    const resolvedWidth = width === 'full' ? '100%' : width
    const isDisabled = disabled || loading
    const status = loading ? 'loading' : feedback

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        whileHover={isDisabled ? undefined : { y: -1 }}
        whileTap={isDisabled ? undefined : { y: 2, scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={
          {
            '--brand': color,
            width: resolvedWidth,
            ...style,
            ...(feedback === 'error'
              ? {
                  background: 'linear-gradient(to bottom, var(--status-error-soft), var(--status-error-soft-strong))',
                  borderColor: 'var(--status-error-deep)',
                  color: 'var(--status-error-strong)',
                }
              : {}),
          } as React.CSSProperties
        }
        className={cn(
          'inline-flex select-none font-mono items-center justify-center whitespace-nowrap font-medium tracking-tight cursor-pointer',
          'outline-none transition-[background-color,border-color,filter] duration-150',
          // default focus ring = brand colour; override via className
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand)]',
          'disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none',
          variants[variant],
          sizes[size],
          className, // last, so it wins over everything above
        )}
        {...props}
      >
        <AnimatePresence mode="wait" initial={false}>
          {status && (
            <motion.span
              key={status}
              role={feedback === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              className="inline-flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.85, y: 3 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -3 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              {loading ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 animate-spin motion-reduce:animate-none">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                  <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                </svg>
              ) : feedback === 'success' ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
                </svg>
              )}
              {loading ? children : feedbackText ?? children}
            </motion.span>
          )}
        </AnimatePresence>
        {!status && children}
      </motion.button>
    )
  },
)

Button.displayName = 'Button'

export { Button, variants as buttonVariants, sizes as buttonSizes }
