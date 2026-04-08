'use client'
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { ApplicationFormData } from '@/types'

const DRAFT_KEY = 'loan_application_draft'

const EMPTY: ApplicationFormData = {
  company_name: '', dba_name: '', industry: '', years_in_operation: '', business_structure: '',
  ein: '', address_street: '', address_city: '', address_state: '', address_zip: '',
  loan_amount: '', loan_purpose: '', loan_purpose_details: '', loan_term_months: '',
  annual_revenue: '', ebitda: '', existing_debt: '', total_assets: '',
  current_assets: '', current_liabilities: '', interest_expense: '', annual_debt_service: '', ebit: '',
}

interface Ctx {
  data: ApplicationFormData
  update: (partial: Partial<ApplicationFormData>) => void
  reset: () => void
  saveDraft: () => void
}

const FormCtx = createContext<Ctx | null>(null)

export function ApplicationFormProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ApplicationFormData>(() => {
    if (typeof window === 'undefined') return EMPTY
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      return saved ? { ...EMPTY, ...JSON.parse(saved) } : EMPTY
    } catch {
      return EMPTY
    }
  })

  const update = useCallback((partial: Partial<ApplicationFormData>) => {
    setData(prev => ({ ...prev, ...partial }))
  }, [])

  const saveDraft = useCallback(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  }, [data])

  const reset = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    setData(EMPTY)
  }, [])

  // Auto-save draft on every change
  useEffect(() => {
    const hasAnyData = Object.values(data).some(v => v !== '')
    if (hasAnyData) localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  }, [data])

  return <FormCtx.Provider value={{ data, update, reset, saveDraft }}>{children}</FormCtx.Provider>
}

export function useApplicationForm() {
  const ctx = useContext(FormCtx)
  if (!ctx) throw new Error('useApplicationForm must be used inside ApplicationFormProvider')
  return ctx
}
