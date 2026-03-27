import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from './chatStore'

describe('ChatStore Integration', () => {
  beforeEach(() => {
    useChatStore.setState({
      sessions: new Map(),
      planToSession: new Map(),
      taskToSession: new Map(),
      currentSessionId: null,
      connectionState: 'disconnected',
      isTyping: false,
    })
  })

  describe('Session Management', () => {
    it('should create a new global session', () => {
      const sessionId = useChatStore.getState().createSession('global', 'plan-1')
      
      const session = useChatStore.getState().sessions.get(sessionId)
      expect(session).toBeDefined()
      expect(session?.messages).toEqual([])
      expect(session?.planId).toBe('plan-1')
    })

    it('should create a new execution session', () => {
      const sessionId = useChatStore.getState().createSession('execution', 'task-1')
      
      const session = useChatStore.getState().sessions.get(sessionId)
      expect(session).toBeDefined()
      expect(session?.taskId).toBe('task-1')
    })

    it('should not duplicate existing sessions', () => {
      useChatStore.getState().createSession('global', 'plan-1')
      useChatStore.getState().createSession('global', 'plan-1')
      
      expect(useChatStore.getState().sessions.size).toBe(1)
    })
  })

  describe('Message Handling', () => {
    it('should add message to session', () => {
      const sessionId = useChatStore.getState().createSession('global', 'plan-1')
      useChatStore.getState().addMessage(sessionId, {
        id: 'msg-1',
        role: 'user',
        content: 'Hello world',
        timestamp: '250101120000000',
      })
      
      const session = useChatStore.getState().sessions.get(sessionId)
      expect(session?.messages.length).toBe(1)
      expect(session?.messages[0].content).toBe('Hello world')
    })

    it('should add multiple messages in order', () => {
      const sessionId = useChatStore.getState().createSession('global', 'plan-1')
      useChatStore.getState().addMessage(sessionId, {
        id: 'msg-1',
        role: 'user',
        content: 'First message',
        timestamp: '250101120000000',
      })
      useChatStore.getState().addMessage(sessionId, {
        id: 'msg-2',
        role: 'assistant',
        content: 'Second message',
        timestamp: '250101120000001',
      })
      
      const session = useChatStore.getState().sessions.get(sessionId)
      expect(session?.messages.length).toBe(2)
      expect(session?.messages[0].id).toBe('msg-1')
      expect(session?.messages[1].id).toBe('msg-2')
    })

    it('should update existing message', () => {
      const sessionId = useChatStore.getState().createSession('global', 'plan-1')
      useChatStore.getState().addMessage(sessionId, {
        id: 'msg-1',
        role: 'assistant',
        content: 'Streaming...',
        timestamp: '250101120000000',
      })
      useChatStore.getState().updateMessage(sessionId, 'msg-1', {
        content: 'Final response',
      })
      
      const session = useChatStore.getState().sessions.get(sessionId)
      expect(session?.messages[0].content).toBe('Final response')
    })
  })

  describe('Connection State', () => {
    it('should update connection state', () => {
      expect(useChatStore.getState().connectionState).toBe('disconnected')
      
      useChatStore.getState().setConnectionState('connecting')
      expect(useChatStore.getState().connectionState).toBe('connecting')
      
      useChatStore.getState().setConnectionState('connected')
      expect(useChatStore.getState().connectionState).toBe('connected')
    })
  })

  describe('Typing Indicator', () => {
    it('should set typing state', () => {
      expect(useChatStore.getState().isTyping).toBe(false)
      
      useChatStore.getState().setTyping('session-1', true)
      expect(useChatStore.getState().isTyping).toBe(true)
      
      useChatStore.getState().setTyping('session-1', false)
      expect(useChatStore.getState().isTyping).toBe(false)
    })
  })

  describe('Session Lookup', () => {
    it('should find session by planId', () => {
      useChatStore.getState().createSession('global', 'plan-1')
      
      const session = useChatStore.getState().getSessionByPlanId('plan-1')
      expect(session).toBeDefined()
      expect(session?.planId).toBe('plan-1')
    })

    it('should find session by taskId', () => {
      useChatStore.getState().createSession('execution', 'task-1')
      
      const session = useChatStore.getState().getSessionByTaskId('task-1')
      expect(session).toBeDefined()
      expect(session?.taskId).toBe('task-1')
    })
  })

  describe('Multiple Sessions', () => {
    it('should handle multiple independent sessions', () => {
      const session1Id = useChatStore.getState().createSession('global', 'plan-1')
      const session2Id = useChatStore.getState().createSession('execution', 'task-1')
      
      useChatStore.getState().addMessage(session1Id, {
        id: 'msg-1',
        role: 'user',
        content: 'Message for session 1',
        timestamp: '250101120000000',
      })
      
      useChatStore.getState().addMessage(session2Id, {
        id: 'msg-2',
        role: 'user',
        content: 'Message for session 2',
        timestamp: '250101120000001',
      })
      
      const session1 = useChatStore.getState().sessions.get(session1Id)
      const session2 = useChatStore.getState().sessions.get(session2Id)
      
      expect(session1?.messages.length).toBe(1)
      expect(session1?.messages[0].content).toBe('Message for session 1')
      
      expect(session2?.messages.length).toBe(1)
      expect(session2?.messages[0].content).toBe('Message for session 2')
    })
  })

  describe('getOrCreateSession', () => {
    it('should return existing session if it exists', () => {
      const sessionId = useChatStore.getState().createSession('global', 'plan-1')
      const session = useChatStore.getState().getOrCreateSession('global', 'plan-1')
      
      expect(session.id).toBe(sessionId)
      expect(useChatStore.getState().sessions.size).toBe(1)
    })

    it('should create new session if it does not exist', () => {
      const session = useChatStore.getState().getOrCreateSession('global', 'plan-1')
      
      expect(session).toBeDefined()
      expect(session.planId).toBe('plan-1')
    })
  })
})

describe('Directory Management', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with empty currentDir', () => {
    expect(useChatStore.getState().currentDir).toBe('')
  })

  it('should set current directory', () => {
    useChatStore.getState().setCurrentDir('/home/user/workspace')
    expect(useChatStore.getState().currentDir).toBe('/home/user/workspace')
  })

  it('should persist currentDir to localStorage', () => {
    useChatStore.getState().setCurrentDir('/test/path')
    expect(localStorage.getItem('octoclaw-chat-currentDir')).toBe('/test/path')
  })

  it('should load currentDir from localStorage on init', () => {
    localStorage.setItem('octoclaw-chat-currentDir', '/saved/path')
    useChatStore.getState().setCurrentDir('/new/path')
    expect(localStorage.getItem('octoclaw-chat-currentDir')).toBe('/new/path')
  })
})