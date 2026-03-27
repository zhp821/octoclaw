# 根任务详情页目录选择器设计

## 需求概述

在根任务详情页顶部增加目录显示和配置功能：
- 默认目录为当前 workspace（动态获取）
- 用户可切换或输入目录
- 保存后存储到前端缓存
- 发送消息时附加当前目录信息

## 设计方案

### 1. UI 改动

**位置**：TaskDetail.tsx 顶部标题栏右侧

**显示状态**：
```
│ 1 任务标题                    [状态Badge] 📁 D:/workspace ✏️ │
```

**编辑状态**（点击 ✏️ 后）：
```
│ 1 任务标题                    [状态Badge] [D:/workspace___] ✓│
```

**组件实现**：
- 新建 `DirSelector.tsx` 组件，显示目录路径 + 编辑按钮
- 仅在根任务（无 parentId）时显示
- 点击编辑按钮展开输入框，回车或点击 ✓ 保存

### 2. 状态管理

**存储位置**：chatStore 中新增 `currentDir` 字段

**理由**：
- DirSelector 组件在 TaskDetail.tsx 中
- 消息发送逻辑在 controller.ts 的 sendMessage 函数中
- 需要跨组件共享状态

**chatStore 改动**：
```typescript
interface ChatState {
  // ... existing fields
  currentDir: string  // 新增：当前工作目录
  setCurrentDir: (dir: string) => void  // 新增：设置目录
}
```

**持久化**：同步存储到 localStorage（key: `octoclaw-agent-main-dir`）

### 3. Session ID 格式修改

**当前格式**：`octo:global:${rootTask.id}`

**修改为**：`agent:main:octo:global:${rootTask.id}`

**理由**：
- 与 picoclaw 的 session key 格式统一（`agent:<agentId>:<rest>`）
- 支持后端从 session key 解析智能体 ID
- 默认使用 `main` 智能体

**影响范围**：
- `ChatPanel.tsx`：sessionId 构造
- `controller.ts`：WebSocket 连接
- 后端无需修改（session key 格式向后兼容）

### 4. 目录获取流程

```
应用启动 / 组件挂载
  ↓
检查 chatStore.currentDir
  ↓ 有值
直接使用
  ↓ 无值
GET /api/config
  ↓ 成功
提取 agents.defaults.workspace → 存入 chatStore + localStorage
  ↓ 失败
使用默认值 "~/.picoclaw/workspace" 或提示用户手动设置
```

### 5. 消息发送附加目录

**实现位置**：`controller.ts` 的 `sendMessage` 函数（第 212-239 行）

**改动逻辑**：
```typescript
export function sendMessage(content: string): void {
  const dir = useChatStore.getState().currentDir
  const dirHint = dir ? `[系统提示：当前工作目录为 ${dir}]\n` : ''
  const fullContent = dirHint + content
  // ... 原有发送逻辑
}
```

**注意**：不在 ChatPanel.tsx 的 handleSend 中修改，因为那只是调用 wsSendMessage 的包装函数。

### 6. 边界情况处理

| 场景 | 处理方式 |
|------|----------|
| `/api/config` 获取失败 | 使用默认值 `~/.picoclaw/workspace`，允许用户手动设置 |
| localStorage 不可用 | 仅存储在 chatStore 内存中，页面刷新后重新获取 |
| 目录为空 | 发送消息时不附加目录提示 |
| 目录路径非法字符 | 前端不做验证，由后端处理 |

## 涉及文件

| 文件 | 改动 |
|------|------|
| `front/src/components/TaskDetail/DirSelector.tsx` | 新建：目录选择器组件 |
| `front/src/components/TaskDetail/TaskDetail.tsx` | 集成 DirSelector，判断根任务 |
| `front/src/stores/chatStore.ts` | 新增 currentDir 状态和 setCurrentDir 方法 |
| `front/src/services/chat/controller.ts` | sendMessage 函数附加目录信息 |
| `front/src/components/Chat/ChatPanel.tsx` | 修改 session ID 格式 |
| `front/src/services/api.config.ts` | 新增 fetchConfig 方法获取配置 |

## 技术细节

### DirSelector 组件接口

```typescript
interface DirSelectorProps {
  dir: string
  onSave: (newDir: string) => void
}
```

### chatStore 新增字段

```typescript
interface ChatState {
  // ... existing
  currentDir: string
  setCurrentDir: (dir: string) => void
}

// persist 配置中 partialize 包含 currentDir
partialize: (state) => ({ 
  sessions: Array.from(state.sessions.entries()),
  currentDir: state.currentDir
})
```

### controller.ts sendMessage 改动

```typescript
export function sendMessage(content: string): void {
  if (!content.trim()) return

  const timestamp = Date.now()
  const sessionId = state.sessionId
  const dir = useChatStore.getState().currentDir
  const dirHint = dir ? `[系统提示：当前工作目录为 ${dir}]\n` : ''
  const fullContent = dirHint + content

  // 乐观更新使用原始 content（不含 dirHint）
  if (sessionId) {
    useChatStore.getState().addMessage(sessionId, {
      id: `msg-user-${timestamp}`,
      role: 'user',
      content,  // 显示原始消息
      timestamp: formatTimestamp(),
    })
  }

  // WebSocket 发送带 dirHint 的完整内容
  if (state.connected && getCurrentSocket()) {
    getCurrentSocket()!.send(JSON.stringify({
      type: 'message.send',
      session_id: sessionId,
      payload: { content: fullContent },  // 发送完整内容
      timestamp,
    }))
  } else {
    messageQueue.push({ content: fullContent, timestamp })
  }
}
```

## 验收标准

1. 根任务详情页顶部显示目录选择器（一行）
2. 点击编辑可修改目录，回车保存到 chatStore + localStorage
3. 页面刷新后目录保持
4. 发送消息时后端收到包含目录信息的消息
5. 子任务详情页不显示目录选择器
6. `/api/config` 获取失败时可正常使用，允许手动设置目录
7. 目录为空时不影响正常消息发送