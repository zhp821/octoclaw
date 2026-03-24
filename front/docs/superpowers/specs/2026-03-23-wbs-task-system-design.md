# WBS 任务管理系统 - 设计规范

**日期：** 2026-03-23  
**版本：** 1.0  
**状态：** 已批准

---

## 1. 系统概述

交互式任务规划 + 多智能体项目执行系统，支持无限层级任务树、AI 多轮对话分解、多端适配。

### 1.1 核心功能
- 动态创建任务（顶层/子任务），支持增删改查
- 与大模型多轮对话式任务分解，非一次性生成
- 分解结果形成任务树，无限层级展开
- 任意节点可再次召唤 AI 继续分解/修改
- 每个任务节点包含执行步骤（Markdown 文档）
- 每个任务节点指定负责人（绑定 Agent）
- 每个任务配置独立质量门（如强制 JSON 输出）
- 任务拖拽排序
- 多端适配（桌面端 + 移动端 H5）

---

## 2. 技术架构

### 2.1 技术栈
| 类别 | 技术选型 |
|------|----------|
| 框架 | React 18 + Vite |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS + CSS Variables |
| 图标 | Lucide React |
| Markdown 渲染 | react-markdown |
| Markdown 编辑 | TipTap |
| 拖拽 | dnd-kit |
| HTTP Mock | MSW (Mock Service Worker) |
| 路由 | React Router v6 |
| 请求库 | Axios |

### 2.2 项目结构
```
src/
├── components/
│   ├── Layout/           # 布局组件
│   ├── TaskTree/         # 任务树组件
│   ├── TaskDetail/       # 任务详情组件
│   ├── Chat/             # AI 聊天组件
│   ├── Steps/            # 执行步骤组件
│   ├── QualityGate/      # 质量门组件
│   └── shared/           # 共享组件
├── stores/
│   ├── taskStore.ts      # 任务状态
│   ├── chatStore.ts      # 聊天状态
│   └── uiStore.ts        # UI 状态（主题等）
├── services/
│   ├── taskApi.ts        # 任务 API
│   ├── chatApi.ts        # 聊天 API
│   └── mock/             # Mock 数据生成
├── hooks/
│   ├── useTask.ts        # 任务 Hook
│   ├── useChat.ts        # 聊天 Hook
│   └── useTheme.ts       # 主题 Hook
├── types/
│   └── index.ts          # TypeScript 类型定义
├── utils/
│   ├── numbering.ts      # 编号算法
│   └── validation.ts     # 依赖校验
└── styles/
    └── variables.css     # CSS 变量（主题）
```

---

## 3. 数据结构

### 3.1 TypeScript 类型定义

```typescript
type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done';

type MessageRole = 'user' | 'assistant' | 'system';

interface Agent {
  id: string;
  name: string;
  avatar: string;
  role: string; // "Coder", "Reviewer", "Architect" 等
}

interface QualityGate {
  enabled: boolean;
  description: string;
  schema?: string; // JSON Schema string
}

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  relatedAction?: 'decompose' | 'modify' | 'create';
  pendingChanges?: TaskChanges; // AI 建议的修改
}

interface TaskChanges {
  title?: string;
  description?: string;
  steps?: string[];
  assigneeId?: string;
  qualityGate?: QualityGate;
  dependencies?: string[];
  status?: TaskStatus;
}

interface TaskNode {
  id: string;
  parentId: string | null;
  title: string;
  description: string; // Markdown
  status: TaskStatus;
  level: number; // 0=根任务，1=第一层子任务...
  numbering: string; // "1", "1.1", "1.1.2" (根任务为空)
  dependencies: string[]; // 任务 ID 数组（仅同级或父级）
  children: TaskNode[];
  assignee?: Agent;
  qualityGate: QualityGate;
  steps: string[];
  chatHistory: ChatMessage[];
  isDecomposing?: boolean;
}

interface ProjectData {
  roots: TaskNode[];
  agents: Agent[];
}
```

---

## 4. 布局设计

