'use client'
import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { MetricCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { api } from '@/lib/api'
import type { ApplicationListResponse, ApplicationListItem } from '@/types'
import { formatCurrency, formatRelativeDate } from '@/lib/utils'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const MONTHLY_DATA = [
  { month: 'May', amount: 1.2 }, { month: 'Jun', amount: 1.8 }, { month: 'Jul', amount: 2.1 },
  { month: 'Aug', amount: 1.9 }, { month: 'Sep', amount: 2.4 }, { month: 'Oct', amount: 2.8 },
  { month: 'Nov', amount: 3.1 }, { month: 'Dec', amount: 2.9 }, { month: 'Jan', amount: 3.4 },
  { month: 'Feb', amount: 3.8 }, { month: 'Mar', amount: 4.2 }, { month: 'Apr', amount: 4.5 },
]

const PIE_COLORS: Record<string, string> = {
  new: '#6B7280', in_review: '#F59E0B', approved: '#10B981', funded: '#8B5CF6', declined: '#EF4444',
}

export default function DashboardPage() {
  const [data, setData] = useState<ApplicationListResponse | null>(null)

  useEffect(() => {
    api.listApplications({ page_size: '5', sort_by: 'submitted_at', sort_dir: 'desc' })
      .then(d => setData(d as ApplicationListResponse))
      .catch(console.error)
  }, [])

  const items = data?.items ?? []
  const total = data?.total ?? 0

  // Status breakdown for donut
  const statusCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  const totalExposure = items.reduce((sum, i) => sum + i.loan_amount, 0)
  const approvedCount = items.filter(i => i.status === 'approved' || i.status === 'funded').length
  const approvalRate = items.length > 0 ? Math.round((approvedCount / items.length) * 100) : 0
  const avgLoan = items.length > 0 ? totalExposure / items.length : 0

  return (
    <DashboardShell title="Portfolio Overview">
      <p className="text-sm text-slate-500 mb-6">Last updated just now</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Exposure" value={formatCurrency(totalExposure)} delta="+12% vs last month" deltaPositive />
        <MetricCard label="Active Deals" value={String(total)} delta="+3 this week" deltaPositive />
        <MetricCard label="Approval Rate" value={`${approvalRate}%`} delta="-2pp MoM" deltaPositive={false} />
        <MetricCard label="Avg. Loan Size" value={formatCurrency(avgLoan)} delta="+8% MoM" deltaPositive />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="col-span-2 rounded-lg border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Monthly Originations ($M)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`$${v}M`, 'Originations']} />
              <Area type="monotone" dataKey="amount" stroke="#1D4ED8" fill="url(#grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Status Breakdown</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] ?? '#94A3B8'} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={v => v.replace('_', ' ')} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Recent Applications</h2>
          <Link href="/dashboard/applications" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {['Company', 'Amount', 'Status', 'Submitted', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-900">{item.company_name}</td>
                  <td className="px-4 py-3.5 text-sm font-mono text-slate-700">{formatCurrency(item.loan_amount)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{formatRelativeDate(item.submitted_at)}</td>
                  <td className="px-4 py-3.5">
                    <Link href={`/dashboard/applications/${item.id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    No applications yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  )
}
