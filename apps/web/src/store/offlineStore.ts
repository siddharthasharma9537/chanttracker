import { create } from 'zustand'

interface PendingSession {
  id: string
  sessionId: string
  count: number
  durationSecs: number
  createdAt: number
}

interface OfflineStore {
  pendingSessions: PendingSession[]
  isOnline: boolean
  addPending: (session: PendingSession) => void
  removePending: (id: string) => void
  clearPending: () => void
  setIsOnline: (online: boolean) => void
}

export const useOfflineStore = create<OfflineStore>((set) => ({
  pendingSessions: [],
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  addPending: (session) =>
    set((state) => ({
      pendingSessions: [...state.pendingSessions, session],
    })),
  removePending: (id) =>
    set((state) => ({
      pendingSessions: state.pendingSessions.filter((s) => s.id !== id),
    })),
  clearPending: () => set({ pendingSessions: [] }),
  setIsOnline: (online) => set({ isOnline: online }),
}))
