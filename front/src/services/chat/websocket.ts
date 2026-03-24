let currentSocket: WebSocket | null = null;
let currentGeneration = 0;
let currentSessionId: string | null = null;

export function normalizeWsUrlForBrowser(wsUrl: string): string {
  if (wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://')) {
    return wsUrl;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  if (wsUrl.startsWith('/')) {
    return `${protocol}//${host}${wsUrl}`;
  }

  return `${protocol}//${host}/${wsUrl}`;
}

export function invalidateSocket(socket: WebSocket | null): void {
  if (!socket) return;

  socket.onopen = null;
  socket.onmessage = null;
  socket.onclose = null;
  socket.onerror = null;

  if (socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
}

export function isCurrentSocket(
  socket: WebSocket | null,
  generation: number,
  sessionId: string | null
): boolean {
  return (
    socket === currentSocket &&
    generation === currentGeneration &&
    sessionId === currentSessionId
  );
}

export function setCurrentSocket(
  socket: WebSocket | null,
  generation: number,
  sessionId: string | null
): void {
  currentSocket = socket;
  currentGeneration = generation;
  currentSessionId = sessionId;
}

export function getCurrentSocket(): WebSocket | null {
  return currentSocket;
}

export function getCurrentGeneration(): number {
  return currentGeneration;
}

export function getCurrentSessionId(): string | null {
  return currentSessionId;
}
