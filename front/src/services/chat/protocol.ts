import type { Timestamp } from '../../utils/timestamp'
import { formatTimestamp } from '../../utils/timestamp'
import { useChatStore } from '../../stores/chatStore'
import type { ChatMessage } from '../../types'

export interface PicoMessage {
  type: string
  id?: string
  session_id?: string
  timestamp?: number | string | Timestamp
  payload?: Record<string, unknown>
}

export function handlePicoMessage(
  message: PicoMessage,
  expectedSessionId: string
): void {
  if (message.session_id !== expectedSessionId) {
    console.warn('Session ID mismatch', message.session_id, expectedSessionId)
    return
  }

  const store = useChatStore.getState()

  switch (message.type) {
    case 'message.create': {
      const content = (message.payload?.content as string) ?? ''
      const timestamp: Timestamp = typeof message.timestamp === 'number'
        ? formatTimestamp(new Date(message.timestamp))
        : typeof message.timestamp === 'string'
          ? message.timestamp
          : formatTimestamp()
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
      break
    }

    case 'error': {
      const error = (message.payload?.error as string) ?? 'Unknown error'
      console.error('WebSocket error:', error)
      store.addMessage(expectedSessionId, {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `Error: ${error}`,
        timestamp: formatTimestamp(),
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

export function formatMessageTimestamp(
  timestamp?: number | string | Timestamp
): number {
  if (typeof timestamp === 'number') {
    return timestamp
  }
  if (typeof timestamp === 'string') {
    const parsed = Date.parse(timestamp)
    if (!isNaN(parsed)) {
      return parsed
    }
  }
  return Date.now()
}
