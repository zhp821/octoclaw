import { useState } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { Button } from '@/components/shared/Button'
import { X } from 'lucide-react'

interface Props {
  parentId: string | null
  onCancel: () => void
}

export function NewTaskForm({ parentId, onCancel }: Props) {
  const { createChild, getNextNumbering, roots } = useTaskStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [qualityGateEnabled, setQualityGateEnabled] = useState(false)
  const [qualityGateDescription, setQualityGateDescription] = useState('')
  const [steps, setSteps] = useState<string[]>([])
  const [stepInput, setStepInput] = useState('')
  const [requiresReview, setRequiresReview] = useState(false)

  const nextNumbering = getNextNumbering(parentId)
  const isRootTask = !parentId || parentId === '__root__'

  const AGENTS = [
    { id: 'a1', name: 'DevBot', avatar: '🤖', role: 'Developer' },
    { id: 'a2', name: 'QA-Master', avatar: '🔍', role: 'Tester' },
    { id: 'a3', name: 'Architect-X', avatar: '🏗️', role: 'Architect' },
    { id: 'a4', name: 'PM-Pro', avatar: '📋', role: 'Product Manager' },
  ]

  function getParentLevel(id: string | null): number {
    if (!id || id === '__root__') return -1
    function findTask(tasks: typeof roots, taskId: string): number {
      for (const t of tasks) {
        if (t.id === taskId) return t.level
        const found = findTask(t.children, taskId)
        if (found !== -1) return found
      }
      return -1
    }
    return findTask(roots, id)
  }

  const parentLevel = getParentLevel(parentId)
  const newTaskLevel = parentLevel + 1

  const handleSubmit = async () => {
    if (!title.trim()) return
    await createChild(parentId || '__root__', {
      title,
      description,
      assignee: AGENTS.find(a => a.id === assigneeId) || AGENTS[0],
      qualityGate: {
        enabled: qualityGateEnabled,
        description: qualityGateDescription,
      },
      steps,
      numbering: isRootTask ? '' : nextNumbering,
      level: newTaskLevel,
      requiresReview,
    })
  }

  const handleAddStep = () => {
    if (stepInput.trim()) {
      setSteps([...steps, stepInput.trim()])
      setStepInput('')
    }
  }

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-bold">新建任务</h2>
        <button onClick={onCancel} className="p-1 hover:bg-dark-border rounded">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto flex-1 pb-4">
        <div>
          <label className="block text-sm font-bold mb-1 light:text-slate-700">编号</label>
          <input
            type="text"
            value={isRootTask ? '(根任务)' : nextNumbering || '1'}
            disabled
            className="w-full px-3 py-2 bg-dark-secondary border border-dark-border rounded text-dark-text-secondary text-sm light:bg-slate-100 light:text-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1 light:text-slate-700">标题 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入任务标题"
            className="w-full px-3 py-2 bg-dark-secondary border border-dark-border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm light:bg-white light:text-slate-900"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1 light:text-slate-700">描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="输入任务描述 (支持 Markdown)"
            rows={4}
            className="w-full px-3 py-2 bg-dark-secondary border border-dark-border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm resize-none light:bg-white light:text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1 light:text-slate-700">负责人 (Agent)</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full px-3 py-2 bg-dark-secondary border border-dark-border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm light:bg-white light:text-slate-900"
          >
            <option value="">选择负责人</option>
            {AGENTS.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.avatar} {agent.name} - {agent.role}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1 light:text-slate-700">质量门</label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="qg-enabled"
              checked={qualityGateEnabled}
              onChange={(e) => setQualityGateEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="qg-enabled" className="text-sm light:text-slate-700">启用质量门</label>
          </div>
          {qualityGateEnabled && (
            <input
              type="text"
              value={qualityGateDescription}
              onChange={(e) => setQualityGateDescription(e.target.value)}
              placeholder="例如：必须输出有效 JSON"
              className="w-full px-3 py-2 bg-dark-secondary border border-dark-border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm light:bg-white light:text-slate-900"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1 light:text-slate-700">执行步骤</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={stepInput}
              onChange={(e) => setStepInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStep())}
              placeholder="输入步骤后按回车添加"
              className="flex-1 px-3 py-2 bg-dark-secondary border border-dark-border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm light:bg-white light:text-slate-900"
            />
            <Button onClick={handleAddStep} type="button">添加</Button>
          </div>
          {steps.length > 0 && (
            <ul className="space-y-1">
              {steps.map((step, index) => (
                <li key={index} className="flex items-center justify-between text-sm bg-dark-secondary px-3 py-2 rounded light:bg-slate-100">
                  <span><span className="text-dark-text-secondary mr-2 light:text-slate-500">{index + 1}.</span>{step}</span>
                  <button onClick={() => handleRemoveStep(index)} className="text-red-400 hover:text-red-300">×</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requires-review"
              checked={requiresReview}
              onChange={(e) => setRequiresReview(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="requires-review" className="text-sm font-bold light:text-slate-700">需要人工审核</label>
          </div>
          <p className="text-xs text-dark-text-secondary mt-1 light:text-slate-500">启用后，任务完成前需要人工审核确认</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-dark-text-secondary mb-1">标题 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入任务标题"
            className="w-full px-3 py-2 bg-dark-secondary border border-dark-border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-dark-text-secondary mb-1">描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="输入任务描述 (支持 Markdown)"
            rows={4}
            className="w-full px-3 py-2 bg-dark-secondary border border-dark-border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-dark-text-secondary mb-1">负责人 (Agent)</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full px-3 py-2 bg-dark-secondary border border-dark-border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm"
          >
            <option value="">选择负责人</option>
            {AGENTS.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.avatar} {agent.name} - {agent.role}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-dark-text-secondary mb-1">质量门</label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="qg-enabled"
              checked={qualityGateEnabled}
              onChange={(e) => setQualityGateEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="qg-enabled" className="text-sm">启用质量门</label>
          </div>
          {qualityGateEnabled && (
            <input
              type="text"
              value={qualityGateDescription}
              onChange={(e) => setQualityGateDescription(e.target.value)}
              placeholder="例如：必须输出有效 JSON"
              className="w-full px-3 py-2 bg-dark-secondary border border-dark-border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-dark-text-secondary mb-1">执行步骤</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={stepInput}
              onChange={(e) => setStepInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStep())}
              placeholder="输入步骤后按回车添加"
              className="flex-1 px-3 py-2 bg-dark-secondary border border-dark-border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm"
            />
            <Button onClick={handleAddStep} type="button">添加</Button>
          </div>
          {steps.length > 0 && (
            <ul className="space-y-1">
              {steps.map((step, index) => (
                <li key={index} className="flex items-center justify-between text-sm bg-dark-secondary px-3 py-2 rounded">
                  <span><span className="text-dark-text-secondary mr-2">{index + 1}.</span>{step}</span>
                  <button onClick={() => handleRemoveStep(index)} className="text-red-400 hover:text-red-300">×</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requires-review"
              checked={requiresReview}
              onChange={(e) => setRequiresReview(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="requires-review" className="text-sm font-bold text-dark-text-secondary">需要人工审核</label>
          </div>
          <p className="text-xs text-dark-text-secondary mt-1">启用后，任务完成前需要人工审核确认</p>
        </div>

        <div className="flex gap-2 pt-4 flex-shrink-0">
          <Button variant="primary" onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700" disabled={!title.trim()}>
            创建
          </Button>
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            取消
          </Button>
        </div>
      </div>
    </div>
  )
}
