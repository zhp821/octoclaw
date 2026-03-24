import { useState, useRef, useEffect } from 'react'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore } from '@/stores/taskStore'
import { GripVertical, ChevronRight, ChevronDown, MessageCircle, Search, Plus, ChevronDown as ChevronDownIcon } from 'lucide-react'
import type { TaskNode, TaskStatus } from '@/types'
import { STATUS_CONFIG } from '@/config/status'

interface SortableTaskProps {
  task: TaskNode
  depth: number
  onCreateSubtask?: (parentId: string) => void
}

function SortableTask({ task, depth, onCreateSubtask }: SortableTaskProps) {
  const { selectTask, toggleExpand, expandedIds } = useTaskStore()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  const isExpanded = expandedIds.has(task.id)
  const isSelected = useTaskStore(state => state.selectedId === task.id)
  const hasChildren = task.children.length > 0
  const hasChat = task.chatHistory && task.chatHistory.length > 0

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        className={`group flex items-center gap-2 p-2 rounded transition-colors ${
          depth === 0 ? 'cursor-default' : 'cursor-pointer'
        } ${isSelected ? 'bg-brand-blue/20' : 'hover:bg-dark-border/50'}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => depth > 0 && selectTask(task.id)}
      >
        {depth === 0 && (
          <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-dark-border rounded">
            <GripVertical size={14} className="text-dark-text-secondary" />
          </span>
        )}
        {depth > 0 && (
          <span className="w-6 flex-shrink-0" />
        )}
        
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); toggleExpand(task.id) }} className="p-1 hover:bg-dark-border rounded">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        
        <span className="text-sm truncate flex-1 cursor-pointer" onClick={() => selectTask(task.id)}>
          {task.title}
        </span>
        
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
          task.status === 'done' ? 'bg-green-500' :
          task.status === 'in-progress' ? 'bg-blue-500' :
          task.status === 'blocked' ? 'bg-red-500' :
          task.status === 'cancel' ? 'bg-black' :
          'bg-gray-500'
        }`} title={task.status} />
        
        {task.assignee && (
          <span className="text-xs flex-shrink-0" title={task.assignee.role}>{task.assignee.avatar}</span>
        )}
        
        {hasChat && <MessageCircle size={12} className="text-brand-purple flex-shrink-0" />}
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCreateSubtask?.(task.id)
          }}
          className="p-1 text-brand-blue hover:bg-brand-blue/10 rounded flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus size={14} />
        </button>
      </div>
      
      {isExpanded && task.children.map(child => (
        <SortableTask key={child.id} task={child} depth={depth + 1} onCreateSubtask={onCreateSubtask} />
      ))}
    </div>
  )
}

export function TaskTree() {
  const { roots, startCreateTask, reorderRoots, statusConfig } = useTaskStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉框
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 使用 store 中的状态配置，如果没有则使用默认配置
  const config = statusConfig && statusConfig.length > 0 ? statusConfig : STATUS_CONFIG
  const currentStatus = config.find(s => s.value === statusFilter) || config[0]

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = roots.findIndex(r => r.id === active.id)
      const newIndex = roots.findIndex(r => r.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...roots]
        const [removed] = newOrder.splice(oldIndex, 1)
        newOrder.splice(newIndex, 0, removed)
        reorderRoots(newOrder.map(r => r.id))
      }
    }
  }

  function handleCreateRoot() {
    startCreateTask(null)
  }

  function handleCreateSubtask(parentId: string) {
    startCreateTask(parentId)
  }

  // 搜索和状态过滤
  const filteredRoots = roots.filter(root => {
    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      if (!root.title.toLowerCase().includes(query) &&
          !root.description.toLowerCase().includes(query)) {
        return false
      }
    }
    // 状态过滤
    if (statusFilter && root.status !== statusFilter) {
      return false
    }
    return true
  })

  return (
    <div className="overflow-y-auto h-full flex flex-col relative">
      <div className="p-2 border-b border-dark-border flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          {/* 状态下拉框 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="w-[80px] px-1.5 py-1 text-[11px] bg-white dark:bg-dark-secondary border border-dark-border rounded text-dark-text-primary focus:outline-none focus:ring-1 focus:ring-brand-blue flex items-center justify-between gap-1"
            >
              <span className="truncate flex items-center gap-1">
                <span className={`flex-shrink-0 ${currentStatus.icon}`} />
                <span className="text-dark-text-primary">{currentStatus.label}</span>
              </span>
              <ChevronDownIcon size={10} className={`flex-shrink-0 text-dark-text-primary transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-0.5 bg-white dark:bg-dark-secondary border border-dark-border rounded shadow-xl z-[100] min-w-[100px] overflow-hidden">
                {config.map(option => (
                  <button
                    key={option.value || 'all'}
                    onClick={() => {
                      setStatusFilter(option.value)
                      setShowStatusDropdown(false)
                    }}
                    className={`w-full px-2.5 py-1 text-[11px] text-left hover:bg-gray-100 dark:hover:bg-dark-border flex items-center gap-2 ${
                      statusFilter === option.value ? 'bg-gray-100 dark:bg-dark-border' : ''
                    }`}
                  >
                    <span className={`flex-shrink-0 ${option.icon}`} />
                    <span className="truncate text-dark-text-primary">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-dark-text-secondary" />
            <input
              type="text"
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-6 pr-2 py-1 text-xs bg-white dark:bg-dark-secondary border border-dark-border rounded focus:outline-none focus:ring-1 focus:ring-brand-blue text-dark-text-primary placeholder-dark-text-secondary"
            />
          </div>
          <button
            onClick={handleCreateRoot}
            className="p-1 text-brand-blue hover:bg-brand-blue/10 rounded flex-shrink-0"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={roots.map(r => r.id)} strategy={verticalListSortingStrategy}>
            {filteredRoots.map(root => (
              <SortableTask key={root.id} task={root} depth={0} onCreateSubtask={handleCreateSubtask} />
            ))}
          </SortableContext>
        </DndContext>
        {searchQuery.trim() && filteredRoots.length === 0 && (
          <div className="p-4 text-center text-dark-text-secondary text-sm">
            未找到匹配的任务
          </div>
        )}
      </div>
    </div>
  )
}
