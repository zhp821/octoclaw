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

### 2. Session ID 格式修改

**当前格式**：`octo:global:${rootTask.id}`

**修改为**：`agent:main:octo:global:${rootTask.id}`

**理由**：
- 与 picoclaw 的 session key 格式统一
- 支持后端从 session key 解析智能体 ID
- 默认使用 `main` 智能体

### 3. 目录存储

**存储位置**：localStorage

**Key**：`octoclaw-agent-main-dir`

**默认值获取**：
1. 首先检查 localStorage 是否已有值
2. 若无，调用 `GET /api/config` 获取 `agents.defaults.workspace`
3. 存入 localStorage

### 4. 发送消息时附加目录

**实现位置**：`ChatPanel.tsx` 的 `handleSend` 函数

**附加内容**：
```
[系统提示：当前工作目录为 ${dir}]
```

**附加方式**：在用户消息内容前拼接

## 涉及文件

| 文件 | 改动 |
|------|------|
| `octoclaw/front/src/components/TaskDetail/DirSelector.tsx` | 新建：目录选择器组件 |
| `octoclaw/front/src/components/TaskDetail/TaskDetail.tsx` | 集成 DirSelector，判断根任务 |
| `octoclaw/front/src/components/Chat/ChatPanel.tsx` | 修改 session ID 格式，发送消息附加目录 |
| `octoclaw/front/src/services/api.config.ts` | 新增获取 config 的方法（可选，复用现有 axios） |

## 技术细节

### DirSelector 组件接口

```typescript
interface DirSelectorProps {
  dir: string
  onSave: (newDir: string) => void
}
```

### 目录获取流程

```
组件挂载
  ↓
检查 localStorage('octoclaw-agent-main-dir')
  ↓ 有值
直接使用
  ↓ 无值
GET /api/config → agents.defaults.workspace
  ↓
存入 localStorage
```

### 消息发送流程

```
用户输入消息
  ↓
获取 localStorage 目录
  ↓
拼接: [系统提示：当前工作目录为 ${dir}]\n${用户消息}
  ↓
发送到后端
```

## 验收标准

1. 根任务详情页顶部显示目录选择器（一行）
2. 点击编辑可修改目录，回车保存到 localStorage
3. 页面刷新后目录保持
4. 发送消息时后端收到包含目录信息的消息
5. 子任务详情页不显示目录选择器