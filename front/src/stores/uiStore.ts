import { create } from 'zustand'

interface UIState {
  theme: 'dark' | 'light'
  sidebarCollapsed: boolean
  chatPanelOpen: boolean
  mobileChatOpen: boolean

  toggleTheme: () => void
  setTheme: (theme: 'dark' | 'light') => void
  toggleSidebar: () => void
  toggleChatPanel: () => void
  setMobileChatOpen: (open: boolean) => void
}

const THEME_KEY = 'wbs-theme'

function getInitialTheme(): 'dark' | 'light' {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useUIStore = create<UIState>((set) => {
  const initialTheme = getInitialTheme()

  if (initialTheme === 'light') {
    document.documentElement.classList.add('light')
  }

  return {
    theme: initialTheme,
    sidebarCollapsed: false,
    chatPanelOpen: true,
    mobileChatOpen: false,

    toggleTheme: () => {
      set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark'
        localStorage.setItem(THEME_KEY, newTheme)
        if (newTheme === 'light') {
          document.documentElement.classList.add('light')
        } else {
          document.documentElement.classList.remove('light')
        }
        return { theme: newTheme }
      })
    },

    setTheme: (theme) => {
      localStorage.setItem(THEME_KEY, theme)
      if (theme === 'light') {
        document.documentElement.classList.add('light')
      } else {
        document.documentElement.classList.remove('light')
      }
      set({ theme })
    },

    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    toggleChatPanel: () => set((state) => ({ chatPanelOpen: !state.chatPanelOpen })),
    setMobileChatOpen: (open) => set({ mobileChatOpen: open }),
  }
})
