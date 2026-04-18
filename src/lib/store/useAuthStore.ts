import { create } from 'zustand'

interface AuthState {
  isUnlocked: boolean
  unlock: (pin: string) => boolean
  lock: () => void
}

const APP_PIN = process.env.NEXT_PUBLIC_APP_PIN || '78952'

export const useAuthStore = create<AuthState>((set) => ({
  // We don't persist this, so it resets on page reload as requested
  isUnlocked: false,

  unlock: (pin: string) => {
    if (pin === APP_PIN) {
      set({ isUnlocked: true })
      return true
    }
    return false
  },

  lock: () => set({ isUnlocked: false }),
}))
