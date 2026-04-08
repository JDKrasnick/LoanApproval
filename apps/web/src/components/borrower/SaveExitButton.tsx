'use client'
import { useRouter } from 'next/navigation'
import { useApplicationForm } from './ApplicationFormContext'

export function SaveExitButton() {
  const { saveDraft } = useApplicationForm()
  const router = useRouter()

  const handleClick = () => {
    saveDraft()
    router.push('/')
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
    >
      Save &amp; Exit
    </button>
  )
}
