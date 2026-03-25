import type { Timestamp } from '../../utils/timestamp'

const STORAGE_KEY = 'octoclaw_session_id'

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export function generateGlobalSessionId(planId: string): string {
  return `global-${planId}`
}

export function generateExecutionSessionId(taskId: string): string {
  return `exec-${taskId}`
}

export function isGlobalSession(sessionId: string): boolean {
  return sessionId.startsWith('global-')
}

export function isExecutionSession(sessionId: string): boolean {
  return sessionId.startsWith('exec-')
}

export function extractPlanId(sessionId: string): string | null {
  if (!isGlobalSession(sessionId)) {
    return null
  }
  return sessionId.slice(7)
}

export function extractTaskId(sessionId: string): string | null {
  if (!isExecutionSession(sessionId)) {
    return null
  }
  return sessionId.slice(5)
}

export function storeSessionId(sessionId: string): void {
  const storage = getLocalStorage()
  if (storage) {
    storage.setItem(STORAGE_KEY, sessionId)
  }
}

export function readStoredSessionId(): string | null {
  const storage = getLocalStorage()
  if (storage) {
    return storage.getItem(STORAGE_KEY)
  }
  return null
}

export function clearStoredSessionId(): void {
  const storage = getLocalStorage()
  if (storage) {
    storage.removeItem(STORAGE_KEY)
  }
}

export function normalizeUnixTimestamp(timestamp: number): Timestamp {
  const date = new Date(timestamp)
  const yy = String(date.getFullYear()).slice(-2)
  const MM = String(date.getMonth() + 1).padStart(2, '0')
  const DD = String(date.getDate()).padStart(2, '0')
  const HH = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const SS = String(date.getSeconds()).padStart(2, '0')
  const sss = String(date.getMilliseconds()).padStart(3, '0')
  return `${yy}${MM}${DD}${HH}${mm}${SS}${sss}`
}
