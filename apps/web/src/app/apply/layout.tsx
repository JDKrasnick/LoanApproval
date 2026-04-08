import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { ApplicationFormProvider } from '@/components/borrower/ApplicationFormContext'
import { SaveExitButton } from '@/components/borrower/SaveExitButton'

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return (
    <ApplicationFormProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Focused header */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center px-6">
          <div className="w-full flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium">
              ← Exit
            </Link>
            <Link href="/" className="flex items-center gap-2 text-blue-700 font-semibold">
              <Building2 className="h-5 w-5" />
              LoanApproval
            </Link>
            <SaveExitButton />
          </div>
        </header>
        {children}
      </div>
    </ApplicationFormProvider>
  )
}
