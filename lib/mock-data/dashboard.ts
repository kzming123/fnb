// ─── Dashboard mock data ──────────────────────────────────────────────────────
// All monetary values are numbers for chart computation.
// Format with formatCurrency() at the UI layer.

import type { Language } from '@/types'

// ─── KPI Stats ────────────────────────────────────────────────────────────────

export const dashboardStats = {
  // Today
  todaySales:           2890.00,
  todayExpenses:         435.00,
  todayVsYesterday:       12.3,   // %

  // Month (May 2026)
  monthSales:          75890.00,
  monthSalesGrowth:        8.2,
  monthSalesLastMonth: 70130.00,

  // Food cost
  foodCostPct:            32.0,
  foodCostPctDelta:       -2.1,   // negative = improved
  foodCostAmount:      24285.50,

  // Gross profit
  grossProfit:         51604.50,
  grossMarginPct:         68.0,
  grossProfitGrowth:       5.8,

  // Net profit
  netProfit:           35069.50,
  netMarginPct:           46.2,
  netProfitGrowth:         6.4,

  // Operating expenses
  totalExpenses:       16535.00,
  expensesGrowth:          3.2,

  // Top supplier (YTD)
  topSupplierName:     'Premium Meats Trading',
  topSupplierSpend:    22150.00,
  topSupplierGrowth:       8.0,

  // Platform commissions (GrabFood + foodpanda + ShopeeFood)
  platformCommission:   3795.00,
  platformCommissionPct:   5.0,  // % of revenue
  platformCommissionDelta: 0.3,  // ppt vs last month
} as const

// ─── 30-day Sales vs Expenses ─────────────────────────────────────────────────

function buildSalesExpenses() {
  const base = new Date('2026-05-29')
  const revenues = [
    2340, 1980, 2650, 3100, 2890, 2450, 1760,
    2560, 2230, 2890, 3200, 2750, 2100, 1890,
    2670, 2340, 2980, 3450, 3100, 2560, 2210,
    2780, 2450, 3120, 2890, 2650, 2100, 1980,
    2340, 2890,
  ]
  const expenseRatios = [
    0.52, 0.58, 0.49, 0.44, 0.46, 0.51, 0.60,
    0.48, 0.53, 0.45, 0.43, 0.47, 0.56, 0.61,
    0.48, 0.52, 0.46, 0.41, 0.44, 0.49, 0.55,
    0.47, 0.50, 0.43, 0.46, 0.48, 0.57, 0.59,
    0.52, 0.45,
  ]

  return revenues.map((rev, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() - (revenues.length - 1 - i))
    return {
      date:     d.toISOString().split('T')[0],
      revenue:  rev,
      expenses: Math.round(rev * expenseRatios[i]),
      profit:   Math.round(rev * (1 - expenseRatios[i])),
    }
  })
}

export const salesExpensesData = buildSalesExpenses()

// ─── Expense category breakdown ───────────────────────────────────────────────

export const expenseCategoryData = [
  { name: 'Food Cost (COGS)', nameZh: '食材成本（COGS）', amount: 24286, color: '#6366f1', pct: 59.5 },
  { name: 'Salaries',         nameZh: '薪资',             amount:  9800, color: '#f59e0b', pct: 24.0 },
  { name: 'Rent',             nameZh: '租金',             amount:  4500, color: '#a855f7', pct: 11.0 },
  { name: 'Utilities',        nameZh: '水电费',           amount:  1005, color: '#3b82f6', pct:  2.5 },
  { name: 'Marketing',        nameZh: '营销',             amount:   550, color: '#ec4899', pct:  1.3 },
  { name: 'Others',           nameZh: '其他',             amount:   680, color: '#94a3b8', pct:  1.7 },
]

export const totalCostBase = expenseCategoryData.reduce((s, d) => s + d.amount, 0)

// ─── 6-month profit trend ─────────────────────────────────────────────────────

export const monthlyProfitData = [
  { month: 'Dec 25', monthZh: '2025年12月', revenue: 68200, cogs: 21824, expenses: 16700, profit: 29676 },
  { month: 'Jan 26', monthZh: '2026年1月',  revenue: 71400, cogs: 22848, expenses: 17400, profit: 31152 },
  { month: 'Feb 26', monthZh: '2026年2月',  revenue: 69800, cogs: 22336, expenses: 17660, profit: 29804 },
  { month: 'Mar 26', monthZh: '2026年3月',  revenue: 73200, cogs: 23424, expenses: 16376, profit: 33400 },
  { month: 'Apr 26', monthZh: '2026年4月',  revenue: 72600, cogs: 23232, expenses: 16388, profit: 32980 },
  { month: 'May 26', monthZh: '2026年5月',  revenue: 75890, cogs: 24286, expenses: 16535, profit: 35069 },
]

