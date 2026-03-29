import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage } from '@/types'

export interface SessionData {
  id: string
  planId?: string
  taskId?: string
  messages: ChatMessage[]
  createdAt: number
}

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

interface ChatState {
  sessions: Map<string, SessionData>
  connectionState: ConnectionState
  isTyping: boolean
  currentDir: string
  planDirs: Map<string, string>

  setCurrentDir: (dir: string) => void
  getPlanDir: (planId: string) => string
  setPlanDir: (planId: string, dir: string) => void
  addMessage: (sessionId: string, message: ChatMessage) => void
  updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void
  setConnectionState: (state: ConnectionState) => void
  setTyping: (sessionId: string, isTyping: boolean) => void
}

const STORAGE_KEY = 'octoclaw-chat-sessions'

function getInitialSessions(): Map<string, SessionData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Map()
    const entries: [string, SessionData][] = JSON.parse(raw)
    return new Map(entries)
  } catch {
    return new Map()
  }
}

function getInitialDir(): string {
  try {
    return localStorage.getItem('octoclaw-chat-currentDir') || ''
  } catch {
    return ''
  }
}

function getInitialPlanDirs(): Map<string, string> {
  try {
    const raw = localStorage.getItem('octoclaw-chat-planDirs')
    if (!raw) return new Map()
    const entries: [string, string][] = JSON.parse(raw)
    return new Map(entries)
  } catch {
    return new Map()
  }
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: getInitialSessions(),
      connectionState: 'disconnected' as ConnectionState,
      isTyping: false,
      currentDir: getInitialDir(),
      planDirs: getInitialPlanDirs(),

      addMessage: (sessionId, message) => {
        set((state) => {
          const newSessions = new Map(state.sessions)
          const existing = newSessions.get(sessionId)
          if (existing) {
            newSessions.set(sessionId, {
              ...existing,
              messages: [...existing.messages, message],
            })
          } else {
            newSessions.set(sessionId, {
              id: sessionId,
              messages: [message],
              createdAt: Date.now(),
            })
          }
          return { sessions: newSessions }
        })
      },

      updateMessage: (sessionId, messageId, updates) => {
        set((state) => {
          const newSessions = new Map(state.sessions)
          const session = newSessions.get(sessionId)
          if (!session) return state
          newSessions.set(sessionId, {
            ...session,
            messages: session.messages.map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
          })
          return { sessions: newSessions }
        })
      },

      setCurrentDir: (dir) => {
        set({ currentDir: dir })
        try { localStorage.setItem('octoclaw-chat-currentDir', dir) } catch {}
      },

      getPlanDir: (planId) => {
        return get().planDirs.get(planId) || get().currentDir
      },

      setPlanDir: (planId, dir) => {
        set((state) => {
          const newPlanDirs = new Map(state.planDirs)
          newPlanDirs.set(planId, dir)
          try {
            localStorage.setItem(
              'octoclaw-chat-planDirs',
              JSON.stringify(Array.from(newPlanDirs.entries()))
            )
          } catch {}
          return { planDirs: newPlanDirs }
        })
      },

      setConnectionState: (connectionState) => {
        set({ connectionState })
      },

      setTyping: (_sessionId, isTyping) => {
        set({ isTyping })
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        sessions: Array.from(state.sessions.entries()),
        currentDir: state.currentDir,
        planDirs: Array.from(state.planDirs.entries()),
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as {
          sessions?: [string, SessionData][]
          currentDir?: string
          planDirs?: [string, string][]
        }
        return {
          ...current,
          sessions: persistedState?.sessions
            ? new Map(persistedState.sessions)
            : current.sessions,
          currentDir: persistedState?.currentDir ?? current.currentDir,
          planDirs: persistedState?.planDirs
            ? new Map(persistedState.planDirs)
            : current.planDirs,
        }
      },
    }
  )
)
