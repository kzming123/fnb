'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations, type TranslationKey } from '@/lib/i18n/translations'
import type { Language } from '@/types'

interface LanguageContextValue {
  lang: Language
  /** Type-safe translation lookup. Falls back to the key if missing. */
  t: (key: TranslationKey) => string
  setLang: (lang: Language) => void
  isZh: boolean
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  t: (key) => key,
  setLang: () => {},
  isZh: false,
})

const STORAGE_KEY = 'fb-ledger-lang'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null
    if (saved === 'en' || saved === 'zh-CN') setLangState(saved)
  }, [])

  const setLang = useCallback((l: Language) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => translations[lang][key],
    [lang]
  )

  return (
    <LanguageContext.Provider value={{ lang, t, setLang, isZh: lang === 'zh-CN' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
