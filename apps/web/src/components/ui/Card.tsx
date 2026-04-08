import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  clickable?: boolean
}

export function Card({ clickable, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-white border border-slate-200 shadow-sm p-6',
        'dark:bg-slate-900 dark:border-slate-800',
        clickable && 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-150',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
  className?: string
}

export function MetricCard({ label, value, delta, deltaPositive, className }: MetricCardProps) {
  return (
    <Card className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 font-mono text-4xl font-bold text-slate-900 dark:text-white">{value}</p>
      {delta && (
        <p className={cn('mt-1 text-xs', deltaPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
          {delta}
        </p>
      )}
    </Card>
  )
}
