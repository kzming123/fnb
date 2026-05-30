'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  ScanLine,
  Receipt,
  Truck,
  FileBarChart2,
  Settings,
  X,
  ChefHat,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { createClient } from '@/lib/supabase/client'
import { isDemoCookie, clearDemoCookie } from '@/lib/supabase/useCurrentBusiness'
import { can, ROLE_LABELS, type UserRole } from '@/lib/auth/permissions'
import type { TranslationKey } from '@/lib/i18n/translations'

// ─── Nav config ──────────────────────────────────────────────────────────────

type NavItem = {
  href:       string
  icon:       React.ElementType
  labelKey:   TranslationKey
  /** Only render when the user has this permission. undefined = always show. */
  permission?: Parameters<typeof can>[1]
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',       icon: LayoutDashboard, labelKey: 'nav_dashboard' },
  { href: '/daily-sales',     icon: TrendingUp,      labelKey: 'nav_daily_sales' },
  { href: '/invoice-scanner', icon: ScanLine,        labelKey: 'nav_invoice_scanner', permission: 'scan_invoices' },
  { href: '/expenses',        icon: Receipt,         labelKey: 'nav_expenses' },
  { href: '/suppliers',       icon: Truck,           labelKey: 'nav_suppliers' },
  { href: '/pnl-report',      icon: FileBarChart2,   labelKey: 'nav_pnl_report',      permission: 'view_pnl' },
]

// ─── Props ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen:       boolean
  onClose:      () => void
  businessName?: string
  userRole?:    UserRole
}

// ─── Nav item ────────────────────────────────────────────────────────────────

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
          'transition-all duration-150',
          isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-white/60" />
        )}

        <Icon
          size={17}
          className={cn(
            'shrink-0 transition-colors',
            isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
          )}
        />

        <span className="flex-1 truncate">{label}</span>

        {isActive && (
          <ChevronRight size={13} className="shrink-0 text-white/60" />
        )}
      </Link>
    </li>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar({ isOpen, onClose, businessName = 'My F&B Business', userRole = 'owner' }: SidebarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const { t, isZh } = useLanguage()

  // Filter nav items based on the user's role
  const navItems = ALL_NAV_ITEMS.filter(item =>
    !item.permission || can(userRole, item.permission)
  )
  // Settings is shown only to owners
  const showSettings = can(userRole, 'access_settings')

  const [userEmail, setUserEmail] = useState('')
  const [isDemo,    setIsDemo]    = useState(false)

  useEffect(() => {
    setIsDemo(isDemoCookie())
    if (!isDemoCookie()) {
      createClient().auth.getUser().then(({ data }) => {
        if (data.user?.email) setUserEmail(data.user.email)
      })
    }
  }, [])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function handleExitDemo() {
    clearDemoCookie()
    router.push('/login')
    router.refresh()
  }

  const avatarInitial = (businessName || 'F').charAt(0).toUpperCase()

  return (
    <>
      {/* ── Mobile backdrop ───────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-20 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Sidebar panel ─────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col',
          'bg-slate-900',
          'transition-transform duration-300 ease-in-out will-change-transform',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ── Brand ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-[18px]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-900/40">
            <ChefHat size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-none">F&B Smart</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-400 leading-none">Ledger</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label={t('close_menu')}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            {t('nav_menu')}
          </p>

          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={t(item.labelKey)}
                isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                onClick={onClose}
              />
            ))}
          </ul>

          {showSettings && (
            <>
              <div className="my-4 border-t border-slate-800" />
              <ul>
                <NavItem
                  href="/settings"
                  icon={Settings}
                  label={t('nav_settings')}
                  isActive={pathname === '/settings'}
                  onClick={onClose}
                />
              </ul>
            </>
          )}
        </nav>

        {/* ── User / business card ──────────────────────────────────────── */}
        <div className="border-t border-slate-800 p-3">
          {isDemo ? (
            /* Demo mode: show amber badge + Exit Demo button */
            <div className="flex flex-col gap-2 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                <p className="text-xs font-semibold text-amber-400 truncate">{businessName}</p>
              </div>
              <p className="text-[11px] text-slate-500">
                {isZh ? '演示模式 · 数据仅供展示' : 'Demo Mode · Sample data only'}
              </p>
              <button
                onClick={handleExitDemo}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200"
              >
                <LogOut size={11} />
                {isZh ? '退出演示' : 'Exit Demo'}
              </button>
            </div>
          ) : (
            /* Real user: avatar + email + logout */
            <div className="flex items-center gap-3 rounded-xl px-3 py-3">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-xs font-bold text-white shadow">
                {avatarInitial}
                <span className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-white leading-none">
                  {businessName}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500 leading-none">
                  {userEmail || '…'}
                </p>
                <span className="mt-1 inline-block rounded-sm bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                  {isZh ? ROLE_LABELS[userRole].zh : ROLE_LABELS[userRole].en}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-700 hover:text-slate-300"
                title={t('nav_logout')}
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
