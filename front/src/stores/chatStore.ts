import { create } from 'zustand'
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
  
  createSession: (type: 'global' | 'execution', id: string) => string
  getOrCreateSession: (type: 'global' | 'execution', id: string) => SessionData
  getSessionByPlanId: (planId: string) => SessionData | undefined
  getSessionByTaskId: (taskId: string) => SessionData | undefined
  addMessage: (sessionId: string, message: ChatMessage) => void
  updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void
  setConnectionState: (state: ConnectionState) => void
  setTyping: (sessionId: string, isTyping: boolean) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: new Map(),
  planToSession: new Map(),
  taskToSession: new Map(),
  currentSessionId: null,
  connectionState: 'disconnected',
  isTyping: false,
  
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
      const session = state.sessions.get(sessionId)
      if (!session) return state
      
      const newSessions = new Map(state.sessions)
      newSessions.set(sessionId, {
        ...session,
        messages: [...session.messages, message],
      })
      
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
      
      return { sessions: newSessions }
    })
  },
  
  setConnectionState: (state) => {
    set({ connectionState: state })
  },
  
  setTyping: (sessionId, isTyping) => {
    set({ isTyping })
  },
}))