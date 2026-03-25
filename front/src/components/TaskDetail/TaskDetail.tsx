import { useTaskStore } from '@/stores/taskStore'
import { TaskSteps } from './TaskSteps'
import { QualityGate } from './QualityGate'
import { TaskDependencies } from './TaskDependencies'
import { Badge } from '@/components/shared/Badge'
import { NewTaskForm } from './NewTaskForm'
import { useNavigate } from 'react-router-dom'

export function TaskDetail() {
  const navigate = useNavigate()
  const { selectedId, roots, isCreatingTask, creatingParentId, cancelCreateTask } = useTaskStore()

  if (isCreatingTask) {
    return (
      <div className="h-full">
        <NewTaskForm parentId={creatingParentId} onCancel={cancelCreateTask} />
      </div>
    )
  }

  function findTask(id: string): any {
    for (const t of roots) {
      if (t.id === id) return t
      const found = findTaskInChildren(t.children, id)
      if (found) return found
    }
    return null
  }

  function findTaskInChildren(tasks: typeof roots, id: string): any {
    for (const task of tasks) {
      if (task.id === id) return task
      const found = findTaskInChildren(task.children, id)
      if (found) return found
    }
    return null
  }

  const task = selectedId ? findTask(selectedId) : null

  if (!task) {
    return (
      <div className="p-4 flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
        <p>请选择一个任务查看详情</p>
      </div>
    )
  }

  return (
    <div className="p-3 overflow-y-auto h-full" style={{ color: 'var(--text-primary)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{task.numbering || '根任务'}</div>
          <h2 className="text-lg font-bold">{task.title}</h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge status={task.status} />
          {task.assignee && (
            <span className="text-lg" title={task.assignee.role}>{task.assignee.avatar}</span>
          )}
        </div>
      </div>

      <div className="mb-3">
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>描述</h3>
        <div className="p-3 rounded whitespace-pre-wrap" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          {task.description}
        </div>
      </div>

      {task.executionSessionId && (
        <div className="mb-3">
          <button
            onClick={() => navigate(`/execution/${task.id}`)}
            className="w-full p-2 rounded text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--brand-purple)', color: 'white' }}
          >
            💬 执行会话
          </button>
        </div>
      )}

      {task.assignee && (
        <div className="mb-3">
          <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>负责人</h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">{task.assignee.avatar}</span>
            <span>{task.assignee.name} ({task.assignee.role})</span>
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>人工审核</h3>
          {task.requiresReview ? (
            <span className="text-xs px-2 py-0.5 rounded border" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.4)' }}>需要审核</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded border" style={{ backgroundColor: 'rgba(107,114,128,0.2)', color: 'var(--text-secondary)', borderColor: 'rgba(107,114,128,0.4)' }}>无需审核</span>
          )}
        </div>
      </div>

      <TaskSteps steps={task.steps} />

      {task.qualityGate?.enabled && (
        <div className="mt-3">
          <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>质量门</h3>
          <div className="p-3 rounded border-l-2" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: 'var(--text-primary)', borderLeftColor: 'var(--brand-purple)' }}>
            {task.qualityGate.description}
          </div>
        </div>
      )}

      <TaskDependencies task={task} />
    </div>
  )
}
