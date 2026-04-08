import { cn, STATUS_CLASSES, STATUS_DOT_CLASSES, STATUS_LABELS } from '@/lib/utils'
import type { ApplicationStatus } from '@/types'

interface Props {
  status: ApplicationStatus
  className?: string
}

export function StatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_CLASSES[status],
        className,
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT_CLASSES[status])}
        aria-hidden="true"
      />
      {STATUS_LABELS[status]}
    </span>
  )
}
