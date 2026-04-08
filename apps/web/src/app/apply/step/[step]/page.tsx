'use client'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Stepper } from '@/components/borrower/Stepper'
import { Step1BusinessProfile } from '@/components/borrower/steps/Step1BusinessProfile'
import { Step2LoanRequest } from '@/components/borrower/steps/Step2LoanRequest'
import { Step3Financials } from '@/components/borrower/steps/Step3Financials'
import { Step4Documents } from '@/components/borrower/steps/Step4Documents'
import { Step5Review } from '@/components/borrower/steps/Step5Review'

const STEPS = [Step1BusinessProfile, Step2LoanRequest, Step3Financials, Step4Documents, Step5Review]

export default function ApplyStepPage() {
  const params = useParams()
  const router = useRouter()
  const currentStep = parseInt(params.step as string, 10) || 1
  const clampedStep = Math.max(1, Math.min(5, currentStep))

  const StepComponent = STEPS[clampedStep - 1]

  const goNext = () => {
    if (clampedStep < 5) router.push(`/apply/step/${clampedStep + 1}`)
  }
  const goBack = () => {
    if (clampedStep > 1) router.push(`/apply/step/${clampedStep - 1}`)
  }

  return (
    <div className="flex flex-col flex-1">
      <Stepper current={clampedStep} />
      <div className="flex flex-1 gap-6 p-6 max-w-6xl mx-auto w-full">
        {/* Help sidebar */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-6 sticky top-28">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Why we ask this</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your information is used exclusively for credit evaluation. All data is encrypted and stored securely. We never sell your information.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-2">Need help?</p>
              <a href="mailto:support@loanapproval.com" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                support@loanapproval.com
              </a>
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <div className="flex-1">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-8">
            <StepComponent onNext={goNext} onBack={goBack} step={clampedStep} />
          </div>
        </div>
      </div>
    </div>
  )
}
