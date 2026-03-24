import type { TaskStatus } from '@/types'

export interface StatusOption {
  value: TaskStatus | null
  label: string
  icon: string  // CSS class for the status icon
  description: string
}

/**
 * 状态配置 - 统一所有状态相关的定义
 */
export const STATUS_CONFIG: StatusOption[] = [
  { value: null, label: '全部', icon: 'w-2 h-2 rounded-full border-2 border-gray-400 bg-transparent', description: '所有状态' },
  { value: 'todo', label: '待办', icon: 'w-2 h-2 rounded-full bg-gray-400', description: '未开始的任务' },
  { value: 'in-progress', label: '进行中', icon: 'w-2 h-2 rounded-full bg-blue-500', description: '正在执行的任务' },
  { value: 'blocked', label: '阻塞', icon: 'w-2 h-2 rounded-full bg-red-500', description: '被阻塞的任务' },
  { value: 'done', label: '已完成', icon: 'w-2 h-2 rounded-full bg-green-500', description: '已完成的任务' },
  { value: 'cancel', label: '取消', icon: 'w-2 h-2 rounded-full bg-black', description: '已取消的任务' },
]

/**
 * 根据状态值获取配置
 */
export function getStatusConfig(status: TaskStatus | null) {
  return STATUS_CONFIG.find(s => s.value === status) || STATUS_CONFIG[0]
}

/**
 * 生成随机状态（用于 Mock 数据）
 */
export function getRandomStatus(): TaskStatus {
  const statuses: TaskStatus[] = ['todo', 'in-progress', 'blocked', 'done', 'cancel']
  return statuses[Math.floor(Math.random() * statuses.length)]
}
