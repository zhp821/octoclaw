import { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-brand-blue text-white',
    secondary: 'bg-dark-border text-dark-text-primary',
    ghost: 'bg-transparent text-dark-text-primary hover:bg-dark-border/50',
  }

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  )
}
