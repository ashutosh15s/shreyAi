import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform } from 'motion/react'
import { IconMicrophone, IconMicrophoneOff, IconX } from '@tabler/icons-react'
import { Button } from '../button'
import { useChatVoice } from '../../hooks/ui/useChatVoice'

type VoiceChatModalProps = {
  onClose: () => void
  onSend: (message: string, voiceMode: boolean) => void
}

export function VoiceChatModal({ onClose, onSend }: VoiceChatModalProps): React.JSX.Element {
  const [transcript, setTranscript] = useState('')
  const [permission, setPermission] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
  const [permissionMessage, setPermissionMessage] = useState('')
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const frameRef = useRef<number>(0)
  const level = useMotionValue(0)
  const blobScale = useTransform(level, [0, 0.15, 0.7], [1, 1.08, 1.32])
  const { listening, supported, toggleListening } = useChatVoice(useCallback((text: string) => setTranscript(text), []))

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      void audioContextRef.current?.close()
    }
  }, [onClose])

  const requestMicrophone = async (): Promise<void> => {
    setPermission('requesting')
    setPermissionMessage('')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone access is unavailable in this environment.')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const context = new AudioContext()
      audioContextRef.current = context
      await context.resume()
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      context.createMediaStreamSource(stream).connect(analyser)
      const samples = new Uint8Array(analyser.fftSize)
      const measure = (): void => {
        analyser.getByteTimeDomainData(samples)
        let sum = 0
        for (let index = 0; index < samples.length; index += 1) {
          const amplitude = (samples[index] - 128) / 128
          sum += amplitude * amplitude
        }
        level.set(Math.min(1, Math.sqrt(sum / samples.length) * 4.2))
        frameRef.current = requestAnimationFrame(measure)
      }
      frameRef.current = requestAnimationFrame(measure)
      setPermission('granted')
      if (supported) toggleListening()
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setPermission('denied')
      setPermissionMessage(error instanceof Error ? error.message : 'Allow microphone access in system settings, then try again.')
    }
  }

  const submit = (): void => {
    const message = transcript.trim()
    if (!message) return
    onSend(message, true)
    onClose()
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 grid place-items-center bg-brand-ink/30 p-3 backdrop-blur-sm sm:p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-chat-title"
          initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          onClick={(event) => event.stopPropagation()}
          className="relative flex max-h-[min(92dvh,760px)] w-full max-w-[540px] flex-col overflow-y-auto rounded-[28px] border border-white/80 bg-white px-5 pb-5 pt-6 shadow-[0_28px_100px_-32px_rgba(23,43,77,.38)] sm:px-8 sm:pb-7 sm:pt-7"
        >
          <button type="button" aria-label="Close voice chat" onClick={onClose} className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand">
            <IconX size={19} />
          </button>
          <div className="text-center">
            <h2 id="voice-chat-title" className="font-display text-2xl font-semibold tracking-[-0.035em] text-neutral-900">Voice chat</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Speak naturally. Shrey AI will turn your words into a message.</p>
          </div>

          <div className="relative mx-auto my-5 grid size-[180px] place-items-center sm:my-7 sm:size-[210px]">
            <motion.div
              aria-hidden="true"
              animate={{ scale: listening ? [1, 1.12, 1] : [1, 1.04, 1], opacity: listening ? [0.17, 0.34, 0.17] : [0.12, 0.2, 0.12] }}
              transition={{ repeat: Infinity, duration: listening ? 1.35 : 3.2, ease: 'easeInOut' }}
              className="absolute inset-3 rounded-full bg-brand-wash"
            />
            <motion.div
              aria-hidden="true"
              style={{ scale: blobScale }}
              className="relative grid size-28 place-items-center rounded-[42%_58%_62%_38%/44%_42%_58%_56%] bg-[radial-gradient(circle_at_32%_25%,#9ac1ff_0%,#5b93ff_36%,#407cf9_74%,#2563eb_100%)] shadow-[0_18px_44px_-20px_rgba(64,124,249,.7)] sm:size-32"
            >
              <motion.div aria-hidden="true" animate={{ rotate: listening ? [0, 5, -4, 0] : 0 }} transition={{ repeat: listening ? Infinity : 0, duration: 2.3, ease: 'easeInOut' }}>
                <IconMicrophone size={34} stroke={1.7} className="text-white" />
              </motion.div>
            </motion.div>
          </div>

          <p aria-live="polite" className="min-h-6 text-center text-sm font-medium text-brand-emphasis">
            {permission === 'requesting' ? 'Requesting microphone access…' : listening ? 'Listening…' : permission === 'granted' ? 'Ready when you are' : 'Microphone permission is needed to start'}
          </p>

          {permission !== 'granted' ? (
            <div className="mx-auto mt-4 w-full max-w-sm text-center">
              {permissionMessage && <p role="alert" className="mb-3 text-sm leading-5 text-error">{permissionMessage}</p>}
              <Button type="button" variant="primary" size="sm" width="full" loading={permission === 'requesting'} onClick={() => void requestMicrophone()}>
                {permission === 'denied' ? 'Try microphone access again' : 'Allow microphone'}
              </Button>
            </div>
          ) : (
            <>
              {!supported && <p className="mt-3 text-center text-sm text-neutral-600">Voice transcription is unavailable here. Type your message below instead.</p>}
              <label htmlFor="voice-transcript" className="sr-only">Voice transcript</label>
              <textarea
                id="voice-transcript"
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                placeholder={supported ? 'Your words will appear here…' : 'Type a message…'}
                className="mt-4 min-h-24 w-full resize-y rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-900 outline-none placeholder:text-neutral-500 focus:border-brand"
              />
              <div className="mt-4 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
                <Button type="button" variant="outline" size="sm" onClick={() => listening ? toggleListening() : supported && toggleListening()} className="gap-2">
                  {listening ? <IconMicrophoneOff size={17} /> : <IconMicrophone size={17} />}
                  {listening ? 'Stop listening' : 'Listen again'}
                </Button>
                <Button type="button" variant="primary" size="sm" disabled={!transcript.trim()} onClick={submit}>
                  Send to Shrey AI
                </Button>
              </div>
            </>
          )}
        </motion.section>
      </motion.div>
    </>
  )
}
