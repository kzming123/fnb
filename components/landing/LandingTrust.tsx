'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { getLandingCopy } from './copy'

/** Slim "made for Malaysian F&B" proof strip directly under the hero. */
export function TrustStrip() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)
  return (
    <section className="border-y border-gray-100 bg-slate-50/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{c.trust.kicker}</p>
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {c.trust.items.map((item) => (
            <li key={item} className="text-sm font-semibold text-gray-500">{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
