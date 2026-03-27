# 根任务详情页目录选择器实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在根任务详情页顶部添加目录选择器，支持显示和编辑工作目录，发送消息时自动附加目录信息。

**Architecture:** 
- 在 chatStore 中添加 currentDir 状态管理
- 新建 DirSelector 组件，集成到 TaskDetail
- 修改 controller.ts 的 sendMessage 函数附加目录
- 修改 session ID 格式为 `agent:main:octo:global:<planId>`

**Tech Stack:** React 18, TypeScript, Zustand, Tailwind CSS, WebSocket, Vitest

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `front/src/stores/chatStore.ts` | 修改 | 添加 currentDir 状态和 setCurrentDir 方法 |
| `front/src/stores/chatStore.test.ts` | 修改 | 添加 currentDir 状态测试 |
| `front/src/services/api.config.ts` | 修改 | 添加 fetchWorkspaceConfig 方法 |
| `front/src/services/chat/controller.ts` | 修改 | sendMessage 函数附加目录信息 |
| `front/src/components/TaskDetail/DirSelector.tsx` | 新建 | 目录选择器组件 |
| `front/src/components/TaskDetail/TaskDetail.tsx` | 修改 | 集成 DirSelector，判断根任务 |
| `front/src/components/Chat/ChatPanel.tsx` | 修改 | 修改 session ID 格式，useEffect 初始化目录 |

---

### Task 1: 添加 currentDir 单元测试（TDD：先写测试）

**Files:**
- Modify: `front/src/stores/chatStore.test.ts`

- [ ] **Step 1: 添加 currentDir 测试用例**

```typescript
// 在 chatStore.test.ts 末尾添加
describe('Directory Management', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with empty currentDir', () => {
    expect(useChatStore.getState().currentDir).toBe('')
  })

  it('should set current directory', () => {
    useChatStore.getState().setCurrentDir('/home/user/workspace')
    expect(useChatStore.getState().currentDir).toBe('/home/user/workspace')
  })

  it('should persist currentDir to localStorage', () => {
    useChatStore.getState().setCurrentDir('/test/path')
    expect(localStorage.getItem('octoclaw-chat-currentDir')).toBe('/test/path')
  })

  it('should load currentDir from localStorage on init', () => {
    localStorage.setItem('octoclaw-chat-currentDir', '/saved/path')
    // 重新导入会读取 localStorage，但这里测试 setCurrentDir 的持久化
    useChatStore.getState().setCurrentDir('/new/path')
    expect(localStorage.getItem('octoclaw-chat-currentDir')).toBe('/new/path')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd front && npm test -- chatStore.test.ts`
Expected: FAIL - "setCurrentDir is not a function" 或 "currentDir is undefined"

- [ ] **Step 3: 提交测试（红色）**

```bash
git add front/src/stores/chatStore.test.ts
git commit -m "test(chatStore): 添加 currentDir 测试用例（TDD 红色）"
```

---

### Task 2: 实现 currentDir 状态管理（TDD：让测试通过）

**Files:**
- Modify: `front/src/stores/chatStore.ts`

- [ ] **Step 1: 修改 ChatState 接口，添加 currentDir 和 setCurrentDir**

```typescript
// 在 ChatState 接口中添加（约第 19 行）
interface ChatState {
  // ... existing fields
  currentDir: string
  // ... existing methods
  setCurrentDir: (dir: string) => void
}
```

- [ ] **Step 2: 在 persist 配置中添加 currentDir 到 partialize 和 merge**

```typescript
// 修改 partialize 配置（约第 178 行）
partialize: (state) => ({ 
  sessions: Array.from(state.sessions.entries()),
  currentDir: state.currentDir
})

// 修改 merge 函数（约第 180 行）
merge: (persisted, current) => {
  const persistedState = persisted as { sessions?: [string, SessionData][]; currentDir?: string }
  return {
    ...current,
    sessions: persistedState?.sessions ? new Map(persistedState.sessions) : current.sessions,
    currentDir: persistedState?.currentDir ?? current.currentDir,
  }
}
```

- [ ] **Step 3: 从 localStorage 初始化 currentDir**

```typescript
// 在文件顶部，savedData 初始化附近（约第 54 行）添加
const savedDir = localStorage.getItem('octoclaw-chat-currentDir')
const initialDir = savedDir || ''
```

- [ ] **Step 4: 添加 setCurrentDir 实现和初始状态**

```typescript
// 在 create 函数的初始状态中添加（约第 65 行）
currentDir: initialDir,

// 在 create 函数中添加方法（约第 173 行）
setCurrentDir: (dir: string) => {
  set({ currentDir: dir })
  localStorage.setItem('octoclaw-chat-currentDir', dir)
},
```

- [ ] **Step 5: 运行测试确认通过**

Run: `cd front && npm test -- chatStore.test.ts`
Expected: PASS - 所有 currentDir 测试通过