### 4.1 桌面端布局（三栏）

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 搜索...                              + 新建根任务  ☾/☀️  │
├──────────┬──────────────────────────┬───────────────────────┤
│ 任务树   │   任务详情               │   AI 聊天             │
│ (25%)    │   (45%)                  │   (30%)               │
│          │                          │                       │
│ ▼ 根 1   │ 1.2.1 孙任务标题         │ 💬 AI 助手            │
│   ▶ 1.1  │ [🔄 进行中] [👤 Agent]   │                       │
│   ▼ 1.2  │                          │ 用户：请分解...       │
│     1.2.1│ 描述: ...                │                       │
│     1.2.2│ 步骤：①②③               │ AI: 已分解为 3 个子... │
│   ▶ 1.3  │ 质量门：🔒 JSON          │ [✓ 应用] [↺ 重生成]   │
│ 根 2     │ 依赖：←1.2 ←1.2.2       │                       │
│ 根 3     │                          │ [输入框] [发送]       │
└──────────┴──────────────────────────┴───────────────────────┘
```

### 4.2 移动端布局

**状态 1：根任务网格**
```
┌─────────────────┐
│ 🔍 搜索         │
├─────────────────┤
│ ┌─────┬─────┐   │
│ │根 1 │根 2 │   │
│ ├─────┼─────┤   │
│ │根 3 │根 4 │   │
│ └─────┴─────┘   │
│                 │
│      💬 FAB     │
└─────────────────┘
```

**状态 2：任务详情 + 面包屑**
```
┌─────────────────┐
│ 📍 根 1 > 1.2   │
├─────────────────┤
│ 1.2.1 孙任务    │
│ [✅ 已完成]     │
├─────────────────┤
│ 📝 描述：...    │
│ 📋 步骤 (3)     │
│ 🔒 质量门       │
├─────────────────┤
│ [📝 编辑]       │
│ [💬 AI 分解]    │
└─────────────────┘
```

**状态 3：底部抽屉聊天（半屏）**
```
┌─────────────────┐
│ (任务详情模糊)  │
│                 │
│ ┌─────────────┐ │
│ │   ___       │ │
│ │ 💬 AI 助手 ×│ │
│ │             │ │
│ │ 用户：...   │ │
│ │ AI: ...     │ │
│ │             │ │
│ │ [输入] [发] │ │
│ └─────────────┘ │
└─────────────────┘
```

**状态 4：全屏聊天**
```
┌─────────────────┐
│ 💬 AI 助手   ×  │
│ 1.2.1 子任务    │
├─────────────────┤
│                 │
│ 用户：请分解... │
│                 │
│ AI: 已分解为... │
│ [✓ 创建子任务]  │
│                 │
│ AI 思考中...    │
│                 │
├─────────────────┤
│ [输入框] [发送] │
└─────────────────┘
```

---

## 5. 交互设计

### 5.1 桌面端交互
- **点击任务**：选中任务，中间栏显示详情，右侧聊天绑定该任务
- **展开/折叠**：点击任务前 ▶/▼ 图标展开/折叠子任务
- **拖拽排序**：拖拽子任务调整顺序，自动重算编号
- **新建任务**：顶部"+ 新建根任务"或任务详情中"添加子任务"
- **编辑任务**：点击编辑按钮，弹窗或行内编辑
- **删除任务**：右键菜单或详情中删除按钮，需确认
- **AI 分解**：点击任务后，右侧聊天窗口自动绑定，或点击"AI 分解"按钮
- **应用修改**：AI 返回修改建议，红绿对比预览，确认后应用

### 5.2 移动端手势
| 手势 | 作用 |
|------|------|
| 点击任务项 | 进入下一级任务列表 |
| 左滑任务项 | 显示删除/阻塞操作 |
| 右滑任务项 | 查看详情 |
| 长按任务项 | 弹出 AI 分解菜单 |
| 底部抽屉上滑 | 半屏聊天 → 全屏聊天 |
| 面包屑点击 | 跳转到对应层级 |

---

## 6. 编号算法

### 6.1 规则
- 根任务：无编号（`numbering: ''`）
- 第一层子任务：`1`, `2`, `3`...
- 第二层：`1.1`, `1.2`, `2.1`...
- 第三层：`1.1.1`, `1.1.2`, `1.2.1`...

### 6.2 实现逻辑
```typescript
function generateNumbering(parentNumbering: string, index: number): string {
  if (!parentNumbering) return `${index + 1}`;
  return `${parentNumbering}.${index + 1}`;
}

