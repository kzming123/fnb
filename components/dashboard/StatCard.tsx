import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Accent palette ───────────────────────────────────────────────────────────

const accents = {
  indigo: {
    ring:       'ring-indigo-100',
    icon:       'bg-indigo-50 text-indigo-600',
    value:      'text-indigo-700',
    trendUp:    'bg-emerald-50 text-emerald-700',
    trendDown:  'bg-red-50 text-red-700',
    trendFlat:  'bg-gray-50 text-gray-500',
  },
  emerald: {
    ring:       'ring-emerald-100',
    icon:       'bg-emerald-50 text-emerald-600',
    value:      'text-emerald-700',
    trendUp:    'bg-emerald-50 text-emerald-700',
    trendDown:  'bg-red-50 text-red-700',
    trendFlat:  'bg-gray-50 text-gray-500',
  },
  amber: {
    ring:       'ring-amber-100',
    icon:       'bg-amber-50 text-amber-600',
    value:      'text-amber-700',
    trendUp:    'bg-red-50 text-red-700',    // cost going up = bad
    trendDown:  'bg-emerald-50 text-emerald-700',
    trendFlat:  'bg-gray-50 text-gray-500',
  },
  red: {
    ring:       'ring-red-100',
    icon:       'bg-red-50 text-red-600',
    value:      'text-red-700',
    trendUp:    'bg-red-50 text-red-700',
    trendDown:  'bg-emerald-50 text-emerald-700',
    trendFlat:  'bg-gray-50 text-gray-500',
  },
  purple: {
    ring:       'ring-purple-100',
    icon:       'bg-purple-50 text-purple-600',
    value:      'text-purple-700',
    trendUp:    'bg-red-50 text-red-700',
    trendDown:  'bg-emerald-50 text-emerald-700',
    trendFlat:  'bg-gray-50 text-gray-500',
  },
  slate: {
    ring:       'ring-slate-100',
    icon:       'bg-slate-100 text-slate-600',
    value:      'text-slate-700',
    trendUp:    'bg-red-50 text-red-700',
    trendDown:  'bg-emerald-50 text-emerald-700',
    trendFlat:  'bg-gray-50 text-gray-500',
  },
} as const

export type StatAccent = keyof typeof accents

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  /** positive = up, negative = down */
  trend?: number
  trendLabel?: string
  /** true means up-trend is bad (e.g. expenses, food cost) */
  invertTrend?: boolean
  accent?: StatAccent
  icon: React.ReactNode
  badge?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  invertTrend = false,
  accent = 'indigo',
  icon,
  badge,
}: StatCardProps) {
  const palette = accents[accent]

  const trendUp   = typeof trend === 'number' && trend > 0
  const trendDown = typeof trend === 'number' && trend < 0
  const trendFlat = typeof trend === 'number' && trend === 0

  // Which colour class to use for the trend chip
  const trendClass = trendUp
    ? invertTrend ? palette.trendDown : palette.trendUp
    : trendDown
    ? invertTrend ? palette.trendUp : palette.trendDown
    : palette.trendFlat

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 shadow-card transition-shadow hover:shadow-card-hover',
        palette.ring
      )}
    >
      {/* Icon + badge row */}
      <div className="flex items-start justify-between">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-sm', palette.icon)}>
          {icon}
        </div>
        {badge && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            {badge}
          </span>
        )}
      </div>

      {/* Value block */}
      <div>
        <p className="text-xs font-medium text-gray-500 leading-none">{title}</p>
        <p className={cn('mt-1.5 text-xl font-bold tracking-tight tabular-nums leading-none', palette.value)}>
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-[11px] text-gray-400 leading-none">{subtitle}</p>
        )}
      </div>

      {/* Trend chip */}
      {typeof trend !== 'undefined' && (
        <div className="flex items-center gap-1.5">
          <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold', trendClass)}>
            {trendUp && <TrendingUp size={10} />}
            {trendDown && <TrendingDown size={10} />}
            {trendFlat && <Minus size={10} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
          {trendLabel && (
            <span className="text-[11px] text-gray-400">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
