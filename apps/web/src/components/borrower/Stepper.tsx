import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'

const STEPS = [
  'Business Profile',
  'Loan Request',
  'Financials',
  'Documents',
  'Review',
]

interface Props {
  current: number  // 1-indexed
}

export function Stepper({ current }: Props) {
  return (
    <>
      {/* Desktop */}
      <nav aria-label="Application progress" className="hidden md:block w-full py-4 px-6 border-b border-slate-200">
        <ol className="flex items-center">
          {STEPS.map((label, i) => {
            const step = i + 1
            const completed = step < current
            const active = step === current
            return (
              <li key={step} className="flex items-center">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                    completed ? 'bg-blue-700 text-white' : active ? 'border-2 border-blue-700 bg-white text-blue-700' : 'border-2 border-slate-300 bg-white text-slate-400',
                  )}
                >
                  {completed ? <CheckIcon className="h-4 w-4" /> : step}
                </span>
                <span
                  className={cn(
                    'ml-2 text-sm font-medium',
                    completed || active ? 'text-blue-700' : 'text-slate-400',
                  )}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-px mx-3 min-w-8', step < current ? 'bg-blue-700' : 'bg-slate-200')} />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Mobile */}
      <div className="md:hidden px-4 py-3 border-b border-slate-200">
        <p className="text-sm font-medium text-slate-600">
          Step {current} of {STEPS.length} — {STEPS[current - 1]}
        </p>
        <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-700 rounded-full transition-all duration-300"
            style={{ width: `${(current / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </>
  )
}
