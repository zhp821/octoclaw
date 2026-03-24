import { useState, useEffect, useRef } from 'react'
import { RootTaskGrid } from '@/components/TaskTree/RootTaskGrid'
import { TaskDetail } from '@/components/TaskDetail/TaskDetail'
import { ChatPanel } from '@/components/Chat/ChatPanel'
import { NewTaskForm } from '@/components/TaskDetail/NewTaskForm'
import { useTaskStore } from '@/stores/taskStore'
import { ChevronLeft, MessageCircle, Plus, X } from 'lucide-react'
import type { TaskNode, TaskStatus } from '@/types'

export function MobileLayout() {
  const [view, setView] = useState<'list' | 'detail' | 'chat'>('list')
  const [showChatDrawer, setShowChatDrawer] = useState(false)
  const [chatDrawerHeight, setChatDrawerHeight] = useState(50)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null)
  const { fetchTasks, selectedId, roots, isCreatingTask, startCreateTask, cancelCreateTask, selectTask } = useTaskStore()
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const detailContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  // 扁平化所有任务用于切换
  function flattenTasks(tasks: TaskNode[]): TaskNode[] {
    const result: TaskNode[] = []
    function traverse(list: TaskNode[]) {
      for (const task of list) {
        result.push(task)
        traverse(task.children)
      }
    }
    traverse(tasks)
    return result
  }

  const allTasks = flattenTasks(roots)
  const currentIndex = selectedId ? allTasks.findIndex(t => t.id === selectedId) : -1

  function handleNextTask() {
    if (currentIndex >= 0 && currentIndex < allTasks.length - 1) {
      const nextTask = allTasks[currentIndex + 1]
      selectTask(nextTask.id)
    }
  }

  function handlePrevTask() {
    if (currentIndex > 0) {
      const prevTask = allTasks[currentIndex - 1]
      selectTask(prevTask.id)
    }
  }

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

  // 任务详情页左滑/右滑手势
  useEffect(() => {
    if (view !== 'detail' || isCreatingTask) return

    const container = detailContainerRef.current
    if (!container) return

    let startX = 0

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - startX
      // 左滑超过 80px 切换到下一个任务
      if (deltaX < -80) {
        handleNextTask()
      }
      // 右滑超过 80px 切换到上一个任务
      if (deltaX > 80) {
        handlePrevTask()
      }
    }

    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [view, isCreatingTask, currentIndex, allTasks.length])

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

  function handleCreateSubtask() {
    startCreateTask(selectedId)
  }

  function handleViewDetail(task: TaskNode) {
    setView('detail')
  }

  // 前端搜索和状态过滤
  const filteredRoots = roots.filter(root => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      if (!root.title.toLowerCase().includes(query) &&
          !root.description.toLowerCase().includes(query)) {
        return false
      }
    }
    if (statusFilter && root.status !== statusFilter) {
      return false
    }
    return true
  })

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-dark-bg-primary">
      {/* 头部 */}
      <header className="h-12 border-b border-gray-200 dark:border-dark-border flex items-center justify-between px-3 bg-white dark:bg-dark-bg-primary flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {view !== 'list' && (
            <button onClick={handleBack} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded flex-shrink-0">
              <ChevronLeft size={20} className="text-slate-900 dark:text-dark-text-primary" />
            </button>
          )}
          <div className="flex items-center gap-1 min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-5 h-5 flex-shrink-0">
              <defs>
                <linearGradient id="mobileLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <ellipse cx="50" cy="45" rx="30" ry="25" fill="url(#mobileLogoGradient)"/>
              <ellipse cx="40" cy="40" rx="8" ry="10" fill="white"/>
              <ellipse cx="60" cy="40" rx="8" ry="10" fill="white"/>
              <circle cx="42" cy="42" r="4" fill="#1e293b"/>
              <circle cx="62" cy="42" r="4" fill="#1e293b"/>
              <circle cx="44" cy="40" r="1.5" fill="white"/>
              <circle cx="64" cy="40" r="1.5" fill="white"/>
              <path d="M 42 52 Q 50 58 58 52" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
            <h1 className="font-bold text-sm text-slate-900 dark:text-dark-text-primary whitespace-nowrap">OctoClaw</h1>
          </div>
          {view === 'list' && (
            <>
              <div className="relative flex-1 min-w-0 ml-2">
                <input
                  type="text"
                  placeholder="搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-[100px] pl-2 pr-2 py-0.5 text-xs bg-transparent border border-gray-300 dark:border-dark-border rounded focus:outline-none focus:ring-1 focus:ring-brand-blue text-dark-text-primary placeholder-dark-text-secondary"
                />
              </div>
              {/* 状态过滤 - 缩小版 */}
              <div className="flex items-center gap-0.5 ml-1 overflow-x-auto">
                <button
                  onClick={() => setStatusFilter(null)}
                  className={`px-1.5 py-0.5 text-[10px] rounded whitespace-nowrap flex items-center gap-0.5 ${
                    statusFilter === null
                      ? 'text-brand-blue font-medium'
                      : 'text-dark-text-secondary'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'todo' ? null : 'todo')}
                  className={`px-1.5 py-0.5 text-[10px] rounded whitespace-nowrap flex items-center gap-0.5 ${
                    statusFilter === 'todo'
                      ? 'text-blue-500 font-medium'
                      : 'text-dark-text-secondary'
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full ${statusFilter === 'todo' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                  待办
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'in-progress' ? null : 'in-progress')}
                  className={`px-1.5 py-0.5 text-[10px] rounded whitespace-nowrap flex items-center gap-0.5 ${
                    statusFilter === 'in-progress'
                      ? 'text-blue-500 font-medium'
                      : 'text-dark-text-secondary'
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full ${statusFilter === 'in-progress' ? 'bg-blue-500' : 'bg-blue-500'}`} />
                  进行中
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'blocked' ? null : 'blocked')}
                  className={`px-1.5 py-0.5 text-[10px] rounded whitespace-nowrap flex items-center gap-0.5 ${
                    statusFilter === 'blocked'
                      ? 'text-red-500 font-medium'
                      : 'text-dark-text-secondary'
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full ${statusFilter === 'blocked' ? 'bg-red-500' : 'bg-red-500'}`} />
                  阻塞
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'done' ? null : 'done')}
                  className={`px-1.5 py-0.5 text-[10px] rounded whitespace-nowrap flex items-center gap-0.5 ${
                    statusFilter === 'done'
                      ? 'text-green-500 font-medium'
                      : 'text-dark-text-secondary'
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full ${statusFilter === 'done' ? 'bg-green-500' : 'bg-green-500'}`} />
                  已完成
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'cancel' ? null : 'cancel')}
                  className={`px-1.5 py-0.5 text-[10px] rounded whitespace-nowrap flex items-center gap-0.5 ${
                    statusFilter === 'cancel'
                      ? 'text-gray-500 font-medium'
                      : 'text-dark-text-secondary'
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full ${statusFilter === 'cancel' ? 'bg-gray-500' : 'bg-gray-400'}`} />
                  取消
                </button>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {view === 'list' && (
            <button
              onClick={() => startCreateTask(null)}
              className="p-1.5 hover:bg-blue-50 dark:hover:bg-brand-blue/10 rounded"
              title="新建根任务"
            >
              <Plus size={20} className="text-blue-600 dark:text-brand-blue" />
            </button>
          )}
          {view !== 'list' && (
            <button
              onClick={handleOpenChat}
              className="p-1.5 hover:bg-purple-50 dark:hover:bg-brand-purple/10 rounded"
              title="AI 助手"
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
            {filteredRoots.map(root => (
              <RootTaskGrid
                key={root.id}
                onCreateTask={() => startCreateTask(null)}
                onViewDetail={handleViewDetail}
              />
            ))}
            {filteredRoots.length === 0 && (
              <div className="text-center py-8 text-dark-text-secondary text-sm">
                {searchQuery.trim() || statusFilter ? '未找到匹配的任务' : '暂无任务'}
              </div>
            )}
          </div>
        )}

        {/* 任务详情视图 */}
        {view === 'detail' && (
          <div 
            ref={detailContainerRef}
            className="h-full overflow-y-auto"
          >
            <TaskDetail />
            {/* 提示 */}
            <div className="p-4 text-center text-dark-text-secondary text-xs">
              ← 左滑下一个任务 &nbsp;|&nbsp; 右滑上一个任务 →
            </div>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      {view === 'detail' && (
        <div className="border-t border-gray-200 dark:border-dark-border p-2 flex gap-2 bg-white dark:bg-dark-bg-primary flex-shrink-0">
          <button
            onClick={handleCreateSubtask}
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
