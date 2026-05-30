import type { Metadata } from 'next'
import { ChefHat } from 'lucide-react'
import { LanguageProvider } from '@/contexts/LanguageContext'

export const metadata: Metadata = {
  title: 'Set up your business | F&B Smart Ledger',
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex flex-col">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="flex items-center gap-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm px-6 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-200">
            <ChefHat size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">F&B Smart Ledger</p>
          </div>
        </header>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <main className="flex-1 flex items-start justify-center px-4 py-8 sm:items-center">
          {children}
        </main>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="text-center text-[11px] text-gray-400 py-3">
          F&B Smart Ledger · &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </LanguageProvider>
  )
}
