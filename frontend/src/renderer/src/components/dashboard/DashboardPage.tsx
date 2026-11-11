import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { IconMenu2, IconShieldCheck } from '@tabler/icons-react'
import { apiClient } from '../../api/client'
import { getApiErrorMessage } from '../../api/errors'
import { useAuthSession } from '../../states/auth/sessionState'
import { Logo } from '../Logo'
import { ChatComposer } from './ChatComposer'
import { ChatMessage, type ChatMessageData } from './ChatMessage'
import { ChatSidebar, type ChatThread } from './ChatSidebar'
import { VoiceChatModal } from './VoiceChatModal'
import { ProfileModal } from '../profile/ProfileModal'

type ApiEnvelope<T> = { success: boolean; message?: string; data: T }
type ConversationRecord = ChatThread & { updatedAt?: string }
type SavedMessage = { id: string; role: 'user' | 'assistant'; content: string; voiceScript?: string; toolsUsed?: string[] }
type ChatApiResponse = { response: string; voice_script?: string; conversationId?: string; userMessageId?: string; assistantMessageId?: string; tools_executed?: string[] }

const shortTitle = (message: string): string => message.replace(/\s+/g, ' ').slice(0, 42) || 'New chat'

export function DashboardPage({ initialProfileOpen = false }: { initialProfileOpen?: boolean } = {}): React.JSX.Element {
  const session = useAuthSession((state) => state.session)
  const clearSession = useAuthSession((state) => state.clearSession)
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches)
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [busy, setBusy] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(initialProfileOpen)
  const [matchingThreadIds, setMatchingThreadIds] = useState<string[] | null>(null)
  const activeThreadRef = useRef<string | null>(null)
  const activeRequestRef = useRef(0)
  const searchRequestRef = useRef(0)
  const searchControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userName = session?.name?.trim() || 'there'
  const firstName = userName.split(/\s+/)[0]
  const activeThread = threads.find((thread) => thread.id === activeThreadId)

  useEffect(() => {
    let active = true
    apiClient.get<ApiEnvelope<ConversationRecord[]>>('/chat/conversations')
      .then(({ data }) => {
        if (active) setThreads(Array.isArray(data.data) ? data.data : [])
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const newChat = (): void => {
    activeRequestRef.current += 1
    activeThreadRef.current = null
    setActiveThreadId(null)
    setMessages([])
    setSidebarOpen(window.matchMedia('(min-width: 768px)').matches)
  }

  const selectThread = async (thread: ChatThread): Promise<void> => {
    activeRequestRef.current += 1
    activeThreadRef.current = thread.id
    setActiveThreadId(thread.id)
    setMessages([])
    setSidebarOpen(window.matchMedia('(min-width: 768px)').matches)
    try {
      const { data } = await apiClient.get<ApiEnvelope<{ messages: SavedMessage[] }>>(`/chat/conversations/${thread.id}`)
      if (activeThreadRef.current !== thread.id) return
      const saved = data.data?.messages ?? []
      setMessages(saved.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        voiceScript: message.voiceScript,
        toolsExecuted: message.toolsUsed,
      })))
    } catch (error) {
      if (activeThreadRef.current === thread.id) {
        setMessages([{ id: `error-${Date.now()}`, role: 'assistant', content: getApiErrorMessage(error) }])
      }
    }
  }

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  }, [])

  const closeVoice = useCallback(() => setVoiceOpen(false), [])

  const searchChats = useCallback(async (query: string): Promise<void> => {
    searchControllerRef.current?.abort()
    const requestId = ++searchRequestRef.current
    if (!query) {
      setMatchingThreadIds([])
      return
    }
    const controller = new AbortController()
    searchControllerRef.current = controller
    setMatchingThreadIds(null)
    try {
      const matches = await Promise.all(threads.map(async (thread) => {
        if (thread.title.toLowerCase().includes(query.toLowerCase())) return thread.id
        const { data } = await apiClient.get<ApiEnvelope<{ messages: SavedMessage[] }>>(
          `/chat/conversations/${thread.id}`,
          { signal: controller.signal },
        )
        return data.data?.messages.some((message) => message.content.toLowerCase().includes(query.toLowerCase()))
          ? thread.id
          : null
      }))
      if (searchRequestRef.current === requestId) setMatchingThreadIds(matches.filter((id): id is string => Boolean(id)))
    } catch {
      if (searchRequestRef.current === requestId && !controller.signal.aborted) {
        setMatchingThreadIds(threads.filter((thread) => thread.title.toLowerCase().includes(query.toLowerCase())).map((thread) => thread.id))
      }
    }
  }, [threads])

  const sendMessage = async (content: string, voiceMode = false): Promise<void> => {
    if (busy) return
    setBusy(true)
    const requestId = ++activeRequestRef.current

    let threadId = activeThreadRef.current
    const userMessage: ChatMessageData = { id: `user-${Date.now()}`, role: 'user', content }
    const responseId = `assistant-${Date.now()}`
    const responsePlaceholder: ChatMessageData = { id: responseId, role: 'assistant', content: '', streaming: true }
    setMessages((current) => [...current, userMessage, responsePlaceholder])

    try {
      if (!threadId) {
        const { data } = await apiClient.post<ApiEnvelope<ConversationRecord>>('/chat/conversations', {
          title: shortTitle(content),
          modelProvider: 'groq',
        })
        threadId = data.data.id
        if (activeRequestRef.current === requestId) {
          activeThreadRef.current = threadId
          setActiveThreadId(threadId)
        }
        setThreads((current) => [data.data, ...current.filter((thread) => thread.id !== data.data.id)])
      }

      const { data } = await apiClient.post<ChatApiResponse>('/ai/chat', {
        message: content,
        conversationId: threadId,
        provider: 'groq',
        include_voice_script: true,
      })
      const answer = data.response || 'I could not find a response for that message.'
      const voiceScript = data.voice_script
      const chunkSize = 5
      if (data.userMessageId) {
        setMessages((current) => current.map((message) => message.id === userMessage.id
          ? { ...message, id: data.userMessageId as string }
          : message))
      }

      for (let index = 0; index < answer.length; index += chunkSize) {
        if (activeRequestRef.current !== requestId || activeThreadRef.current !== threadId) break
        const visibleText = answer.slice(0, index + chunkSize)
        setMessages((current) => current.map((message) => message.id === responseId
          ? { ...message, content: visibleText, voiceScript }
          : message))
        await new Promise((resolve) => window.setTimeout(resolve, 14))
      }
      if (activeRequestRef.current === requestId && activeThreadRef.current === threadId) {
        setMessages((current) => current.map((message) => message.id === responseId
          ? {
              ...message,
              id: data.assistantMessageId || message.id,
              content: answer,
              voiceScript,
              toolsExecuted: data.tools_executed || [],
              streaming: false,
            }
          : message))
        if (voiceMode) speak(voiceScript || answer)
      }
      setThreads((current) => current.map((thread) => thread.id === threadId
        ? { ...thread, title: thread.title === 'New Chat' ? shortTitle(content) : thread.title, updatedAt: new Date().toISOString() }
        : thread))
    } catch (error) {
      if (activeRequestRef.current === requestId && (activeThreadRef.current === threadId || !threadId)) {
        const message = getApiErrorMessage(error)
        setMessages((current) => current.map((item) => item.id === responseId
          ? { ...item, content: message, streaming: false }
          : item))
      }
    } finally {
      setBusy(false)
    }
  }

  const editMessage = async (id: string, content: string): Promise<void> => {
    await apiClient.put(`/chat/messages/${id}`, { content })
    setMessages((current) => current.map((message) => message.id === id ? { ...message, content } : message))
  }

  const deleteMessage = async (message: ChatMessageData): Promise<void> => {
    await apiClient.delete(`/chat/messages/${message.id}`)
    setMessages((current) => current.filter((item) => item.id !== message.id))
  }

  const renameThread = async (thread: ChatThread, title: string): Promise<void> => {
    const { data } = await apiClient.put<ApiEnvelope<ConversationRecord>>(`/chat/conversations/${thread.id}`, { title })
    setThreads((current) => current.map((item) => item.id === thread.id ? { ...item, title: data.data.title } : item))
  }

  const deleteThread = async (thread: ChatThread): Promise<void> => {
    await apiClient.delete(`/chat/conversations/${thread.id}`)
    setThreads((current) => current.filter((item) => item.id !== thread.id))
    if (activeThreadRef.current === thread.id) newChat()
  }

  const logOut = (): void => {
    window.speechSynthesis?.cancel()
    clearSession()
    window.location.hash = '/'
  }

  const isWelcome = messages.length === 0

  return (
    <motion.main layout className="flex h-dvh w-full overflow-hidden bg-neutral-100 font-mono text-copy">
      <AnimatePresence initial={false}>
        {sidebarOpen && <ChatSidebar
          key="chat-sidebar"
          threads={threads}
          activeThreadId={activeThreadId}
          userName={userName}
          matchingThreadIds={matchingThreadIds}
          onNewChat={newChat}
          onSelectThread={selectThread}
          onRenameThread={renameThread}
          onDeleteThread={deleteThread}
          onSearchQuery={searchChats}
          onOpenProfile={() => setProfileOpen(true)}
          onLogout={logOut}
          onClose={() => setSidebarOpen(false)}
        />}
      </AnimatePresence>

      <motion.section layout transition={{ type: 'spring', stiffness: 420, damping: 38 }} className="flex min-w-0 flex-1 flex-col bg-neutral-50">
        <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-divider bg-white/80 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              className="grid size-9 shrink-0 place-items-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand"
            >
              <IconMenu2 size={20} stroke={1.8} />
            </button>
            <span className="truncate text-sm font-medium text-neutral-800">{activeThread?.title || 'Shrey AI'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Open Profile and Protection Settings"
              title="Profile & Protection Settings"
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-mono font-medium text-neutral-700 shadow-2xs transition-colors hover:border-brand hover:bg-brand-wash hover:text-brand-emphasis focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span className="grid size-6 place-items-center rounded-full bg-brand-wash text-xs font-semibold text-brand-emphasis">
                {userName.trim().charAt(0).toUpperCase() || 'S'}
              </span>
              <span className="hidden sm:inline font-semibold">{firstName}</span>
              <IconShieldCheck size={16} className="text-brand" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
        {isWelcome ? (
          <motion.div key="welcome" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 pb-8 pt-10 sm:px-8">
            <div className="mb-4 flex items-center gap-3">
              <Logo showName={false} size={42} />
              <h1 className="font-display text-[32px] font-medium tracking-[-0.045em] text-neutral-900 sm:text-[38px]">
                Good evening, {firstName}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-3.5 py-1 text-xs font-mono text-neutral-600 shadow-2xs transition-colors hover:border-brand hover:bg-white hover:text-brand-emphasis"
            >
              <IconShieldCheck size={14} className="text-brand" />
              <span>Profile & Protection Layer</span>
            </button>
            <ChatComposer centered busy={busy} onSend={(message) => void sendMessage(message)} onVoiceStart={() => setVoiceOpen(true)} />
          </motion.div>
        ) : (
          <motion.div key="conversation" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-8">
              <div className="mx-auto max-w-[800px] pb-8 pt-7">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onSpeak={speak}
                    onEdit={message.role === 'user' ? (content) => editMessage(message.id, content) : undefined}
                    onDelete={!message.id.startsWith('user-') ? () => deleteMessage(message) : undefined}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="shrink-0 px-4 pb-3 pt-2 sm:px-8 sm:pb-5">
              <div className="mx-auto flex max-w-[820px] justify-center">
                <ChatComposer busy={busy} onSend={(message) => void sendMessage(message)} onVoiceStart={() => setVoiceOpen(true)} />
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </motion.section>
      <AnimatePresence initial={false}>
        {voiceOpen && <VoiceChatModal key="voice-chat" onClose={closeVoice} onSend={(message, voiceMode) => void sendMessage(message, voiceMode)} />}
      </AnimatePresence>
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </motion.main>
  )
}
