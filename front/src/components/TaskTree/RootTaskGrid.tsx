import { useTaskStore } from '@/stores/taskStore'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface Props {
  onTaskClick?: () => void
  onCreateTask?: () => void
}

export function RootTaskGrid({ onTaskClick, onCreateTask }: Props) {
  const { roots, selectTask } = useTaskStore()
  const [swipedId, setSwipedId] = useState<string | null>(null)

  return (
    <div className="p-3">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-dark-text-secondary">根任务 ({roots.length})</h2>
        <button
          onClick={onCreateTask}
          className="flex items-center gap-1 px-3 py-1.5 bg-brand-blue/10 text-brand-blue rounded text-sm"
        >
          <Plus size={14} />
          <span>新建</span>
        </button>
      </div>
      
      {/* 任务网格 */}
      <div className="space-y-2">
        {roots.map(root => (
          <div
            key={root.id}
            className="relative bg-dark-secondary rounded-lg border border-dark-border overflow-hidden"
          >
            {/* 背景操作按钮 */}
            <div className="absolute inset-0 flex">
              <button
                className="flex-1 bg-brand-blue/20 flex items-center justify-center text-brand-blue"
                onClick={(e) => {
                  e.stopPropagation()
                  selectTask(root.id)
                  onTaskClick?.()
                }}
              >
                <Edit2 size={16} />
              </button>
              <button
                className="flex-1 bg-red-500/20 flex items-center justify-center text-red-500"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: 删除任务
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            {/* 前景内容 */}
            <div
              className={`relative p-3 transition-transform ${
                swipedId === root.id ? '-translate-x-16' : ''
              }`}
              onClick={() => {
                selectTask(root.id)
                onTaskClick?.()
              }}
              onTouchStart={() => setSwipedId(root.id)}
              onTouchEnd={() => setSwipedId(null)}
            >
              <h3 className="font-bold text-sm mb-2">{root.title}</h3>
              <div className="flex items-center justify-between text-xs text-dark-text-secondary">
                <span className="flex items-center gap-1">
                  {root.assignee?.avatar}
                  {root.children.length} 子任务
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  root.status === 'done' ? 'bg-green-500' :
                  root.status === 'in-progress' ? 'bg-blue-500' :
                  root.status === 'blocked' ? 'bg-red-500' :
                  'bg-gray-500'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {roots.length === 0 && (
        <div className="text-center py-8 text-dark-text-secondary text-sm">
          暂无任务，点击右上角 + 创建
        </div>
      )}
    </div>
  )
}
