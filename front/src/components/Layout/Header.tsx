import { ThemeToggle } from '@/components/shared/ThemeToggle'

export function Header() {
  return (
    <header className="h-12 border-b border-dark-border flex items-center justify-between px-4 bg-dark-bg-primary">
      <h1 className="font-bold text-lg text-dark-text-primary">WBS 任务管理系统</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
