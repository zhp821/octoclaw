import { normalizeWsUrlForBrowser, invalidateSocket, isCurrentSocket, setCurrentSocket, getCurrentSocket, getCurrentGeneration, } from './websocket'
import type { PicoMessage } from './protocol'
import { handlePicoMessage } from './protocol'
import { useChatStore } from '../../stores/chatStore'


interface PicoTokenResponse {
  token: string
  ws_url: string
  enabled: boolean
}

async function getPicoToken(): Promise<PicoTokenResponse> {
  const res = await fetch('/api/pico/token')
  if (!res.ok) {
    throw new Error(`Failed to get pico token: ${res.status}`)
  }
  return res.json()
}

interface ConnectionState {
  connected: boolean
  connecting: boolean
  sessionId: string | null
  reconnectAttempts: number
  maxReconnectAttempts: number
  baseReconnectDelay: number
}

const state: ConnectionState = {
  connected: false,
  connecting: false,
  sessionId: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  baseReconnectDelay: 1000,
}

let messageQueue: { content: string; timestamp: number }[] = []
let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null

function calculateReconnectDelay(attempt: number): number {
  return Math.min(state.baseReconnectDelay * Math.pow(2, attempt), 30000)
}

function processMessageQueue(): void {
  while (messageQueue.length > 0 && state.connected) {
    const message = messageQueue.shift()
    if (message && getCurrentSocket()) {
      getCurrentSocket()!.send(JSON.stringify({
        type: 'message.send',
        session_id: state.sessionId,
        payload: { content: message.content },
        timestamp: message.timestamp,
      }))
    }
  }
}

function handleConnectionError(error: Error): void {
  console.error('WebSocket connection error:', error)
  state.connected = false
  state.connecting = false
  useChatStore.getState().setTyping(state.sessionId ?? 'root', false)
}

async function connectWebSocket(sessionId: string): Promise<void> {
  if (state.connecting) {
    return
  }

  state.connecting = true

  try {
    const { token, ws_url } = await getPicoToken()
    
    if (!token) {
      console.error('No pico token available')
      state.connecting = false
      scheduleReconnect(sessionId)
      return
    }

    const normalizedUrl = normalizeWsUrlForBrowser(ws_url)
    const url = `${normalizedUrl}?session_id=${encodeURIComponent(sessionId)}`
    const socket = new WebSocket(url, [`token.${token}`])
    const generation = getCurrentGeneration() + 1
    setCurrentSocket(socket, generation, sessionId)

    socket.onopen = () => {
      if (!isCurrentSocket(socket, generation, sessionId)) {
        socket.close()
        return
      }

      state.connected = true
      state.connecting = false
      state.reconnectAttempts = 0

      console.log('WebSocket connected')

      processMessageQueue()
    }

    socket.onmessage = (event) => {
      if (!isCurrentSocket(socket, generation, sessionId)) {
        return
      }

      try {
        const message: PicoMessage = JSON.parse(event.data)
        handlePicoMessage(message, sessionId)
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    }

    socket.onclose = () => {
      if (!isCurrentSocket(socket, generation, sessionId)) {
        return
      }

      state.connected = false
      state.connecting = false
      useChatStore.getState().setTyping(sessionId, false)

      if (state.reconnectAttempts < state.maxReconnectAttempts) {
        scheduleReconnect(sessionId)
      } else {
        console.warn('Max reconnection attempts reached')
      }
    }

    socket.onerror = (error) => {
      if (!isCurrentSocket(socket, generation, sessionId)) {
        return
      }

      state.connecting = false
      scheduleReconnect(sessionId)
    }
  } catch (error) {
    console.error('Failed to connect to pico:', error)
    state.connecting = false
    scheduleReconnect(sessionId)
  }
}

function scheduleReconnect(sessionId: string): void {
  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId)
  }

  const delay = calculateReconnectDelay(state.reconnectAttempts)
  state.reconnectAttempts++

  console.log(`Reconnecting in ${delay}ms (attempt ${state.reconnectAttempts}/${state.maxReconnectAttempts})`)

  reconnectTimeoutId = setTimeout(() => {
    connectWebSocket(sessionId)
  }, delay)
}

export function connectChat(sessionId: string): void {
  if (state.sessionId === sessionId && state.connected) {
    return
  }

  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId)
    reconnectTimeoutId = null
  }

  const currentSocket = getCurrentSocket()
  if (currentSocket) {
    invalidateSocket(currentSocket)
  }

  state.sessionId = sessionId
  state.reconnectAttempts = 0
  messageQueue = []

  connectWebSocket(sessionId)
}

export function disconnectChat(): void {
  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId)
    reconnectTimeoutId = null
  }

  const socket = getCurrentSocket()
  if (socket) {
    invalidateSocket(socket)
    setCurrentSocket(null, getCurrentGeneration() + 1, null)
  }

  state.connected = false
  state.connecting = false
  state.sessionId = null
  messageQueue = []
}

function getDirForSession(sessionId: string | null): string {
  if (!sessionId) return useChatStore.getState().currentDir
  const { sessions, planDirs, currentDir } = useChatStore.getState()
  const session = sessions.get(sessionId)
  if (session?.planId && planDirs.get(session.planId)) {
    return planDirs.get(session.planId)!
  }
  return currentDir
}

function buildContentWithDir(content: string, sessionId: string | null): string {
  const dir = getDirForSession(sessionId)
  if (!dir) return content
  return `[系统提示：当前工作目录是 ${dir}]\n\n${content}`
}

export function sendMessage(content: string): void {
  if (!content.trim()) return

  const timestamp = Date.now()
  const sessionId = state.sessionId
  const contentWithDir = buildContentWithDir(content, sessionId)

  if (sessionId) {
    useChatStore.getState().addMessage(sessionId, {
      id: `msg-user-${timestamp}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    })
  }

  if (state.connected && getCurrentSocket()) {
    getCurrentSocket()!.send(JSON.stringify({
      type: 'message.send',
      session_id: sessionId,
      payload: { content: contentWithDir },
      timestamp,
    }))
  } else {
    messageQueue.push({ content: contentWithDir, timestamp })
  }
}

export function switchSession(sessionId: string) {
  if (state.sessionId === sessionId) {
    return
  }

  disconnectChat()
  state.sessionId = sessionId
  state.reconnectAttempts = 0
  messageQueue = []



  connectWebSocket(sessionId)
}

export function getConnectionState(): { connected: boolean; connecting: boolean; sessionId: string | null } {
  return {
    connected: state.connected,
    connecting: state.connecting,
    sessionId: state.sessionId,
  }
}
