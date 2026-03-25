import { create } from 'zustand'
import type { ChatMessage } from '@/types'
import { formatTimestamp } from '@/utils/timestamp'
import chatApi from '@/services/chatApi'

export interface SessionData {
  id: string
  planId?: string
  taskId?: string
  messages: ChatMessage[]
  createdAt: number
  isActive: boolean
}

interface ChatState {
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error'
  currentSessionId: string | null
  isTyping: boolean
  
  globalSessions: Record<string, SessionData>
  executionSessions: Record<string, SessionData>
  
  setConnectionState: (state: 'disconnected' | 'connecting' | 'connected' | 'error') => void
  setCurrentSessionId: (sessionId: string | null) => void
  setTyping: (sessionId: string, isTyping: boolean) => void
  addMessage: (sessionId: string, message: ChatMessage) => void
  updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void
  clearMessages: (sessionId: string) => void
  getGlobalSession: (planId: string) => SessionData | undefined
  getExecutionSession: (taskId: string) => SessionData | undefined
  initGlobalSession: (planId: string) => SessionData
  initExecutionSession: (taskId: string) => SessionData
}

export const useChatStore = create<ChatState>((set, get) => ({
  connectionState: 'disconnected',
  currentSessionId: null,
  isTyping: false,
  
  globalSessions: {},
  executionSessions: {},

  setConnectionState: (state) => {
    set({ connectionState: state })
  },

  setCurrentSessionId: (sessionId) => {
    set({ currentSessionId: sessionId })
  },

  setTyping: (sessionId, isTyping) => {
    set((state) => {
      const session = state.globalSessions[sessionId] || state.executionSessions[sessionId]
      if (!session) return state
      
      const isGlobal = sessionId.startsWith('global-')
      const sessionsKey = isGlobal ? 'globalSessions' : 'executionSessions'
      
      return {
        isTyping,
        [sessionsKey]: {
          ...state[sessionsKey as 'globalSessions' | 'executionSessions'],
          [sessionId]: { ...session, isActive: isTyping },
        },
      }
    })
  },

  addMessage: (sessionId, message) => {
    set((state) => {
      const session = state.globalSessions[sessionId] || state.executionSessions[sessionId]
      if (!session) {
        return state
      }
      
      const isGlobal = sessionId.startsWith('global-')
      const sessionsKey = isGlobal ? 'globalSessions' : 'executionSessions'
      
      return {
        [sessionsKey]: {
          ...state[sessionsKey as 'globalSessions' | 'executionSessions'],
          [sessionId]: {
            ...session,
            messages: [...session.messages, message],
          },
        },
      }
    })
  },

  updateMessage: (sessionId, messageId, updates) => {
    set((state) => {
      const session = state.globalSessions[sessionId] || state.executionSessions[sessionId]
      if (!session) return state
      
      const isGlobal = sessionId.startsWith('global-')
      const sessionsKey = isGlobal ? 'globalSessions' : 'executionSessions'
      
      return {
        [sessionsKey]: {
          ...state[sessionsKey as 'globalSessions' | 'executionSessions'],
          [sessionId]: {
            ...session,
            messages: session.messages.map(m =>
              m.id === messageId ? { ...m, ...updates } : m
            ),
          },
        },
      }
    })
  },

  clearMessages: (sessionId) => {
    set((state) => {
      const session = state.globalSessions[sessionId] || state.executionSessions[sessionId]
      if (!session) return state
      
      const isGlobal = sessionId.startsWith('global-')
      const sessionsKey = isGlobal ? 'globalSessions' : 'executionSessions'
      
      return {
        [sessionsKey]: {
          ...state[sessionsKey as 'globalSessions' | 'executionSessions'],
          [sessionId]: { ...session, messages: [] },
        },
      }
    })
  },

  getGlobalSession: (planId) => {
    const sessionId = `global-${planId}`
    return get().globalSessions[sessionId]
  },

  getExecutionSession: (taskId) => {
    const sessionId = `exec-${taskId}`
    return get().executionSessions[sessionId]
  },

  initGlobalSession: (planId) => {
    const sessionId = `global-${planId}`
    const existing = get().globalSessions[sessionId]
    if (existing) {
      return existing
    }
    
    const newSession: SessionData = {
      id: sessionId,
      planId,
      messages: [],
      createdAt: Date.now(),
      isActive: false,
    }
    
    set((state) => ({
      globalSessions: {
        ...state.globalSessions,
        [sessionId]: newSession,
      },
    }))
    
    return newSession
  },

  initExecutionSession: (taskId) => {
    const sessionId = `exec-${taskId}`
    const existing = get().executionSessions[sessionId]
    if (existing) {
      return existing
    }
    
    const newSession: SessionData = {
      id: sessionId,
      taskId,
      messages: [],
      createdAt: Date.now(),
      isActive: false,
    }
    
    set((state) => ({
      executionSessions: {
        ...state.executionSessions,
        [sessionId]: newSession,
      },
    }))
    
    return newSession
  },
}))
