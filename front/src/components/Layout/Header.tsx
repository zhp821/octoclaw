import { ThemeToggle } from '@/components/shared/ThemeToggle'

export function Header() {
  return (
    <header className="h-12 border-b border-dark-border flex items-center justify-between px-4 bg-dark-bg-primary">
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-6 h-6">
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="45" rx="30" ry="25" fill="url(#bodyGradient)"/>
          <ellipse cx="40" cy="40" rx="8" ry="10" fill="white"/>
          <ellipse cx="60" cy="40" rx="8" ry="10" fill="white"/>
          <circle cx="42" cy="42" r="4" fill="#1e293b"/>
          <circle cx="62" cy="42" r="4" fill="#1e293b"/>
          <circle cx="44" cy="40" r="1.5" fill="white"/>
          <circle cx="64" cy="40" r="1.5" fill="white"/>
          <path d="M 42 52 Q 50 58 58 52" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
        <h1 className="font-bold text-lg text-dark-text-primary">OctoClaw</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