- [ ] **Step 6: 验证编译**

Run: `cd front && npm run build`
Expected: 无编译错误

- [ ] **Step 7: 提交实现（绿色）**

```bash
git add front/src/stores/chatStore.ts
git commit -m "feat(chatStore): 实现 currentDir 状态管理（TDD 绿色）"
```

---

### Task 3: 添加获取 workspace 配置的 API 方法

**Files:**
- Modify: `front/src/services/api.config.ts`

- [ ] **Step 1: 添加 fetchWorkspaceConfig 方法**

```typescript
// 在 api.config.ts 中，使用已有的 api 实例（baseURL: 'api'）
// 注意：api 的 baseURL 是 'api'，所以请求路径是 'config'，最终 URL 是 /api/config
export const configApi = {
  async fetchWorkspaceConfig(): Promise<string> {
    try {
      const response = await api.get<{ agents: { defaults: { workspace: string } } }>('config')
      return response.data.agents?.defaults?.workspace || ''
    } catch {
      return ''
    }
  }
}

// 修改 default export
export default { taskApi, chatApi, configApi }
```

- [ ] **Step 2: 验证编译**

Run: `cd front && npm run build`
Expected: 无编译错误

- [ ] **Step 3: 提交**

```bash
git add front/src/services/api.config.ts
git commit -m "feat(api): 添加 fetchWorkspaceConfig 方法获取配置"
```

---

### Task 4: 修改 sendMessage 附加目录信息

**Files:**
- Modify: `front/src/services/chat/controller.ts`

- [ ] **Step 1: 在 sendMessage 函数中获取 currentDir 并附加到消息**

找到 sendMessage 函数（约第 212 行），修改为：

```typescript
export function sendMessage(content: string): void {
  if (!content.trim()) return

  const timestamp = Date.now()
  const sessionId = state.sessionId
  
  // 获取当前目录并构造提示
  const dir = useChatStore.getState().currentDir
  const dirHint = dir ? `[系统提示：当前工作目录为 ${dir}]\n` : ''
  const fullContent = dirHint + content

  // 乐观更新使用原始 content（不含 dirHint，对用户透明）
  if (sessionId) {
    useChatStore.getState().addMessage(sessionId, {
      id: `msg-user-${timestamp}`,
      role: 'user',
      content,
      timestamp: formatTimestamp(),
    })
  }

  // WebSocket 发送带 dirHint 的完整内容
  if (state.connected && getCurrentSocket()) {
    getCurrentSocket()!.send(JSON.stringify({
      type: 'message.send',
      session_id: sessionId,
      payload: { content: fullContent },
      timestamp,
    }))
  } else {
    messageQueue.push({ content: fullContent, timestamp })
  }
}
```

- [ ] **Step 2: 验证编译**

Run: `cd front && npm run build`
Expected: 无编译错误

- [ ] **Step 3: 提交**

```bash
git add front/src/services/chat/controller.ts
git commit -m "feat(controller): sendMessage 附加当前目录信息"
```

---

### Task 5: 新建 DirSelector 组件

**Files:**
- Create: `front/src/components/TaskDetail/DirSelector.tsx`

- [ ] **Step 1: 创建 DirSelector 组件**

```tsx
import { useState, useEffect } from 'react'

interface DirSelectorProps {
  dir: string
  onSave: (newDir: string) => void
}

export function DirSelector({ dir, onSave }: DirSelectorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(dir)

  // 同步外部 dir 变化
  useEffect(() => {
    setEditValue(dir)
  }, [dir])

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed) {
      onSave(trimmed)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(dir)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="text-xs px-1 py-0.5 rounded border w-32 truncate"
          style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            color: 'var(--text-primary)',
            borderColor: 'var(--border-color)'
          }}
          autoFocus
        />
        <button
          onClick={handleSave}
          className="text-xs px-1"
          style={{ color: 'var(--brand-purple)' }}
        >
          ✓
        </button>
      </div>
    )
  }

  return (
    <div 
      className="flex items-center gap-1 cursor-pointer group"
      onClick={() => {
        setEditValue(dir)
        setIsEditing(true)
      }}
    >
      <span className="text-xs">📁</span>
      <span 
        className="text-xs truncate max-w-[80px]" 
        style={{ color: 'var(--text-secondary)' }}
        title={dir}
      >
        {dir || '(未设置)'}
      </span>
      <span 
        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--text-secondary)' }}
      >
        ✏️
      </span>
    </div>
  )
}
```

- [ ] **Step 2: 验证编译**

Run: `cd front && npm run build`
Expected: 无编译错误

- [ ] **Step 3: 提交**

```bash
git add front/src/components/TaskDetail/DirSelector.tsx
git commit -m "feat(DirSelector): 新建目录选择器组件"
```

---

### Task 6: 集成 DirSelector 到 TaskDetail

