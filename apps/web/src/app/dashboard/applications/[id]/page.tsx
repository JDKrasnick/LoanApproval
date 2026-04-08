'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { api } from '@/lib/api'
import type { Application, Decision, AuditLog, ApplicationStatus } from '@/types'
import { formatCurrency, formatCurrencyFull, formatDate, formatRatio, cn } from '@/lib/utils'
import Link from 'next/link'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts'
import { FileText, CheckCircle2, XCircle, AlertTriangle, ChevronLeft } from 'lucide-react'

function RatioRow({ label, value, threshold, direction }: {
  label: string; value: number | null; threshold: number; direction: 'min' | 'max'
}) {
  const good = value != null && (direction === 'min' ? value >= threshold : value <= threshold)
  const warn = value != null && (direction === 'min'
    ? (value < threshold && value >= threshold * 0.85)
    : (value > threshold && value <= threshold * 1.15))
  const bad = value != null && !good && !warn

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">
          {direction === 'min' ? `min ${formatRatio(threshold)}` : `max ${formatRatio(threshold)}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-slate-900">{formatRatio(value)}</span>
        {good && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        {warn && <AlertTriangle className="h-4 w-4 text-amber-500" />}
        {bad && <XCircle className="h-4 w-4 text-red-500" />}
      </div>
    </div>
  )
}

export default function ApplicationDetailPage() {
  const { id } = useParams() as { id: string }
  const [app, setApp] = useState<Application | null>(null)
  const [decision, setDecision] = useState<Decision | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [evaluating, setEvaluating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [explaining, setExplaining] = useState(false)

  const load = async () => {
    const [appR, decR, auditR] = await Promise.allSettled([
      api.getApplication(id) as Promise<Application>,
      api.getDecision(id) as Promise<Decision>,
      api.getAuditLog(id) as Promise<AuditLog[]>,
    ])
    if (appR.status === 'fulfilled') setApp(appR.value)
    if (decR.status === 'fulfilled') setDecision(decR.value)
    if (auditR.status === 'fulfilled') setAuditLogs(auditR.value)
  }

  useEffect(() => { load() }, [id])

  const runEvaluation = async () => {
    setEvaluating(true)
    try {
      const d = await api.evaluate(id) as Decision
      setDecision(d)
      await load()
    } finally {
      setEvaluating(false)
    }
  }

  const generateExplanation = async () => {
    setExplaining(true)
    try {
      const d = await api.explainDecision(id) as Decision
      setDecision(d)
    } finally {
      setExplaining(false)
    }
  }

  const updateStatus = async (status: ApplicationStatus) => {
    setUpdating(true)
    try {
      const updated = await api.updateStatus(id, status) as Application
      setApp(updated)
    } finally {
      setUpdating(false)
    }
  }

  if (!app) {
    return <DashboardShell><div className="py-20 text-center text-slate-400">Loading…</div></DashboardShell>
  }

  const borrower = app.borrower!
  const equity = app.total_assets - app.existing_debt
  const dte = equity > 0 ? app.existing_debt / equity : null
  const annualDS = app.annual_debt_service || app.existing_debt * 0.15
  const dscr = annualDS > 0 ? app.ebitda / annualDS : null
  const currentRatio = app.current_assets && app.current_liabilities
    ? app.current_assets / app.current_liabilities : null
  const ic = app.ebit && app.interest_expense && app.interest_expense > 0
    ? app.ebit / app.interest_expense : null

  const radarData = [
    { ratio: 'D/E', value: dte != null ? Math.min(dte, 4) : 0 },
    { ratio: 'DSCR', value: dscr != null ? Math.min(dscr, 3) : 0 },
    { ratio: 'Current', value: currentRatio != null ? Math.min(currentRatio, 3) : 0 },
    { ratio: 'Int. Cov.', value: ic != null ? Math.min(ic, 5) : 0 },
  ]

  return (
    <DashboardShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/dashboard/applications" className="hover:text-slate-900 flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Applications
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{borrower.company_name}</span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{borrower.company_name}</h1>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-sm text-slate-500 mt-1 font-mono">
            #{app.id.slice(0, 8).toUpperCase()} · Submitted {formatDate(app.submitted_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!decision && (
            <Button onClick={runEvaluation} loading={evaluating} variant="primary">
              Run Credit Evaluation
            </Button>
          )}
          {decision?.outcome === 'approved' && (
            <Button onClick={() => updateStatus('approved')} loading={updating} variant="primary" className="bg-emerald-600 hover:bg-emerald-700">
              Approve Deal
            </Button>
          )}
          {app.status === 'approved' && (
            <Button onClick={() => updateStatus('funded')} loading={updating} className="bg-violet-600 hover:bg-violet-700 text-white border-0">
              Mark as Funded
            </Button>
          )}
          <Button onClick={() => updateStatus('declined')} loading={updating} variant="danger">
            Decline
          </Button>
          <Button onClick={() => updateStatus('in_review')} loading={updating} variant="ghost">
            Flag for Review
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2 space-y-4">
          {/* Loan Request */}
          <Card>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Loan Request</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-500">Amount</p><p className="font-mono font-semibold text-slate-900">{formatCurrencyFull(app.loan_amount)}</p></div>
              <div><p className="text-slate-500">Purpose</p><p className="font-medium text-slate-900">{app.loan_purpose}</p></div>
              <div><p className="text-slate-500">Term</p><p className="font-medium text-slate-900">{app.loan_term_months} months</p></div>
              <div><p className="text-slate-500">Submitted</p><p className="font-medium text-slate-900">{formatDate(app.submitted_at)}</p></div>
            </div>
          </Card>

          {/* Business Profile */}
          <Card>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Business Profile</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-500">Company</p><p className="font-medium text-slate-900">{borrower.company_name}</p></div>
              <div><p className="text-slate-500">Industry</p><p className="font-medium text-slate-900">{borrower.industry}</p></div>
              <div><p className="text-slate-500">Founded</p><p className="font-medium text-slate-900">{new Date().getFullYear() - borrower.years_in_operation} (~{borrower.years_in_operation} yrs)</p></div>
              <div><p className="text-slate-500">Structure</p><p className="font-medium text-slate-900">{borrower.business_structure}</p></div>
              {borrower.ein && <div><p className="text-slate-500">EIN</p><p className="font-mono font-medium text-slate-900">{borrower.ein}</p></div>}
            </div>
          </Card>

          {/* Financial Snapshot */}
          <Card>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Financial Snapshot</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><p className="text-slate-500">Annual Revenue</p><p className="font-mono font-semibold text-slate-900">{formatCurrencyFull(app.annual_revenue)}</p></div>
              <div><p className="text-slate-500">EBITDA</p><p className="font-mono font-semibold text-slate-900">{formatCurrencyFull(app.ebitda)}</p></div>
              <div><p className="text-slate-500">Total Debt</p><p className="font-mono font-semibold text-slate-900">{formatCurrencyFull(app.existing_debt)}</p></div>
              <div><p className="text-slate-500">Total Assets</p><p className="font-mono font-semibold text-slate-900">{formatCurrencyFull(app.total_assets)}</p></div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Key Ratios</h3>
                <RatioRow label="Debt-to-Equity" value={dte} threshold={3.0} direction="max" />
                <RatioRow label="DSCR" value={dscr} threshold={1.2} direction="min" />
                {currentRatio != null && <RatioRow label="Current Ratio" value={currentRatio} threshold={1.0} direction="min" />}
                {ic != null && <RatioRow label="Interest Coverage" value={ic} threshold={2.0} direction="min" />}
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Ratio Chart</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="ratio" tick={{ fontSize: 11 }} />
                    <Radar dataKey="value" stroke="#1D4ED8" fill="#1D4ED8" fillOpacity={0.15} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Audit Log */}
          {auditLogs.length > 0 && (
            <Card>
              <h2 className="text-base font-semibold text-slate-900 mb-3">Decision Audit Log</h2>
              <ol className="space-y-3">
                {auditLogs.map(log => (
                  <li key={log.id} className="flex gap-3 text-sm">
                    <div className="mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">{formatDate(log.created_at)}</p>
                      <p className="font-medium text-slate-800 capitalize">{log.event_type.replace(/_/g, ' ')}</p>
                      {Object.entries(log.payload).slice(0, 4).map(([k, v]) => (
                        <p key={k} className="text-xs text-slate-500">
                          {k}: <span className="text-slate-700">{String(v)}</span>
                        </p>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Decision Panel */}
          {decision && (
            <Card>
              <h2 className="text-base font-semibold text-slate-900 mb-3">AI Decision</h2>
              <div className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold mb-3',
                decision.outcome === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                decision.outcome === 'declined' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700',
              )}>
                {decision.outcome === 'approved' ? '✓ APPROVE' : decision.outcome === 'declined' ? '✗ DECLINE' : '⚠ MANUAL REVIEW'}
              </div>
              {decision.score != null && (
                <p className="text-sm text-slate-600 mb-2">Score: <span className="font-mono font-semibold">{decision.score.toFixed(1)}</span></p>
              )}
              <p className="text-xs text-slate-600 mb-3">{decision.rationale.summary}</p>

              <div className="space-y-1.5 text-xs">
                {decision.rationale.passes.length > 0 && (
                  <div>
                    <p className="font-medium text-emerald-700 mb-1">Passes ({decision.rationale.passes.length})</p>
                    {decision.rationale.passes.map(r => (
                      <p key={r} className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {r}</p>
                    ))}
                  </div>
                )}
                {decision.rationale.cautions.length > 0 && (
                  <div>
                    <p className="font-medium text-amber-700 mb-1 mt-2">Cautions ({decision.rationale.cautions.length})</p>
                    {decision.rationale.cautions.map(r => (
                      <p key={r} className="text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {r}</p>
                    ))}
                  </div>
                )}
                {decision.rationale.hard_fails.length > 0 && (
                  <div>
                    <p className="font-medium text-red-700 mb-1 mt-2">Hard Fails ({decision.rationale.hard_fails.length})</p>
                    {decision.rationale.hard_fails.map(r => (
                      <p key={r} className="text-red-600 flex items-center gap-1"><XCircle className="h-3 w-3" /> {r}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                {decision.rationale.explanation ? (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Analyst Explanation</p>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{decision.rationale.explanation}</p>
                    <button
                      onClick={generateExplanation}
                      disabled={explaining}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 disabled:text-slate-400"
                    >
                      {explaining ? 'Regenerating…' : 'Regenerate'}
                    </button>
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" onClick={generateExplanation} loading={explaining} className="w-full">
                    Generate Explanation
                  </Button>
                )}
              </div>

              {decision.ml_default_probability != null && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">ML Default Probability</p>
                  <p className="font-mono font-semibold text-slate-900">{(decision.ml_default_probability * 100).toFixed(1)}%</p>
                </div>
              )}
            </Card>
          )}

          {!decision && (
            <Card className="text-center py-8">
              <p className="text-sm text-slate-500 mb-3">No evaluation yet</p>
              <Button onClick={runEvaluation} loading={evaluating}>
                Run Evaluation
              </Button>
            </Card>
          )}

          {/* Activity */}
          <Card>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Activity</h2>
            <textarea
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Add a note..."
            />
            <Button variant="secondary" size="sm" className="mt-2">Post</Button>

            <div className="mt-4 space-y-3">
              {auditLogs.slice().reverse().slice(0, 5).map(log => (
                <div key={log.id} className="text-xs text-slate-500 border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                  <span className="font-medium text-slate-700 capitalize">{log.event_type.replace(/_/g, ' ')}</span>
                  <span className="ml-2">{formatDate(log.created_at)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
