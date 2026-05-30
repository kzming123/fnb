import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Accent palette ───────────────────────────────────────────────────────────
// Accent only tints the icon tile. The big number stays near-black for a calm,
// premium read (Stripe/Linear style) — color is reserved for the icon + trend
// chip so the data itself is unambiguous.

const ICON_TINT = {
  indigo:  'bg-indigo-50  text-indigo-600  ring-indigo-100/70',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100/70',
  amber:   'bg-amber-50   text-amber-600   ring-amber-100/70',
  red:     'bg-red-50     text-red-600     ring-red-100/70',
  purple:  'bg-purple-50  text-purple-600  ring-purple-100/70',
  slate:   'bg-slate-100  text-slate-600   ring-slate-200/70',
} as const

export type StatAccent = keyof typeof ICON_TINT

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  /** positive = up, negative = down */
  trend?: number
  trendLabel?: string
  /** true means an up-trend is bad (e.g. expenses, food cost) */
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
  const trendUp   = typeof trend === 'number' && trend > 0
  const trendDown = typeof trend === 'number' && trend < 0
  const trendFlat = typeof trend === 'number' && trend === 0

  // Single source of truth for trend semantics: an up-trend is "good" (green)
  // unless invertTrend flips it for cost-style metrics. (Previously the per-accent
  // palette ALSO inverted, which double-negated and showed rising costs as green.)
  const isGood = invertTrend ? trendDown : trendUp
  const isBad  = invertTrend ? trendUp   : trendDown
  const trendClass = isGood
    ? 'bg-emerald-50 text-emerald-700'
    : isBad
    ? 'bg-red-50 text-red-700'
    : 'bg-gray-100 text-gray-500'

  return (
    <div className="group relative flex flex-col gap-3.5 rounded-2xl border border-gray-100 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-card-hover sm:p-5">
      {/* Icon tile + optional badge */}
      <div className="flex items-start justify-between">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset', ICON_TINT[accent])}>
          {icon}
        </div>
        {badge && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            {badge}
          </span>
        )}
      </div>

      {/* Value block — the number is the hero */}
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{title}</p>
        <p className="text-[1.7rem] font-bold leading-none tracking-tight tabular-nums text-gray-900">
          {value}
        </p>
        {subtitle && (
          <p className="pt-0.5 text-[11px] leading-snug text-gray-400">{subtitle}</p>
        )}
      </div>

      {/* Trend chip */}
      {typeof trend !== 'undefined' && (
        <div className="flex items-center gap-1.5">
          <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums', trendClass)}>
            {trendUp   && <TrendingUp   size={11} />}
            {trendDown && <TrendingDown size={11} />}
            {trendFlat && <Minus        size={11} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
          {trendLabel && <span className="text-[11px] text-gray-400">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}
