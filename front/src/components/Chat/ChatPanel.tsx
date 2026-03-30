import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useTaskStore } from '@/stores/taskStore'
import { connectChat, sendMessage as wsSendMessage, getConnectionState, switchSession } from '@/services/chat/controller'
import type { ChatMessage as ChatMessageType, TaskNode } from '@/types'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { OctoClawLogo } from '@/components/Layout/Header'
import { ChevronDown, ChevronUp } from 'lucide-react'

import axios from 'axios'
import { mediaApi } from '@/services/api/media'

const api = axios.create({
  baseURL: '/octo/api',
  timeout: 30000,
})

interface FileAttachment {
  file: File
  preview?: string
}

export function ChatPanel() {
  const { selectedId, roots, fetchTasks, selectTask, toggleExpand } = useTaskStore()
  const { sessions, isTyping, connectionState, setConnectionState } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [userMessageIndices, setUserMessageIndices] = useState<number[]>([])
  const [currentUserIndex, setCurrentUserIndex] = useState(-1)
  
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
  
  const sessionId = rootTask?.globalSessionId || (rootTask ? `agent:main:octo:global:${rootTask.id}` : 'global')
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

  useEffect(() => {
    const indices = taskMessages
      .map((m, i) => m.role === 'user' ? i : -1)
      .filter(i => i !== -1)
    setUserMessageIndices(indices)
  }, [taskMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setCurrentUserIndex(-1)
  }

  const scrollToPrevUserMessage = () => {
    if (userMessageIndices.length === 0) return
    const currentIdx = currentUserIndex === -1 ? userMessageIndices.length : currentUserIndex
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : 0
    setCurrentUserIndex(prevIdx)
    const msgIndex = userMessageIndices[prevIdx]
    const msgElements = messagesContainerRef.current?.children
    if (msgElements && msgElements[msgIndex]) {
      msgElements[msgIndex].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const taskDisplayName = selectedTask 
    ? (selectedTask.numbering ? `${selectedTask.numbering} ${selectedTask.title}` : selectedTask.title)
    : null

  const handleSend = (content: string) => {
    wsSendMessage(content)
  }

  const handleCreate = async (content: string, files: FileAttachment[]) => {
    try {
      const fileRefs: string[] = []
      for (const attachment of files) {
        const result = await mediaApi.uploadFile(attachment.file)
        fileRefs.push(result.ref)
      }

      const response = await api.post<{ data: { planId: string; sessionId: string }; success: boolean }>(
        'plans/create',
        {
          content,
          files: fileRefs,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data.success) {
        await fetchTasks()
        toggleExpand(response.data.data.planId)
        selectTask(response.data.data.planId)
        switchSession(response.data.data.sessionId)

        useChatStore.getState().addMessage(response.data.data.sessionId, {
          id: `msg-user-${Date.now()}`,
          role: 'user',
          content,
          timestamp: Date.now(),
        })
      }
    } catch (err) {
      console.error('创建任务失败:', err)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="p-2 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <OctoClawLogo className="w-5 h-5" />
          <span style={{ color: 'var(--text-primary)' }}>AI 助手</span>
          {taskDisplayName && (
            <span className="text-xs truncate max-w-[120px]" style={{ color: 'var(--text-secondary)' }} title={taskDisplayName}>
              {taskDisplayName}
            </span>
          )}
          {!selectedId && (
            <span className="text-xs px-2 py-0.5 rounded whitespace-nowrap" style={{ color: 'var(--brand-purple)', backgroundColor: 'rgba(139,92,246,0.1)' }}>
              创建根任务
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            connectionState === 'connected' ? 'bg-green-500' :
            connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-gray-500'
          }`} title={
            connectionState === 'connected' ? '已连接' :
            connectionState === 'connecting' ? '连接中...' : '未连接'
          } />
        </div>
      </div>
      
      <div className="flex items-center gap-1 px-2 py-1 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={scrollToPrevUserMessage}
          disabled={userMessageIndices.length === 0}
          className="p-1 rounded hover:opacity-80 disabled:opacity-30"
          title="上一个用户消息"
        >
          <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
        <button
          onClick={scrollToBottom}
          className="p-1 rounded hover:opacity-80"
          title="滚动到底部"
        >
          <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3" ref={messagesContainerRef}>
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
        showCreate={true}
        disabled={connectionState === 'connecting'}
        placeholder={selectedId ? '输入消息...' : '描述你想创建的任务...'}
        planId={rootTask?.id}
      />
    </div>
  )
}