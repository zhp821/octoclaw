import { useState, useRef } from 'react'
import { mediaApi } from '@/services/api/media'
import { FILE_UPLOAD_CONFIG, formatFileSize, isAllowedExtension, getAllowedExtensionsString } from '@/config/fileUpload'
import { Paperclip, X, Plus, Send } from 'lucide-react'
import { DirSelector } from '@/components/shared/DirSelector'

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
  planId?: string | null
}

export function ChatInput({ onSend, onCreate, disabled, placeholder, showCreate, planId }: Props) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      if (item.kind === 'file') {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          if (!isAllowedExtension(file.name)) {
            alert(`不支持的文件类型：${file.name}\n支持的类型：${FILE_UPLOAD_CONFIG.allowedExtensions.join(', ')}`)
            continue
          }
          
          if (file.size > FILE_UPLOAD_CONFIG.maxFileSize) {
            alert(`文件过大：${file.name}\n最大限制：${formatFileSize(FILE_UPLOAD_CONFIG.maxFileSize)}`)
            continue
          }
          
          try {
            await mediaApi.uploadFile(file)
            setAttachments(prev => [...prev, {
              file,
              preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
            }])
          } catch (err: any) {
            console.error('Paste upload failed:', err)
            const errorMsg = err.response?.data?.error?.message || '上传失败，请重试'
            alert(`上传失败：${errorMsg}`)
          }
        }
        break
      }
    }
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) continue
      
      try {
        await mediaApi.uploadFile(file)
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        setAttachments(prev => [...prev, { file, preview }])
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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

  const isDisabled = disabled || (!content.trim() && attachments.length === 0)

  return (
    <div className="flex flex-col gap-2 p-3 border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
      {/* 文件预览区 */}
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap px-2 pt-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              {attachment.preview ? (
                <img src={attachment.preview} alt={attachment.file.name} className="w-10 h-10 object-cover rounded" />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center rounded" style={{ backgroundColor: 'var(--brand-purple)', color: 'white' }}>
                  <Paperclip className="w-5 h-5" />
                </div>
              )}
              <span className="text-xs max-w-[100px] truncate" style={{ color: 'var(--text-secondary)' }}>
                {attachment.file.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(index)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* 输入框 */}
      <textarea
        ref={textareaRef}
        className="flex-1 px-3 py-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 transition-all min-h-[50px] max-h-[160px] border"
        style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          color: 'var(--text-primary)',
          borderColor: 'var(--border-color)',
          '--tw-ring-color': 'var(--brand-blue)',
          '--tw-ring-opacity': '0.4'
        } as React.CSSProperties}
        rows={1}
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder={placeholder || '输入消息...'}
      />
      
      {/* 底部工具栏 */}
      <div className="flex gap-1 items-center justify-between px-1 pb-1">
        {/* 左侧：附件 + 目录选择 */}
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={getAllowedExtensionsString()}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={handleFileClick}
            className="p-1 rounded transition-colors hover:bg-gray-100"
            title="添加附件"
          >
            <Paperclip className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <DirSelector planId={planId} />
        </div>
        
        {/* 右侧：创建和发送按钮 */}
        <div className="flex gap-1 items-center">
          {showCreate && (
            <button
              className="p-1 rounded transition-colors hover:opacity-80 flex items-center justify-center"
              style={{ 
                backgroundColor: isDisabled ? 'var(--border-color)' : 'var(--brand-purple)',
                color: 'white',
                opacity: isDisabled ? 0.6 : 1,
                width: '24px',
                height: '24px'
              }}
              onClick={handleCreate}
              disabled={isDisabled}
              title="创建任务"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          
          <button
            className="p-1 rounded transition-colors hover:opacity-80 flex items-center justify-center"
            style={{ 
              backgroundColor: isDisabled ? 'var(--border-color)' : 'var(--brand-blue)',
              color: 'white',
              opacity: isDisabled ? 0.6 : 1,
              width: '24px',
              height: '24px'
            }}
            onClick={handleSubmit}
            disabled={isDisabled}
            title="发送 (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
