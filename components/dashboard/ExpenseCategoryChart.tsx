'use client'

import {
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  Cell, ResponsiveContainer,
} from 'recharts'
import { expenseCategoryData, totalCostBase } from '@/lib/mock-data/dashboard'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatCurrency } from '@/lib/utils'

// ─── Real data item type ──────────────────────────────────────────────────────

export interface ExpenseCategoryItem {
  name:    string
  nameZh:  string
  amount:  number
  color:   string
  pct:     number
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ExpenseCategoryChartProps {
  /** Real category breakdown. Falls back to mock when undefined / empty. */
  data?:  ExpenseCategoryItem[]
  total?: number
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, grandTotal }: {
  active?:    boolean
  payload?:   Array<{ payload: ExpenseCategoryItem; value: number }>
  grandTotal: number
}) {
  const { isZh } = useLanguage()
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-lg text-xs">
      <p className="mb-1 font-semibold text-gray-700">
        {isZh ? d.nameZh : d.name}
      </p>
      <p className="text-gray-800 font-bold">{formatCurrency(d.amount)}</p>
      <p className="text-gray-400">
        {grandTotal > 0 ? ((d.amount / grandTotal) * 100).toFixed(1) : '0.0'}% of total cost
      </p>
    </div>
  )
}

// ─── Chart ───────────────────────────────────────────────────────────────────

export function ExpenseCategoryChart({ data: realData, total: realTotal }: ExpenseCategoryChartProps) {
  const { t, isZh } = useLanguage()

  // `undefined`  → demo mode  → render the mock chart (looks great in demos)
  // `[]`         → real user, no expenses yet → show empty prompt
  // `[...items]` → real data → render real chart
  const useMock    = realData === undefined
  const isEmpty    = !useMock && (!realData || realData.length === 0)
  const items      = useMock ? expenseCategoryData as ExpenseCategoryItem[] : (realData ?? [])
  const grandTotal = useMock ? totalCostBase : (realTotal ?? items.reduce((s, d) => s + d.amount, 0))

  const data = items.map(d => ({ ...d, label: isZh ? d.nameZh : d.name }))

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-5 ring-1 ring-gray-100 shadow-card">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{t('dashboard_expense_breakdown')}</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          {isEmpty ? '—' : `${t('total')}: ${formatCurrency(grandTotal)}`}
        </p>
      </div>

      {isEmpty && (
        <div className="flex h-[220px] items-center justify-center rounded-xl bg-gray-50 text-center px-4">
          <div>
            <p className="text-sm font-medium text-gray-400">
              {isZh ? '暂无开销数据' : 'No expense data yet'}
            </p>
            <p className="mt-1 text-xs text-gray-300">
              {isZh ? '在「开销记录」页面添加第一笔开销' : 'Add expenses to see the breakdown'}
            </p>
          </div>
        </div>
      )}

      {!isEmpty && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            barSize={12}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={isZh ? 88 : 96}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip grandTotal={grandTotal} />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]} label={{
              position: 'right',
              formatter: (v: number) => grandTotal > 0 ? `${((v / grandTotal) * 100).toFixed(0)}%` : '',
              fontSize: 10,
              fill: '#94a3b8',
            }}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
