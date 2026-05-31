import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'temple' | 'midnight' | 'dawn'

interface UIStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  isChantModalOpen: boolean
  setChantModalOpen: (open: boolean) => void
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'temple',
      setTheme: (theme) => set({ theme }),
      isChantModalOpen: false,
      setChantModalOpen: (open) => set({ isChantModalOpen: open }),
      isSidebarOpen: false,
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    }),
    {
      name: 'ui-storage',
    }
  )
)
