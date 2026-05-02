'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApplicationForm } from '../ApplicationFormContext'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { formatCurrencyFull, BUSINESS_STRUCTURES } from '@/lib/utils'
import { ChevronDown, ChevronUp, Edit2 } from 'lucide-react'
import Link from 'next/link'

interface Props { onNext: () => void; onBack: () => void; step: number }

function Section({ title, step, children }: { title: string; step: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        className="flex items-center justify-between w-full px-5 py-4 text-left cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-slate-900">{title}</span>
        <div className="flex items-center gap-3">
          <Link
            href={`/apply/step/${step}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <Edit2 className="h-3 w-3" /> Edit
          </Link>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>
      {open && <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 text-sm space-y-2">{children}</div>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium text-right">{value}</span>
    </div>
  )
}

export function Step5Review({ onBack }: Props) {
  const { data, reset } = useApplicationForm()
  const router = useRouter()
  const [certified, setCertified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        borrower: {
          company_name: data.company_name,
          dba_name: data.dba_name || undefined,
          industry: data.industry,
          business_structure: data.business_structure,
          years_in_operation: parseInt(data.years_in_operation),
          ein: data.ein || undefined,
          address_street: data.address_street || undefined,
          address_city: data.address_city || undefined,
          address_state: data.address_state || undefined,
          address_zip: data.address_zip || undefined,
        },
        loan_amount: parseFloat(data.loan_amount),
        loan_purpose: data.loan_purpose,
        loan_purpose_details: data.loan_purpose_details || undefined,
        loan_term_months: parseInt(data.loan_term_months),
        annual_revenue: parseFloat(data.annual_revenue),
        ebitda: parseFloat(data.ebitda),
        existing_debt: parseFloat(data.existing_debt),
        total_assets: parseFloat(data.total_assets),
        current_assets: data.current_assets ? parseFloat(data.current_assets) : undefined,
        current_liabilities: data.current_liabilities ? parseFloat(data.current_liabilities) : undefined,
        interest_expense: data.interest_expense ? parseFloat(data.interest_expense) : undefined,
        annual_debt_service: data.annual_debt_service ? parseFloat(data.annual_debt_service) : undefined,
        ebit: data.ebit ? parseFloat(data.ebit) : undefined,
        collateral_value: data.collateral_value ? parseFloat(data.collateral_value) : undefined,
        bankruptcies_last_7y: data.bankruptcies_last_7y ? parseInt(data.bankruptcies_last_7y) : 0,
        industry_metrics: Object.fromEntries(
          Object.entries(data.industry_metrics)
            .filter(([, v]) => v !== '' && v != null)
            .map(([k, v]) => [k, parseFloat(v as string)])
            .filter(([, v]) => !isNaN(v as number))
        ),
      }

      const result = await api.createApplication(payload) as { id: string }
      // Persist application ID locally so the borrower can find it later
      const saved = JSON.parse(localStorage.getItem('loan_application_ids') ?? '[]') as string[]
      localStorage.setItem('loan_application_ids', JSON.stringify([...saved, result.id]))
      reset()
      router.push(`/apply/confirmation?id=${result.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-1">Review &amp; Submit</h2>
      <p className="text-slate-600 mb-6">Confirm your information before submitting.</p>

      <div className="space-y-3">
        <Section title="Business Profile" step={1}>
          <Row label="Company" value={data.company_name} />
          <Row label="Industry" value={data.industry} />
          <Row label="Structure" value={data.business_structure} />
          <Row label="Years in Business" value={data.years_in_operation} />
          {data.ein && <Row label="EIN" value={data.ein} />}
        </Section>

        <Section title="Loan Request" step={2}>
          <Row label="Amount" value={data.loan_amount ? formatCurrencyFull(parseFloat(data.loan_amount)) : undefined} />
          <Row label="Purpose" value={data.loan_purpose} />
          <Row label="Term" value={data.loan_term_months ? `${data.loan_term_months} months` : undefined} />
        </Section>

        <Section title="Financial Data" step={3}>
          <Row label="Annual Revenue" value={data.annual_revenue ? formatCurrencyFull(parseFloat(data.annual_revenue)) : undefined} />
          <Row label="EBITDA" value={data.ebitda ? formatCurrencyFull(parseFloat(data.ebitda)) : undefined} />
          <Row label="Existing Debt" value={data.existing_debt ? formatCurrencyFull(parseFloat(data.existing_debt)) : undefined} />
          <Row label="Total Assets" value={data.total_assets ? formatCurrencyFull(parseFloat(data.total_assets)) : undefined} />
          <Row label="Collateral Value" value={data.collateral_value ? formatCurrencyFull(parseFloat(data.collateral_value)) : undefined} />
          <Row label="Annual Debt Service" value={data.annual_debt_service ? formatCurrencyFull(parseFloat(data.annual_debt_service)) : undefined} />
          <Row label="Bankruptcies (7y)" value={data.bankruptcies_last_7y || '0'} />
          {Object.entries(data.industry_metrics).filter(([, v]) => v).map(([k, v]) => (
            <Row key={k} label={k.replace(/_/g, ' ')} value={v} />
          ))}
        </Section>

        <Section title="Documents" step={4}>
          <p className="text-slate-600">Documents staged for upload.</p>
        </Section>
      </div>

      {/* Certification */}
      <label className="flex items-start gap-3 mt-6 cursor-pointer">
        <input
          type="checkbox"
          checked={certified}
          onChange={e => setCertified(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
        />
        <span className="text-sm text-slate-700">
          I certify that all information provided is accurate and complete to the best of my knowledge.
        </span>
      </label>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="secondary" onClick={onBack} size="lg">← Back</Button>
        <Button
          onClick={handleSubmit}
          disabled={!certified}
          loading={loading}
          size="lg"
        >
          Submit Application
        </Button>
      </div>
    </div>
  )
}