// 拖拽后重算同级编号
function renumberSiblings(tasks: TaskNode[]): void {
  tasks.forEach((task, index) => {
    task.numbering = generateNumbering(getParentNumbering(task), index);
    if (task.children.length > 0) {
      renumberSiblings(task.children);
    }
  });
}
```

---

## 7. 依赖校验

### 7.1 规则
- 任务只能依赖其**直接父级**或**同级任务**
- 禁止跨层级依赖
- 禁止跨分支依赖

### 7.2 校验逻辑
```typescript
function validateDependencies(task: TaskNode, allTasks: TaskNode[]): boolean {
  const siblingIds = getSiblings(task, allTasks).map(t => t.id);
  const parentIds = task.parentId ? [task.parentId] : [];
  const allowedDeps = [...siblingIds, ...parentIds];
  
  return task.dependencies.every(depId => allowedDeps.includes(depId));
}
```

---

## 8. 视觉设计

### 8.1 配色方案

**深色主题**
| 用途 | 色值 |
|------|------|
| 背景主色 | #0f172a |
| 背景次要 | #1e293b |
| 边框 | #334155 |
| 文字主色 | #e2e8f0 |
| 文字次要 | #94a3b8 |
| 主色 (蓝) | #3b82f6 |
| 强调色 (紫) | #8b5cf6 |
| 成功 | #22c55e |
| 警告 | #f59e0b |
| 危险 | #ef4444 |

**浅色主题**
| 用途 | 色值 |
|------|------|
| 背景主色 | #ffffff |
| 背景次要 | #f8fafc |
| 边框 | #e2e8f0 |
| 文字主色 | #1e293b |
| 文字次要 | #64748b |
| 主色 (蓝) | #2563eb |
| 强调色 (紫) | #7c3aed |
| 成功 | #16a34a |
| 警告 | #ca8a04 |
| 危险 | #dc2626 |

### 8.2 组件风格
- **卡片**：渐变顶边（深蓝→紫），左侧高亮条
- **按钮**：渐变背景 + 发光阴影
- **状态标签**：半透明背景 + 同色边框 + 图标
- **聊天气泡**：AI 回复使用渐变背景 + 紫色边框

### 8.3 字体
- 主字体：系统字体（Inter / SF Pro / 微软雅黑）
- 代码字体：JetBrains Mono / Fira Code

### 8.4 图标
- 图标库：Lucide React（线条简洁现代）

---

## 9. Mock 数据规范

### 9.1 数据规模
- **根任务**：30 个（可重复）
- **深度**：每个根任务分解至 4 层
- **子任务数量**：每层 1-3 个随机

### 9.2 生成逻辑
```typescript
function generateMockData(): ProjectData {
  const roots: TaskNode[] = [];
  const agents = [
    { id: 'a1', name: 'DevBot', role: 'Developer' },
    { id: 'a2', name: 'QA-Master', role: 'Tester' },
    { id: 'a3', name: 'Architect-X', role: 'Architect' }
  ];
  
  for (let i = 0; i < 30; i++) {
    roots.push(generateTask(0, 4, null, i, null, []));
  }
  
  return { roots, agents };
}
```

### 9.3 API 端点（MSW Mock）
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/tasks` | GET | 获取所有根任务 |
| `/api/tasks/:id` | GET | 获取任务详情（含子任务） |
| `/api/tasks/:id` | PUT | 更新任务 |
| `/api/tasks/:id` | DELETE | 删除任务 |
| `/api/tasks/:id/children` | POST | 创建子任务 |
| `/api/tasks/reorder` | POST | 拖拽排序 |
| `/api/agents` | GET | 获取所有 Agent |
| `/api/chat/:taskId` | POST | 发送聊天消息 |
| `/api/chat/:taskId/stream` | POST | 流式响应 |

---

## 10. 状态管理 (Zustand)

### 10.1 Task Store
```typescript
interface TaskState {
  roots: TaskNode[];
  expandedIds: Set<string>;
  selectedId: string | null;
  searchQuery: string;
  
  // Actions
  fetchTasks: () => Promise<void>;
  selectTask: (id: string) => void;
  toggleExpand: (id: string) => void;
  updateTask: (id: string, changes: Partial<TaskNode>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createChild: (parentId: string, task: Partial<TaskNode>) => Promise<void>;
  reorderTasks: (parentId: string, newOrder: string[]) => Promise<void>;
  searchTasks: (query: string) => TaskNode[];
}
```

### 10.2 Chat Store
```typescript
interface ChatState {
  messages: Record<string, ChatMessage[]>; // taskId -> messages
  isLoading: boolean;
  
  // Actions
  sendMessage: (taskId: string, content: string) => Promise<void>;
  applyChanges: (taskId: string, messageId: string) => Promise<void>;
  clearHistory: (taskId: string) => void;
}
```

### 10.3 UI Store
```typescript
interface UIState {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  chatPanelOpen: boolean;
  
  // Actions
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  toggleChatPanel: () => void;
}
```

---

## 11. 开发路线图

| Phase | 内容 | 产出 |
|-------|------|------|
| Phase 1 | 项目初始化 + 基础架构 | Vite 项目、目录结构、类型定义 |
| Phase 2 | Mock 数据生成 | MSW 配置、递归生成器、API 拦截 |
| Phase 3 | 任务树核心 | 递归组件、展开/折叠、选中状态 |
| Phase 4 | 任务详情 | 描述、步骤、质量门、依赖展示 |
| Phase 5 | 拖拽排序 | dnd-kit 集成、重排逻辑、编号重算 |
| Phase 6 | 聊天集成 | 聊天 UI、消息发送、流式响应 |
| Phase 7 | AI 修改 | 修改预览、确认/拒绝、批量应用 |
| Phase 8 | 移动端适配 | 响应式布局、手势交互 |
| Phase 9 | 主题切换 | CSS 变量、Toggle 开关、LocalStorage |
| Phase 10 | 搜索功能 | 关键字过滤、高亮、路径展开 |
| Phase 11 |  polish | 动画、加载状态、错误处理 |

---

## 12. 验收标准

### 12.1 功能验收
- [ ] 可创建/编辑/删除任意层级任务
- [ ] 拖拽排序后编号自动重算
- [ ] 依赖校验阻止非法依赖
- [ ] AI 聊天可针对任意任务
- [ ] AI 修改建议可预览/确认/拒绝
- [ ] 质量门配置生效
- [ ] 搜索功能正常

### 12.2 交互验收
- [ ] 桌面端三栏布局响应正常
- [ ] 移动端手势流畅
- [ ] 主题切换无闪烁
- [ ] 加载状态友好

### 12.3 数据验收
- [ ] Mock 数据 30 个根任务 × 4 层深度
- [ ] 所有 API 端点可正常调用
- [ ] 状态管理数据流正确
