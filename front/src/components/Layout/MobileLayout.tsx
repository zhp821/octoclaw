import { useState, useEffect, useRef } from 'react'
import { Header } from './Header'
import { RootTaskGrid } from '@/components/TaskTree/RootTaskGrid'
import { TaskDetail } from '@/components/TaskDetail/TaskDetail'
import { ChatPanel } from '@/components/Chat/ChatPanel'
import { NewTaskForm } from '@/components/TaskDetail/NewTaskForm'
import { useTaskStore } from '@/stores/taskStore'
import { ChevronLeft, MessageCircle, Plus, X, Home } from 'lucide-react'

export function MobileLayout() {
  const [view, setView] = useState<'list' | 'detail' | 'chat'>('list')
  const [showChatDrawer, setShowChatDrawer] = useState(false)
  const [chatDrawerHeight, setChatDrawerHeight] = useState(50) // percentage
  const { fetchTasks, selectedId, isCreatingTask, startCreateTask, cancelCreateTask, creatingParentId } = useTaskStore()
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  // 处理聊天抽屉拖拽
  useEffect(() => {
    if (!showChatDrawer) return

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY
      const containerHeight = chatContainerRef.current?.clientHeight || window.innerHeight
      const newHeight = ((containerHeight - touchY) / containerHeight) * 100
      setChatDrawerHeight(Math.min(Math.max(newHeight, 30), 90))
    }

    const handleTouchEnd = () => {
      if (chatDrawerHeight < 40) {
        setShowChatDrawer(false)
      }
    }

    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [showChatDrawer, chatDrawerHeight])

  function handleBack() {
    if (isCreatingTask) {
      cancelCreateTask()
    } else {
      setView('list')
    }
  }

  function handleOpenChat() {
    setShowChatDrawer(true)
    setChatDrawerHeight(50)
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-dark-bg-primary">
      {/* 头部 */}
      <header className="h-12 border-b border-gray-200 dark:border-dark-border flex items-center justify-between px-3 bg-white dark:bg-dark-bg-primary flex-shrink-0">
        <div className="flex items-center gap-2">
          {view !== 'list' && (
            <button onClick={handleBack} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded">
              <ChevronLeft size={20} className="text-slate-900 dark:text-dark-text-primary" />
            </button>
          )}
          {view === 'list' && (
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded">
              <Home size={20} className="text-slate-900 dark:text-dark-text-primary" />
            </button>
          )}
          <h1 className="font-bold text-sm text-slate-900 dark:text-dark-text-primary">
            {isCreatingTask ? '新建任务' : view === 'list' ? '任务列表' : '任务详情'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {view === 'list' && (
            <button
              onClick={() => startCreateTask(null)}
              className="p-1.5 hover:bg-blue-50 dark:hover:bg-brand-blue/10 rounded"
            >
              <Plus size={20} className="text-blue-600 dark:text-brand-blue" />
            </button>
          )}
          {view !== 'list' && (
            <button
              onClick={handleOpenChat}
              className="p-1.5 hover:bg-purple-50 dark:hover:bg-brand-purple/10 rounded"
            >
              <MessageCircle size={20} className="text-purple-600 dark:text-brand-purple" />
            </button>
          )}
        </div>
      </header>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden relative">
        {/* 根任务列表视图 */}
        {view === 'list' && (
          <div className="h-full overflow-y-auto">
            <RootTaskGrid onTaskClick={() => setView('detail')} onCreateTask={() => startCreateTask(null)} />
          </div>
        )}

        {/* 任务详情视图 */}
        {view === 'detail' && (
          <div className="h-full overflow-y-auto">
            <TaskDetail />
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      {view === 'detail' && (
        <div className="border-t border-gray-200 dark:border-dark-border p-2 flex gap-2 bg-white dark:bg-dark-bg-primary flex-shrink-0">
          <button
            onClick={() => startCreateTask(selectedId)}
            className="flex-1 flex items-center justify-center gap-2 p-2 bg-blue-50 dark:bg-brand-blue/10 text-blue-600 dark:text-brand-blue rounded"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">子任务</span>
          </button>
          <button
            onClick={handleOpenChat}
            className="flex-1 flex items-center justify-center gap-2 p-2 bg-purple-50 dark:bg-brand-purple/10 text-purple-600 dark:text-brand-purple rounded"
          >
            <MessageCircle size={16} />
            <span className="text-sm font-medium">AI 助手</span>
          </button>
        </div>
      )}

      {/* 聊天抽屉 */}
      {showChatDrawer && (
        <div
          ref={chatContainerRef}
          className="fixed inset-0 z-50"
          onClick={() => setShowChatDrawer(false)}
        >
          {/* 遮罩层 */}
          <div className="absolute inset-0 bg-black/50" />
          
          {/* 抽屉内容 */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-dark-bg-primary rounded-t-xl overflow-hidden"
            style={{ height: `${chatDrawerHeight}%` }}
            onClick={e => e.stopPropagation()}
          >
            {/* 拖拽手柄 */}
            <div className="flex items-center justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-dark-border rounded-full" />
            </div>
            
            {/* 聊天头部 */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-purple-600 dark:text-brand-purple" />
                <span className="font-bold text-sm text-slate-900 dark:text-dark-text-primary">AI 助手</span>
              </div>
              <button
                onClick={() => setShowChatDrawer(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded"
              >
                <X size={18} className="text-slate-900 dark:text-dark-text-primary" />
              </button>
            </div>
            
            {/* 聊天内容 */}
            <div className="h-[calc(100%-50px)] overflow-hidden">
              <ChatPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
