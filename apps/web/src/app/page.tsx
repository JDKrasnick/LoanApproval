import Link from 'next/link'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { Button } from '@/components/ui/Button'
import { Shield, Zap, Clock, CheckCircle2, ArrowRight, Building2 } from 'lucide-react'

const LOAN_TYPES = [
  { name: 'Term Loan', range: '$50K – $5M', desc: 'Fixed repayment schedule for major investments and growth.' },
  { name: 'Line of Credit', range: '$25K – $2M', desc: 'Flexible revolving credit for working capital needs.' },
  { name: 'Equipment Finance', range: '$10K – $2M', desc: 'Finance equipment purchases with the asset as collateral.' },
  { name: 'Bridge Loan', range: '$100K – $5M', desc: 'Short-term financing between transactions or fundraises.' },
]

const ELIGIBILITY = [
  'Business operating for 1+ year',
  'Annual revenue of $250K or more',
  'No active bankruptcies',
  'US-based business entity',
  'Business bank account',
]


export default function LandingPage() {
  return (
    <>
      <PublicHeader />

      {/* Hero */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-sm text-blue-600 font-medium">Trusted by 500+ businesses</p>
          <h1 className="mt-3 text-5xl font-bold text-slate-900 max-w-2xl leading-tight">
            Business financing,<br />decided in minutes.
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-xl">
            Automated credit analysis powered by real financial data. Know where you stand — transparently, quickly, without the guesswork.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/apply/step/1">
              <Button size="lg">Check Your Rate <ArrowRight className="h-5 w-5" /></Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="secondary" size="lg">How It Works ↓</Button>
            </a>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-slate-400" /> SOC 2 Certified</span>
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-slate-400" /> 256-bit Encryption</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-slate-400" /> No hard credit pull</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-semibold text-slate-900 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Apply (5 min)', desc: 'Complete our streamlined form with your business profile, loan details, and financial data.', icon: Clock },
              { step: '2', title: 'Instant Decision', desc: 'Our rules engine evaluates your financials against credit policy — no waiting days for a response.', icon: Zap },
              { step: '3', title: 'Funded in 24h', desc: 'Once approved, funds are disbursed directly to your business bank account within one business day.', icon: CheckCircle2 },
            ].map(item => (
              <div key={item.step} className="flex flex-col items-start">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-white font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-base">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loan Types */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-semibold text-slate-900 text-center mb-12">Financing Options</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {LOAN_TYPES.map(lt => (
              <div key={lt.name} className="rounded-lg border border-slate-200 p-6 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-150 cursor-pointer">
                <h3 className="font-semibold text-slate-900 text-lg mb-1">{lt.name}</h3>
                <p className="text-sm font-mono text-blue-600 font-medium mb-3">{lt.range}</p>
                <p className="text-sm text-slate-600">{lt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-semibold text-slate-900 mb-4">Basic Eligibility</h2>
            <p className="text-slate-600 mb-8">Most established businesses qualify. Here's what we look for:</p>
            <ul className="space-y-3 text-left">
              {ELIGIBILITY.map(item => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to grow your business?</h2>
          <p className="text-blue-200 text-lg mb-8">Apply in 5 minutes. No hard credit pull. Decision within the hour.</p>
          <Link href="/apply/step/1">
            <Button variant="secondary" size="lg">Start Your Application</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <Building2 className="h-4 w-4" /> LoanApproval
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-900">Privacy</a>
            <a href="#" className="hover:text-slate-900">Terms</a>
            <a href="#" className="hover:text-slate-900">Contact</a>
          </div>
          <p className="text-xs text-slate-400">LoanApproval is not a bank. Loans subject to credit approval.</p>
        </div>
      </footer>
    </>
  )
}
