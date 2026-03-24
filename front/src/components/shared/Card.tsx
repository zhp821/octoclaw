import { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'selected'
}

export function Card({ variant = 'default', className = '', ...props }: Props) {
  const variants = {
    default: 'bg-dark-secondary border-dark-border',
    selected: 'bg-brand-blue/10 border-brand-blue',
  }

  return (
    <div
      className={`p-4 rounded-lg border ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
