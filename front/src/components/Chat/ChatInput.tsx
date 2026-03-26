import { useState } from 'react'
import { X, Plus, Send } from 'lucide-react'
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
    <div className="flex flex-col gap-1 p-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
      {/* 文件预览区 */}
      {attachments.length > 0 && (
        <div className="flex gap-1 flex-wrap px-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              {attachment.preview ? (
                <img src={attachment.preview} alt={attachment.file.name} className="w-6 h-6 object-cover rounded" />
              ) : (
                <span className="text-xs" style={{ color: 'var(--text-secondary)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {attachment.file.name}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemoveAttachment(index)}
                className="hover:opacity-70"
              >
                <X className="w-2.5 h-2.5" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* 输入区 */}
      <div className="flex gap-2 items-end">
        <textarea
          className="flex-1 p-2 rounded text-sm resize-none focus:outline-none focus:ring-1 border min-h-[40px] max-h-[120px]"
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
      </div>
      
      {/* 按钮区 */}
      <div className="flex gap-1 items-center">
        {/* 文件上传 + 号 */}
        <FileUploader
          onFileSelect={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt,.md"
          maxSize={10 * 1024 * 1024}
        />
        
        {/* 发送按钮 */}
        <button
          className="p-1.5 rounded hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-opacity"
          style={{ backgroundColor: 'var(--brand-blue)', minWidth: '32px', height: '32px' }}
          onClick={handleSubmit}
          disabled={disabled || !content.trim()}
          title="发送"
        >
          <Send className="w-4 h-4" />
        </button>
        
        {/* 创建按钮 */}
        {showCreate && (
          <button
            className="p-1.5 rounded hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-opacity flex items-center gap-1"
            style={{ backgroundColor: 'var(--brand-purple)', minWidth: '32px', height: '32px' }}
            onClick={handleCreate}
            disabled={disabled || (!content.trim() && attachments.length === 0)}
            title="创建任务"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
