'use client'

import {
  ComposedChart, Bar, Line,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { monthlyProfitData } from '@/lib/mock-data/dashboard'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatCurrency } from '@/lib/utils'
import type { TrendPoint } from '@/lib/supabase/queries/pnl'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MonthlyProfitChartProps {
  /** Real trend data from Supabase. Falls back to mock when undefined. */
  data?: TrendPoint[]
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg text-xs">
      <p className="mb-2 font-semibold text-gray-600">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-bold text-gray-800">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMonthLabel(month: string, isZh: boolean): string {
  // month: "YYYY-MM" e.g. "2026-05"
  const [year, mon] = month.split('-').map(Number)
  const d = new Date(year, mon - 1, 1)
  if (isZh) {
    return `${year}年${mon}月`
  }
  return d.toLocaleDateString('en-MY', { month: 'short', year: '2-digit' })
    .replace(' ', ' ')   // "May 26"
}

// ─── Chart ───────────────────────────────────────────────────────────────────

export function MonthlyProfitChart({ data: realData }: MonthlyProfitChartProps) {
  const { t, isZh } = useLanguage()

  // undefined → demo mode → show mock; [] → real user, no data → empty state
  const useMock = realData === undefined
  const isEmpty = !useMock && (!realData || realData.length === 0)

  // Build unified chart rows from either real or mock data
  const data = useMock
    ? monthlyProfitData.map(d => ({
        label:   isZh ? d.monthZh.replace('年', '/').replace('月', '') : d.month,
        revenue: d.revenue,
        profit:  d.profit,
      }))
    : (realData ?? []).map(p => ({
        label:   formatMonthLabel(p.month, isZh),
        revenue: p.revenue,
        profit:  p.profit,
      }))

  const lastIdx = data.length - 1
  const prevProfit  = data.length >= 2 ? data[lastIdx - 1].profit : 0
  const curProfit   = data[lastIdx]?.profit ?? 0
  const profitGrowth = prevProfit > 0
    ? (((curProfit - prevProfit) / prevProfit) * 100).toFixed(1)
    : null

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{t('dashboard_monthly_profit_trend')}</h3>
          <p className="mt-0.5 text-xs text-gray-400">{t('dashboard_6_months')}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-md bg-emerald-500" />
            {t('net_profit')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 bg-indigo-400" />
            {t('reports_revenue')}
          </span>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex h-[240px] items-center justify-center rounded-xl bg-gray-50 text-center px-4">
          <div>
            <p className="text-sm font-medium text-gray-400">
              {isZh ? '暂无销售数据' : 'No sales data yet'}
            </p>
            <p className="mt-1 text-xs text-gray-300">
              {isZh ? '记录每日营业额后，图表将自动更新' : 'Log daily sales to see the profit trend'}
            </p>
          </div>
        </div>
      ) : (
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#10b981" stopOpacity={1} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
            </linearGradient>
            <linearGradient id="profitGradCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6366f1" stopOpacity={1} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.85} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />

          <Bar dataKey="profit" name={t('net_profit')} radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === lastIdx ? 'url(#profitGradCurrent)' : 'url(#profitGrad)'}
              />
            ))}
          </Bar>

          <Line
            type="monotone"
            dataKey="revenue"
            name={t('reports_revenue')}
            stroke="#6366f1"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      )}

      {/* Month-on-month annotation */}
      {!isEmpty && data.length >= 2 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <span className="text-gray-400">{t('dashboard_last_month')}:</span>
          <span className="font-semibold text-emerald-600">
            {formatCurrency(prevProfit)}
          </span>
          <span className="text-gray-300">→</span>
          <span className="font-bold text-indigo-600">
            {formatCurrency(curProfit)}
          </span>
          {profitGrowth !== null && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              parseFloat(profitGrowth) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {parseFloat(profitGrowth) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(profitGrowth)).toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}
