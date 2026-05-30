'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { mockFoodCostData } from '@/lib/mock-data'
import { useLanguage } from '@/contexts/LanguageContext'

const total = mockFoodCostData.reduce((s, d) => s + d.amount, 0)

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: { category: string; amount: number; color: string } }>
}) {
  const { t } = useLanguage()
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg bg-white px-3 py-2 shadow-lg border border-gray-100 text-xs">
      <p className="font-semibold text-gray-700">{d.category}</p>
      <p className="text-gray-500">
        {t('rm')} {d.amount.toLocaleString('en-MY')}
        <span className="ml-1 text-gray-400">({((d.amount / total) * 100).toFixed(1)}%)</span>
      </p>
    </div>
  )
}

export function FoodCostDonut() {
  const { t, isZh } = useLanguage()

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card border border-gray-100">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{t('dashboard_food_cost_breakdown')}</h3>
        <p className="text-xs text-gray-400">
          {isZh ? '2026年5月' : 'May 2026'} — {t('rm')} {total.toLocaleString('en-MY')}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <ResponsiveContainer width={130} height={130}>
          <PieChart>
            <Pie
              data={mockFoodCostData}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={58}
              paddingAngle={2}
              dataKey="amount"
            >
              {mockFoodCostData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <ul className="flex-1 space-y-1.5">
          {mockFoodCostData.map((item) => (
            <li key={item.category} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: item.color }}
                />
                {item.category}
              </span>
              <span className="text-xs font-medium text-gray-700">
                {((item.amount / total) * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
