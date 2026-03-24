import { useTaskStore } from '@/stores/taskStore'

interface Props {
  task: import('@/types').TaskNode
}

export function TaskDependencies({ task }: Props) {
  const { roots } = useTaskStore()

  if (task.dependencies.length === 0) return null

  function findTaskName(id: string): string {
    function findInTree(tasks: typeof roots): string | null {
      for (const t of tasks) {
        if (t.id === id) return t.title
        const found = findInTree(t.children)
        if (found) return found
      }
      return null
    }
    return findTaskName(id) || id
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-bold text-slate-400 dark:text-dark-text-secondary mb-2">依赖关系</h3>
      <div className="flex flex-wrap gap-2">
        {task.dependencies.map(depId => (
          <span
            key={depId}
            className="text-xs bg-gray-100 dark:bg-dark-border px-2 py-1 rounded flex items-center gap-1 text-slate-700 dark:text-dark-text-primary"
          >
            <span>←</span>
            <span>{findTaskName(depId)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
