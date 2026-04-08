'use client'
import { useApplicationForm } from '../ApplicationFormContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatRatio } from '@/lib/utils'
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
  const assets = parseNum(data.total_assets)
  const currentAssets = parseNum(data.current_assets)
  const currentLiabilities = parseNum(data.current_liabilities)
  const annualDebtService = parseNum(data.annual_debt_service)

  const equity = assets != null && debt != null ? assets - debt : null
  const dte = equity != null && debt != null && equity > 0 ? formatRatio(debt / equity) : null
  const dscr = ebitda != null && annualDebtService != null && annualDebtService > 0
    ? formatRatio(ebitda / annualDebtService)
    : (ebitda != null && debt != null && debt > 0
        ? formatRatio(ebitda / (debt * 0.15))
        : null)
  const currentRatio = currentAssets != null && currentLiabilities != null && currentLiabilities > 0
    ? formatRatio(currentAssets / currentLiabilities)
    : null

  const valid = !!(data.annual_revenue && data.ebitda && data.existing_debt && data.total_assets)

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-1">Financial Data</h2>
      <p className="text-slate-600 mb-6">Most recent fiscal year. All values in USD.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Annual Revenue"
          required
          type="number"
          min={0}
          value={data.annual_revenue}
          onChange={e => update({ annual_revenue: e.target.value })}
          prefix="$"
          helper="Most recent fiscal year"
        />
        <Input
          label="EBITDA"
          required
          type="number"
          value={data.ebitda}
          onChange={e => update({ ebitda: e.target.value })}
          prefix="$"
          helper="Earnings before interest, taxes, depreciation & amortization"
        />
        <Input
          label="Total Existing Debt"
          required
          type="number"
          min={0}
          value={data.existing_debt}
          onChange={e => update({ existing_debt: e.target.value })}
          prefix="$"
          helper="All outstanding debt obligations"
        />
        <Input
          label="Total Assets"
          required
          type="number"
          min={0}
          value={data.total_assets}
          onChange={e => update({ total_assets: e.target.value })}
          prefix="$"
        />
        <Input
          label="Current Assets"
          type="number"
          min={0}
          value={data.current_assets}
          onChange={e => update({ current_assets: e.target.value })}
          prefix="$"
          helper="Cash, receivables, inventory (optional but improves analysis)"
        />
        <Input
          label="Current Liabilities"
          type="number"
          min={0}
          value={data.current_liabilities}
          onChange={e => update({ current_liabilities: e.target.value })}
          prefix="$"
          helper="Due within 12 months"
        />
        <Input
          label="Annual Debt Service"
          type="number"
          min={0}
          value={data.annual_debt_service}
          onChange={e => update({ annual_debt_service: e.target.value })}
          prefix="$"
          helper="Total principal + interest payments per year"
        />
        <Input
          label="Interest Expense"
          type="number"
          min={0}
          value={data.interest_expense}
          onChange={e => update({ interest_expense: e.target.value })}
          prefix="$"
          helper="Annual interest paid"
        />
        <Input
          label="EBIT"
          type="number"
          value={data.ebit}
          onChange={e => update({ ebit: e.target.value })}
          prefix="$"
          helper="Earnings before interest and taxes"
        />
      </div>

      {/* Auto-calculated ratios */}
      {(dte || dscr || currentRatio) && (
        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-700">Calculated Ratios (used in credit evaluation)</p>
          </div>
          <RatioDisplay label="Debt-to-Equity" value={dte} helper="existing_debt / equity" />
          <RatioDisplay label="DSCR" value={dscr} helper="EBITDA / annual debt service" />
          {currentRatio && <RatioDisplay label="Current Ratio" value={currentRatio} helper="current assets / current liabilities" />}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="secondary" onClick={onBack} size="lg">← Back</Button>
        <Button onClick={onNext} disabled={!valid} size="lg">Continue →</Button>
      </div>
    </div>
  )
}
