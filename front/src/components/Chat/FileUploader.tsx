import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
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

    const file = multiple ? files[0] : files[0]
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
    <div className="flex flex-col gap-2">
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
        className="flex items-center gap-2 px-3 py-2 rounded text-sm border border-dashed hover:border-solid transition-colors"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
        }}
      >
        <Upload className="w-4 h-4" />
        {uploading ? '上传中...' : '选择文件'}
      </button>
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  )
}
