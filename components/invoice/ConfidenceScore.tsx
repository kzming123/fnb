'use client'

import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

function getLevel(score: number) {
  if (score >= 0.9) return 'high'   as const
  if (score >= 0.7) return 'medium' as const
  return 'low' as const
}

const configs = {
  high: {
    icon:       ShieldCheck,
    ring:       'ring-emerald-200',
    bg:         'bg-emerald-50',
    bar:        'bg-emerald-500',
    pct:        'text-emerald-700',
    label:      'text-emerald-600',
    icon_color: 'text-emerald-500',
    descKey:    'invoice_confidence_high' as const,
  },
  medium: {
    icon:       ShieldAlert,
    ring:       'ring-amber-200',
    bg:         'bg-amber-50',
    bar:        'bg-amber-500',
    pct:        'text-amber-700',
    label:      'text-amber-600',
    icon_color: 'text-amber-500',
    descKey:    'invoice_confidence_medium' as const,
  },
  low: {
    icon:       ShieldX,
    ring:       'ring-red-200',
    bg:         'bg-red-50',
    bar:        'bg-red-500',
    pct:        'text-red-700',
    label:      'text-red-600',
    icon_color: 'text-red-500',
    descKey:    'invoice_confidence_low' as const,
  },
}

interface ConfidenceScoreProps {
  score: number       // 0–1
  className?: string
}

export function ConfidenceScore({ score, className }: ConfidenceScoreProps) {
  const { t } = useLanguage()
  const level  = getLevel(score)
  const cfg    = configs[level]
  const Icon   = cfg.icon
  const pct    = Math.round(score * 100)

  return (
    <div className={cn(
      'flex flex-col gap-3 rounded-xl p-4 ring-1',
      cfg.bg, cfg.ring, className
    )}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} className={cfg.icon_color} />
          <span className={cn('text-xs font-bold uppercase tracking-wide', cfg.label)}>
            {t('invoice_confidence')}
          </span>
        </div>
        <span className={cn('text-xl font-bold tabular-nums', cfg.pct)}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/70">
        <div
          className={cn('h-full rounded-full transition-all duration-700', cfg.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Description */}
      <p className={cn('text-xs leading-relaxed', cfg.label)}>
        {t(cfg.descKey)}
      </p>
    </div>
  )
}

// ─── Inline confidence chip (for table cells) ─────────────────────────────────

export function ConfidenceChip({ score }: { score: number }) {
  const level = getLevel(score)
  const pct   = Math.round(score * 100)

  const cls = {
    high:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
    medium: 'bg-amber-50   text-amber-700   ring-amber-200',
    low:    'bg-red-50     text-red-700     ring-red-200',
  }[level]

  return (
    <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1', cls)}>
      {pct}%
    </span>
  )
}
