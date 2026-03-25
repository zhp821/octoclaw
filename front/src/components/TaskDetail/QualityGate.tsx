import type { QualityGate as QG } from '@/types'

interface Props {
  qualityGate: QG
}

export function QualityGate({ qualityGate }: Props) {
  if (!qualityGate.enabled) return null

  return (
    <div 
      className="mt-4 p-3 border-l-2 rounded" 
      style={{ backgroundColor: 'rgba(139,92,246,0.1)', borderLeftColor: 'var(--brand-purple)' }}
    >
      <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--brand-purple)' }}>质量门</h3>
      <p className="text-xs text-dark-text-secondary">{qualityGate.description}</p>
      {qualityGate.schema && (
        <pre className="mt-2 p-2 rounded text-xs overflow-auto" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          {qualityGate.schema}
        </pre>
      )}
    </div>
  )
}
