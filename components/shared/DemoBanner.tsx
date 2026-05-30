'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export function DemoBanner() {
  const { isZh } = useLanguage()
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100 shrink-0">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      {isZh ? '演示模式' : 'Demo Mode'}
    </span>
  )
}
