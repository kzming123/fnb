'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { salesStats } from '@/lib/mock-data/sales'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

const COLORS = {
  cash:    '#10b981', // emerald
  card:    '#3b82f6', // blue
  eWallet: '#a855f7', // purple
}

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: { name: string; value: number; pct: number } }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700">{d.name}</p>
      <p className="text-gray-800 font-bold">{formatCurrency(d.value)}</p>
      <p className="text-gray-400">{d.pct.toFixed(1)}%</p>
    </div>
  )
}

export function PaymentBreakdown() {
  const { t } = useLanguage()
  const s = salesStats
  const total = s.totalCash + s.totalCard + s.totalEWallet

  const data = [
    { name: t('sales_cash_pct'),    value: s.totalCash,    pct: (s.totalCash    / total) * 100, color: COLORS.cash },
    { name: t('sales_card_pct'),    value: s.totalCard,    pct: (s.totalCard    / total) * 100, color: COLORS.card },
    { name: t('sales_ewallet_pct'), value: s.totalEWallet, pct: (s.totalEWallet / total) * 100, color: COLORS.eWallet },
  ]

  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-gray-100 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{t('sales_payment_chart_title')}</h3>
        <p className="mt-0.5 text-xs text-gray-400">{t('sales_payment_chart_sub')} · {formatCurrency(total)}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="shrink-0">
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={50}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend + values */}
        <div className="flex-1 space-y-2.5">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: d.color }}
                />
                <span className="text-xs text-gray-600 truncate">{d.name}</span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-gray-800 tabular-nums">
                  {formatCurrency(d.value)}
                </p>
                <p className="text-[10px] text-gray-400">{d.pct.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