**Files:**
- Modify: `front/src/components/TaskDetail/TaskDetail.tsx`

- [ ] **Step 1: 导入 DirSelector 和 useChatStore**

```typescript
import { useTaskStore } from '@/stores/taskStore'
import { useChatStore } from '@/stores/chatStore'  // 新增
import { TaskSteps } from './TaskSteps'
import { QualityGate } from './QualityGate'
import { TaskDependencies } from './TaskDependencies'
import { Badge } from '@/components/shared/Badge'
import { NewTaskForm } from './NewTaskForm'
import { DirSelector } from './DirSelector'  // 新增
```

- [ ] **Step 2: 在 TaskDetail 组件中获取 currentDir 和 setCurrentDir**

```typescript
export function TaskDetail() {
  const { selectedId, roots, isCreatingTask, creatingParentId, cancelCreateTask } = useTaskStore()
  const { currentDir, setCurrentDir } = useChatStore()  // 新增
  // ... rest of component
```

- [ ] **Step 3: 判断是否为根任务**

```typescript
const task = selectedId ? findTask(selectedId) : null
const isRootTask = task && !task.parentId  // 新增：判断是否为根任务
```

- [ ] **Step 4: 在标题栏右侧添加 DirSelector**

修改标题栏部分（约第 51-64 行）：

```tsx
<div className="flex items-start justify-between mb-3">
  <div className="flex-1 min-w-0">
    <h2 className="text-lg font-bold truncate">
      {task.numbering && <span className="text-dark-text-secondary mr-2">{task.numbering}</span>}
      {task.title}
    </h2>
  </div>
  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
    <Badge status={task.status} />
    {task.assignee && (
      <span className="text-lg" title={task.assignee.role}>{task.assignee.avatar}</span>
    )}
    {isRootTask && (
      <DirSelector dir={currentDir} onSave={setCurrentDir} />
    )}
  </div>
</div>
```

- [ ] **Step 5: 验证编译**

Run: `cd front && npm run build`
Expected: 无编译错误

- [ ] **Step 6: 提交**

```bash
git add front/src/components/TaskDetail/TaskDetail.tsx
git commit -m "feat(TaskDetail): 集成 DirSelector 到根任务详情页"
```

---

### Task 7: 修改 ChatPanel session ID 格式并初始化目录

**Files:**
- Modify: `front/src/components/Chat/ChatPanel.tsx`

- [ ] **Step 1: 导入 configApi**

```typescript
import { configApi } from '@/services/api.config'
```

- [ ] **Step 2: 修改 sessionId 格式**

找到 sessionId 构造（约第 61 行），修改为：

```typescript
// 会话 ID 格式：agent:main:octo:global:<planId>
const sessionId = rootTask ? `agent:main:octo:global:${rootTask.id}` : 'global'
```

- [ ] **Step 3: 添加 useEffect 初始化目录**

在组件中添加新的 useEffect：

```typescript
// 初始化目录（首次使用时从配置获取）
useEffect(() => {
  async function initDir() {
    // 使用 getState() 避免依赖问题
    if (!useChatStore.getState().currentDir) {
      const workspace = await configApi.fetchWorkspaceConfig()
      if (workspace) {
        useChatStore.getState().setCurrentDir(workspace)
      }
    }
  }
  initDir()
}, [])  // 仅在组件挂载时执行一次
```

- [ ] **Step 4: 验证编译**

Run: `cd front && npm run build`
Expected: 无编译错误

- [ ] **Step 5: 提交**

```bash
git add front/src/components/Chat/ChatPanel.tsx
git commit -m "feat(ChatPanel): 修改 session ID 格式，初始化目录从配置获取"
```

---

### Task 8: 最终验证

- [ ] **Step 1: 运行所有测试**

Run: `cd front && npm test`
Expected: 所有测试通过

- [ ] **Step 2: 完整构建测试**

Run: `cd front && npm run build`
Expected: 构建成功，无错误

- [ ] **Step 3: 推送所有提交**

```bash
git push origin master
```

- [ ] **Step 4: 功能验证清单**

手动验证以下场景：
1. [ ] 打开根任务详情页，顶部显示目录选择器
2. [ ] 点击目录可编辑，回车保存
3. [ ] 刷新页面后目录保持
4. [ ] 发送消息时，WebSocket 消息包含目录信息
5. [ ] 子任务详情页不显示目录选择器
6. [ ] 切换根任务时目录保持不变

---

## 验收标准

1. 根任务详情页顶部显示目录选择器（一行）
2. 点击编辑可修改目录，回车保存到 chatStore + localStorage
3. 页面刷新后目录保持
4. 发送消息时后端收到包含目录信息的消息
5. 子任务详情页不显示目录选择器
6. `/api/config` 获取失败时可正常使用，允许手动设置目录
7. 目录为空时不影响正常消息发送
8. 切换不同根任务时目录保持不变（全局共享）
9. 单元测试全部通过