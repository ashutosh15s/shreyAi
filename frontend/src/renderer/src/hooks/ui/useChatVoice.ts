import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechResultEvent = Event & {
  resultIndex: number
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

type SpeechRecognizer = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechResultEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognizer
  webkitSpeechRecognition?: new () => SpeechRecognizer
}

export function useChatVoice(onTranscript: (text: string) => void) {
  const recognition = useRef<SpeechRecognizer | null>(null)
  const [listening, setListening] = useState(false)
  const supported = typeof window !== 'undefined' && Boolean((window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition)

  useEffect(() => () => recognition.current?.stop(), [])

  const toggleListening = useCallback(() => {
    if (listening) {
      recognition.current?.stop()
      setListening(false)
      return
    }

    const SpeechRecognition = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const nextRecognition = new SpeechRecognition()
    nextRecognition.continuous = false
    nextRecognition.interimResults = true
    nextRecognition.lang = 'en-US'
    nextRecognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join('')
      if (transcript) onTranscript(transcript)
    }
    nextRecognition.onend = () => setListening(false)
    nextRecognition.onerror = () => setListening(false)
    recognition.current = nextRecognition
    try {
      nextRecognition.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [listening, onTranscript])

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => window.speechSynthesis?.cancel(), [])

  return { listening, supported, toggleListening, speak, stopSpeaking }
}
