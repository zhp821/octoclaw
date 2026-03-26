import { useEffect, useRef } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useTaskStore } from '@/stores/taskStore'
import { connectChat, sendMessage as wsSendMessage, getConnectionState } from '@/services/chat/controller'
import type { ChatMessage as ChatMessageType, TaskNode } from '@/types'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { OctoClawLogo } from '@/components/Layout/Header'
import axios from 'axios'

const api = axios.create({
  baseURL: 'api',
  timeout: 30000,
})

interface FileAttachment {
  file: File
  preview?: string
}

export function ChatPanel() {
  const { selectedId, roots, fetchTasks, selectTask } = useTaskStore()
  const { sessions, isTyping, connectionState, setConnectionState, addMessage } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  function findTask(id: string): TaskNode | null {
    const visited = new Set<string>()
    function findInTree(tasks: TaskNode[]): TaskNode | null {
      for (const task of tasks) {
        if (visited.has(task.id)) continue
        visited.add(task.id)
        if (task.id === id) return task
        const found = findInTree(task.children)
        if (found) return found
      }
      return null
    }
    return findInTree(roots)
  }
  
  function findRootTask(taskId: string): TaskNode | null {
    const visited = new Set<string>()
    function findInTree(tasks: TaskNode[], targetId: string, root: TaskNode | null): TaskNode | null {
      for (const task of tasks) {
        if (visited.has(task.id)) continue
        visited.add(task.id)
        if (task.id === targetId) return root || task
        const found = findInTree(task.children, targetId, root || task)
        if (found) return found
      }
      return null
    }
    return findInTree(roots, taskId, null)
  }
  
  const selectedTask = selectedId ? findTask(selectedId) : null
  const rootTask = selectedId ? findRootTask(selectedId) : null
  const sessionId = rootTask ? `plan-${rootTask.id}` : 'global'
  const session = sessions.get(sessionId)
  const taskMessages = session?.messages || []
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [taskMessages, isTyping])
  
  useEffect(() => {
    connectChat(sessionId)
    
    const updateConnectionState = () => {
      const state = getConnectionState()
      setConnectionState(state.connected ? 'connected' : state.connecting ? 'connecting' : 'disconnected')
    }
    
    updateConnectionState()
    const interval = setInterval(updateConnectionState, 1000)
    
    return () => clearInterval(interval)
  }, [sessionId])

  const taskDisplayName = selectedTask 
    ? (selectedTask.numbering ? `${selectedTask.numbering} ${selectedTask.title}` : selectedTask.title)
    : null

  const handleSend = (content: string) => {
    wsSendMessage(content)
  }

  const handleCreate = async (content: string, files: FileAttachment[]) => {
    try {
      const formData = new FormData()
      formData.append('title', content)
      formData.append('description', content)
      
      for (const attachment of files) {
        formData.append('files', attachment.file)
      }

      const response = await api.post<{ data: { id: string }; success: boolean }>(
        'plans/create',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      const newTaskId = response.data.data.id
      
      await fetchTasks()
      selectTask(newTaskId)
    } catch (err) {
      console.error('创建任务失败:', err)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="p-3 border-b font-bold flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <OctoClawLogo className="w-5 h-5" />
          <span style={{ color: 'var(--text-primary)' }}>AI 助手</span>
        </div>
        <div className="flex items-center gap-2">
          {taskDisplayName ? (
            <span className="text-xs truncate max-w-[150px]" style={{ color: 'var(--text-secondary)' }} title={taskDisplayName}>
              {taskDisplayName}
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded whitespace-nowrap" style={{ color: 'var(--brand-purple)', backgroundColor: 'rgba(139,92,246,0.1)' }}>
              创建根任务
            </span>
          )}
          <span className={`w-2 h-2 rounded-full ${
            connectionState === 'connected' ? 'bg-green-500' :
            connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-gray-500'
          }`} title={
            connectionState === 'connected' ? '已连接' :
            connectionState === 'connecting' ? '连接中...' : '未连接'
          } />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {taskMessages.length === 0 ? (
          <div className="text-center text-sm py-8" style={{ color: 'var(--text-secondary)' }}>
            {selectedId ? (
              <>
                <p>暂无消息</p>
                <p className="mt-1">与 AI 助手对话，帮助分解或修改任务</p>
              </>
            ) : (
              <>
                <p>💡 创建新任务</p>
                <p className="mt-1 text-xs">告诉 AI 助手你想创建什么任务</p>
                <p className="mt-2 text-xs" style={{ color: 'var(--brand-purple)' }}>例如："帮我创建一个电商后台管理系统的任务"</p>
              </>
            )}
          </div>
        ) : (
          taskMessages.map((m: ChatMessageType) => <ChatMessage key={m.id} message={m} />)
        )}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput
        onSend={handleSend}
        onCreate={handleCreate}
        showCreate={!selectedId}
        disabled={connectionState === 'connecting'}
        placeholder={selectedId ? '输入消息...' : '描述你想创建的任务...'}
      />
    </div>
  )
}
