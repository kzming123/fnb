'use client'

import {
  AreaChart, Area,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { salesExpensesData } from '@/lib/mock-data/dashboard'
import { useLanguage } from '@/contexts/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'
import { formatDate } from '@/lib/utils'

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg text-xs">
      <p className="mb-2 font-semibold text-gray-600">
        {label ? formatDate(label, 'en-MY', { day: 'numeric', month: 'short' }) : ''}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-bold text-gray-800">
            RM {entry.value.toLocaleString('en-MY')}
          </span>
        </div>
      ))}
      {payload.length === 2 && (
        <>
          <div className="my-2 border-t border-gray-100" />
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Profit</span>
            <span className={`font-bold ${(payload[0].value - payload[1].value) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              RM {(payload[0].value - payload[1].value).toLocaleString('en-MY')}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function CustomLegend({ t }: { t: (k: TranslationKey) => string }) {
  return (
    <div className="flex items-center justify-end gap-4 text-xs text-gray-500">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
        {t('reports_revenue')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
        {t('nav_expenses')}
      </span>
    </div>
  )
}

// ─── Chart ───────────────────────────────────────────────────────────────────

interface SalesExpensesChartProps {
  /** true = demo mode (render mock data); false = real account (render empty state) */
  isDemo?: boolean
}

export function SalesExpensesChart({ isDemo = false }: SalesExpensesChartProps) {
  const { t, isZh } = useLanguage()

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-5 ring-1 ring-gray-100 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{t('dashboard_sales_vs_expenses')}</h3>
          <p className="mt-0.5 text-xs text-gray-400">{t('dashboard_30_days')}</p>
        </div>
        <CustomLegend t={t} />
      </div>

      {!isDemo && (
        <div className="flex h-[240px] items-center justify-center rounded-xl bg-gray-50 text-center px-4">
          <div>
            <p className="text-sm font-medium text-gray-400">
              {isZh ? '暂无销售数据' : 'No sales data yet'}
            </p>
            <p className="mt-1 text-xs text-gray-300">
              {isZh ? '开始记录每日营业额，图表将自动生成' : 'Start logging daily sales to see the trend'}
            </p>
          </div>
        </div>
      )}

      {isDemo && (
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart
          data={salesExpensesData}
          margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#fb923c" stopOpacity={0.14} />
              <stop offset="95%" stopColor="#fb923c" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: string) => {
              const d = new Date(val)
              return d.getDate() % 7 === 1
                ? d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
                : ''
            }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="revenue"
            name={t('reports_revenue')}
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#gradRevenue)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: '#6366f1' }}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            name={t('nav_expenses')}
            stroke="#fb923c"
            strokeWidth={2}
            fill="url(#gradExpenses)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: '#fb923c' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      )}
    </div>
  )
}
