'use client'

import { Quote } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLandingCopy } from './copy'

/**
 * Social-proof section.
 * NOTE: testimonials in copy.ts are PLACEHOLDERS — swap in real founding-client
 * quotes before launch.
 */
export function ProofSection() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">{c.proof.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{c.proof.title}</h2>
          <p className="mt-3 text-base leading-relaxed text-gray-500">{c.proof.sub}</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {c.proof.testimonials.map((tm, i) => (
            <figure key={i} className="flex flex-col rounded-3xl border border-gray-100 bg-slate-50/60 p-6 shadow-card">
              <Quote size={22} className="text-indigo-300" />
              <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-gray-700">
                “{tm.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {tm.name.slice(0, 1)}
                </span>
                <span>
                  <span className="block text-sm font-bold text-gray-900">{tm.name}</span>
                  <span className="block text-xs text-gray-400">{tm.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
