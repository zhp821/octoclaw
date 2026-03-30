import { useChatStore } from '../../stores/chatStore'
import type { ChatMessage } from '../../types'

export interface PicoMessage {
  type: string
  id?: string
  session_id?: string
  timestamp?: number | string
  payload?: Record<string, unknown>
}

export function handlePicoMessage(
  message: PicoMessage,
  expectedSessionId: string
): void {
  if (message.session_id !== expectedSessionId) {
    console.warn('Session ID mismatch', message.session_id, expectedSessionId)
    useChatStore.getState().addMessage(expectedSessionId, {
      id: `session-error-${Date.now()}`,
      role: 'system',
      content: 'Session error: Reconnecting...',
      timestamp: Date.now(),
    })
    return
  }

  const store = useChatStore.getState()

  switch (message.type) {
    case 'message.create': {
      const content = (message.payload?.content as string) ?? ''
      const timestamp: number = typeof message.timestamp === 'number'
        ? message.timestamp
        : Date.now()
      const assistantMessage: ChatMessage = {
        id: message.id ?? `msg-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp,
      }
      store.addMessage(expectedSessionId, assistantMessage)
      break
    }

    case 'message.update': {
      if (!message.id) return
      const content = (message.payload?.content as string) ?? ''
      store.updateMessage(expectedSessionId, message.id, { content })
      break
    }

    case 'typing.start': {
      store.setTyping(expectedSessionId, true)
      break
    }

    case 'typing.stop': {
      store.setTyping(expectedSessionId, false)
      const { sessions } = store as any
      const session = sessions.get(expectedSessionId)
      if (session && session.messages && session.messages.length > 0) {
        const lastMsg = session.messages[session.messages.length - 1]
        if (lastMsg.role === 'assistant') {
          store.updateMessage(expectedSessionId, lastMsg.id, { completed: true })
        }
      }
      break
    }

    case 'error': {
      const error = (message.payload?.error as string) ?? 'Unknown error'
      console.error('WebSocket error:', error)
      store.addMessage(expectedSessionId, {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `Error: ${error}`,
        timestamp: Date.now(),
      })
      store.setTyping(expectedSessionId, false)
      break
    }

    case 'pong': {
      break
    }

    default: {
      console.warn('Unknown message type:', message.type)
    }
  }
}
