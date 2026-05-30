'use client'

import { Check, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { getLandingCopy } from './copy'
import { DemoButton, contactHref } from './LandingCta'

export function PricingSection() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)

  return (
    <section id="pricing" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">{isZh ? '价格' : 'Pricing'}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{c.pricing.title}</h2>
          <p className="mt-3 text-base leading-relaxed text-gray-500">{c.pricing.sub}</p>
        </div>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
          {c.pricing.tiers.map((tier, i) => {
            const popular = i === 1
            return (
              <div
                key={i}
                className={cn(
                  'relative flex flex-col rounded-3xl bg-white p-6 sm:p-7',
                  popular
                    ? 'border-2 border-indigo-500 shadow-card-hover lg:-mt-3 lg:mb-3'
                    : 'border border-gray-100 shadow-card',
                )}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
                    <Sparkles size={12} /> {c.pricing.popular}
                  </span>
                )}

                <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{tier.tagline}</p>

                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-bold tracking-tight tabular-nums text-gray-900">{tier.price}</span>
                  <span className="mb-1 text-sm text-gray-400">{c.pricing.perMonth}</span>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full', popular ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500')}>
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <span className="text-[13px] leading-relaxed text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  {popular ? (
                    <DemoButton label={tier.cta} tone="primary" size="md" className="w-full" />
                  ) : (
                    <a
                      href={contactHref(`F&B Smart Ledger — ${tier.name} enquiry`)}
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-150 hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98]"
                    >
                      {tier.cta}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-gray-400">{c.pricing.note}</p>
      </div>
    </section>
  )
}
