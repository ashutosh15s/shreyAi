import { useEffect, useState } from 'react'
import {
  IconUser,
  IconShieldLock,
  IconShieldCheck,
  IconX,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconPlayerPlay,
  IconLogout2,
} from '@tabler/icons-react'
import {
  fetchUserProfile,
  updateUserProfile,
  changeUserPassword,
  resolveActionConfirmation,
  type ActionConfirmationResult,
} from '../../api/profile'
import { getApiErrorMessage } from '../../api/errors'
import { useAuthSession } from '../../states/auth/sessionState'
import { Button } from '../button'

type TabType = 'account' | 'security' | 'protection'

type PendingAction = {
  actionId: string
  actionType: string
  params: Record<string, unknown>
  title: string
  description: string
}

type ProfileModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps): React.JSX.Element | null {
  const session = useAuthSession((state) => state.session)
  const updateSessionUser = useAuthSession((state) => state.updateSessionUser)
  const clearSession = useAuthSession((state) => state.clearSession)

  const [activeTab, setActiveTab] = useState<TabType>('account')
  const [loadingProfile, setLoadingProfile] = useState(false)

  // Account tab state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [accountMsg, setAccountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savingAccount, setSavingAccount] = useState(false)

  // Security tab state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  // Protection layer state
  const [protectionEnabled, setProtectionEnabled] = useState(true)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>({
    actionId: 'act-sample-empty-bin',
    actionType: 'empty_recycle_bin',
    params: { confirm: true },
    title: 'Empty Recycle Bin',
    description: 'Permanently remove all files currently in the Windows Recycle Bin.',
  })
  const [confirmationBusy, setConfirmationBusy] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<ActionConfirmationResult | null>(null)
  const [confirmMsg, setConfirmMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!isOpen) return
    loadProfile()
  }, [isOpen])

  const loadProfile = async (): Promise<void> => {
    setLoadingProfile(true)
    setAccountMsg(null)
    try {
      const data = await fetchUserProfile()
      setName(data.name || '')
      setEmail(data.email || '')
    } catch {
      if (session) {
        setName(session.name || '')
        setEmail(session.email || '')
      }
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setAccountMsg({ type: 'error', text: 'Name and email are required.' })
      return
    }
    setSavingAccount(true)
    setAccountMsg(null)
    try {
      const updated = await updateUserProfile(name.trim(), email.trim())
      updateSessionUser({ name: updated.name, email: updated.email })
      setAccountMsg({ type: 'success', text: 'Profile updated successfully.' })
    } catch (err) {
      setAccountMsg({ type: 'error', text: getApiErrorMessage(err) })
    } finally {
      setSavingAccount(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!oldPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all password fields.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    setSavingPassword(true)
    setPasswordMsg(null)
    try {
      await changeUserPassword(oldPassword, newPassword)
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordMsg({ type: 'error', text: getApiErrorMessage(err) })
    } finally {
      setSavingPassword(false)
    }
  }

  const handleResolveAction = async (approved: boolean): Promise<void> => {
    if (!pendingAction) return
    setConfirmationBusy(true)
    setConfirmMsg(null)
    try {
      const result = await resolveActionConfirmation({
        actionId: pendingAction.actionId,
        actionType: pendingAction.actionType,
        params: pendingAction.params,
        approved,
        reason: approved ? 'Approved by user' : 'Denied by user',
      })
      setConfirmationResult(result)
      setPendingAction(null)
      setConfirmMsg({
        type: approved ? 'success' : 'error',
        text: approved
          ? `Action approved and executed: ${result.response}`
          : `Action denied. Request was cancelled.`,
      })
    } catch (err) {
      setConfirmMsg({ type: 'error', text: getApiErrorMessage(err) })
    } finally {
      setConfirmationBusy(false)
    }
  }

  const simulateNewConfirmation = (actionType: 'empty_recycle_bin' | 'kill_process' | 'lock_workstation'): void => {
    const titles: Record<string, string> = {
      empty_recycle_bin: 'Empty Recycle Bin',
      kill_process: 'Kill Background Process',
      lock_workstation: 'Lock Workstation',
    }
    const descriptions: Record<string, string> = {
      empty_recycle_bin: 'Permanently remove all files in the Windows Recycle Bin to free up disk space.',
      kill_process: 'Terminate running process notepad.exe from memory.',
      lock_workstation: 'Immediately lock the Windows computer screen.',
    }
    const sampleParams: Record<string, Record<string, unknown>> = {
      empty_recycle_bin: { confirm: true },
      kill_process: { process_name: 'notepad.exe' },
      lock_workstation: {},
    }
    setConfirmationResult(null)
    setConfirmMsg(null)
    setPendingAction({
      actionId: `act-${Date.now()}`,
      actionType,
      params: sampleParams[actionType],
      title: titles[actionType],
      description: descriptions[actionType],
    })
  }

  const handleLogout = (): void => {
    window.speechSynthesis?.cancel()
    clearSession()
    onClose()
    window.location.hash = '/login'
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4 sm:p-6"
    >
      <div className="relative flex h-[560px] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-divider bg-neutral-100 shadow-2xl md:flex-row">
        {/* Left Navigation Sidebar */}
        <aside className="flex w-full flex-col justify-between border-b border-divider bg-white p-4 md:w-60 md:border-b-0 md:border-r md:p-6">
          <div>
            <div className="mb-6 flex items-center justify-between md:block">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-wash text-base font-bold text-brand-emphasis">
                  {(name || session?.name || 'S').trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-display text-sm font-semibold text-neutral-900">
                    {name || session?.name || 'User Profile'}
                  </h3>
                  <p className="truncate text-xs text-neutral-500 font-mono">
                    {email || session?.email || ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="grid size-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 md:hidden"
              >
                <IconX size={18} />
              </button>
            </div>

            <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col md:space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'account'
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <IconUser size={18} />
                <span>Account</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <IconShieldLock size={18} />
                <span>Security</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('protection')}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'protection'
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconShieldCheck size={18} />
                  <span>Protection Layer</span>
                </div>
                {pendingAction && (
                  <span className="grid size-2 rounded-full bg-amber-400" title="Action pending approval" />
                )}
              </button>
            </nav>
          </div>

          {/* Logout Button */}
          <div className="pt-4 border-t border-divider mt-4 md:mt-0">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              <IconLogout2 size={18} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Content Pane */}
        <section className="relative flex flex-1 flex-col overflow-y-auto bg-neutral-50 p-6 md:p-8">
          {/* Desktop Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile dialog"
            className="absolute right-5 top-5 hidden size-8 place-items-center rounded-xl text-neutral-400 hover:bg-neutral-200/60 hover:text-neutral-800 md:grid"
          >
            <IconX size={20} />
          </button>

          {/* TAB 1: ACCOUNT */}
          {activeTab === 'account' && (
            <div className="max-w-md">
              <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
                Personal Information
              </h2>
              <p className="mt-1 text-sm font-mono text-neutral-600">
                Update your name and email address.
              </p>

              {accountMsg && (
                <div
                  className={`mt-4 flex items-center gap-2.5 rounded-xl p-3 text-sm font-mono ${
                    accountMsg.type === 'success'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  {accountMsg.type === 'success' ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}
                  <span>{accountMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loadingProfile || savingAccount}
                    className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm font-mono text-neutral-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loadingProfile || savingAccount}
                    className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm font-mono text-neutral-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    placeholder="user@example.com"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={savingAccount}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SECURITY */}
          {activeTab === 'security' && (
            <div className="max-w-md">
              <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
                Security & Password
              </h2>
              <p className="mt-1 text-sm font-mono text-neutral-600">
                Change your account password.
              </p>

              {passwordMsg && (
                <div
                  className={`mt-4 flex items-center gap-2.5 rounded-xl p-3 text-sm font-mono ${
                    passwordMsg.type === 'success'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  {passwordMsg.type === 'success' ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    disabled={savingPassword}
                    className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm font-mono text-neutral-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={savingPassword}
                    className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm font-mono text-neutral-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={savingPassword}
                    className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm font-mono text-neutral-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    placeholder="Re-type new password"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={savingPassword}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PROTECTION LAYER */}
          {activeTab === 'protection' && (
            <div className="max-w-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
                    Protection Layer
                  </h2>
                  <p className="mt-1 text-sm font-mono text-neutral-600">
                    Require approval before AI performs sensitive tasks on your computer.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold font-mono text-neutral-700">
                    {protectionEnabled ? 'Active' : 'Disabled'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProtectionEnabled((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      protectionEnabled ? 'bg-brand' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                        protectionEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {confirmMsg && (
                <div
                  className={`mt-4 flex items-center gap-2.5 rounded-xl p-3 text-sm font-mono ${
                    confirmMsg.type === 'success'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  <IconInfoCircle size={18} />
                  <span>{confirmMsg.text}</span>
                </div>
              )}

              {/* Action Approval Card */}
              <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-amber-500 text-white">
                    <IconAlertTriangle size={16} />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
                    Permission Request
                  </span>
                </div>

                {pendingAction ? (
                  <div className="mt-4">
                    <h3 className="text-base font-semibold text-neutral-900 font-display">
                      {pendingAction.title}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600 font-mono">
                      {pendingAction.description}
                    </p>

                    <div className="mt-5 flex items-center gap-3">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        loading={confirmationBusy}
                        onClick={() => handleResolveAction(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <IconCheck size={16} className="mr-1.5" /> Approve Action
                      </Button>
                      <button
                        type="button"
                        disabled={confirmationBusy}
                        onClick={() => handleResolveAction(false)}
                        className="h-9 rounded-xl border border-rose-300 bg-rose-50 px-4 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-neutral-500 font-mono">
                    No pending sensitive action right now.
                  </div>
                )}
              </div>

              {/* Execution Result summary */}
              {confirmationResult && (
                <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-100/70 p-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase">Result</p>
                  <p className="mt-1 text-sm font-medium text-neutral-800 font-mono">
                    {confirmationResult.response}
                  </p>
                </div>
              )}

              {/* Quick simulation buttons */}
              <div className="mt-6 border-t border-divider pt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Test Protection Layer
                </h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => simulateNewConfirmation('empty_recycle_bin')}
                    className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-brand"
                  >
                    <IconPlayerPlay size={14} className="text-brand" /> Empty Recycle Bin
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateNewConfirmation('kill_process')}
                    className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-brand"
                  >
                    <IconPlayerPlay size={14} className="text-brand" /> Kill Process
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateNewConfirmation('lock_workstation')}
                    className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-brand"
                  >
                    <IconPlayerPlay size={14} className="text-brand" /> Lock Workstation
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
