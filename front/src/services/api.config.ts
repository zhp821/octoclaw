import type { TaskNode, ProjectData, Agent, ChatMessage } from '@/types'
import type { StatusOption } from '@/config/status'
import axios from 'axios'

/**
 * API 配置 - 统一使用相对路径
 * 适配任何部署路径：
 * - http://localhost:3000/ → api/tasks
 * - http://localhost:18800/octo/ → octo/api/tasks
 * - http://localhost:18800/ → api/tasks
 */
const api = axios.create({
  baseURL: 'api',
  timeout: 10000,
})

/**
 * 任务相关 API
 */
export const taskApi = {
  async fetchTasks(): Promise<ProjectData & { statusConfig?: StatusOption[] }> {
    const response = await api.get<{ data: ProjectData & { statusConfig?: StatusOption[] }; success: boolean }>('tasks')
    return response.data.data
  },

  async fetchTaskDetail(id: string): Promise<TaskNode> {
    const response = await api.get<{ data: TaskNode; success: boolean }>(`tasks/${id}`)
    return response.data.data
  },

  async updateTask(id: string, changes: Partial<TaskNode>): Promise<TaskNode> {
    const response = await api.put<{ data: TaskNode; success: boolean }>(`tasks/${id}`, changes)
    return response.data.data
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`tasks/${id}`)
  },

  async createChild(parentId: string, task: Partial<TaskNode>): Promise<TaskNode> {
    const response = await api.post<{ data: TaskNode; success: boolean }>(
      `tasks/${parentId}/children`,
      task
    )
    return response.data.data
  },

  async reorderTasks(parentId: string | null, newOrder: string[]): Promise<{ newOrder: string[] }> {
    const response = await api.post<{ data: { newOrder: string[] }; success: boolean }>(
      'tasks/reorder',
      { parentId, newOrder }
    )
    return response.data.data
  },
}

/**
 * 聊天相关 API
 */
export const chatApi = {
  async sendMessage(taskId: string, content: string): Promise<{ message: ChatMessage }> {
    const response = await api.post<{ data: { message: ChatMessage }; success: boolean }>(
      `chat/${taskId}`,
      { content }
    )
    return response.data.data
  },
}

export default { taskApi, chatApi }
