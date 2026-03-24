import type { QualityGate as QG } from '@/types'

interface Props {
  qualityGate: QG
}

export function QualityGate({ qualityGate }: Props) {
  if (!qualityGate.enabled) return null

  return (
    <div className="mt-4 p-3 bg-purple-50 dark:bg-brand-purple/10 border-l-2 border-purple-400 dark:border-brand-purple rounded">
      <h3 className="text-sm font-bold text-purple-600 dark:text-brand-purple mb-1">质量门</h3>
      <p className="text-xs text-slate-600 dark:text-dark-text-secondary">{qualityGate.description}</p>
      {qualityGate.schema && (
        <pre className="mt-2 p-2 bg-gray-100 dark:bg-dark-bg-secondary rounded text-xs overflow-auto text-slate-900 dark:text-dark-text-primary">
          {qualityGate.schema}
        </pre>
      )}
    </div>
  )
}
