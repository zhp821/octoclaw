import type { TaskStatus } from '@/types'

/**
 * 状态配置 - 统一所有状态相关的定义
 */
export const STATUS_CONFIG: {
  value: TaskStatus | null
  label: string
  color: string
  description: string
}[] = [
  { value: null, label: '全部', color: 'bg-gradient-to-r from-gray-400 to-gray-600', description: '所有状态' },
  { value: 'todo', label: '待办', color: 'bg-white border-2 border-gray-400', description: '未开始的任务' },
  { value: 'in-progress', label: '进行中', color: 'bg-blue-500', description: '正在执行的任务' },
  { value: 'blocked', label: '阻塞', color: 'bg-red-500', description: '被阻塞的任务' },
  { value: 'done', label: '已完成', color: 'bg-green-500', description: '已完成的任务' },
  { value: 'cancel', label: '取消', color: 'bg-black', description: '已取消的任务' },
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
