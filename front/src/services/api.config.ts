import type { TaskNode, ProjectData } from '@/types'
import type { StatusOption } from '@/config/status'
import axios from 'axios'

const api = axios.create({
  baseURL: 'api',
  timeout: 10000,
})

export const taskApi = {
  async fetchTasks(): Promise<ProjectData & { statusConfig?: StatusOption[] }> {
    const response = await api.get<{ data: ProjectData & { statusConfig?: StatusOption[] }; success: boolean }>('tasks')
    return response.data.data
  },

  async updateTask(id: string, changes: Partial<TaskNode>): Promise<TaskNode> {
    const response = await api.put<{ data: TaskNode; success: boolean }>('tasks/' + id, changes)
    return response.data.data
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete('tasks/' + id)
  },

  async createChild(parentId: string, task: Partial<TaskNode>): Promise<TaskNode> {
    const response = await api.post<{ data: TaskNode; success: boolean }>('tasks/' + parentId + '/children', task)
    return response.data.data
  },
}

export const configApi = {
  async fetchWorkspaceConfig(): Promise<string> {
    try {
      const response = await axios.get<{ agents: { defaults: { workspace: string } } }>('/api/config')
      return response.data.agents?.defaults?.workspace || ''
    } catch {
      return ''
    }
  },

  async updatePlanDir(planId: string, dir: string): Promise<void> {
    await api.put('plans/' + planId + '/dir', { dir })
  },

  async updateGlobalDir(dir: string): Promise<void> {
    await api.put('config/dir', { dir })
  },
}
