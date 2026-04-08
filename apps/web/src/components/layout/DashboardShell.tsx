'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Building2, LayoutDashboard, GitBranch, FileText, Users,
  Settings, LogOut, Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Overview',     href: '/dashboard',                  icon: LayoutDashboard },
  { label: 'Pipeline',     href: '/dashboard/pipeline',         icon: GitBranch },
  { label: 'Applications', href: '/dashboard/applications',     icon: FileText },
  { label: 'Borrowers',    href: '/dashboard/borrowers',        icon: Users },
]

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const path = usePathname()
  const active = path === href || (href !== '/dashboard' && path.startsWith(href))
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors duration-100 cursor-pointer',
        active
          ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-950 dark:text-blue-300'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}

function Sidebar() {
  const router = useRouter()
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col">
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-blue-700 font-semibold">
          <Building2 className="h-5 w-5" />
          <span>LoanApproval</span>
          <span className="ml-auto text-xs font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 px-1.5 py-0.5 rounded">
            INTERNAL
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-1">
        <button className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md w-full cursor-pointer dark:text-slate-400 dark:hover:bg-slate-800">
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md w-full cursor-pointer dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

function TopBar({ title }: { title?: string }) {
  const path = usePathname()
  const segments = path.split('/').filter(Boolean)
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 gap-4 bg-white dark:bg-slate-900">
      <div className="flex-1">
        {title ? (
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>
        ) : (
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-slate-500">
              {segments.map((seg, i) => (
                <li key={i} className="flex items-center gap-2">
                  {i > 0 && <span>/</span>}
                  <span className={i === segments.length - 1 ? 'text-slate-900 font-medium dark:text-white' : ''}>
                    {seg.charAt(0).toUpperCase() + seg.slice(1)}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
      <button className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Notifications">
        <Bell className="h-5 w-5 text-slate-500" />
      </button>
      <div className="h-8 w-8 rounded-full bg-blue-700 text-white text-sm font-medium flex items-center justify-center">
        J
      </div>
    </header>
  )
}

export function DashboardShell({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="hidden lg:flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} />
        <main id="main-content" className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
