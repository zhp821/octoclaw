import { useChatStore } from '@/stores/chatStore'
import { useTaskStore } from '@/stores/taskStore'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'

export function ChatPanel() {
  const { selectedId, roots } = useTaskStore()
  const { messages, rootMessages, sendMessage, isLoading } = useChatStore()
  
  // 未选择任务时使用根任务聊天消息
  const taskMessages = selectedId 
    ? (messages[selectedId] || [])
    : rootMessages

  // 查找选中任务的名称
  function findTaskName(id: string): string {
    function findInTree(tasks: typeof roots): string | null {
      for (const t of tasks) {
        if (t.id === id) return t.title
        const found = findInTree(t.children)
        if (found) return found
      }
      return null
    }
    return findInTree(roots) || '未知任务'
  }

  const taskName = selectedId ? findTaskName(selectedId) : null

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-dark-border font-bold flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span>💬</span>
          <span>AI 助手</span>
        </div>
        {taskName ? (
          <span className="text-xs text-dark-text-secondary truncate max-w-[120px]" title={taskName}>
            {taskName}
          </span>
        ) : (
          <span className="text-xs text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded whitespace-nowrap">
            创建根任务
          </span>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {taskMessages.length === 0 ? (
          <div className="text-center text-dark-text-secondary text-sm py-8">
            {selectedId ? (
              <>
                <p>暂无消息</p>
                <p className="mt-1">与 AI 助手对话，帮助分解或修改任务</p>
              </>
            ) : (
              <>
                <p>💡 创建新任务</p>
                <p className="mt-1 text-xs">告诉 AI 助手你想创建什么任务</p>
                <p className="mt-2 text-xs text-brand-purple">例如："帮我创建一个电商后台管理系统的任务"</p>
              </>
            )}
          </div>
        ) : (
          taskMessages.map(m => <ChatMessage key={m.id} message={m} />)
        )}
        {isLoading && (
          <div className="flex gap-2 justify-end">
            <div className="text-sm text-dark-text-secondary animate-pulse">
              AI 正在思考...
            </div>
          </div>
        )}
      </div>
      
      <ChatInput
        onSend={(c) => sendMessage(selectedId, c)}
        disabled={isLoading}
        placeholder={selectedId ? '输入消息...' : '描述你想创建的任务...'}
      />
    </div>
  )
}
