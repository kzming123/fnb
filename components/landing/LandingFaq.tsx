'use client'

import { ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLandingCopy } from './copy'

/** Objection-handling FAQ. Uses native <details> so it works without JS. */
export function FaqSection() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)
  return (
    <section id="faq" className="bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">{c.faq.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{c.faq.title}</h2>
        </div>

        <div className="mt-10 space-y-3">
          {c.faq.items.map((item, i) => (
            <details key={i} className="group rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-card [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-gray-900">
                {item.q}
                <ChevronDown size={18} className="shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-[14px] leading-relaxed text-gray-600">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
