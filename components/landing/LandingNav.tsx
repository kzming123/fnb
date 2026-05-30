'use client'

import Link from 'next/link'
import { Receipt } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { getLandingCopy } from './copy'
import { DemoButton } from './LandingCta'

export function LandingNav() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100/80 topbar-glass">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Receipt size={16} />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-gray-900">
            F&amp;B Smart Ledger
          </span>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:inline-flex"
          >
            {c.nav.login}
          </Link>
          <DemoButton label={c.nav.demo} size="sm" />
        </div>
      </nav>
    </header>
  )
}
