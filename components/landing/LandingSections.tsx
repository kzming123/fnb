'use client'

import {
  Files, Clock, ShoppingBasket, HelpCircle, Bike, CalendarClock,
  ScanLine, TrendingUp, Truck, FileBarChart2, Download, Languages, PlayCircle,
  Check, Plus, LayoutDashboard,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLandingCopy } from './copy'

// ─── Shared section heading ─────────────────────────────────────────────────────

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{title}</h2>
      <p className="mt-3 text-base leading-relaxed text-gray-500">{sub}</p>
    </div>
  )
}

const PAIN_ICONS: LucideIcon[] = [Files, Clock, ShoppingBasket, Bike, HelpCircle, CalendarClock]
const FEATURE_ICONS: LucideIcon[] = [ScanLine, TrendingUp, ShoppingBasket, Truck, FileBarChart2, Download, Languages, PlayCircle]
const STEP_ICONS: LucideIcon[] = [Plus, ScanLine, LayoutDashboard]

// ─── Agitate (problem) ──────────────────────────────────────────────────────────

export function AgitateSection() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHead eyebrow={c.agitate.eyebrow} title={c.agitate.title} sub={c.agitate.sub} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.agitate.items.map((item, i) => {
            const Icon = PAIN_ICONS[i]
            return (
              <div key={i} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-inset ring-rose-100/70">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-sm font-bold text-gray-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Solution ─────────────────────────────────────────────────────────────────

export function SolutionSection() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHead eyebrow={c.solution.eyebrow} title={c.solution.title} sub={c.solution.sub} />
        <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8">
          <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {c.solution.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="text-sm leading-relaxed text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

// ─── How it works (3 steps) ─────────────────────────────────────────────────────

export function HowSection() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHead eyebrow={c.how.eyebrow} title={c.how.title} sub={c.how.sub} />
        <div className="relative mt-12 grid gap-6 lg:grid-cols-3">
          <div aria-hidden className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent lg:block" />
          {c.how.steps.map((step, i) => {
            const Icon = STEP_ICONS[i]
            return (
              <div key={i} className="relative">
                <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                  <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm ring-4 ring-white">
                    <Icon size={20} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 lg:mt-4">
                    {(isZh ? '步骤 ' : 'Step ') + (i + 1)}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-gray-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Features (benefits) ────────────────────────────────────────────────────────

export function FeaturesSection() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)
  return (
    <section id="features" className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHead eyebrow={c.features.eyebrow} title={c.features.title} sub={c.features.sub} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.features.items.map((item, i) => {
            const Icon = FEATURE_ICONS[i]
            return (
              <div key={i} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100/70 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <Icon size={19} />
                </span>
                <h3 className="mt-4 text-sm font-bold text-gray-900">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
