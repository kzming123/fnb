'use client'

import { ShieldOff } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export function AccessDenied() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white border border-gray-100 shadow-card py-20 text-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
        <ShieldOff size={24} className="text-red-400" />
      </div>
      <div>
        <p className="text-base font-bold text-gray-800">{t('access_denied_title')}</p>
        <p className="mt-1.5 text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
          {t('access_denied_sub')}
        </p>
      </div>
    </div>
  )
}
