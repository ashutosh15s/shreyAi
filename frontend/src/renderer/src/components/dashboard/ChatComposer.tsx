import { useState } from 'react'
import { IconArrowUp, IconMicrophone } from '@tabler/icons-react'
import { Button } from '../button'

type ChatComposerProps = {
  busy: boolean
  centered?: boolean
  onSend: (message: string) => void
  onVoiceStart?: () => void
}

export function ChatComposer({ busy, centered = false, onSend, onVoiceStart }: ChatComposerProps): React.JSX.Element {
  const [value, setValue] = useState('')

  const send = (): void => {
    const message = value.trim()
    if (!message || busy) return
    onSend(message)
    setValue('')
  }

  return (
    <form
      onSubmit={(event) => { event.preventDefault(); send() }}
      className={`w-full ${centered ? 'max-w-[760px]' : 'max-w-[820px]'}`}
    >
      <div className="rounded-[24px] border border-neutral-300 bg-white shadow-[0_10px_36px_-28px_rgba(23,43,77,.32)] transition-colors focus-within:border-neutral-400">
        <label className="sr-only" htmlFor="chat-message">Message Shrey AI</label>
        <textarea
          id="chat-message"
          rows={centered ? 2 : 1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              send()
            }
          }}
          disabled={busy}
          placeholder="Message Shrey AI"
          className={`block max-h-48 w-full resize-none bg-transparent px-5 text-[15px] leading-6 text-neutral-900 outline-none placeholder:text-neutral-500 disabled:opacity-60 ${centered ? 'min-h-[72px] pt-4' : 'min-h-[42px] pt-2.5'}`}
        />
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <span className="pl-2 text-xs text-neutral-500" />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Start voice chat"
              title="Start voice chat"
              disabled={busy}
              onClick={onVoiceStart}
              className="!h-10 !w-10 !px-0 !py-0 rounded-full border-0 text-neutral-700 hover:text-brand"
            >
              <IconMicrophone size={20} />
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              aria-label="Send message"
              disabled={!value.trim() || busy}
              className="!h-10 !w-10 !px-0 !py-0 rounded-full border-0 shadow-none"
            >
              {busy ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
              ) : <IconArrowUp size={20} stroke={2.2} />}
            </Button>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-neutral-500">Shrey AI can make mistakes. Check important details.</p>
    </form>
  )
}
