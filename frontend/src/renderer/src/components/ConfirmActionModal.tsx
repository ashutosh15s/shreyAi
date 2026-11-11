import { useEffect } from 'react'
import { motion } from 'motion/react'
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import { Button } from './button'

type ConfirmActionModalProps = {
  title: string
  description: string
  confirmLabel: string
  intent?: 'default' | 'danger'
  busy?: boolean
  error?: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  intent = 'default',
  busy = false,
  error,
  onCancel,
  onConfirm,
}: ConfirmActionModalProps): React.JSX.Element {
  const isDanger = intent === 'danger'

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [busy, onCancel])

  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center bg-brand-ink/25 p-4 backdrop-blur-[3px]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel() }}
    >
      <motion.section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        aria-describedby="confirm-action-description"
        initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-[420px] rounded-[24px] border border-neutral-200 bg-white p-5 shadow-[0_24px_80px_-28px_rgba(23,43,77,.35)] sm:p-6"
      >
        <div className="flex items-start gap-3.5">
          <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${isDanger ? 'bg-red-100 text-red-600' : 'bg-brand-wash text-brand-emphasis'}`}>
            {isDanger ? <IconAlertTriangle size={20} /> : <IconInfoCircle size={20} />}
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id="confirm-action-title" className="font-display text-lg font-semibold tracking-tight text-neutral-900">{title}</h2>
            <p id="confirm-action-description" className="mt-1.5 break-words text-sm leading-6 text-neutral-600">{error || description}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={onCancel}>Cancel</Button>
          <Button type="button" variant="primary" size="sm" autoFocus loading={busy} onClick={onConfirm} color={isDanger ? '#dc2626' : '#407cf9'}>
            {error ? 'Try again' : confirmLabel}
          </Button>
        </div>
      </motion.section>
    </motion.div>
  )
}
