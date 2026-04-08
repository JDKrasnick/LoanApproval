'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import type { Application } from '@/types'
import { formatCurrency, formatRelativeDate } from '@/lib/utils'
import { FileText, Plus, RefreshCw } from 'lucide-react'

type LoadedApp = Application & { error?: boolean }

export default function MyApplicationsPage() {
  const [apps, setApps] = useState<LoadedApp[]>([])
  const [loading, setLoading] = useState(true)

  const loadApplications = async () => {
    setLoading(true)
    const ids = JSON.parse(
      typeof window !== 'undefined' ? (localStorage.getItem('loan_application_ids') ?? '[]') : '[]'
    ) as string[]

    if (ids.length === 0) {
      setApps([])
      setLoading(false)
      return
    }

    const results = await Promise.allSettled(
      ids.map(id => api.getApplication(id) as Promise<Application>)
    )

    setApps(
      results.map((r, i) =>
        r.status === 'fulfilled'
          ? r.value
          : ({ id: ids[i], status: 'new', error: true } as LoadedApp)
      )
    )
    setLoading(false)
  }

  useEffect(() => {
    loadApplications()
  }, [])

  return (
    <>
      <PublicHeader />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My Applications</h1>
            <p className="text-slate-500 text-sm mt-1">
              Loan applications submitted from this device
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadApplications}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <Link href="/apply/step/1">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                New Application
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="rounded-lg border border-slate-200 bg-white p-5 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-40" />
                    <div className="h-3 bg-slate-100 rounded w-24" />
                  </div>
                  <div className="h-6 bg-slate-200 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm py-20 flex flex-col items-center text-center">
            <FileText className="h-12 w-12 text-slate-300 mb-4" />
            <h2 className="text-lg font-semibold text-slate-700 mb-1">No applications yet</h2>
            <p className="text-slate-500 text-sm mb-6">
              Applications you submit will appear here for easy tracking.
            </p>
            <Link href="/apply/step/1">
              <Button>Start an Application</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map(app => (
              <div
                key={app.id}
                className="rounded-lg border border-slate-200 bg-white shadow-sm p-5 hover:border-slate-300 transition-colors"
              >
                {app.error ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-mono text-slate-500">
                        #{app.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-red-500 mt-0.5">Failed to load</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-slate-900 truncate">
                          {app.borrower?.company_name ?? `Application #${app.id.slice(0, 8).toUpperCase()}`}
                        </p>
                        <StatusBadge status={app.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="font-mono font-medium text-slate-700">
                          {formatCurrency(app.loan_amount)}
                        </span>
                        <span>{app.loan_purpose}</span>
                        <span>{app.loan_term_months}mo</span>
                        <span>Submitted {formatRelativeDate(app.submitted_at)}</span>
                      </div>
                    </div>
                    <Link
                      href={`/apply/status?id=${app.id}`}
                      className="shrink-0 text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                    >
                      View Status →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
