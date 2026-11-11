import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { IconCheck, IconCopy, IconFile, IconPencil, IconTrash, IconUserCircle, IconVolume, IconVolumeOff, IconX } from '@tabler/icons-react'
import { Button } from '../button'
import { Logo } from '../Logo'
import { ConfirmActionModal } from '../ConfirmActionModal'

export type ChatMessageData = {
  id: string
  role: 'user' | 'assistant'
  content: string
  voiceScript?: string
  streaming?: boolean
}

function inlineContent(value: string): React.ReactNode[] {
  return value.split(/(\*\*[^*]+\*\*|==[^=]+==|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-neutral-900">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('==') && part.endsWith('==')) {
      return <mark key={index} className="rounded bg-blue-100 px-1 text-neutral-900">{part.slice(2, -2)}</mark>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.92em] text-brand-emphasis">{part.slice(1, -1)}</code>
    }
    return <span key={index}>{part}</span>
  })
}

function assistantContent(value: string): React.ReactNode[] {
  const tokenPattern = /(!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)|```[\s\S]*?```|(?:[A-Za-z]:\\(?:[^\\\s]+\\)*[^\\\s,;!?]+|\/(?:Users|home|tmp|mnt|workspace)\/[^\s,;!?]+))/g
  const output: React.ReactNode[] = []
  let cursor = 0

  for (const match of value.matchAll(tokenPattern)) {
    const index = match.index ?? 0
    if (index > cursor) output.push(<span key={`text-${cursor}`}>{inlineContent(value.slice(cursor, index))}</span>)

    const token = match[0]
    if (token.startsWith('![')) {
      const alt = match[2] || 'Shared image'
      const url = match[3]
      output.push(
        <figure key={`media-${index}`} className="my-3 max-w-[520px] overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2">
          <img src={url} alt={alt} loading="lazy" className="max-h-[360px] w-full rounded-xl object-contain" />
          <figcaption className="px-2 pb-1 pt-2 text-xs text-neutral-500">{alt}</figcaption>
        </figure>,
      )
    } else if (token.startsWith('```')) {
      const code = token.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '')
      output.push(<pre key={`code-${index}`} className="my-3 overflow-x-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-800"><code>{code}</code></pre>)
    } else {
      output.push(
        <div key={`file-${index}`} className="my-3 flex max-w-full items-start gap-3 rounded-2xl border border-brand/25 bg-blue-50/60 p-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-emphasis shadow-sm"><IconFile size={19} /></span>
          <span className="min-w-0">
            <span className="block text-xs font-medium text-neutral-600">File path</span>
            <code className="mt-1 block break-all font-mono text-sm leading-5 text-neutral-900">{token}</code>
          </span>
        </div>,
      )
    }
    cursor = index + token.length
  }

  if (cursor < value.length) output.push(<span key={`text-${cursor}`}>{inlineContent(value.slice(cursor))}</span>)
  return output
}

type ChatMessageProps = {
  message: ChatMessageData
  onSpeak: (text: string) => void
  onEdit?: (content: string) => Promise<void>
  onDelete?: () => Promise<void>
}

