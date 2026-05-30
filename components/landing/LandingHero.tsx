'use client'

import { Sparkles, ScanLine, TrendingUp, ArrowUpRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLandingCopy } from './copy'
import { DemoButton, contactHref } from './LandingCta'

// Faux dashboard bars — purely decorative, height %s only.
const BARS = [38, 52, 45, 64, 58, 76, 92]

export function LandingHero() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)

  return (
    <section className="relative overflow-hidden">
      {/* Atmosphere: dotted texture + soft indigo glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(rgb(99 102 241 / 0.07) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-indigo-300/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        {/* ── Copy ── */}
        <div>
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Sparkles size={13} /> {c.hero.badge}
          </span>

          <h1 className="animate-fade-up mt-5 text-4xl font-bold leading-[1.07] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem]" style={{ animationDelay: '60ms' }}>
            {c.hero.h1a}{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              {c.hero.accent}
            </span>{' '}
            {c.hero.h1b}
          </h1>

          <p className="animate-fade-up mt-5 max-w-xl text-lg leading-relaxed text-gray-600" style={{ animationDelay: '120ms' }}>
            {c.hero.sub}
          </p>
          <p className="animate-fade-up mt-2 max-w-xl text-sm text-gray-400" style={{ animationDelay: '160ms' }}>
            {c.hero.zhNote}
          </p>

          <div className="animate-fade-up mt-7 flex flex-wrap items-center gap-3" style={{ animationDelay: '200ms' }}>
            <DemoButton label={c.hero.ctaDemo} size="lg" />
            <a
              href={contactHref('F&B Smart Ledger — pricing enquiry')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-7 text-base font-semibold text-gray-700 shadow-sm transition-all duration-150 hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98]"
            >
              {c.hero.ctaPrice} <ArrowUpRight size={16} />
            </a>
          </div>

          <p className="animate-fade-up mt-8 text-[11px] font-medium uppercase tracking-wider text-gray-400" style={{ animationDelay: '260ms' }}>
            {c.hero.trust}
          </p>
        </div>

        {/* ── Product preview mock ── */}
        <div className="animate-fade-up relative mx-auto w-full max-w-md lg:mx-0" style={{ animationDelay: '180ms' }}>
          {/* Main dark panel */}
          <div className="relative rotate-1 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 shadow-hero ring-1 ring-white/10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{ backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
            />
            <div className="relative">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{c.hero.preview.net}</p>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-3xl font-bold tabular-nums text-white">RM 13,770</p>
                <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  <TrendingUp size={11} /> 18.4%
                </span>
              </div>

              {/* Faux bar chart */}
              <div className="mt-6 flex h-28 items-end gap-2">
                {BARS.map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-md ${i === BARS.length - 1 ? 'bg-indigo-400' : 'bg-white/15'}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Floating KPI card */}
          <div className="absolute -right-3 -top-5 w-44 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-card-hover sm:-right-6">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">{c.hero.preview.today}</p>
                <p className="text-[13px] font-bold tabular-nums text-gray-900">2,840</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">{c.hero.preview.food}</p>
                <p className="text-[13px] font-bold tabular-nums text-amber-600">35.8%</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">{c.hero.preview.month}</p>
                <p className="text-[13px] font-bold tabular-nums text-gray-900">74.9k</p>
              </div>
            </div>
          </div>

          {/* Floating "invoice scanned" pill */}
          <div className="absolute -bottom-4 -left-3 flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-card-hover sm:-left-6">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <ScanLine size={14} />
            </span>
            <div>
              <p className="text-[10px] font-medium text-gray-400">{c.hero.preview.scanned}</p>
              <p className="text-xs font-bold tabular-nums text-gray-900">RM 1,280.50</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
