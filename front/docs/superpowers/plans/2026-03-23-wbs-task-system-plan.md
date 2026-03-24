# WBS 任务管理系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个支持无限层级任务树、AI 多轮对话分解、多端适配的交互式任务规划系统

**Architecture:** React 18 + Vite + Zustand 状态管理，MSW Mock 数据，三栏布局（任务树/详情/聊天），移动端优先的手势交互，双主题切换。后期对接 Golang 后端。

**Tech Stack:** React 18, Vite, TypeScript, Zustand, Tailwind CSS, Lucide React, react-markdown, TipTap, dnd-kit, MSW

---

## Phase 1: 前端开发 (Mock 数据)

### Task 1: 项目初始化
**Files:** `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/variables.css`, `src/styles/index.css`

- [ ] Step 1: 创建 package.json
- [ ] Step 2: `npm install`
- [ ] Step 3: 创建 vite.config.ts
- [ ] Step 4: 创建 tsconfig.json + tsconfig.node.json
- [ ] Step 5: 创建 tailwind.config.js
- [ ] Step 6: 创建 postcss.config.js
- [ ] Step 7: 创建 index.html
- [ ] Step 8: 创建 src/styles/variables.css
- [ ] Step 9: 创建 src/styles/index.css
- [ ] Step 10: 创建 src/main.tsx
- [ ] Step 11: 创建 src/App.tsx
- [ ] Step 12: `npm run dev` 验证
- [ ] Step 13: `git commit -m "feat: initialize project"`

### Task 2: 类型定义
**Files:** `src/types/index.ts`, `tests/types/index.test.ts`

- [ ] Step 1: 创建 TaskStatus, MessageRole 类型
- [ ] Step 2: 创建 Agent, QualityGate 接口
- [ ] Step 3: 创建 ChatMessage, TaskChanges 接口
- [ ] Step 4: 创建 TaskNode 接口 (递归结构)
- [ ] Step 5: 创建 ProjectData 接口
- [ ] Step 6: 创建类型测试
- [ ] Step 7: `git commit -m "feat: define TypeScript types"`

### Task 3: Mock 数据生成
**Files:** `src/services/mock/mockData.ts`, `handlers.ts`, `browser.ts`

- [ ] Step 1: 创建 AGENTS 常量 (4 个智能体)
- [ ] Step 2: 创建 generateNumbering 函数
- [ ] Step 3: 创建 generateTask 递归函数 (30 根任务，4 层深度)
- [ ] Step 4: 创建 generateMockData 导出函数
- [ ] Step 5: 创建 MSW handlers
- [ ] Step 6: 创建 setupWorker 入口
- [ ] Step 7: 更新 main.tsx 启用 MSW
- [ ] Step 8: `git commit -m "feat: setup MSW mock"`

### Task 4: 前端 API 服务层
**Files:** `src/services/taskApi.ts`, `chatApi.ts`

- [ ] Step 1: 创建 axios 实例 (baseURL: /api)
- [ ] Step 2: 创建 taskApi (fetchTasks, updateTask, deleteTask, createChild)
- [ ] Step 3: 创建 chatApi (sendMessage)
- [ ] Step 4: `git commit -m "feat: add API services"`

### Task 5: 状态管理 (Zustand)
**Files:** `src/stores/taskStore.ts`, `chatStore.ts`, `uiStore.ts`

- [ ] Step 1: 创建 taskStore
- [ ] Step 2: 创建 chatStore
- [ ] Step 3: 创建 uiStore (主题切换)
- [ ] Step 4: `git commit -m "feat: implement Zustand stores"`

### Task 6: 共享组件
**Files:** `src/components/shared/Button.tsx`, `Card.tsx`, `Badge.tsx`, `ThemeToggle.tsx`

- [ ] Step 1: 创建 Button 组件
- [ ] Step 2: 创建 Card 组件
- [ ] Step 3: 创建 Badge 组件
- [ ] Step 4: 创建 ThemeToggle 组件
- [ ] Step 5: `git commit -m "feat: create shared components"`

### Task 7: 任务树组件
**Files:** `src/components/TaskTree/TaskTree.tsx`, `TaskTreeNode.tsx`, `RootTaskGrid.tsx`

- [ ] Step 1: 创建 TaskTreeNode (递归渲染)
- [ ] Step 2: 创建 RootTaskGrid (根任务网格)
- [ ] Step 3: 创建 TaskTree
- [ ] Step 4: `git commit -m "feat: create task tree components"`

### Task 8: 任务详情组件
**Files:** `src/components/TaskDetail/TaskDetail.tsx`, `TaskSteps.tsx`, `QualityGate.tsx`, `TaskDependencies.tsx`

- [ ] Step 1: 创建 TaskDetail
- [ ] Step 2: 创建 TaskSteps
- [ ] Step 3: 创建 QualityGate
- [ ] Step 4: 创建 TaskDependencies
- [ ] Step 5: `git commit -m "feat: create task detail components"`

### Task 9: 聊天组件
**Files:** `src/components/Chat/ChatPanel.tsx`, `ChatMessage.tsx`, `ChatInput.tsx`, `ModifyPreview.tsx`

- [ ] Step 1: 创建 ChatMessage
- [ ] Step 2: 创建 ChatInput
- [ ] Step 3: 创建 ChatPanel
- [ ] Step 4: 创建 ModifyPreview
- [ ] Step 5: `git commit -m "feat: create chat components"`

### Task 10: 布局组件
**Files:** `src/components/Layout/DesktopLayout.tsx`, `MobileLayout.tsx`, `Header.tsx`

- [ ] Step 1: 创建 Header
- [ ] Step 2: 创建 DesktopLayout (三栏)
- [ ] Step 3: 创建 MobileLayout (移动端)
- [ ] Step 4: 更新 App.tsx
- [ ] Step 5: `git commit -m "feat: create layouts"`

### Task 11: 工具函数和 Hooks
**Files:** `src/utils/numbering.ts`, `validation.ts`, `src/hooks/useSwipe.ts`

- [ ] Step 1: 创建 numbering.ts
- [ ] Step 2: 创建 validation.ts
- [ ] Step 3: 创建 useSwipe Hook
- [ ] Step 4: `git commit -m "feat: add utils and hooks"`

---

## Phase 2: Golang 后端开发

### Task 12: Golang 后端初始化
**Files:** `../wbs-backend/main.go`, `go.mod`, `handlers/`, `services/`, `storage/`, `models/`

- [ ] Step 1: 创建 go.mod
- [ ] Step 2: 创建 models/task.go
- [ ] Step 3: 创建 storage/filesystem.go
- [ ] Step 4: 创建 handlers/task.go, chat.go
- [ ] Step 5: 创建 main.go
- [ ] Step 6: 创建数据初始化脚本
- [ ] Step 7: `go run main.go` 验证
- [ ] Step 8: `git commit`

### Task 13: 前端切换真实接口
**Files:** `src/services/taskApi.ts`, `chatApi.ts`, `.env`

- [ ] Step 1: 创建 .env 配置后端地址
- [ ] Step 2: 更新 axios baseURL
- [ ] Step 3: 移除 MSW Mock
- [ ] Step 4: 测试真实接口
- [ ] Step 5: `git commit -m "feat: switch to real backend API"`

---

## 执行状态

当前进度：Task 1 进行中 (项目初始化已完成大部分配置)
