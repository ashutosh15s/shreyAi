'use client'

import * as React from 'react'
import { twMerge } from 'tailwind-merge'
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
  IconPhone,
  IconSearch,
} from '@tabler/icons-react'

const cn = (...classes: Array<string | false | null | undefined>) =>
  twMerge(classes.filter(Boolean).join(' '))

const defaultIcons: Record<string, React.ElementType | undefined> = {
  email: IconMail,
  password: IconLock,
  search: IconSearch,
  tel: IconPhone,
}

export type InputProps = Omit<React.ComponentPropsWithoutRef<'input'>, 'size'> & {
  label?: string
  /** helper text under the field */
  hint?: string
  /** error message, turns the field red */
  error?: string
  /** leading icon. Leave undefined for the default per type, pass null for none */
  icon?: React.ReactNode | null
  /** content on the right side of the label row (e.g. a "Forgot password?" link) */
  labelRight?: React.ReactNode
  /** focus ring colour */
  color?: string
  wrapperClassName?: string
  tone?: 'dark' | 'light'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      icon,
      labelRight,
      color = 'var(--brand-primary)',
      tone = 'dark',
      type = 'text',
      id,
      className,
      wrapperClassName,
      disabled,
      ...props
    },
    ref,
  ) => {
    const autoId = React.useId()
    const inputId = id ?? autoId
    const messageId = `${inputId}-message`

    const [show, setShow] = React.useState(false)
    const isPassword = type === 'password'
    const resolvedType = isPassword && show ? 'text' : type

    const DefaultIcon = defaultIcons[type]
    const leading =
      icon === undefined ? (DefaultIcon ? <DefaultIcon /> : null) : icon
    const light = tone === 'light'

    return (
      <div
        style={{ '--brand': color } as React.CSSProperties}
        className={cn('flex w-full flex-col gap-2', wrapperClassName)}
      >
        {(label || labelRight) && (
          <div className="flex items-center justify-between text-sm">
            {label && (
              <label htmlFor={inputId} className={light ? 'text-body' : 'text-white/80'}>
                {label}
              </label>
            )}
            {labelRight}
          </div>
        )}

        <div
          className={cn(
            'flex h-12 items-center gap-3 rounded-2xl border px-4 transition-colors',
            light
              ? 'border-neutral-400 bg-surface/75 focus-within:border-[color:var(--brand)] focus-within:bg-surface'
              : 'border-white/10 bg-surface/5 focus-within:border-[color:var(--brand)] focus-within:bg-surface/[0.07]',
            error && 'border-red-500/60 focus-within:border-red-500',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          {leading && (
            <span className={cn(light ? 'text-subtle' : 'text-white/40', '[&>svg]:h-5 [&>svg]:w-5')}>{leading}</span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error || hint ? messageId : undefined}
            className={cn(
              cn(
                'w-full bg-transparent text-base outline-none',
                light
                  ? 'text-copy placeholder:text-subtle'
                  : 'text-white placeholder:text-white/30',
              ),
              '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
              className,
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className={cn(
                'transition-colors',
                light ? 'text-subtle hover:text-copy' : 'text-white/40 hover:text-white',
              )}
            >
              {show ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
            </button>
          )}
        </div>

        {(error || hint) && (
          <p
            id={messageId}
            role={error ? 'alert' : undefined}
            className={cn(
              'text-xs',
              error ? 'text-red-500' : light ? 'text-neutral-600' : 'text-white/40',
            )}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input }
