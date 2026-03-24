import axios from 'axios'
import type { ChatMessage } from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export interface ChatResponse {
  message: ChatMessage
}

export const chatApi = {
  async sendMessage(taskId: string, content: string): Promise<ChatResponse> {
    const response = await api.post<{ data: ChatResponse; success: boolean }>(
      `/chat/${taskId}`,
      { content }
    )
    return response.data.data
  },
}

export default chatApi
