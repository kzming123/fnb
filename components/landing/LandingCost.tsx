'use client'

import { TrendingDown, AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLandingCopy } from './copy'

/** Dark "cost of inaction" band — the agitation peak of the funnel. */
export function CostSection() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)
  return (
    <section className="bg-slate-950">
      <div className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-400">
            <TrendingDown size={14} /> {c.cost.eyebrow}
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            {c.cost.title}
          </h2>

          <ul className="mt-8 space-y-3">
            {c.cost.points.map((p, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-400" />
                <span className="text-[15px] leading-relaxed text-slate-200">{p}</span>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-xl font-bold text-white sm:text-2xl">
            <span className="bg-gradient-to-r from-rose-400 to-amber-300 bg-clip-text text-transparent">{c.cost.kicker}</span>
          </p>
        </div>
      </div>
    </section>
  )
}
