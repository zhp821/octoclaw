export function generateNumbering(parentNumbering: string | null, index: number): string {
  if (!parentNumbering) return `${index + 1}`
  return `${parentNumbering}.${index + 1}`
}

export function renumberSiblings(tasks: any[], parentNumbering: string | null): void {
  tasks.forEach((task, index) => {
    task.numbering = generateNumbering(parentNumbering, index)
    if (task.children.length > 0) {
      renumberSiblings(task.children, task.numbering)
    }
  })
}
