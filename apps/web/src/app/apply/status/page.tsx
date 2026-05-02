'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { api } from '@/lib/api'
import type { Application, Decision } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

const TIMELINE_STAGES = [
  { key: 'new',       label: 'Application Received' },
  { key: 'in_review', label: 'Under Review' },
  { key: 'approved',  label: 'Decision' },
  { key: 'funded',    label: 'Funding' },
]

const STATUS_ORDER = ['new', 'in_review', 'approved', 'funded']

function stageIndex(status: string) {
  if (status === 'declined') return 2
  return STATUS_ORDER.indexOf(status)
}

function StatusContent() {
  const params = useSearchParams()
  const id = params.get('id') ?? ''
  const [app, setApp] = useState<Application | null>(null)
  const [decision, setDecision] = useState<Decision | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [appData, decisionData] = await Promise.allSettled([
          api.getApplication(id) as Promise<Application>,
          api.getDecision(id) as Promise<Decision>,
        ])
        if (appData.status === 'fulfilled') setApp(appData.value)
        else setError('Application not found')
        if (decisionData.status === 'fulfilled') setDecision(decisionData.value)
      } catch {
        setError('Failed to load application')
      }
    }
    load()
    // Poll every 30s
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [id])

  const currentIdx = app ? stageIndex(app.status) : -1

  return (
    <>
      <PublicHeader />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {error && <p className="text-red-600 text-center">{error}</p>}
        {app && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Application #{app.id.slice(0, 8).toUpperCase()}
                </h1>
                <p className="text-slate-500 text-sm mt-1">Submitted {formatDate(app.submitted_at)}</p>
              </div>
              <StatusBadge status={app.status} className="text-sm px-3 py-1" />
            </div>

            {/* Timeline */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-6 mb-4">
              <h2 className="text-lg font-semibold text-slate-900 mb-5">Application Status</h2>
              <ol className="space-y-4">
                {TIMELINE_STAGES.map((stage, i) => {
                  const done = i <= currentIdx
                  const active = i === currentIdx
                  return (
                    <li key={stage.key} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        {done ? (
                          <CheckCircle2 className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-emerald-500'}`} />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300" />
                        )}
                        {i < TIMELINE_STAGES.length - 1 && (
                          <div className={`w-px flex-1 mt-1 min-h-4 ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className={`font-medium text-sm ${done ? 'text-slate-900' : 'text-slate-400'}`}>
                          {stage.label}
                        </p>
                        {active && app.updated_at && (
                          <p className="text-xs text-slate-500 mt-0.5">{formatDate(app.updated_at)}</p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* Loan summary */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-6 mb-4">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Loan Summary</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Amount</p>
                  <p className="font-mono font-semibold text-slate-900">{formatCurrency(app.loan_amount)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Purpose</p>
                  <p className="font-medium text-slate-900">{app.loan_purpose}</p>
                </div>
                <div>
                  <p className="text-slate-500">Term</p>
                  <p className="font-medium text-slate-900">{app.loan_term_months} months</p>
                </div>
              </div>
            </div>

            {/* Decision result */}
            {app.status === 'approved' && decision && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 mb-4">
                <h2 className="text-lg font-semibold text-emerald-800 mb-2">Congratulations — Approved!</h2>
                <p className="text-emerald-700 text-sm mb-4">{decision.rationale.summary}</p>
                <button className="bg-emerald-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-emerald-700 cursor-pointer">
                  Accept Offer
                </button>
              </div>
            )}

            {app.status === 'declined' && decision && (
              <div className="rounded-lg border border-slate-200 bg-white p-6 mb-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Application Declined</h2>
                <p className="text-slate-600 text-sm mb-4">
                  After reviewing your application, we're unable to offer financing at this time.
                </p>
                {(decision.rationale.hard_stops ?? []).length > 0 && (
                  <ul className="text-sm text-slate-600 space-y-1 mb-4">
                    {decision.rationale.hard_stops!.map(f => (
                      <li key={f} className="flex items-start gap-2"><span>•</span>{f}</li>
                    ))}
                  </ul>
                )}
                <a href="mailto:support@loanapproval.com" className="text-sm text-blue-600 font-medium hover:underline">
                  Contact Us to Discuss Options
                </a>
              </div>
            )}

            {decision?.rationale.explanation && (
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-6 mb-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Why You Got This Decision</h2>
                {decision.score != null && (
                  <p className="text-xs text-slate-500 mb-3">
                    Final score <span className="font-mono font-semibold text-slate-800">{decision.score.toFixed(2)}</span> / 2.00
                    {decision.rationale.loan_bracket && <> · bracket {decision.rationale.loan_bracket}</>}
                    {decision.rationale.approve_threshold != null && <> · approve ≥ {decision.rationale.approve_threshold.toFixed(2)}</>}
                  </p>
                )}
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {decision.rationale.explanation}
                </p>
              </div>
            )}

            {app.status === 'funded' && (
              <div className="rounded-lg border border-violet-200 bg-violet-50 p-6 mb-4">
                <h2 className="text-lg font-semibold text-violet-800 mb-2">Funded!</h2>
                <p className="text-violet-700 text-sm">Your loan has been disbursed. Funds should appear within 1–2 business days.</p>
              </div>
            )}

            {/* What's next */}
            {app.status === 'in_review' && (
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">What happens next?</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Our credit team is reviewing your application and supporting documents. You'll receive a decision notification by email. This typically takes 1–2 business days.
                </p>
                <p className="mt-4 text-sm text-slate-500">
                  Questions? <a href="mailto:support@loanapproval.com" className="text-blue-600 hover:underline">Contact support</a>
                </p>
              </div>
            )}
          </>
        )}

        {!app && !error && (
          <div className="flex items-center justify-center py-20">
            <Clock className="h-6 w-6 text-slate-400 animate-spin mr-3" />
            <span className="text-slate-500">Loading application...</span>
          </div>
        )}
      </div>
    </>
  )
}

export default function StatusPage() {
  return (
    <Suspense>
      <StatusContent />
    </Suspense>
  )
}
