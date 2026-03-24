import { create } from 'zustand'
import type { TaskNode, ProjectData } from '@/types'
import taskApi from '@/services/taskApi'

interface TaskState {
  roots: TaskNode[]
  agents: ProjectData['agents']
  expandedIds: Set<string>
  selectedId: string | null
  isLoading: boolean
  isCreatingTask: boolean
  creatingParentId: string | null
  searchQuery: string

  fetchTasks: () => Promise<void>
  selectTask: (id: string) => void
  toggleExpand: (id: string) => void
  updateTask: (id: string, changes: Partial<TaskNode>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  createChild: (parentId: string, task: Partial<TaskNode>) => Promise<void>
  startCreateTask: (parentId: string | null) => void
  cancelCreateTask: () => void
  reorderRoots: (newOrder: string[]) => void
  setSearchQuery: (query: string) => void
  searchTasks: (query: string) => TaskNode[]
  getNextNumbering: (parentId: string | null) => string
}

function flattenTasks(roots: TaskNode[]): TaskNode[] {
  const result: TaskNode[] = []
  function traverse(tasks: TaskNode[]) {
    for (const task of tasks) {
      result.push(task)
      traverse(task.children)
    }
  }
  traverse(roots)
  return result
}

export const useTaskStore = create<TaskState>((set, get) => ({
  roots: [],
  agents: [],
  expandedIds: new Set(),
  selectedId: null,
  isLoading: false,
  isCreatingTask: false,
  creatingParentId: null,
  searchQuery: '',

  fetchTasks: async () => {
    set({ isLoading: true })
    try {
      const data = await taskApi.fetchTasks()
      set({ roots: data.roots, agents: data.agents, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      set({ isLoading: false })
    }
  },

  selectTask: (id: string) => {
    const { expandedIds, roots } = get()
    const newExpanded = new Set(expandedIds)
    function expandParents(tasks: TaskNode[], targetId: string): boolean {
      for (const task of tasks) {
        if (task.id === targetId) return true
        if (expandParents(task.children, targetId)) {
          newExpanded.add(task.id)
          return true
        }
      }
      return false
    }
    expandParents(roots, id)
    set({ selectedId: id, expandedIds: newExpanded, isCreatingTask: false, creatingParentId: null })
  },

  toggleExpand: (id: string) => {
    const { expandedIds } = get()
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    set({ expandedIds: newExpanded })
  },

  updateTask: async (id: string, changes: Partial<TaskNode>) => {
    await taskApi.updateTask(id, changes)
    const { roots } = get()
    const newRoots = JSON.parse(JSON.stringify(roots)) as TaskNode[]
    function updateInTree(tasks: TaskNode[]): boolean {
      for (const task of tasks) {
        if (task.id === id) {
          Object.assign(task, changes)
          return true
        }
        if (updateInTree(task.children)) return true
      }
      return false
    }
    updateInTree(newRoots)
    set({ roots: newRoots })
  },

  deleteTask: async (id: string) => {
    await taskApi.deleteTask(id)
    const { roots } = get()
    const newRoots = roots.filter(r => r.id !== id)
    set({ roots: newRoots, selectedId: null })
  },

  createChild: async (parentId: string, task: Partial<TaskNode>) => {
    const newChild = await taskApi.createChild(parentId, task)
    const { roots } = get()
    const newRoots = JSON.parse(JSON.stringify(roots)) as TaskNode[]
    function addChildToTree(tasks: TaskNode[]): boolean {
      for (const t of tasks) {
        if (t.id === parentId) {
          t.children.push(newChild)
          return true
        }
        if (addChildToTree(t.children)) return true
      }
      return false
    }
    addChildToTree(newRoots)
    set({ roots: newRoots, isCreatingTask: false, creatingParentId: null })
  },

  reorderRoots: (newOrder: string[]) => {
    const { roots } = get()
    const newRoots = newOrder.map(id => roots.find(r => r.id === id)!).filter(Boolean)
    set({ roots: newRoots })
  },

  startCreateTask: (parentId: string | null) => {
    set({ isCreatingTask: true, creatingParentId: parentId, selectedId: null })
  },

  cancelCreateTask: () => {
    set({ isCreatingTask: false, creatingParentId: null })
  },

  getNextNumbering: (parentId: string | null): string => {
    const { roots } = get()
    if (!parentId || parentId === '__root__') {
      // 新建根任务，不需要编号
      return ''
    }
    // 查找父任务
    function findTask(id: string): TaskNode | null {
      for (const t of roots) {
        if (t.id === id) return t
        const found = findTaskInChildren(t.children, id)
        if (found) return found
      }
      return null
    }
    function findTaskInChildren(tasks: TaskNode[], id: string): TaskNode | null {
      for (const task of tasks) {
        if (task.id === id) return task
        const found = findTaskInChildren(task.children, id)
        if (found) return found
      }
      return null
    }
    const parent = findTask(parentId)
    if (!parent) return '1'
    // 下一个编号 = 当前子任务数量 + 1
    const nextIndex = parent.children.length + 1
    // 如果父任务是根任务 (level 0)，子任务编号从 1 开始 (1, 2, 3...)
    // 否则子任务编号 = 父编号。序号 (如 1.1, 1.2 或 1.2.1, 1.2.2)
    if (parent.level === 0) {
      return `${nextIndex}`
    }
    return `${parent.numbering}.${nextIndex}`
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  searchTasks: (query: string) => {
    const { roots } = get()
    const allTasks = flattenTasks(roots)
    const lowerQuery = query.toLowerCase()
    return allTasks.filter(task =>
      task.title.toLowerCase().includes(lowerQuery) ||
      task.description.toLowerCase().includes(lowerQuery)
    )
  },
}))
