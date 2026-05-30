'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Play } from 'lucide-react'
import { setDemoCookie } from '@/lib/supabase/useCurrentBusiness'
import { cn } from '@/lib/utils'
import { CONTACT_EMAIL } from './copy'

/** mailto link for all "Contact" / "Request Demo" CTAs (no payment wired). */
export function contactHref(subject = 'F&B Smart Ledger — enquiry') {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`
}

type Tone = 'primary' | 'light' | 'ghost'

const TONES: Record<Tone, string> = {
  primary: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700',
  light:   'bg-white text-slate-900 shadow-sm hover:bg-slate-100',
  ghost:   'text-slate-200 hover:text-white hover:bg-white/10',
}

/**
 * "View Demo" — enables demo mode (cookie) and drops the visitor straight into
 * the fully-loaded dashboard. No sign-up, no payment.
 */
export function DemoButton({
  label, tone = 'primary', size = 'md', className,
}: {
  label: string
  tone?: Tone
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function start() {
    setLoading(true)
    setDemoCookie()
    router.push('/dashboard')
  }

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-7 text-base',
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-70',
        sizes[size], TONES[tone], className,
      )}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
      {label}
    </button>
  )
}
