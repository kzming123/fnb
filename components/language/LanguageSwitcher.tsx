'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  className?: string
  /** pill = two-button segmented control (default); text = single toggle link */
  variant?: 'pill' | 'text'
}

export function LanguageSwitcher({ className, variant = 'pill' }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useLanguage()

  if (variant === 'text') {
    return (
      <button
        onClick={() => setLang(lang === 'en' ? 'zh-CN' : 'en')}
        className={cn(
          'text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors',
          className
        )}
        aria-label={lang === 'en' ? t('simplified_chinese') : t('english')}
      >
        {lang === 'en' ? t('lang_zh') : t('lang_en')}
      </button>
    )
  }

  return (
    <div
      className={cn('flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5', className)}
      role="group"
      aria-label={t('language')}
    >
      <button
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        title={t('english')}
        className={cn(
          'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
          lang === 'en'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        {t('lang_en')}
      </button>
      <button
        onClick={() => setLang('zh-CN')}
        aria-pressed={lang === 'zh-CN'}
        title={t('simplified_chinese')}
        className={cn(
          'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
          lang === 'zh-CN'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        {t('lang_zh')}
      </button>
    </div>
  )
}
