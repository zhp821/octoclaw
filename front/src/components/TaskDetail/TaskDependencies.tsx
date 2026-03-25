import { useTaskStore } from '@/stores/taskStore'

interface Props {
  task: import('@/types').TaskNode
}

export function TaskDependencies({ task }: Props) {
  const { roots } = useTaskStore()

  if (task.dependencies.length === 0) return null

  function findTaskName(id: string): string {
    const visited = new Set<string>()
    function findInTree(tasks: typeof roots): string | null {
      for (const t of tasks) {
        if (visited.has(t.id)) continue
        visited.add(t.id)
        if (t.id === id) return t.title
        const found = findInTree(t.children)
        if (found) return found
      }
      return null
    }
    return findInTree(roots) || id
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-bold text-dark-text-secondary mb-2">依赖关系</h3>
      <div className="flex flex-wrap gap-2">
        {task.dependencies.map(depId => (
          <span
            key={depId}
            className="text-xs px-2 py-1 rounded flex items-center gap-1 text-dark-text-primary"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <span>←</span>
            <span>{findTaskName(depId)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
