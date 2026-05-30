'use client'

import { Menu, Bell, Store, ChevronDown } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import type { TranslationKey } from '@/lib/i18n/translations'

// ─── Page title map (path → i18n key) ────────────────────────────────────────

const pageTitleKeys: Record<string, TranslationKey> = {
  '/dashboard':       'nav_dashboard',
  '/daily-sales':     'nav_daily_sales',
  '/invoice-scanner': 'nav_invoice_scanner',
  '/expenses':        'nav_expenses',
  '/suppliers':       'nav_suppliers',
  '/pnl-report':     'nav_pnl_report',
  '/settings':        'nav_settings',
}

// ─── Notification badge ───────────────────────────────────────────────────────

function NotificationButton({ label }: { label: string }) {
  return (
    <button
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
      aria-label={label}
    >
      <Bell size={17} />
      {/* Unread dot */}
      <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
      </span>
    </button>
  )
}

// ─── User avatar ──────────────────────────────────────────────────────────────

function UserAvatar({ initial, name }: { initial: string; name: string }) {
  return (
    <button
      className="flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-gray-100"
      aria-label={name}
    >
      {/* Name — hidden on very small screens */}
      <span className="hidden sm:block text-right">
        <span className="block text-xs font-semibold text-gray-800 leading-none">{name}</span>
        <span className="block mt-0.5 text-[10px] text-gray-400 leading-none">Owner</span>
      </span>
      {/* Avatar circle */}
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-[11px] font-bold text-white shadow-sm">
        {initial}
      </div>
    </button>
  )
}

// ─── Business name chip ───────────────────────────────────────────────────────

function BusinessChip({ name }: { name: string }) {
  return (
    <button className="hidden md:flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50">
      <Store size={12} className="shrink-0 text-indigo-500" />
      <span className="max-w-[140px] truncate">{name}</span>
      <ChevronDown size={11} className="shrink-0 text-gray-400" />
    </button>
  )
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

interface TopbarProps {
  onMenuClick: () => void
  businessName?: string
}

export function Topbar({ onMenuClick, businessName = 'My F&B Business' }: TopbarProps) {
  const pathname = usePathname()
  const { t } = useLanguage()

  const titleKey = Object.entries(pageTitleKeys).find(
    ([path]) => pathname === path || pathname.startsWith(path + '/')
  )?.[1]
  const pageTitle = titleKey ? t(titleKey) : ''

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-gray-100 bg-white/95 px-4 backdrop-blur-sm md:px-5">

      {/* ── Left: hamburger + page title ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Hamburger (mobile only) */}
        <button
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 lg:hidden"
          aria-label={t('open_menu')}
        >
          <Menu size={19} />
        </button>

        {/* Vertical divider after hamburger (mobile) */}
        <span className="h-5 w-px bg-gray-200 lg:hidden" />

        {/* Page title */}
        <h1 className="text-sm font-semibold text-gray-900 md:text-[15px]">
          {pageTitle}
        </h1>
      </div>

      {/* ── Right: business chip + lang + bell + avatar ───────────────── */}
      <div className="ml-auto flex items-center gap-2">

        {/* Business name — desktop */}
        <BusinessChip name={businessName} />

        {/* Divider — desktop */}
        <span className="mx-1 hidden h-5 w-px bg-gray-200 md:block" />

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Notification bell */}
        <NotificationButton label={t('notifications')} />

        {/* Divider */}
        <span className="mx-0.5 h-5 w-px bg-gray-200" />

        {/* User avatar */}
        <UserAvatar
          initial="M"
          name={businessName}
        />
      </div>
    </header>
  )
}
