import type { ChatMessage } from '@/types'

interface Props {
  message: ChatMessage
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-brand-blue' : 'bg-brand-purple'
        }`}
      >
        {isUser ? '👤' : '🤖'}
      </div>
      <div
        className={`max-w-[80%] p-3 rounded-lg text-sm ${
          isUser
            ? 'bg-dark-secondary'
            : 'bg-brand-purple/10 border border-brand-purple/40'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <div className="text-xs text-dark-text-secondary mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
