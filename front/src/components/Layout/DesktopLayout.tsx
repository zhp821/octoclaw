import { useState, useEffect, useRef } from 'react'
import { Header } from './Header'
import { TaskTree } from '@/components/TaskTree/TaskTree'
import { TaskDetail } from '@/components/TaskDetail/TaskDetail'
import { ChatPanel } from '@/components/Chat/ChatPanel'
import { MobileLayout } from './MobileLayout'
import { useTaskStore } from '@/stores/taskStore'

const MIN_SIDEBAR_WIDTH = 200
const MAX_SIDEBAR_WIDTH = 500
const MIN_CHAT_WIDTH = 320
const MOBILE_BREAKPOINT = 768

export function DesktopLayout() {
  const { fetchTasks } = useTaskStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [chatWidth, setChatWidth] = useState(475)
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
  const [isResizingChat, setIsResizingChat] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  // 响应式判断
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 根据屏幕宽度初始化
  useEffect(() => {
    if (isMobile) return
    
    const updateWidths = () => {
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth
      if (containerWidth > 0) {
        const defaultSidebar = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, containerWidth * 0.2))
        const defaultChat = Math.max(MIN_CHAT_WIDTH, containerWidth * 0.29)
        setSidebarWidth(prev => prev || defaultSidebar)
        setChatWidth(prev => prev || defaultChat)
      }
    }

    updateWidths()
  }, [isMobile])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      
      if (isResizingSidebar) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const newWidth = e.clientX - containerRect.left
        setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth)))
      } else if (isResizingChat) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const newWidth = containerRect.right - e.clientX
        setChatWidth(Math.max(MIN_CHAT_WIDTH, Math.min(containerRect.width * 0.45, newWidth)))
      }
    }

    const handleMouseUp = () => {
      setIsResizingSidebar(false)
      setIsResizingChat(false)
    }

    if (isResizingSidebar || isResizingChat) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingSidebar, isResizingChat])

  // 移动端直接返回 MobileLayout
  if (isMobile) {
    return <MobileLayout />
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* 左侧任务树 */}
        <div 
          className="border-r border-dark-border overflow-hidden flex-shrink-0" 
          style={{ width: sidebarWidth }}
        >
          <TaskTree />
        </div>
        
        {/* 拖动条 - 任务树右侧 */}
        <div
          className={`w-[2px] cursor-col-resize hover:bg-brand-blue/50 transition-colors flex-shrink-0 z-10 ${
            isResizingSidebar ? 'bg-brand-blue' : 'bg-transparent'
          }`}
          onMouseDown={(e) => {
            e.preventDefault()
            setIsResizingSidebar(true)
          }}
          style={{ marginLeft: '-1px' }}
        />
        
        {/* 中间任务详情 - 自适应剩余宽度 */}
        <div className="flex-1 border-r border-dark-border overflow-hidden min-w-0">
          <TaskDetail />
        </div>
        
        {/* 拖动条 - 聊天左侧 */}
        <div
          className={`w-[2px] cursor-col-resize hover:bg-brand-blue/50 transition-colors flex-shrink-0 z-10 ${
            isResizingChat ? 'bg-brand-blue' : 'bg-transparent'
          }`}
          onMouseDown={(e) => {
            e.preventDefault()
            setIsResizingChat(true)
          }}
          style={{ marginRight: '-1px' }}
        />
        
        {/* 右侧聊天 */}
        <div 
          className="overflow-hidden flex-shrink-0" 
          style={{ width: chatWidth }}
        >
          <ChatPanel />
        </div>
      </div>
    </div>
  )
}
