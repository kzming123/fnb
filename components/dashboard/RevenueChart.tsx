'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { mockRevenueChartData } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  const { t } = useLanguage()
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-white px-3 py-2.5 shadow-lg border border-gray-100 text-xs">
      <p className="mb-1.5 font-medium text-gray-600">
        {label ? formatDate(label, 'en-MY', { day: 'numeric', month: 'short' }) : ''}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-semibold text-gray-800">
            {t('rm')} {entry.value.toLocaleString('en-MY', { minimumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart() {
  const { t } = useLanguage()

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card border border-gray-100">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{t('dashboard_revenue_trend')}</h3>
          <p className="text-xs text-gray-400">
            {t('reports_revenue')} vs {t('expenses_title')} — 30 days
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            {t('reports_revenue')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            {t('nav_expenses')}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={mockRevenueChartData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: string) =>
              new Date(val).getDate() % 5 === 1
                ? new Date(val).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
                : ''
            }
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: number) => `${(val / 1000).toFixed(1)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            name={t('reports_revenue')}
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#colorRevenue)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            name={t('nav_expenses')}
            stroke="#f87171"
            strokeWidth={2}
            fill="url(#colorExpenses)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