// ─── Recent transactions ──────────────────────────────────────────────────────

export type TxType = 'sale' | 'invoice' | 'expense'
export type TxStatus = 'completed' | 'confirmed' | 'pending_review'

export interface Transaction {
  id: string
  date: string
  type: TxType
  description: string
  subtext: string
  amount: number    // positive = money in, negative = money out
  status: TxStatus
}

export const recentTransactions: Transaction[] = [
  { id: 'tx-01', date: '2026-05-29', type: 'sale',    description: 'Daily Sales',             subtext: 'Dine-in · Takeaway · GrabFood',       amount:  2890.00, status: 'completed' },
  { id: 'tx-02', date: '2026-05-28', type: 'sale',    description: 'Daily Sales',             subtext: 'Dine-in · Takeaway · ShopeeFood',     amount:  2650.00, status: 'completed' },
  { id: 'tx-03', date: '2026-05-27', type: 'invoice', description: 'Premium Meats Trading',   subtext: 'Invoice PMT-2026-0892 · 8 items',    amount: -1250.00, status: 'confirmed' },
  { id: 'tx-04', date: '2026-05-26', type: 'invoice', description: 'Fresh Produce Sdn Bhd',  subtext: 'Invoice FP-2026-1145 · 15 items',    amount:  -580.50, status: 'confirmed' },
  { id: 'tx-05', date: '2026-05-25', type: 'sale',    description: 'Daily Sales',             subtext: 'Dine-in · Takeaway · foodpanda',      amount:  3100.00, status: 'completed' },
  { id: 'tx-06', date: '2026-05-25', type: 'invoice', description: 'Seafood Direct Marketing',subtext: 'Invoice SDM-2026-0441 · 6 items',    amount:  -980.00, status: 'confirmed' },
  { id: 'tx-07', date: '2026-05-22', type: 'invoice', description: 'Wholesale Dry Goods Hub', subtext: 'Invoice WDG-2026-0234 · 8 items',    amount:  -745.00, status: 'confirmed' },
  { id: 'tx-08', date: '2026-05-20', type: 'invoice', description: 'Beverage & Drinks Co',    subtext: 'Invoice BDC-2026-0567 · 4 items',    amount:  -430.00, status: 'pending_review' },
  { id: 'tx-09', date: '2026-05-18', type: 'expense', description: 'Green Pack Solutions',    subtext: 'Invoice GPS-2026-0189 · Packaging',  amount:  -285.00, status: 'confirmed' },
  { id: 'tx-10', date: '2026-05-10', type: 'expense', description: 'Marketing — Meta Ads',    subtext: 'Raya promotion campaign',            amount:  -350.00, status: 'completed' },
]

// ─── AI Insight ───────────────────────────────────────────────────────────────

export interface AIInsight {
  text: Record<Language, string>
  highlights: Array<{
    labelEn: string
    labelZh: string
    value: string
    status: 'good' | 'warning' | 'neutral'
  }>
  generatedAt: string
}

export const aiInsight: AIInsight = {
  text: {
    en:
      'Your food cost is 32% this month — within target (< 35%). Seafood supplier spending increased by 22% vs last month. Consider reviewing your seafood menu pricing to protect profit margins. GrabFood remains your top delivery channel at 15% of total revenue.',
    'zh-CN':
      '你本月的食材成本是 32%，在目标范围内（< 35%）。海鲜供应商的支出比上月增加了 22%。建议检视海鲜菜单定价，以维持利润率。GrabFood 是你最大的外卖渠道，占总营业额的 15%。',
  },
  highlights: [
    { labelEn: 'Food Cost',  labelZh: '食材成本',  value: '32%',  status: 'good' },
    { labelEn: 'Target',     labelZh: '目标',      value: '< 35%',status: 'good' },
    { labelEn: 'Seafood ↑',  labelZh: '海鲜 ↑',   value: '+22%', status: 'warning' },
    { labelEn: 'GrabFood',   labelZh: 'GrabFood',  value: '15%',  status: 'neutral' },
  ],
  generatedAt: '2026-05-29T08:00:00Z',
}
