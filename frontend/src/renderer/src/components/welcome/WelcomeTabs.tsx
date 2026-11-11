import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { IconApps, IconCompass, IconUserCircle, IconWorldSearch } from '@tabler/icons-react'

const tabs = [
  { id: 'search-web', label: 'Search web', Icon: IconWorldSearch, description: 'Find answers, current events, weather, and useful pages across the web.' },
  { id: 'discover', label: 'Discover', Icon: IconCompass, description: 'Explore live weather, crypto prices, and trending stories in one conversation.' },
  { id: 'desktop-apps', label: 'Open desktop apps', Icon: IconApps, description: 'Launch apps, control media, work with files, and take quick desktop actions.' },
  { id: 'profile', label: 'Profile', Icon: IconUserCircle, description: 'Manage your Shrey AI account and personal settings.' },
] as const

export function WelcomeTabs(): React.JSX.Element {
  const instanceId = useId().replaceAll(':', '')
  const [hoveredTab, setHoveredTab] = useState<(typeof tabs)[number]['id'] | null>(null)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const previewTab = tabs.find((tab) => tab.id === (hoveredTab ?? 'search-web')) ?? tabs[0]
  const pillId = `welcome-tab-pill-${instanceId}`
  const panelId = `welcome-tab-panel-${instanceId}`

  const selectByKeyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === null) return

    event.preventDefault()
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div
        role="group"
        aria-label="Explore Shrey AI"
        onMouseLeave={() => setHoveredTab(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHoveredTab(null)
        }}
        className="mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/70 bg-white/55 p-1.5 shadow-[0_14px_42px_-30px_rgba(23,43,77,.48)] backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab, index) => {
          const highlighted = (hoveredTab ?? 'search-web') === tab.id
          const Icon = tab.Icon
          return (
            <motion.button
              key={tab.id}
              ref={(element) => { tabRefs.current[index] = element }}
              type="button"
              aria-controls={panelId}
              tabIndex={0}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onFocus={() => setHoveredTab(tab.id)}
              onKeyDown={(event) => selectByKeyboard(event, index)}
              whileTap={{ scale: 0.98 }}
              className={`relative isolate shrink-0 rounded-full px-4 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white/70 sm:px-5 ${highlighted ? 'text-neutral-900' : 'text-neutral-700 hover:text-neutral-900'}`}
            >
              {highlighted && (
                <motion.span
                  layoutId={pillId}
                  aria-hidden="true"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 430, damping: 34 }}
                  className="absolute inset-0 -z-10 rounded-full bg-white shadow-[0_3px_12px_-7px_rgba(23,43,77,.38)] ring-1 ring-neutral-900/[0.04]"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-2 whitespace-nowrap">
                <Icon size={17} stroke={1.8} aria-hidden="true" />
                {tab.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={panelId}
        aria-label={`${previewTab.label} details`}
        className="mt-4 min-h-12 px-4 text-center text-sm leading-6 text-neutral-700 [text-shadow:0_1px_12px_rgba(255,255,255,0.8)]"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={previewTab.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {previewTab.description}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
