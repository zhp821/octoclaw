import { http, HttpResponse, delay } from 'msw'
import { generateMockData, findTaskById } from './mockData'
import type { TaskNode, ChatMessage } from '@/types'
import { STATUS_CONFIG } from '@/config/status'
import { formatTimestamp } from '@/utils/timestamp'

let mockData = generateMockData()

export const handlers = [
  http.get('/api/tasks', async () => {
    await delay(300)
    return HttpResponse.json({
      data: { 
        roots: mockData.roots, 
        agents: mockData.agents,
        statusConfig: STATUS_CONFIG,
      },
      success: true,
    })
  }),

  http.get('/api/tasks/:id', async ({ params }) => {
    await delay(200)
    const { id } = params
    const task = findTaskById(mockData.roots, id as string)
    if (!task) {
      return HttpResponse.json({ data: null, success: false, message: 'Task not found' }, { status: 404 })
    }
    return HttpResponse.json({ data: task, success: true })
  }),

  http.put('/api/tasks/:id', async ({ params, request }) => {
    await delay(200)
    const { id } = params
    const changes = await request.json() as Partial<TaskNode>
    const task = findTaskById(mockData.roots, id as string)
    if (!task) {
      return HttpResponse.json({ data: null, success: false }, { status: 404 })
    }
    Object.assign(task, changes)
    return HttpResponse.json({ data: task, success: true })
  }),

  http.delete('/api/tasks/:id', async ({ params }) => {
    await delay(200)
    const { id } = params
    function removeFromTree(tasks: TaskNode[]): boolean {
      const idx = tasks.findIndex(t => t.id === id)
      if (idx !== -1) { tasks.splice(idx, 1); return true }
      return tasks.some(t => removeFromTree(t.children))
    }
    removeFromTree(mockData.roots)
    return HttpResponse.json({ data: null, success: true })
  }),

  http.post('/api/tasks/:id/children', async ({ params, request }) => {
    await delay(200)
    const { id } = params
    const newTask = await request.json() as Partial<TaskNode>
    const parentTask = findTaskById(mockData.roots, id as string)
    if (!parentTask) {
      return HttpResponse.json({ data: null, success: false }, { status: 404 })
    }
    const child: TaskNode = {
      id: `task-${Date.now()}`,
      parentId: parentTask.id,
      title: newTask.title || 'New Task',
      description: newTask.description || '',
      status: 'todo',
      level: parentTask.level + 1,
      numbering: `${parentTask.numbering}.${parentTask.children.length + 1}`,
      order: (parentTask.children.length + 1) * 1000,
      dependencies: [],
      children: [],
      assignee: parentTask.assignee,
      qualityGate: { enabled: false, description: '' },
      steps: [],
      chatHistory: [],
      requiresReview: false,
    }
    parentTask.children.push(child)
    return HttpResponse.json({ data: child, success: true })
  }),

  http.post('/api/tasks/reorder', async () => {
    await delay(200)
    return HttpResponse.json({ data: { success: true }, success: true })
  }),

  http.get('/api/agents', async () => {
    await delay(100)
    return HttpResponse.json({ data: mockData.agents, success: true })
  }),

  http.post('/api/chat/:taskId', async ({ request }) => {
    await delay(1000)
    const { content } = await request.json() as { content: string }
    const response: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `收到消息："${content}"。这是一个 Mock 响应，模拟 AI 助手。`,
      timestamp: formatTimestamp(),
      relatedAction: 'modify',
      pendingChanges: {
        title: 'Updated by AI',
        description: 'AI updated description',
      },
    }
    return HttpResponse.json({ data: { message: response }, success: true })
  }),
]
