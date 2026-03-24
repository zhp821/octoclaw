import type { TaskNode } from '@/types'

export function validateDependencies(task: TaskNode, siblings: TaskNode[], parentId: string | null): boolean {
  const allowedIds = siblings.map(s => s.id)
  if (parentId) allowedIds.push(parentId)
  return task.dependencies.every(depId => allowedIds.includes(depId))
}

export function getDependentTasks(task: TaskNode, allTasks: TaskNode[]): TaskNode[] {
  const result: TaskNode[] = []
  function findDependents(t: TaskNode) {
    for (const candidate of allTasks) {
      if (candidate.dependencies.includes(t.id) && !result.find(r => r.id === candidate.id)) {
        result.push(candidate)
        findDependents(candidate)
      }
    }
  }
  findDependents(task)
  return result
}