export function ChatMessage({ message, onSpeak, onEdit, onDelete }: ChatMessageProps): React.JSX.Element {
  const [speaking, setSpeaking] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'edit' | 'delete' | null>(null)
  const [actionError, setActionError] = useState('')
  const isUser = message.role === 'user'
  const canEdit = isUser && Boolean(onEdit) && !message.id.startsWith('user-')

  const copyMessage = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  const saveEdit = async (): Promise<void> => {
    const nextContent = editValue.trim()
    if (!nextContent || nextContent === message.content || !onEdit) {
      setEditing(false)
      return
    }
    setActionError('')
    setConfirmAction('edit')
  }

  const confirmActionRequest = async (): Promise<void> => {
    if (!confirmAction) return
    setSaving(true)
    setActionError('')
    try {
      if (confirmAction === 'edit') {
        await onEdit?.(editValue.trim())
        setEditing(false)
      } else {
        await onDelete?.()
      }
      setConfirmAction(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not complete this action.')
    } finally {
      setSaving(false)
    }
  }

  const toggleSpeak = (): void => {
    const speech = message.voiceScript || message.content
    if (speaking) {
      window.speechSynthesis?.cancel()
      setSpeaking(false)
      return
    }
    onSpeak(speech)
    setSpeaking(true)
    window.setTimeout(() => setSpeaking(false), Math.max(1200, speech.length * 58))
  }

  if (isUser) {
    return (
      <>
      <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="group flex justify-end gap-2.5 py-3">
        <div className="flex max-w-[min(78%,680px)] flex-col items-end gap-1.5">
          <div className="w-fit rounded-[22px] rounded-br-md bg-brand px-5 py-3.5 text-[15px] leading-7 text-white shadow-[0_5px_18px_-12px_rgba(37,99,235,.65)]">
            {editing ? (
              <div className="min-w-[240px]">
                <textarea
                  aria-label="Edit your message"
                  value={editValue}
                  onChange={(event) => setEditValue(event.target.value)}
                  className="min-h-20 w-full resize-y rounded-lg border border-neutral-200 bg-white p-2.5 text-sm leading-6 text-neutral-900 outline-none focus:border-brand"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => { setEditValue(message.content); setEditing(false) }} className="h-8 rounded-lg border-0 px-2 text-white hover:text-white">
                    <IconX size={16} /> Cancel
                  </Button>
                  <Button type="button" variant="secondary" size="sm" loading={saving} onClick={saveEdit} className="h-8 rounded-lg px-3 text-xs">
                    <IconCheck size={15} /> Save
                  </Button>
                </div>
              </div>
            ) : <p className="whitespace-pre-wrap">{message.content}</p>}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Button type="button" variant="ghost" size="sm" aria-label={copied ? 'Copied' : 'Copy message'} title="Copy message" onClick={() => void copyMessage()} className="size-8 rounded-lg border-0 p-0 text-neutral-500 hover:text-brand">
              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            </Button>
            {canEdit && !editing && <Button type="button" variant="ghost" size="sm" aria-label="Edit message" title="Edit message" onClick={() => { setEditValue(message.content); setEditing(true) }} className="size-8 rounded-lg border-0 p-0 text-neutral-500 hover:text-brand"><IconPencil size={16} /></Button>}
            {onDelete && !editing && <Button type="button" variant="ghost" size="sm" aria-label="Delete message" title="Delete message" onClick={() => { setActionError(''); setConfirmAction('delete') }} className="size-8 rounded-lg border-0 p-0 text-neutral-500 hover:text-error"><IconTrash size={16} /></Button>}
          </div>
        </div>
        <span aria-label="You" title="You" className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-brand-wash text-brand-emphasis ring-1 ring-brand/15">
          <IconUserCircle size={21} stroke={1.7} />
        </span>
      </motion.div>
      <AnimatePresence>
        {confirmAction && <ConfirmActionModal
          key="user-message-action"
          title={confirmAction === 'edit' ? 'Save message changes?' : 'Delete this message?'}
          description={confirmAction === 'edit' ? 'Your updated message will be saved in this conversation.' : 'This message will be removed from the conversation.'}
          confirmLabel={confirmAction === 'edit' ? 'Save changes' : 'Delete message'}
          intent={confirmAction === 'delete' ? 'danger' : 'default'}
          busy={saving}
          error={actionError}
          onCancel={() => { if (!saving) setConfirmAction(null) }}
          onConfirm={() => void confirmActionRequest()}
        />}
      </AnimatePresence>
      </>
    )
  }

  return (
    <>
    <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="group flex items-start gap-3 py-4" aria-label="Shrey AI response">
      <Logo showName={false} size={28} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-neutral-800">
          {assistantContent(message.content)}
          {message.streaming && <span aria-label="Shrey AI is responding" className="ml-1 inline-block h-[1.1em] w-[2px] translate-y-[2px] animate-pulse bg-brand motion-reduce:animate-none" />}
        </div>
        {!message.streaming && message.content && (
          <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Button type="button" variant="ghost" size="sm" aria-label={speaking ? 'Stop reading response' : 'Read response aloud'} title={speaking ? 'Stop reading' : 'Read aloud'} onClick={toggleSpeak} className="size-8 rounded-lg border-0 p-0 text-neutral-500 hover:text-brand">
              {speaking ? <IconVolumeOff size={17} /> : <IconVolume size={17} />}
            </Button>
            <Button type="button" variant="ghost" size="sm" aria-label={copied ? 'Copied' : 'Copy response'} title="Copy response" onClick={() => void copyMessage()} className="size-8 rounded-lg border-0 p-0 text-neutral-500 hover:text-brand">
              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            </Button>
            {onDelete && <Button type="button" variant="ghost" size="sm" aria-label="Delete response" title="Delete response" onClick={() => { setActionError(''); setConfirmAction('delete') }} className="size-8 rounded-lg border-0 p-0 text-neutral-500 hover:text-error"><IconTrash size={16} /></Button>}
          </div>
        )}
      </div>
    </motion.article>
    <AnimatePresence>
      {confirmAction && <ConfirmActionModal
        key="assistant-message-action"
        title="Delete this response?"
        description="This response will be removed from the conversation."
        confirmLabel="Delete response"
        intent="danger"
        busy={saving}
        error={actionError}
        onCancel={() => { if (!saving) setConfirmAction(null) }}
        onConfirm={() => void confirmActionRequest()}
      />}
    </AnimatePresence>
    </>
  )
}
