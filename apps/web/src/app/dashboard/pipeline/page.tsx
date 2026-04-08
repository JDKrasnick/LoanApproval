'use client'
import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { api } from '@/lib/api'
import type { ApplicationListResponse, ApplicationListItem, ApplicationStatus } from '@/types'
import { formatCurrency, formatRelativeDate, STATUS_LABELS } from '@/lib/utils'
import Link from 'next/link'
import { LayoutGrid, List } from 'lucide-react'

const COLUMNS: { key: ApplicationStatus; label: string }[] = [
  { key: 'new',       label: 'New' },
  { key: 'in_review', label: 'In Review' },
  { key: 'approved',  label: 'Approved' },
  { key: 'funded',    label: 'Funded' },
  { key: 'declined',  label: 'Declined' },
]

const COLUMN_HEADER_COLORS: Record<ApplicationStatus, string> = {
  new:       'border-t-gray-400',
  in_review: 'border-t-amber-400',
  approved:  'border-t-emerald-500',
  funded:    'border-t-violet-500',
  declined:  'border-t-red-500',
}

function DealCard({ item }: { item: ApplicationListItem }) {
  return (
    <Link href={`/dashboard/applications/${item.id}`}>
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-150 mb-2">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-medium text-slate-900 leading-snug">{item.company_name}</p>
          <StatusBadge status={item.status} />
        </div>
        <p className="text-xs text-slate-500 mb-2">{item.industry}</p>
        <p className="text-sm font-mono text-slate-700">
          {formatCurrency(item.loan_amount)} · {item.loan_term_months}mo
        </p>
        <p className="text-xs text-slate-400 mt-1">{formatRelativeDate(item.submitted_at)}</p>
      </div>
    </Link>
  )
}

export default function PipelinePage() {
  const [items, setItems] = useState<ApplicationListItem[]>([])
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.listApplications({ page_size: '100' })
      .then(d => setItems((d as ApplicationListResponse).items))
      .finally(() => setLoading(false))
  }, [])

  const byStatus = COLUMNS.reduce<Record<string, ApplicationListItem[]>>((acc, col) => {
    acc[col.key] = items.filter(i => i.status === col.key)
    return acc
  }, {})

  return (
    <DashboardShell title="Deal Pipeline">
      <div className="flex items-center justify-end mb-4 gap-2">
        <button
          onClick={() => setView('kanban')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors ${view === 'kanban' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <LayoutGrid className="h-4 w-4" /> Kanban
        </button>
        <button
          onClick={() => setView('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors ${view === 'table' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <List className="h-4 w-4" /> Table
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading pipeline…</div>
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
          {COLUMNS.map(col => (
            <div key={col.key} className="flex-none w-64">
              <div className={`rounded-t-lg border-t-4 ${COLUMN_HEADER_COLORS[col.key]} bg-slate-50 border border-b-0 border-slate-200 px-3 py-2 flex items-center justify-between`}>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{col.label}</span>
                <span className="text-xs bg-white rounded-full px-2 py-0.5 text-slate-500 border border-slate-200">
                  {byStatus[col.key]?.length ?? 0}
                </span>
              </div>
              <div className="rounded-b-lg border border-t-0 border-slate-200 bg-slate-50 p-2 min-h-40">
                {byStatus[col.key]?.map(item => <DealCard key={item.id} item={item} />)}
                {byStatus[col.key]?.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No deals</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {['Company', 'Industry', 'Amount', 'Status', 'Submitted', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-900">{item.company_name}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{item.industry}</td>
                  <td className="px-4 py-3.5 text-sm font-mono text-slate-700">{formatCurrency(item.loan_amount)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{formatRelativeDate(item.submitted_at)}</td>
                  <td className="px-4 py-3.5">
                    <Link href={`/dashboard/applications/${item.id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  )
}
