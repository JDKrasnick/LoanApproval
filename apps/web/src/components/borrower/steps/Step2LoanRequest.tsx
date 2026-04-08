'use client'
import { useApplicationForm } from '../ApplicationFormContext'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { LOAN_PURPOSES, LOAN_TERMS, formatCurrencyFull } from '@/lib/utils'

interface Props { onNext: () => void; onBack: () => void; step: number }

export function Step2LoanRequest({ onNext, onBack }: Props) {
  const { data, update } = useApplicationForm()
  const amount = parseFloat(data.loan_amount) || 0
  const valid = !!(data.loan_amount && data.loan_purpose && data.loan_term_months && amount >= 10000)

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-1">Loan Request</h2>
      <p className="text-slate-600 mb-6">Tell us how much you need and what it's for.</p>

      <div className="space-y-5">
        <div>
          <Input
            label="Loan Amount"
            required
            type="number"
            min={10000}
            max={5000000}
            value={data.loan_amount}
            onChange={e => update({ loan_amount: e.target.value })}
            prefix="$"
            helper={amount > 0 ? `${formatCurrencyFull(amount)}` : '$10,000 – $5,000,000'}
          />
          {amount > 0 && (
            <div className="mt-3">
              <input
                type="range"
                min={10000}
                max={5000000}
                step={10000}
                value={amount}
                onChange={e => update({ loan_amount: e.target.value })}
                className="w-full accent-blue-700"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>$10K</span><span>$5M</span>
              </div>
            </div>
          )}
        </div>

        <Select
          label="Loan Purpose"
          required
          value={data.loan_purpose}
          onChange={e => update({ loan_purpose: e.target.value })}
          placeholder="Select purpose"
          options={LOAN_PURPOSES.map(p => ({ value: p, label: p }))}
        />

        {data.loan_purpose === 'Other' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-600">
              Purpose Details <span className="text-red-500">*</span>
            </label>
            <textarea
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              rows={3}
              value={data.loan_purpose_details}
              onChange={e => update({ loan_purpose_details: e.target.value })}
              placeholder="Describe the intended use of funds..."
            />
          </div>
        )}

        <Select
          label="Desired Term"
          required
          value={data.loan_term_months}
          onChange={e => update({ loan_term_months: e.target.value })}
          placeholder="Select term"
          options={LOAN_TERMS.map(t => ({ value: String(t), label: `${t} months` }))}
        />
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="secondary" onClick={onBack} size="lg">← Back</Button>
        <Button onClick={onNext} disabled={!valid} size="lg">Continue →</Button>
      </div>
    </div>
  )
}
