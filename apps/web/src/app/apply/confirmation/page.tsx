import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  searchParams: { id?: string }
}

export default function ConfirmationPage({ searchParams }: Props) {
  const id = searchParams.id ?? ''
  const displayId = id ? `#${id.slice(0, 8).toUpperCase()}` : '#LA-2026-00001'

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20 px-4">
      <div className="max-w-md w-full text-center rounded-lg border border-slate-200 bg-white shadow-sm p-10">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Application Submitted</h1>
        <p className="mt-2 font-mono text-slate-500 text-sm">Application ID: {displayId}</p>
        <p className="mt-4 text-slate-600 text-base">
          We'll review your application and respond within 1–2 business days.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href={`/apply/status?id=${id}`}>
            <Button size="lg" className="w-full">Track Your Application →</Button>
          </Link>
          <Link href="/apply/applications">
            <Button variant="secondary" size="lg" className="w-full">View All My Applications</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="lg" className="w-full">Return to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
