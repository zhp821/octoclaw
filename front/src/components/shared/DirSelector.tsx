import { useState, useEffect } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { configApi } from '@/services/api.config'

interface DirSelectorProps {
  planId?: string | null
}

export function DirSelector({ planId }: DirSelectorProps) {
  const { getPlanDir, setPlanDir, currentDir, setCurrentDir } = useChatStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const dir = planId ? getPlanDir(planId) : currentDir

  useEffect(() => {
    if (!currentDir) {
      configApi.fetchWorkspaceConfig().then(ws => {
        if (ws) setCurrentDir(ws)
      })
    }
  }, [currentDir, setCurrentDir])

  useEffect(() => {
    setEditValue(dir)
  }, [dir])

  const save = async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setIsEditing(false)
      return
    }
    if (planId) {
      setPlanDir(planId, trimmed)
      try { await configApi.updatePlanDir(planId, trimmed) } catch {}
    } else {
      setCurrentDir(trimmed)
      try { await configApi.updateGlobalDir(trimmed) } catch {}
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      save(editValue)
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
          onBlur={() => save(editValue)}
          className="text-xs px-2 py-0.5 rounded border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-color)',
            minWidth: '300px'
          }}
          autoFocus
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <div
        className="flex items-center gap-1 cursor-pointer hover:opacity-80 px-2 py-1 rounded border"
        style={{ backgroundColor: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.2)' }}
        onClick={() => {
          setEditValue(dir)
          setIsEditing(true)
        }}
        title="点击编辑工作路径"
      >
        <span className="text-xs font-medium" style={{ color: 'var(--brand-purple)' }}>工作路径:</span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {dir || '(点击设置)'}
        </span>
      </div>
    </div>
  )
}
