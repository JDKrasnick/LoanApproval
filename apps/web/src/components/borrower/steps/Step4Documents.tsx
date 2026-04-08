'use client'
import { useState } from 'react'
import { useApplicationForm } from '../ApplicationFormContext'
import { Button } from '@/components/ui/Button'
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props { onNext: () => void; onBack: () => void; step: number }

interface UploadSlot {
  key: string
  label: string
  required: boolean
  accept: string
  hint: string
}

const SLOTS: UploadSlot[] = [
  { key: 'financial_statement', label: 'Financial Statements', required: true, accept: '.pdf', hint: 'Last 2 fiscal years — PDF' },
  { key: 'tax_return', label: 'Tax Returns', required: true, accept: '.pdf', hint: 'Last 2 years — PDF' },
  { key: 'bank_statement', label: 'Bank Statements', required: true, accept: '.pdf', hint: 'Last 3 months — PDF' },
  { key: 'ar_aging', label: 'Accounts Receivable Aging', required: false, accept: '.pdf,.xlsx', hint: 'Optional — PDF or XLSX' },
  { key: 'collateral', label: 'Collateral Documentation', required: false, accept: '.pdf,.png,.jpg,.jpeg', hint: 'Optional — PDF or images' },
]

export function Step4Documents({ onNext, onBack }: Props) {
  const [files, setFiles] = useState<Record<string, File[]>>({})
  const [dragOver, setDragOver] = useState<string | null>(null)

  const requiredSlotsUploaded = SLOTS
    .filter(s => s.required)
    .every(s => (files[s.key]?.length ?? 0) > 0)

  const handleFiles = (key: string, newFiles: FileList | null) => {
    if (!newFiles) return
    setFiles(prev => ({ ...prev, [key]: [...(prev[key] ?? []), ...Array.from(newFiles)] }))
  }

  const removeFile = (key: string, idx: number) => {
    setFiles(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }))
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-1">Document Upload</h2>
      <p className="text-slate-600 mb-6">Upload supporting documents for your application. Required files are marked with *.</p>

      <div className="space-y-4">
        {SLOTS.map(slot => (
          <div key={slot.key}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600 mb-2">
              {slot.label}
              {slot.required && <span className="ml-1 text-red-500">*</span>}
            </p>
            {/* Drop zone */}
            <div
              className={cn(
                'rounded-lg border-2 border-dashed transition-colors cursor-pointer p-6 text-center',
                dragOver === slot.key
                  ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/20'
                  : 'border-slate-300 hover:border-blue-400 dark:border-slate-700 dark:hover:border-blue-500',
              )}
              onDragOver={e => { e.preventDefault(); setDragOver(slot.key) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => { e.preventDefault(); setDragOver(null); handleFiles(slot.key, e.dataTransfer.files) }}
              onClick={() => document.getElementById(`file-${slot.key}`)?.click()}
            >
              <Upload className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Drop files here or <span className="text-blue-600 font-medium">browse</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">{slot.hint} · up to 20MB</p>
              <input
                id={`file-${slot.key}`}
                type="file"
                className="sr-only"
                accept={slot.accept}
                multiple
                onChange={e => handleFiles(slot.key, e.target.files)}
              />
            </div>

            {/* File list */}
            {(files[slot.key]?.length ?? 0) > 0 && (
              <ul className="mt-2 space-y-1.5">
                {files[slot.key].map((f, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm bg-slate-50 rounded-md px-3 py-2">
                    <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="flex-1 truncate text-slate-700">{f.name}</span>
                    <span className="text-slate-400 text-xs">{(f.size / 1024).toFixed(0)} KB</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <button
                      onClick={e => { e.stopPropagation(); removeFile(slot.key, idx) }}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="secondary" onClick={onBack} size="lg">← Back</Button>
        <Button onClick={onNext} disabled={!requiredSlotsUploaded} size="lg">Continue →</Button>
      </div>
    </div>
  )
}
