import axios from 'axios'
import type { TaskNode, ProjectData, Agent } from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export interface TaskListResponse {
  roots: TaskNode[]
  agents: Agent[]
}

export const taskApi = {
  async fetchTasks(): Promise<ProjectData> {
    const response = await api.get<{ data: ProjectData; success: boolean }>('/tasks')
    return response.data.data
  },

  async fetchTaskDetail(id: string): Promise<TaskNode> {
    const response = await api.get<{ data: TaskNode; success: boolean }>(`/tasks/${id}`)
    return response.data.data
  },

  async updateTask(id: string, changes: Partial<TaskNode>): Promise<TaskNode> {
    const response = await api.put<{ data: TaskNode; success: boolean }>(`/tasks/${id}`, changes)
    return response.data.data
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`)
  },

  async createChild(parentId: string, task: Partial<TaskNode>): Promise<TaskNode> {
    const response = await api.post<{ data: TaskNode; success: boolean }>(
      `/tasks/${parentId}/children`,
      task
    )
    return response.data.data
  },

  async reorderTasks(parentId: string | null, newOrder: string[]): Promise<{ newOrder: string[] }> {
    const response = await api.post<{ data: { newOrder: string[] }; success: boolean }>(
      '/tasks/reorder',
      { parentId, newOrder }
    )
    return response.data.data
  },
}

export default taskApi
