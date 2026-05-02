'use client'
import { useApplicationForm } from '../ApplicationFormContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatRatio, industryTrack, INDUSTRY_METRIC_SPECS } from '@/lib/utils'
import { Info } from 'lucide-react'

interface Props { onNext: () => void; onBack: () => void; step: number }

function parseNum(s: string) {
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function RatioDisplay({ label, value, helper }: { label: string; value: string | null; helper?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {helper && <p className="text-xs text-slate-500">{helper}</p>}
      </div>
      <span className="font-mono font-semibold text-slate-900 text-sm">
        {value ?? '—'}
      </span>
    </div>
  )
}

export function Step3Financials({ onNext, onBack }: Props) {
  const { data, update } = useApplicationForm()

  const revenue = parseNum(data.annual_revenue)
  const ebitda = parseNum(data.ebitda)
  const debt = parseNum(data.existing_debt)
  const collateral = parseNum(data.collateral_value) ?? parseNum(data.total_assets)
  const loanAmount = parseNum(data.loan_amount)
  const annualDebtService = parseNum(data.annual_debt_service)

  const dscr = ebitda != null && annualDebtService != null && annualDebtService > 0
    ? formatRatio(ebitda / annualDebtService)
    : null
  const ltv = loanAmount != null && collateral != null && collateral > 0
    ? `${((loanAmount / collateral) * 100).toFixed(1)}%`
    : null
  const leverage = debt != null && ebitda != null && ebitda > 0
    ? formatRatio(debt / ebitda)
    : null

  const track = industryTrack(data.industry)
  const industrySpec = track ? INDUSTRY_METRIC_SPECS[track] : []

  const updateIndustryMetric = (key: string, value: string) => {
    update({ industry_metrics: { ...data.industry_metrics, [key]: value } })
  }

  const baseValid = !!(
    data.annual_revenue && data.ebitda && data.existing_debt && data.total_assets &&
    data.collateral_value && data.annual_debt_service
  )

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-1">Financial Data</h2>
      <p className="text-slate-600 mb-6">Most recent fiscal year. All values in USD unless marked.</p>

      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Core Financials</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Annual Revenue" required type="number" min={0} prefix="$"
          value={data.annual_revenue}
          onChange={e => update({ annual_revenue: e.target.value })}
        />
        <Input
          label="EBITDA" required type="number" prefix="$"
          value={data.ebitda}
          onChange={e => update({ ebitda: e.target.value })}
          helper="Earnings before interest, taxes, D&A"
        />
        <Input
          label="Total Existing Debt" required type="number" min={0} prefix="$"
          value={data.existing_debt}
          onChange={e => update({ existing_debt: e.target.value })}
        />
        <Input
          label="Total Assets" required type="number" min={0} prefix="$"
          value={data.total_assets}
          onChange={e => update({ total_assets: e.target.value })}
        />
        <Input
          label="Collateral Value" required type="number" min={0} prefix="$"
          value={data.collateral_value}
          onChange={e => update({ collateral_value: e.target.value })}
          helper="Value of the asset securing the loan (used for LTV)"
        />
        <Input
          label="Annual Debt Service" required type="number" min={0} prefix="$"
          value={data.annual_debt_service}
          onChange={e => update({ annual_debt_service: e.target.value })}
          helper="Principal + interest payments per year"
        />
        <Input
          label="Bankruptcies in Last 7 Years" required type="number" min={0}
          value={data.bankruptcies_last_7y}
          onChange={e => update({ bankruptcies_last_7y: e.target.value })}
          helper="0 if none"
        />
        <Input
          label="Current Assets" type="number" min={0} prefix="$"
          value={data.current_assets}
          onChange={e => update({ current_assets: e.target.value })}
          helper="Optional"
        />
        <Input
          label="Current Liabilities" type="number" min={0} prefix="$"
          value={data.current_liabilities}
          onChange={e => update({ current_liabilities: e.target.value })}
          helper="Optional"
        />
        <Input
          label="Interest Expense" type="number" min={0} prefix="$"
          value={data.interest_expense}
          onChange={e => update({ interest_expense: e.target.value })}
          helper="Optional"
        />
        <Input
          label="EBIT" type="number" prefix="$"
          value={data.ebit}
          onChange={e => update({ ebit: e.target.value })}
          helper="Optional"
        />
      </div>

      {/* Industry-specific metrics */}
      {track && industrySpec.length > 0 && (
        <>
          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Industry Metrics — {track.charAt(0).toUpperCase() + track.slice(1)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {industrySpec.map(m => (
              <Input
                key={m.key}
                label={m.suffix === '%' ? `${m.label} (%)` : m.label}
                required
                type="number"
                prefix={m.suffix === '$' ? '$' : undefined}
                value={data.industry_metrics[m.key] ?? ''}
                onChange={e => updateIndustryMetric(m.key, e.target.value)}
                helper={m.helper}
              />
            ))}
          </div>
        </>
      )}

      {!track && data.industry && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Industry "{data.industry}" doesn't map to one of the defined tracks (Hospitality, Tech, Retail, Healthcare, Industrials). Your application will be routed to human review.
        </div>
      )}

      {/* Auto-calculated ratios */}
      {(dscr || ltv || leverage) && (
        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-700">Calculated Core Ratios</p>
          </div>
          <RatioDisplay label="DSCR" value={dscr} helper="EBITDA / annual debt service (target ≥ 1.50)" />
          <RatioDisplay label="LTV" value={ltv} helper="loan / collateral (target ≤ 65%)" />
          <RatioDisplay label="Leverage" value={leverage} helper="debt / EBITDA (target ≤ 3.0x)" />
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="secondary" onClick={onBack} size="lg">← Back</Button>
        <Button onClick={onNext} disabled={!baseValid} size="lg">Continue →</Button>
      </div>
    </div>
  )
}
