import { useState, useEffect } from 'react'

interface DirSelectorProps {
  dir: string
  onSave: (newDir: string) => void
}

export function DirSelector({ dir, onSave }: DirSelectorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(dir)

  useEffect(() => {
    setEditValue(dir)
  }, [dir])

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed) {
      onSave(trimmed)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(dir)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="text-xs px-1 py-0.5 rounded border w-32 truncate"
          style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            color: 'var(--text-primary)',
            borderColor: 'var(--border-color)'
          }}
          autoFocus
        />
        <button
          onClick={handleSave}
          className="text-xs px-1"
          style={{ color: 'var(--brand-purple)' }}
        >
          ✓
        </button>
      </div>
    )
  }

  return (
    <div 
      className="flex items-center gap-1 cursor-pointer group"
      onClick={() => {
        setEditValue(dir)
        setIsEditing(true)
      }}
    >
      <span className="text-xs">📁</span>
      <span 
        className="text-xs truncate max-w-[80px]" 
        style={{ color: 'var(--text-secondary)' }}
        title={dir}
      >
        {dir || '(未设置)'}
      </span>
      <span 
        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--text-secondary)' }}
      >
        ✏️
      </span>
    </div>
  )
}