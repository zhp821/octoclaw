interface Props {
  steps: string[]
}

export function TaskSteps({ steps }: Props) {
  if (steps.length === 0) return null

  return (
    <div className="mt-4">
      <h3 className="text-sm font-bold text-slate-400 dark:text-dark-text-secondary mb-2">执行步骤</h3>
      <ul className="space-y-1">
        {steps.map((step, i) => (
          <li key={i} className="text-sm flex items-center gap-2 text-slate-700 dark:text-dark-text-primary">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-brand-blue/20 text-blue-600 dark:text-brand-blue flex items-center justify-center text-xs font-bold">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
