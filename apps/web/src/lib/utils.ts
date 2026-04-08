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
