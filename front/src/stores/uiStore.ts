import { create } from 'zustand'

interface UIState {
  theme: 'dark' | 'light'
  toggleTheme: () => void
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
  }
})
