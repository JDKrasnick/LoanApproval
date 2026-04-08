'use client'
import { useApplicationForm } from '../ApplicationFormContext'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { INDUSTRIES, BUSINESS_STRUCTURES } from '@/lib/utils'

interface Props { onNext: () => void; onBack: () => void; step: number }

export function Step1BusinessProfile({ onNext }: Props) {
  const { data, update } = useApplicationForm()

  const valid = !!(data.company_name && data.industry && data.business_structure && data.years_in_operation)

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-1">Business Profile</h2>
      <p className="text-slate-600 mb-6">Tell us about your company.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Input
            label="Company Legal Name"
            required
            value={data.company_name}
            onChange={e => update({ company_name: e.target.value })}
            placeholder="Acme Corp Inc."
          />
        </div>
        <Input
          label="DBA / Trade Name"
          value={data.dba_name}
          onChange={e => update({ dba_name: e.target.value })}
          placeholder="Acme"
          helper="Optional"
        />
        <Select
          label="Industry"
          required
          value={data.industry}
          onChange={e => update({ industry: e.target.value })}
          placeholder="Select industry"
          options={INDUSTRIES.map(i => ({ value: i, label: i }))}
        />
        <Input
          label="Years in Business"
          required
          type="number"
          min={1}
          value={data.years_in_operation}
          onChange={e => update({ years_in_operation: e.target.value })}
          placeholder="5"
        />
        <Select
          label="Legal Structure"
          required
          value={data.business_structure}
          onChange={e => update({ business_structure: e.target.value })}
          placeholder="Select structure"
          options={BUSINESS_STRUCTURES.map(s => ({ value: s, label: s }))}
        />
        <Input
          label="EIN"
          value={data.ein}
          onChange={e => update({ ein: e.target.value })}
          placeholder="12-3456789"
          helper="Federal Employer Identification Number"
        />
        <div className="md:col-span-2">
          <Input
            label="Business Address"
            value={data.address_street}
            onChange={e => update({ address_street: e.target.value })}
            placeholder="123 Main St"
          />
        </div>
        <Input
          label="City"
          value={data.address_city}
          onChange={e => update({ address_city: e.target.value })}
          placeholder="New York"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="State"
            value={data.address_state}
            onChange={e => update({ address_state: e.target.value.toUpperCase().slice(0, 2) })}
            placeholder="NY"
            maxLength={2}
          />
          <Input
            label="ZIP"
            value={data.address_zip}
            onChange={e => update({ address_zip: e.target.value })}
            placeholder="10001"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={onNext} disabled={!valid} size="lg">
          Continue →
        </Button>
      </div>
    </div>
  )
}
