import type { TaskNode, Agent, ProjectData, TaskStatus, QualityGate } from '@/types'
import { STATUS_CONFIG } from '@/config/status'

function getRandomStatus(): TaskStatus {
  const statuses: TaskStatus[] = ['todo', 'in-progress', 'blocked', 'done', 'cancel']
  return statuses[Math.floor(Math.random() * statuses.length)]
}

const TITLE_PREFIX = ['Design', 'Develop', 'Test', 'Deploy', 'Research', 'Plan']

export const AGENTS: Agent[] = [
  { id: 'a1', name: 'DevBot', avatar: '🤖', role: 'Developer' },
  { id: 'a2', name: 'QA-Master', avatar: '🔍', role: 'Tester' },
  { id: 'a3', name: 'Architect-X', avatar: '🏗️', role: 'Architect' },
  { id: 'a4', name: 'PM-Pro', avatar: '📋', role: 'Product Manager' },
]

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function generateNumbering(parentNumbering: string | null, index: number): string {
  if (!parentNumbering) return `${index + 1}`
  return `${parentNumbering}.${index + 1}`
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateQualityGate(): QualityGate {
  const enabled = Math.random() > 0.5
  return {
    enabled,
    description: enabled ? 'Output must be valid JSON' : '',
    schema: enabled ? '{}' : undefined,
  }
}

function generateSteps(): string[] {
  const stepTemplates = ['Initialize', 'Configure', 'Implement', 'Test', 'Review', 'Deploy', 'Verify']
  const count = Math.floor(Math.random() * 4) + 1
  return Array.from({ length: count }, (_, i) => `${i + 1}. ${getRandomItem(stepTemplates)}`)
}

function generateTask(
  level: number,
  maxDepth: number,
  parentNumbering: string | null,
  index: number,
  parentId: string | null,
  siblingIds: string[]
): TaskNode {
  const id = generateId()
  // 根任务编号为空，子任务编号从父任务编号推导
  const numbering = level === 0 ? '' : generateNumbering(parentNumbering, index)
  const hasChildren = level < maxDepth && Math.random() > 0.3

  const possibleDeps = siblingIds.filter(sid => sid !== id)
  if (parentId) possibleDeps.push(parentId)
  const depsCount = Math.min(Math.floor(Math.random() * 3), possibleDeps.length)
  const dependencies = possibleDeps.sort(() => 0.5 - Math.random()).slice(0, depsCount)

  const node: TaskNode = {
    id,
    parentId,
    title: `${getRandomItem(TITLE_PREFIX)} Task ${numbering || 'Root'}`,
    description: `## Description for Task ${numbering || 'Root'}\n\nThis is a detailed description.\n\n- Step 1\n- Step 2\n- Step 3`,
    status: getRandomStatus(),
    level,
    numbering,
    order: (index + 1) * 1000,
    dependencies,
    children: [],
    assignee: getRandomItem(AGENTS),
    qualityGate: generateQualityGate(),
    steps: generateSteps(),
    chatHistory: [],
    isDecomposing: false,
    requiresReview: false,
  }

  if (hasChildren) {
    const childCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < childCount; i++) {
      node.children.push(generateTask(level + 1, maxDepth, numbering, i, id, []))
    }
  }

  return node
}

export function generateRootTask(index: number): TaskNode {
  return generateTask(0, 4, null, index, null, [])
}

export function generateMockData(): ProjectData {
  const roots: TaskNode[] = []
  for (let i = 0; i < 30; i++) {
    roots.push(generateRootTask(i))
  }
  return { roots, agents: AGENTS }
}

export function findTaskById(roots: TaskNode[], id: string): TaskNode | null {
  for (const root of roots) {
    if (root.id === id) return root
    const found = findTaskInChildren(root.children, id)
    if (found) return found
  }
  return null
}

function findTaskInChildren(tasks: TaskNode[], id: string): TaskNode | null {
  for (const task of tasks) {
    if (task.id === id) return task
    const found = findTaskInChildren(task.children, id)
    if (found) return found
  }
  return null
}
