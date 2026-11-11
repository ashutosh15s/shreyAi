import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import {
  IconMessageCircle,
  IconPlus,
  IconSearch,
  IconX,
  IconLogout2,
  IconPencil,
  IconTrash,
  IconCheck,
} from '@tabler/icons-react'
import { Logo } from '../Logo'

export type ChatThread = {
  id: string
  title: string
  updatedAt?: string
}

type ChatSidebarProps = {
  open?: boolean
  threads: ChatThread[]
  activeThreadId: string | null
  userName: string
  matchingThreadIds?: string[] | null
  onNewChat: () => void
  onSelectThread: (thread: ChatThread) => void
  onRenameThread?: (thread: ChatThread, title: string) => void
  onDeleteThread?: (thread: ChatThread) => void
  onSearchQuery?: (query: string) => void
  onOpenProfile?: () => void
  onLogout: () => void
  onClose: () => void
}

export function ChatSidebar({
  open = true,
  threads,
  activeThreadId,
  userName,
  matchingThreadIds = null,
  onNewChat,
  onSelectThread,
  onRenameThread,
  onDeleteThread,
  onSearchQuery,
  onOpenProfile,
  onLogout,
  onClose,
}: ChatSidebarProps): React.JSX.Element | null {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    if (!onSearchQuery) return
    const timer = window.setTimeout(() => onSearchQuery(query.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [onSearchQuery, query])

  if (!open) return null

  const filteredThreads = threads.filter((thread) => !query.trim()
    || thread.title.toLowerCase().includes(query.trim().toLowerCase())
    || matchingThreadIds?.includes(thread.id))

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-30 bg-neutral-900/20 md:hidden"
      />
      <motion.aside
        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="fixed inset-y-0 left-0 z-40 flex w-[276px] flex-col border-r border-divider bg-white px-3 py-4 md:static md:z-auto md:h-full md:shrink-0"
      >
        <div className="flex items-center justify-between px-2">
          <Logo size={34} className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand" />
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand md:hidden"
          >
            <IconX size={19} />
          </button>
        </div>

        <div className="mt-9 space-y-1">
          <button
            type="button"
            onClick={onNewChat}
            className="flex h-11 w-full items-center gap-3 rounded-xl bg-brand-wash px-3 text-left text-sm font-medium text-brand-emphasis transition-colors hover:bg-brand-wash-strong focus-visible:outline-2 focus-visible:outline-brand"
          >
            <IconPlus size={20} stroke={1.8} />
            New chat
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen((value) => !value)}
            className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <IconSearch size={19} stroke={1.8} />
            Search chats
          </button>
          {searchOpen && (
            <input
              autoFocus
              aria-label="Search conversations"
              placeholder="Find a conversation"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="my-1 h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-500 focus:border-brand"
            />
          )}
        </div>

        <div className="mt-8 min-h-0 flex-1">
          <h2 className="px-3 text-xs font-semibold text-neutral-500">Recent chats</h2>
          <nav aria-label="Recent conversations" className="mt-2 space-y-1 overflow-y-auto">
            {filteredThreads.length ? filteredThreads.map((thread) => (
              <div key={thread.id} className={`group flex min-h-10 items-center rounded-xl pr-1 transition-colors ${activeThreadId === thread.id ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
                {editingId === thread.id ? (
                  <form className="flex min-w-0 flex-1 items-center gap-1 px-2" onSubmit={(event) => { event.preventDefault(); if (editTitle.trim()) onRenameThread?.(thread, editTitle.trim()); setEditingId(null) }}>
                    <input autoFocus aria-label="Rename chat" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="h-8 min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-2 text-sm outline-none focus:border-brand" />
                    <button type="submit" aria-label="Save chat name" className="grid size-8 shrink-0 place-items-center rounded-lg text-brand-emphasis hover:bg-brand-wash"><IconCheck size={16} /></button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectThread(thread)}
                    title={thread.title}
                    className={`flex h-10 min-w-0 flex-1 items-center gap-2.5 overflow-hidden rounded-xl px-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-brand ${activeThreadId === thread.id ? 'text-neutral-900' : 'text-neutral-700'}`}
                  >
                    <IconMessageCircle size={18} className="shrink-0 text-neutral-500" stroke={1.7} />
                    <span className="truncate">{thread.title}</span>
                  </button>
                )}
                {editingId !== thread.id && <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <button type="button" aria-label={`Rename ${thread.title}`} title="Rename" onClick={() => { setEditingId(thread.id); setEditTitle(thread.title) }} className="grid size-8 place-items-center rounded-lg text-neutral-500 hover:bg-white hover:text-brand-emphasis focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-brand"><IconPencil size={15} /></button>
                  <button type="button" aria-label={`Delete ${thread.title}`} title="Delete" onClick={() => onDeleteThread?.(thread)} className="grid size-8 place-items-center rounded-lg text-neutral-500 hover:bg-white hover:text-error focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-brand"><IconTrash size={15} /></button>
                </div>}
              </div>
            )) : (
              <p className="px-3 py-3 text-xs leading-5 text-neutral-500">
                {query ? (matchingThreadIds === null ? 'Searching conversations…' : 'No chats match that search.') : 'Your conversations will appear here.'}
              </p>
            )}
          </nav>
        </div>

        <div className="border-t border-divider pt-3">
          <div className="flex items-center gap-2 px-1 py-1">
            <button
              type="button"
              onClick={onOpenProfile}
              title="Open Profile & Settings"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-wash text-sm font-semibold text-brand-emphasis">
                {userName.trim().charAt(0).toUpperCase() || 'S'}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-neutral-800">{userName || 'Shrey AI user'}</span>
                <span className="block truncate text-[11px] text-neutral-500">Profile & Protection</span>
              </div>
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sign out"
              title="Sign out"
              className="grid size-9 shrink-0 place-items-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-brand"
            >
              <IconLogout2 size={19} stroke={1.7} />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
