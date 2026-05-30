'use client'

import Link from 'next/link'
import { Receipt, Info, ArrowUpRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { getLandingCopy } from './copy'
import { DemoButton, contactHref } from './LandingCta'

// ─── Disclaimer band ─────────────────────────────────────────────────────────

export function DisclaimerBand() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-4 pb-4 sm:px-6">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-4">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-[13px] leading-relaxed text-amber-900/80">{c.disclaimer}</p>
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

export function FinalCta() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-6 py-12 text-center shadow-hero ring-1 ring-white/10 sm:px-10 sm:py-16">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold leading-snug text-white sm:text-3xl">{c.final.title}</h2>
            <p className="mt-3 text-base text-slate-300">{c.final.sub}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <DemoButton label={c.hero.ctaDemo} tone="light" size="lg" />
              <a
                href={contactHref('F&B Smart Ledger — founding price enquiry')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-7 text-base font-semibold text-slate-100 transition-all duration-150 hover:bg-white/10 active:scale-[0.98]"
              >
                {c.hero.ctaPrice} <ArrowUpRight size={16} />
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-400">{c.final.micro}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────

export function LandingFooter() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Receipt size={16} />
              </span>
              <span className="text-[15px] font-bold tracking-tight text-gray-900">F&amp;B Smart Ledger</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">{c.footer.tagline}</p>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">{c.footer.login}</Link>
            <a href={contactHref()} className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">{c.footer.contact}</a>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-gray-100 pt-6 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} F&amp;B Smart Ledger. {c.footer.rights}</p>
          <p>{c.footer.mini}</p>
        </div>
      </div>
    </footer>
  )
}
