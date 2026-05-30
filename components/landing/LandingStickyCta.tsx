'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { getLandingCopy } from './copy'
import { DemoButton } from './LandingCta'

/** Persistent bottom CTA bar on mobile — keeps the offer one tap away. */
export function StickyCta() {
  const { isZh } = useLanguage()
  const c = getLandingCopy(isZh)
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-amber-600">{c.nav.offer}</p>
          <p className="text-sm font-bold text-gray-900">{c.sticky.price}</p>
        </div>
        <DemoButton label={c.sticky.cta} size="md" className="shrink-0" />
      </div>
    </div>
  )
}
