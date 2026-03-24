import { create } from 'zustand'
import type { ChatMessage } from '@/types'
import chatApi from '@/services/chatApi'

interface ChatState {
  messages: Record<string, ChatMessage[]>
  rootMessages: ChatMessage[] // 根任务聊天消息（未选择任务时）
  isLoading: boolean

  sendMessage: (taskId: string | null, content: string) => Promise<void>
  applyChanges: (taskId: string, messageId: string) => Promise<void>
  clearHistory: (taskId: string | null) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  rootMessages: [],
  isLoading: false,

  sendMessage: async (taskId: string | null, content: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    if (!taskId) {
      // 未选择任务，发送到根任务聊天
      set(state => ({
        rootMessages: [...state.rootMessages, userMessage],
        isLoading: true,
      }))

      try {
        const response = await chatApi.sendMessage('root', content)
        set(state => ({
          rootMessages: [...state.rootMessages, response.message],
          isLoading: false,
        }))
      } catch (error) {
        console.error('Failed to send message:', error)
        set({ isLoading: false })
      }
    } else {
      // 发送到选定任务聊天
      set(state => ({
        messages: {
          ...state.messages,
          [taskId]: [...(state.messages[taskId] || []), userMessage],
        },
        isLoading: true,
      }))

      try {
        const response = await chatApi.sendMessage(taskId, content)
        set(state => ({
          messages: {
            ...state.messages,
            [taskId]: [...(state.messages[taskId] || []), response.message],
          },
          isLoading: false,
        }))
      } catch (error) {
        console.error('Failed to send message:', error)
        set({ isLoading: false })
      }
    }
  },

  applyChanges: async (taskId: string, messageId: string) => {
    const { messages } = get()
    const message = messages[taskId]?.find(m => m.id === messageId)
    if (!message?.pendingChanges) return
    console.log('Applying changes:', message.pendingChanges)
  },

  clearHistory: (taskId: string | null) => {
    if (!taskId) {
      set({ rootMessages: [] })
    } else {
      set(state => {
        const newMessages = { ...state.messages }
        delete newMessages[taskId]
        return { messages: newMessages }
      })
    }
  },
}))
