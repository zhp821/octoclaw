import { create } from 'zustand'
import type { TaskNode, ProjectData } from '@/types'
import type { StatusOption } from '@/config/status'
import taskApi from '@/services/taskApi'

interface TaskState {
  roots: TaskNode[]
  agents: ProjectData['agents']
  statusConfig: StatusOption[]
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
  const visited = new Set<string>()
  function traverse(tasks: TaskNode[]) {
    for (const task of tasks) {
      if (visited.has(task.id)) continue
      visited.add(task.id)
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
  statusConfig: [],
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
      set({ 
        roots: data.roots || [], 
        agents: data.agents || [],
        statusConfig: data.statusConfig || [],
        isLoading: false 
      })
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      set({ isLoading: false })
    }
  },

  selectTask: (id: string) => {
    const { expandedIds, roots } = get()
    const newExpanded = new Set(expandedIds)
    const visited = new Set<string>()
    function expandParents(tasks: TaskNode[], targetId: string): boolean {
      for (const task of tasks) {
        if (visited.has(task.id)) continue
        visited.add(task.id)
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
    const visited = new Set<string>()
    function updateInTree(tasks: TaskNode[]): boolean {
      for (const task of tasks) {
        if (visited.has(task.id)) continue
        visited.add(task.id)
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
    const visited = new Set<string>()
    function addChildToTree(tasks: TaskNode[]): boolean {
      for (const t of tasks) {
        if (visited.has(t.id)) continue
        visited.add(t.id)
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
    const orderMap = new Map<string, number>()
    
    // 计算新的 order 值
    for (let i = 0; i < newOrder.length; i++) {
      const id = newOrder[i]
      const prevOrder = i > 0 ? orderMap.get(newOrder[i - 1]) ?? null : null
      const nextTask = roots.find(r => r.id === newOrder[i + 1])
      const nextOrder = nextTask?.order ?? null
      
      let newOrderValue: number
      if (prevOrder === null && nextOrder === null) {
        newOrderValue = 1000
      } else if (prevOrder === null) {
        newOrderValue = nextOrder! / 2
      } else if (nextOrder === null) {
        newOrderValue = prevOrder + 1000
      } else {
        newOrderValue = (prevOrder + nextOrder) / 2
      }
      orderMap.set(id, newOrderValue)
    }
    
    const newRoots = newOrder.map(id => {
      const task = roots.find(r => r.id === id)
      if (task) {
        return { ...task, order: orderMap.get(id) ?? task.order }
      }
      return null
    }).filter(Boolean) as TaskNode[]
    
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
      return ''
    }
    
    const visited = new Set<string>()
    function findTask(id: string): TaskNode | null {
      for (const t of roots) {
        if (visited.has(t.id)) continue
        visited.add(t.id)
        if (t.id === id) return t
        const found = findTaskInChildren(t.children, id, visited)
        if (found) return found
      }
      return null
    }
    function findTaskInChildren(tasks: TaskNode[], id: string, visited: Set<string>): TaskNode | null {
      for (const task of tasks) {
        if (visited.has(task.id)) continue
        visited.add(task.id)
        if (task.id === id) return task
        const found = findTaskInChildren(task.children, id, visited)
        if (found) return found
      }
      return null
    }
    
    const parent = findTask(parentId)
    if (!parent) return '1'
    
    // 下一个编号 = 最后一个子任务编号最后一位 + 1
    let nextNum = 1
    if (parent.children.length > 0) {
      const lastChild = parent.children[parent.children.length - 1]
      const parts = lastChild.numbering.split('.')
      const lastPart = parts[parts.length - 1]
      nextNum = parseInt(lastPart, 10) + 1
    }
    
    // 如果父任务没有编号（根任务），子任务编号就是 nextNum
    // 如果父任务有编号，子任务编号是 父编号.nextNum
    if (!parent.numbering) {
      return `${nextNum}`
    }
    return `${parent.numbering}.${nextNum}`
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
