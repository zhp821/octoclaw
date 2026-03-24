import { useState } from 'react'

interface Props {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: Props) {
  const [content, setContent] = useState('')

  const handleSubmit = () => {
    if (content.trim()) {
      onSend(content)
      setContent('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex gap-2 p-3 border-t border-dark-border">
      <textarea
        className="flex-1 bg-dark-secondary p-2 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue"
        rows={1}
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder || '输入消息...'}
      />
      <button
        className="bg-brand-blue px-4 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSubmit}
        disabled={disabled || !content.trim()}
      >
        发送
      </button>
    </div>
  )
}
