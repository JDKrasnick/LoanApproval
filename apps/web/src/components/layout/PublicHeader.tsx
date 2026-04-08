'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Building2 } from 'lucide-react'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs h-16 flex items-center px-6">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-blue-700 font-semibold text-lg">
          <Building2 className="h-6 w-6" />
          LoanApproval
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900 font-medium px-3 py-2">
            Sign In
          </Link>
          <Link href="/apply/step/1">
            <Button size="default">Apply Now →</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
