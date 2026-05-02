export type ApplicationStatus = 'new' | 'in_review' | 'approved' | 'declined' | 'funded'
export type DecisionOutcome = 'approved' | 'declined' | 'manual_review'
export type DocumentType = 'financial_statement' | 'tax_return' | 'bank_statement' | 'ar_aging' | 'collateral'

export interface Borrower {
  id: string
  company_name: string
  dba_name?: string
  industry: string
  business_structure: string
  years_in_operation: number
  ein?: string
  address_street?: string
  address_city?: string
  address_state?: string
  address_zip?: string
  created_at: string
}

export interface Application {
  id: string
  borrower_id: string
  borrower?: Borrower
  loan_amount: number
  loan_purpose: string
  loan_purpose_details?: string
  loan_term_months: number
  annual_revenue: number
  ebitda: number
  existing_debt: number
  total_assets: number
  current_assets?: number
  current_liabilities?: number
  interest_expense?: number
  annual_debt_service?: number
  ebit?: number
  collateral_value?: number
  bankruptcies_last_7y?: number
  industry_metrics?: Record<string, number>
  status: ApplicationStatus
  submitted_at: string
  updated_at: string
}

export interface ApplicationListItem {
  id: string
  borrower_id: string
  company_name: string
  industry: string
  loan_amount: number
  loan_term_months: number
  status: ApplicationStatus
  submitted_at: string
}

export interface ApplicationListResponse {
  items: ApplicationListItem[]
  total: number
  page: number
  page_size: number
}

export type MetricTier = 'approve' | 'human_review' | 'concern' | 'reject'

export interface MetricResult {
  category: 'core' | 'industry'
  rule: string
  key: string
  value: number | null
  tier: number // 2 | 1 | 0 | -1
  tier_label: MetricTier
  score: number
  weight?: number
}

export interface Decision {
  id: string
  application_id: string
  outcome: DecisionOutcome
  rationale: {
    summary: string
    explanation?: string
    model_used?: string
    company_score?: number
    industry_score?: number | null
    final_score?: number
    industry_track?: string | null
    loan_bracket?: string
    approve_threshold?: number
    hr_lower_threshold?: number
    hard_stops?: string[]
    caps?: string[]
  }
  score: number | null
  ml_default_probability: number | null
  triggered_rules: MetricResult[]
  decided_at: string
}

export interface Document {
  id: string
  application_id: string
  document_type: DocumentType
  filename: string
  file_size_bytes?: number
  supabase_storage_path?: string
  uploaded_at: string
}

export interface AuditLog {
  id: string
  application_id: string
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}

// Multi-step form state
export interface ApplicationFormData {
  // Step 1 — Business Profile
  company_name: string
  dba_name: string
  industry: string
  years_in_operation: string
  business_structure: string
  ein: string
  address_street: string
  address_city: string
  address_state: string
  address_zip: string
  // Step 2 — Loan Request
  loan_amount: string
  loan_purpose: string
  loan_purpose_details: string
  loan_term_months: string
  // Step 3 — Financials
  annual_revenue: string
  ebitda: string
  existing_debt: string
  total_assets: string
  current_assets: string
  current_liabilities: string
  interest_expense: string
  annual_debt_service: string
  ebit: string
  collateral_value: string
  bankruptcies_last_7y: string
  // Step 3b — Industry-specific metrics (keys depend on industry track)
  industry_metrics: Record<string, string>
}
