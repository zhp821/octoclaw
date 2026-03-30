import type { ChatMessage as ChatMessageType } from '@/types'
import { OctoClawLogo } from '@/components/Layout/Header'

interface Props {
  message: ChatMessageType
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  const formatTime = (timestamp: number) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleDateString('zh-CN', { year: '2-digit', month: '2-digit', day: '2-digit' }) + ' ' +
             date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-brand-blue' : 'bg-transparent'
        }`}
      >
        {isUser ? '👤' : <OctoClawLogo className="w-7 h-7" />}
      </div>
      <div
        className={`max-w-[80%] p-3 rounded-lg text-sm border overflow-auto ${
          message.completed ? 'border-green-500' : ''
        }`}
        style={{ 
          backgroundColor: isUser ? 'var(--bg-secondary)' : 'rgba(139,92,246,0.1)',
          borderColor: isUser ? 'var(--border-color)' : message.completed ? 'var(--brand-green, #22c55e)' : 'rgba(139,92,246,0.4)',
          color: 'var(--text-primary)',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'normal'
        }}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className="text-xs mt-1 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <span>{formatTime(message.timestamp)}</span>
          {message.completed && (
            <span className="text-green-500 font-medium">✓ 已完成</span>
          )}
        </div>
      </div>
    </div>
  )
}
