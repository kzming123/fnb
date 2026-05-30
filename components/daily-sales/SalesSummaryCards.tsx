'use client'

import { TrendingUp, Calendar, BarChart2, Coins } from 'lucide-react'
import { salesStats } from '@/lib/mock-data/sales'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

interface CardProps {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  label: string
  value: string
  sub?: string
  trendPct?: number
  trendLabel?: string
}

function SummaryCard({ icon, iconBg, iconColor, label, value, sub, trendPct, trendLabel }: CardProps) {
  const up = typeof trendPct === 'number' && trendPct > 0
  const down = typeof trendPct === 'number' && trendPct < 0

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-gray-100 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', iconBg, iconColor)}>
          {icon}
        </div>
        {typeof trendPct === 'number' && (
          <span className={cn(
            'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
            up   ? 'bg-emerald-50 text-emerald-700' :
            down ? 'bg-red-50 text-red-700' :
                   'bg-gray-50 text-gray-500'
          )}>
            {up ? '↑' : down ? '↓' : '–'} {Math.abs(trendPct).toFixed(1)}%
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-xl font-bold tracking-tight tabular-nums text-gray-900">{value}</p>
        {sub && <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>}
      </div>

      {trendLabel && (
        <p className="text-[11px] text-gray-400">{trendLabel}</p>
      )}
    </div>
  )
}

export function SalesSummaryCards() {
  const { t } = useLanguage()
  const s = salesStats

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SummaryCard
        icon={<TrendingUp size={17} />}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
        label={t('sales_today_label')}
        value={formatCurrency(s.todaySales)}
        trendPct={s.todayDelta}
        trendLabel={t('dashboard_vs_yesterday')}
      />
      <SummaryCard
        icon={<Calendar size={17} />}
        iconBg="bg-sky-50"
        iconColor="text-sky-600"
        label={t('sales_week_label')}
        value={formatCurrency(s.weekSales)}
        trendPct={s.weekDelta}
        trendLabel={t('dashboard_vs_last_month')}
      />
      <SummaryCard
        icon={<BarChart2 size={17} />}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        label={t('sales_month_label')}
        value={formatCurrency(s.monthSales)}
        trendPct={s.monthDelta}
        trendLabel={t('dashboard_vs_last_month')}
      />
      <SummaryCard
        icon={<Coins size={17} />}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        label={t('sales_avg_daily_label')}
        value={formatCurrency(s.avgDaily)}
        sub={t('per_day')}
      />
    </div>
  )
}
