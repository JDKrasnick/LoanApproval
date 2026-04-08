import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
  size?: 'sm' | 'default' | 'lg'
  loading?: boolean
}

const variantClasses: Record<string, string> = {
  primary:   'bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-600',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-blue-500',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  link:      'text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline p-0',
}

const sizeClasses: Record<string, string> = {
  sm:      'px-3 py-1.5 text-xs',
  default: 'px-4 py-2.5 text-sm',
  lg:      'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
