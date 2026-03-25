import { ThemeToggle } from '@/components/shared/ThemeToggle'

export function OctoClawLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
      <defs>
        <linearGradient id="octoBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      {/* 8条触手 */}
      <path d="M 18 58 Q 10 75 5 92" stroke="url(#octoBodyGradient)" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M 28 64 Q 20 82 18 96" stroke="url(#octoBodyGradient)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M 40 68 Q 36 86 34 98" stroke="url(#octoBodyGradient)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M 50 70 Q 50 88 50 100" stroke="url(#octoBodyGradient)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M 60 68 Q 64 86 66 98" stroke="url(#octoBodyGradient)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M 72 64 Q 80 82 82 96" stroke="url(#octoBodyGradient)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M 82 58 Q 90 75 95 92" stroke="url(#octoBodyGradient)" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M 50 69 Q 58 85 55 95" stroke="url(#octoBodyGradient)" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* 身体 */}
      <ellipse cx="50" cy="42" rx="34" ry="28" fill="url(#octoBodyGradient)"/>
      {/* 眼睛 */}
      <ellipse cx="38" cy="38" rx="9" ry="11" fill="white"/>
      <ellipse cx="62" cy="38" rx="9" ry="11" fill="white"/>
      <circle cx="40" cy="40" r="4" fill="#1e293b"/>
      <circle cx="64" cy="40" r="4" fill="#1e293b"/>
      <circle cx="42" cy="38" r="1.5" fill="white"/>
      <circle cx="66" cy="38" r="1.5" fill="white"/>
      {/* 嘴巴 */}
      <path d="M 40 52 Q 50 58 60 52" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

export function Header() {
  return (
    <header className="h-12 border-b border-dark-border flex items-center justify-between px-4 bg-dark-bg-primary">
      <div className="flex items-center gap-2">
        <OctoClawLogo />
        <h1 className="font-bold text-lg text-dark-text-primary">OctoClaw</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
