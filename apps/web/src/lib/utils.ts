import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString()}`
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function formatRatio(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value.toFixed(2)}x`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  in_review: 'In Review',
  approved: 'Approved',
  declined: 'Declined',
  funded: 'Funded',
}

export const STATUS_CLASSES: Record<string, string> = {
  new:       'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  in_review: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  approved:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  funded:    'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  declined:  'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
}

export const STATUS_DOT_CLASSES: Record<string, string> = {
  new:       'bg-gray-400',
  in_review: 'bg-amber-400',
  approved:  'bg-emerald-500',
  funded:    'bg-violet-500',
  declined:  'bg-red-500',
}

export const INDUSTRIES = [
  'SaaS', 'Technology', 'Software', 'Healthcare', 'Financial Services',
  'Professional Services', 'Manufacturing', 'Retail', 'Real Estate',
  'Construction', 'Restaurants', 'Hospitality', 'Food & Beverage',
  'Entertainment', 'Education', 'Transportation', 'Other',
]

export const LOAN_PURPOSES = [
  'Working Capital', 'Equipment Purchase', 'Real Estate', 'Acquisition', 'Refinancing', 'Other',
]

export const BUSINESS_STRUCTURES = ['LLC', 'C-Corp', 'S-Corp', 'Sole Proprietorship', 'Partnership']

export const LOAN_TERMS = [12, 24, 36, 48, 60]

// Maps selected industry → spec track. Must match backend INDUSTRY_TRACK.
export function industryTrack(industry: string): 'hospitality' | 'tech' | 'retail' | 'healthcare' | 'industrials' | null {
  const k = industry.toLowerCase().trim()
  if (['saas', 'technology', 'software'].includes(k)) return 'tech'
  if (k === 'healthcare') return 'healthcare'
  if (k === 'retail') return 'retail'
  if (['hospitality', 'restaurants', 'food & beverage', 'entertainment'].includes(k)) return 'hospitality'
  if (['manufacturing', 'construction', 'real estate', 'transportation'].includes(k)) return 'industrials'
  return null
}

export const INDUSTRY_METRIC_SPECS: Record<string, { key: string; label: string; helper: string; suffix?: string }[]> = {
  hospitality: [
    { key: 'revpar', label: 'RevPAR', helper: 'Total room revenue / available rooms', suffix: '$' },
    { key: 'gop_per_room', label: 'Gross Operating Profit / Room', helper: 'GOP per available room', suffix: '$' },
    { key: 'occupancy_rate', label: 'Occupancy Rate', helper: 'Rooms sold / rooms available', suffix: '%' },
    { key: 'cap_rate', label: 'Cap Rate', helper: 'NOI / property value', suffix: '%' },
    { key: 'current_ratio', label: 'Current Ratio', helper: 'Current assets / current liabilities' },
  ],
  tech: [
    { key: 'revenue_growth_yoy', label: 'Revenue Growth YoY', helper: 'Year-over-year revenue growth', suffix: '%' },
    { key: 'gross_margin', label: 'Gross Margin', helper: '(Revenue − COGS) / Revenue', suffix: '%' },
    { key: 'customer_concentration', label: 'Customer Concentration', helper: 'Top customer share of revenue', suffix: '%' },
    { key: 'burn_coverage_months', label: 'Monthly Burn Coverage', helper: 'Cash / monthly burn (months)' },
    { key: 'nrr', label: 'Net Revenue Retention', helper: 'NRR %', suffix: '%' },
  ],
  retail: [
    { key: 'sales_per_sqft', label: 'Sales per Sq Ft', helper: 'Annual sales / retail sq ft', suffix: '$' },
    { key: 'gmroi', label: 'GMROI', helper: 'Gross margin return on inventory investment' },
    { key: 'inventory_turnover', label: 'Inventory Turnover', helper: 'Turns per year' },
    { key: 'gross_margin', label: 'Gross Margin', helper: '(Revenue − COGS) / Revenue', suffix: '%' },
    { key: 'same_store_sales_yoy', label: 'Same-Store Sales Growth YoY', suffix: '%', helper: 'Comparable store sales change' },
  ],
  healthcare: [
    { key: 'operating_margin', label: 'Operating Margin', helper: 'Operating income / revenue', suffix: '%' },
    { key: 'days_cash_on_hand', label: 'Days Cash on Hand', helper: 'Cash / daily operating expense' },
    { key: 'days_in_ar', label: 'Days in Accounts Receivable', helper: 'AR / avg daily revenue' },
    { key: 'payer_mix_gov', label: 'Payer Mix — Medicare/Medicaid', helper: 'Share of revenue from gov payers', suffix: '%' },
    { key: 'collection_rate', label: 'Collection Rate', helper: 'Collected / billed', suffix: '%' },
  ],
  industrials: [
    { key: 'asset_turnover', label: 'Asset Turnover', helper: 'Revenue / total assets' },
    { key: 'interest_coverage', label: 'Interest Coverage Ratio', helper: 'EBIT / interest expense' },
    { key: 'gross_margin', label: 'Gross Margin', helper: '(Revenue − COGS) / Revenue', suffix: '%' },
    { key: 'ocf_margin', label: 'Operating Cash Flow Margin', helper: 'OCF / revenue', suffix: '%' },
    { key: 'backlog_to_revenue', label: 'Backlog-to-Revenue Ratio', helper: 'Contracted backlog / annual revenue' },
  ],
}
