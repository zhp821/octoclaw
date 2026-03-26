import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import { mediaApi } from '@/services/api/media'

interface Props {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number
  multiple?: boolean
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024

export function FileUploader({ onFileSelect, accept, maxSize = DEFAULT_MAX_SIZE, multiple = false }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `文件大小超过限制 (${(maxSize / 1024 / 1024).toFixed(1)}MB)`
    }
    return null
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const validationError = validateFile(file)
    
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setUploading(true)

    try {
      await mediaApi.uploadFile(file)
      onFileSelect(file)
    } catch (err) {
      setError('上传失败，请重试')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        multiple={multiple}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="p-1.5 rounded hover:opacity-80 disabled:opacity-50 transition-opacity"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          minWidth: '32px',
          height: '32px',
        }}
        title="上传文件"
      >
        <Plus className="w-4 h-4" />
      </button>
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  )
}
