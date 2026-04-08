'use client'
import { useEffect, useState, useCallback } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import type { ApplicationListResponse, ApplicationListItem, ApplicationStatus } from '@/types'
import { formatCurrency, formatRelativeDate, STATUS_LABELS } from '@/lib/utils'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

const STATUSES: ApplicationStatus[] = ['new', 'in_review', 'approved', 'declined', 'funded']

function SortHeader({ label, field, sort, dir, onChange }: {
  label: string; field: string
  sort: string; dir: string
  onChange: (f: string) => void
}) {
  const active = sort === field
  return (
    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
      <button className="flex items-center gap-1 hover:text-slate-900 cursor-pointer" onClick={() => onChange(field)}>
        {label}
        {active ? (dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </th>
  )
}

export default function ApplicationsPage() {
  const [data, setData] = useState<ApplicationListResponse | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('submitted_at')
  const [sortDir, setSortDir] = useState('desc')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page), page_size: '25', sort_by: sortBy, sort_dir: sortDir,
      }
      if (search) params.search = search
      if (status) params.status = status
      const result = await api.listApplications(params)
      setData(result as ApplicationListResponse)
    } finally {
      setLoading(false)
    }
  }, [page, search, status, sortBy, sortDir])

  useEffect(() => { load() }, [load])

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pageSize = 25
  const totalPages = Math.ceil(total / pageSize)

  return (
    <DashboardShell title="Applications">
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search companies..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        {(search || status) && (
          <div className="flex items-center gap-2">
            {search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                Search: {search}
                <button onClick={() => setSearch('')} className="ml-1 hover:text-blue-900 cursor-pointer">×</button>
              </span>
            )}
            {status && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                Status: {STATUS_LABELS[status as ApplicationStatus]}
                <button onClick={() => setStatus('')} className="ml-1 hover:text-blue-900 cursor-pointer">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <SortHeader label="Company" field="company_name" sort={sortBy} dir={sortDir} onChange={handleSort} />
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Industry</th>
                <SortHeader label="Amount" field="loan_amount" sort={sortBy} dir={sortDir} onChange={handleSort} />
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Term</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                <SortHeader label="Submitted" field="submitted_at" sort={sortBy} dir={sortDir} onChange={handleSort} />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">Loading…</td></tr>
              )}
              {!loading && items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-900">{item.company_name}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{item.industry}</td>
                  <td className="px-4 py-3.5 text-sm font-mono text-right text-slate-700">{formatCurrency(item.loan_amount)}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{item.loan_term_months}mo</td>
                  <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{formatRelativeDate(item.submitted_at)}</td>
                  <td className="px-4 py-3.5">
                    <Link href={`/dashboard/applications/${item.id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">No applications found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
        <span>Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total} applications</span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
            ← Prev
          </Button>
          <span className="px-3">{page} / {totalPages || 1}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
            Next →
          </Button>
        </div>
      </div>
    </DashboardShell>
  )
}
