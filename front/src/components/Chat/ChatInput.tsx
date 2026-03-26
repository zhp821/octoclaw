import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { FileUploader } from './FileUploader'
import type { UploadedFile } from '@/types'

interface FileAttachment {
  file: File
  preview?: string
}

interface Props {
  onSend: (content: string) => void
  onCreate: (content: string, files: FileAttachment[]) => void
  disabled?: boolean
  placeholder?: string
  showCreate?: boolean
}

export function ChatInput({ onSend, onCreate, disabled, placeholder, showCreate }: Props) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<FileAttachment[]>([])

  const handleSubmit = () => {
    if (content.trim()) {
      onSend(content)
      setContent('')
    }
  }

  const handleCreate = () => {
    if (content.trim() || attachments.length > 0) {
      onCreate(content, attachments)
      setContent('')
      setAttachments([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileSelect = (file: File) => {
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    setAttachments(prev => [...prev, { file, preview }])
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => {
      const attachment = prev[index]
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="flex flex-col gap-2 p-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-2 py-1 rounded text-sm"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              {attachment.preview ? (
                <img src={attachment.preview} alt={attachment.file.name} className="w-8 h-8 object-cover rounded" />
              ) : (
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {attachment.file.name}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemoveAttachment(index)}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <FileUploader
          onFileSelect={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx"
          maxSize={10 * 1024 * 1024}
        />
        <textarea
          className="flex-1 p-2 rounded text-sm resize-none focus:outline-none focus:ring-2 border"
          style={{ 
            backgroundColor: 'var(--bg-primary)', 
            color: 'var(--text-primary)',
            borderColor: 'var(--border-color)',
            '--tw-ring-color': 'var(--brand-blue)'
          } as React.CSSProperties}
          rows={1}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || '输入消息...'}
        />
        <button
          className="px-4 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white"
          style={{ backgroundColor: 'var(--brand-blue)' }}
          onClick={handleSubmit}
          disabled={disabled || !content.trim()}
        >
          发送
        </button>
        {showCreate && (
          <button
            className="px-4 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-white"
            style={{ backgroundColor: 'var(--brand-purple)' }}
            onClick={handleCreate}
            disabled={disabled || (!content.trim() && attachments.length === 0)}
          >
            <Plus className="w-4 h-4" />
            创建
          </button>
        )}
      </div>
    </div>
  )
}
