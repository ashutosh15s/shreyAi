import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthResponse } from '../../api/auth'

type AuthSessionState = {
  session: AuthResponse | null
  setSession: (session: AuthResponse) => void
  updateSessionUser: (user: Partial<Pick<AuthResponse, 'name' | 'email' | 'role'>>) => void
  clearSession: () => void
}

export const useAuthSession = create<AuthSessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      updateSessionUser: (user) =>
        set((state) => ({
          session: state.session ? { ...state.session, ...user } : null,
        })),
      clearSession: () => set({ session: null }),
    }),
    {
      name: 'shrey_ai_auth_session',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
