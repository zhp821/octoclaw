import { Sun, Moon } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore()

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors border ${
        theme === 'dark' 
          ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' 
          : 'bg-slate-200 border-slate-300 hover:bg-slate-300'
      }`}
      title="切换主题"
    >
      {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-700" />}
    </button>
  )
}
