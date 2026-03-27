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
  
  planToSession: Map<string, string>
  taskToSession: Map<string, string>
  
  currentSessionId: string | null
  connectionState: ConnectionState
  isTyping: boolean
  currentDir: string
  setCurrentDir: (dir: string) => void
  
  createSession: (type: 'global' | 'execution', id: string) => string
  getOrCreateSession: (type: 'global' | 'execution', id: string) => SessionData
  getSessionByPlanId: (planId: string) => SessionData | undefined
  getSessionByTaskId: (taskId: string) => SessionData | undefined
  addMessage: (sessionId: string, message: ChatMessage) => void
  updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void
  setConnectionState: (state: ConnectionState) => void
  setTyping: (sessionId: string, isTyping: boolean) => void
}

const STORAGE_KEY = 'octoclaw-chat-sessions'

function serializeSessions(sessions: Map<string, SessionData>): string {
  return JSON.stringify(Array.from(sessions.entries()))
}

function deserializeSessions(data: string): Map<string, SessionData> {
  try {
    const entries = JSON.parse(data)
    return new Map(entries)
  } catch {
    return new Map()
  }
}

const savedData = localStorage.getItem(STORAGE_KEY)
const initialSessions = savedData ? deserializeSessions(savedData) : new Map()
const savedDir = localStorage.getItem('octoclaw-chat-currentDir')
const initialDir = savedDir || ''

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: initialSessions,
      planToSession: new Map(),
      taskToSession: new Map(),
      currentSessionId: null,
      connectionState: 'disconnected',
      isTyping: false,
      currentDir: initialDir,
      
      createSession: (type, id) => {
        const sessionId = type === 'global' 
          ? `global-${id}` 
          : `octo:exec:${id}`
        
        const session: SessionData = {
          id: sessionId,
          planId: type === 'global' ? id : undefined,
          taskId: type === 'execution' ? id : undefined,
          messages: [],
          createdAt: Date.now(),
        }
        
        set((state) => {
          const newSessions = new Map(state.sessions)
          newSessions.set(sessionId, session)
          
          const newPlanMap = new Map(state.planToSession)
          const newTaskMap = new Map(state.taskToSession)
          
          if (type === 'global') {
            newPlanMap.set(id, sessionId)
          } else {
            newTaskMap.set(id, sessionId)
          }
          
          localStorage.setItem(STORAGE_KEY, serializeSessions(newSessions))
          
          return {
            sessions: newSessions,
            planToSession: newPlanMap,
            taskToSession: newTaskMap,
          }
        })
        
        return sessionId
      },
      
      getOrCreateSession: (type, id) => {
        const existing = type === 'global'
          ? get().getSessionByPlanId(id)
          : get().getSessionByTaskId(id)
        
        if (existing) return existing
        
        const sessionId = get().createSession(type, id)
        return get().sessions.get(sessionId)!
      },
      
      getSessionByPlanId: (planId) => {
        const sessionId = get().planToSession.get(planId)
        return sessionId ? get().sessions.get(sessionId) : undefined
      },
      
      getSessionByTaskId: (taskId) => {
        const sessionId = get().taskToSession.get(taskId)
        return sessionId ? get().sessions.get(sessionId) : undefined
      },
      
      addMessage: (sessionId, message) => {
        set((state) => {
          const newSessions = new Map(state.sessions)
          const existingSession = state.sessions.get(sessionId)
          
          if (existingSession) {
            newSessions.set(sessionId, {
              ...existingSession,
              messages: [...existingSession.messages, message],
            })
          } else {
            newSessions.set(sessionId, {
              id: sessionId,
              messages: [message],
              createdAt: Date.now(),
            })
          }
          
          localStorage.setItem(STORAGE_KEY, serializeSessions(newSessions))
          
          return { sessions: newSessions }
        })
      },
      
      updateMessage: (sessionId, messageId, updates) => {
        set((state) => {
          const session = state.sessions.get(sessionId)
          if (!session) return state
          
          const newSessions = new Map(state.sessions)
          newSessions.set(sessionId, {
            ...session,
            messages: session.messages.map(m =>
              m.id === messageId ? { ...m, ...updates } : m
            ),
          })
          
          localStorage.setItem(STORAGE_KEY, serializeSessions(newSessions))
          
          return { sessions: newSessions }
        })
      },
      
      setConnectionState: (state) => {
        set({ connectionState: state })
      },
      
      setTyping: (sessionId, isTyping) => {
        set({ isTyping })
      },
      
      setCurrentDir: (dir: string) => {
        set({ currentDir: dir })
        localStorage.setItem('octoclaw-chat-currentDir', dir)
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ 
        sessions: Array.from(state.sessions.entries()),
        currentDir: state.currentDir
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as { sessions?: [string, SessionData][]; currentDir?: string }
        return {
          ...current,
          sessions: persistedState?.sessions ? new Map(persistedState.sessions) : current.sessions,
          currentDir: persistedState?.currentDir ?? current.currentDir,
        }
      },
    }
  )
)