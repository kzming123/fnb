import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string
  trend?: number       // positive = up, negative = down, undefined = neutral
  trendLabel?: string
  subtitle?: string
  accent?: 'indigo' | 'emerald' | 'amber' | 'red'
  icon?: React.ReactNode
}

const accentMap = {
  indigo: {
    value: 'text-indigo-600',
    icon: 'bg-indigo-50 text-indigo-600',
  },
  emerald: {
    value: 'text-emerald-600',
    icon: 'bg-emerald-50 text-emerald-600',
  },
  amber: {
    value: 'text-amber-600',
    icon: 'bg-amber-50 text-amber-600',
  },
  red: {
    value: 'text-red-600',
    icon: 'bg-red-50 text-red-600',
  },
}

export function StatsCard({
  title,
  value,
  trend,
  trendLabel,
  subtitle,
  accent = 'indigo',
  icon,
}: StatsCardProps) {
  const colors = accentMap[accent]

  const trendPositive = typeof trend === 'number' && trend > 0
  const trendNegative = typeof trend === 'number' && trend < 0

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card border border-gray-100">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && (
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-sm', colors.icon)}>
            {icon}
          </div>
        )}
      </div>

      <p className={cn('mt-3 text-2xl font-bold tracking-tight', colors.value)}>{value}</p>

      {subtitle && (
        <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
      )}

      {typeof trend !== 'undefined' && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
              trendPositive && 'bg-emerald-50 text-emerald-700',
              trendNegative && 'bg-red-50 text-red-700',
              !trendPositive && !trendNegative && 'bg-gray-50 text-gray-500'
            )}
          >
            {trendPositive && <TrendingUp size={11} />}
            {trendNegative && <TrendingDown size={11} />}
            {!trendPositive && !trendNegative && <Minus size={11} />}
            {Math.abs(trend)}%
          </span>
          {trendLabel && (
            <span className="text-xs text-gray-400">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
