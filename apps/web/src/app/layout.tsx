import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LoanApproval — Business Financing, Decided in Minutes',
  description: 'Fast, transparent business loan decisions powered by intelligent credit analysis.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
