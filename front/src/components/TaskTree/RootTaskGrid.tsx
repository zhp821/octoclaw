import { useTaskStore } from '@/stores/taskStore'
import { Plus, Eye, ChevronRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { TaskNode } from '@/types'

interface Props {
  onCreateTask?: () => void
  onViewDetail?: (task: TaskNode) => void
}

export function RootTaskGrid({ onCreateTask, onViewDetail }: Props) {
  const { roots, selectTask, expandedIds, toggleExpand } = useTaskStore()
  const [expandedRootId, setExpandedRootId] = useState<string | null>(null)

  // 展开任务的所有子节点（递归）
  function expandAllChildren(task: TaskNode) {
    task.children.forEach(child => {
      if (!expandedIds.has(child.id)) {
        toggleExpand(child.id)
      }
      if (child.children.length > 0) {
        expandAllChildren(child)
      }
    })
  }

  function handleRootClick(rootId: string) {
    if (expandedRootId === rootId) {
      // 收起
      setExpandedRootId(null)
    } else {
      // 展开当前根任务的所有子节点，关闭其他根任务
      setExpandedRootId(rootId)
      const root = roots.find(r => r.id === rootId)
      if (root) {
        expandAllChildren(root)
      }
    }
  }

  function renderTaskTree(task: TaskNode, depth: number = 0) {
    const isExpanded = expandedIds.has(task.id)
    const hasChildren = task.children.length > 0

    // 计算缩进：第一层 16px，第二层 20px，依次 +4px
    const paddingLeft = depth === 0 ? '12px' : `${12 + depth * 4}px`

    const taskContent = (
      <div
        className="flex items-center gap-2 p-3"
        style={{ paddingLeft }}
      >
        {/* 展开/收起箭头 (仅子任务显示) */}
        {depth > 0 && hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleExpand(task.id)
            }}
            className="p-0.5 hover:bg-dark-border rounded"
          >
            {isExpanded ? (
              <ChevronDown size={14} className="text-dark-text-secondary opacity-60" />
            ) : (
              <ChevronRight size={14} className="text-dark-text-secondary opacity-60" />
            )}
          </button>
        )}
        {depth > 0 && !hasChildren && <span className="w-4" />}

        {/* 任务标题 */}
        <div
          className="flex-1 cursor-pointer"
          onClick={() => {
            if (depth === 0) {
              handleRootClick(task.id)
            } else {
              toggleExpand(task.id)
            }
          }}
        >
          <div className="font-medium text-sm">{task.title}</div>
          {depth === 0 && (
            <div className="text-xs text-dark-text-secondary mt-0.5">
              {task.children.length} 个子任务
            </div>
          )}
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 进度状态 */}
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              task.status === 'done' ? 'bg-green-500' :
              task.status === 'in-progress' ? 'bg-blue-500' :
              task.status === 'blocked' ? 'bg-red-500' :
              task.status === 'cancel' ? 'bg-gray-400' :
              'bg-gray-500'
            }`}
            title={task.status}
          />

          {/* 智能体头像 */}
          {task.assignee && (
            <span className="text-lg flex-shrink-0" title={task.assignee.role}>
              {task.assignee.avatar}
            </span>
          )}

          {/* 查看详情 (眼睛) */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              selectTask(task.id)
              onViewDetail?.(task)
            }}
            className="p-1.5 hover:bg-brand-blue/10 rounded flex-shrink-0"
          >
            <Eye size={16} className="text-brand-blue" />
          </button>

          {/* 添加子任务 (+ 号) */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCreateTask?.()
            }}
            className="p-1.5 hover:bg-brand-purple/10 rounded flex-shrink-0"
          >
            <Plus size={16} className="text-brand-purple" />
          </button>
        </div>
      </div>
    )

    return (
      <div key={task.id}>
        <div className={`border-b border-dark-border/30 ${depth === 0 ? '' : 'bg-dark-secondary'}`}>
          {taskContent}
        </div>
        {isExpanded && hasChildren && (
          <div>
            {task.children.map(child => renderTaskTree(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-2">
      <div className="space-y-2">
        {roots.map(root => (
          <div
            key={root.id}
            className="bg-dark-secondary rounded-lg border border-dark-border overflow-hidden"
          >
            {/* 根任务行 */}
            <div
              className="flex items-center gap-2 p-3 cursor-pointer"
              onClick={() => handleRootClick(root.id)}
            >
              {/* 展开/收起箭头 */}
              <span className="w-4 flex-shrink-0">
                {expandedRootId === root.id ? (
                  <ChevronDown size={14} className="text-dark-text-secondary opacity-60" />
                ) : (
                  <ChevronRight size={14} className="text-dark-text-secondary opacity-60" />
                )}
              </span>

              {/* 任务标题 */}
              <div className="flex-1">
                <div className="font-bold text-sm">{root.title}</div>
                <div className="text-xs text-dark-text-secondary mt-0.5">
                  {root.children.length} 个子任务
                </div>
              </div>

              {/* 右侧操作区 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* 进度状态 */}
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    root.status === 'done' ? 'bg-green-500' :
                    root.status === 'in-progress' ? 'bg-blue-500' :
                    root.status === 'blocked' ? 'bg-red-500' :
                    root.status === 'cancel' ? 'bg-gray-400' :
                    'bg-gray-500'
                  }`}
                  title={root.status}
                />

                {/* 智能体头像 */}
                {root.assignee && (
                  <span className="text-lg flex-shrink-0" title={root.assignee.role}>
                    {root.assignee.avatar}
                  </span>
                )}

                {/* 查看详情 (眼睛) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    selectTask(root.id)
                    onViewDetail?.(root)
                  }}
                  className="p-1.5 hover:bg-brand-blue/10 rounded flex-shrink-0"
                >
                  <Eye size={16} className="text-brand-blue" />
                </button>

                {/* 添加子任务 (+ 号) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateTask?.()
                  }}
                  className="p-1.5 hover:bg-brand-purple/10 rounded flex-shrink-0"
                >
                  <Plus size={16} className="text-brand-purple" />
                </button>
              </div>
            </div>

            {/* 子任务树 (展开时显示) */}
            {expandedRootId === root.id && root.children.length > 0 && (
              <div>
                {root.children.map(child => renderTaskTree(child, 1))}
              </div>
            )}
          </div>
        ))}
      </div>

      {roots.length === 0 && (
        <div className="text-center py-8 text-dark-text-secondary text-sm">
          暂无任务
        </div>
      )}
    </div>
  )
}
