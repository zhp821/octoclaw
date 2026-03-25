import type { ChatMessage } from '@/types'
import { parseTimestamp } from '@/utils/timestamp'
import { OctoClawLogo } from '@/components/Layout/Header'

interface Props {
  message: ChatMessage
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'
  
  const formatTime = (timestamp: string) => {
    try {
      const date = parseTimestamp(timestamp)
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
        className={`max-w-[80%] p-3 rounded-lg text-sm border`}
        style={{ 
          backgroundColor: isUser ? 'var(--bg-secondary)' : 'rgba(139,92,246,0.1)',
          borderColor: isUser ? 'var(--border-color)' : 'rgba(139,92,246,0.4)',
          color: 'var(--text-primary)'
        }}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  )
}
