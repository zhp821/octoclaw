interface Props {
  status: 'todo' | 'in-progress' | 'blocked' | 'done' | 'cancel'
}

export function Badge({ status }: Props) {
  const styles = {
    todo: 'bg-gray-500/20 text-gray-400',
    'in-progress': 'bg-blue-500/20 text-blue-400',
    blocked: 'bg-red-500/20 text-red-400',
    done: 'bg-green-500/20 text-green-400',
    cancel: 'bg-gray-500/20 text-gray-500',
  }

  const labels = {
    todo: '待办',
    'in-progress': '进行中',
    blocked: '阻塞',
    done: '已完成',
    cancel: '已取消',
  }

  return (
    <span className={`${styles[status]} px-2 py-1 rounded text-xs font-medium`}>
      {labels[status]}
    </span>
  )
}
