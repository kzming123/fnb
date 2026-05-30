/**
 * P&L Calculation Engine
 * ──────────────────────
 * Pure functions — no Supabase calls, no side effects.
 * Input  : raw data assembled from lib/supabase/queries/pnl.ts
 * Output : a fully calculated PnLReport (types/pnl.ts)
 *
 * Calculation flow:
 *   Revenue     = sum of all daily_sales channel columns
 *   COGS        = confirmed invoice items  +  any food-cost-type expense entries
 *   Gross Profit = Revenue − COGS
 *   OpEx        = expense entries with operating-cost category kinds
 *   Net Profit  = Gross Profit − OpEx
 *
 * Percentages are always expressed as 0–100 and rounded to 2 decimal places.
 * All division is guarded — returns 0 when the denominator is 0.
 */

import type {
  PnLInput,
  PnLReport,
  RevenueBreakdown,
  CogsLineItem,
  OpexLineItem,
  TopSupplierSummary,
  PnLInsight,
  FoodCostCategory,
  OperatingExpenseCategory,
} from '@/types/pnl'

import {
  fetchMonthlySalesBreakdown,
  fetchMonthlyCogs,
  fetchMonthlyOpex,
  fetchSupplierSpendTotals,
} from '@/lib/supabase/queries/pnl'

// ─── Category classification ───────────────────────────────────────────────────

/**
 * Category kinds that belong to "Cost of Goods Sold".
 * Source: invoice_items.suggested_category + food-cost expense entries.
 */
export const FOOD_COST_KINDS = new Set<string>([
  'meat', 'seafood', 'vegetables', 'dry_goods',
  'beverages', 'packaging', 'sauce_seasoning',
])

/**
 * Category kinds that belong to "Operating Expenses".
 */
export const OPEX_KINDS = new Set<string>([
  'rent', 'salaries', 'utilities', 'marketing',
  'repairs', 'cleaning', 'pos_software', 'delivery_commission', 'others',
])

// ─── Display labels ───────────────────────────────────────────────────────────

const COGS_LABELS: Record<string, { en: string; zh: string }> = {
  meat:           { en: 'Meat',             zh: '肉类'   },
  seafood:        { en: 'Seafood',          zh: '海鲜'   },
  vegetables:     { en: 'Vegetables',       zh: '蔬菜'   },
  dry_goods:      { en: 'Dry Goods',        zh: '干货'   },
  beverages:      { en: 'Beverages',        zh: '饮料'   },
  packaging:      { en: 'Packaging',        zh: '包装材料' },
  sauce_seasoning:{ en: 'Sauce & Seasoning',zh: '酱料调料' },
  others:         { en: 'Others',           zh: '其他'   },
}

const OPEX_LABELS: Record<string, { en: string; zh: string }> = {
  rent:                { en: 'Rent',                    zh: '租金'    },
  salaries:            { en: 'Salaries',                zh: '薪资'    },
  utilities:           { en: 'Utilities',               zh: '水电费'  },
  marketing:           { en: 'Marketing',               zh: '营销'    },
  repairs:             { en: 'Repairs & Maintenance',   zh: '维修保养' },
  cleaning:            { en: 'Cleaning',                zh: '清洁'    },
  pos_software:        { en: 'POS / Software',          zh: 'POS系统' },
  delivery_commission: { en: 'Platform Commission',     zh: '外卖平台佣金' },
  others:              { en: 'Others',                  zh: '其他'    },
}

// ─── Rounding helpers ─────────────────────────────────────────────────────────

/** Rounds to 2 decimal places, avoiding floating-point drift. */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Safe percentage: (numerator / denominator) × 100, rounded to 2dp.
 * Returns 0 when denominator is 0 — prevents NaN / Infinity in the report.
 */
function safePct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return round2((numerator / denominator) * 100)
}

// ─── Core calculator ──────────────────────────────────────────────────────────

/**
 * calculatePnL — pure P&L calculation.
 *
 * @example
 * // Given real data fetched for May 2026:
 * const report = calculatePnL({
 *   businessId: 'biz-001',
 *   month: '2026-05',
 *   salesData: {
 *     month: '2026-05',
 *     totalRevenue: 75890,
 *     byChannel: { dineIn: 34150, takeaway: 18972, grabFood: 11383,
 *                  foodpanda: 7589, shopeeFood: 0, catering: 3796, other: 0 },
 *     daysLogged: 29,
 *   },
 *   cogsFromInvoices: [
 *     { category: 'meat',       totalAmount: 8632 },
 *     { category: 'seafood',    totalAmount: 4900 },
 *     { category: 'vegetables', totalAmount: 3470 },
 *     { category: 'dry_goods',  totalAmount: 3685 },
 *     { category: 'beverages',  totalAmount: 2160 },
 *     { category: 'packaging',  totalAmount:  849 },
 *     { category: 'sauce_seasoning', totalAmount: 589 },
 *   ],
 *   allExpenses: [
 *     { categoryKind: 'rent',     categoryName: 'Rent',     totalAmount: 4500 },
 *     { categoryKind: 'salaries', categoryName: 'Salaries', totalAmount: 7210 },
 *     { categoryKind: 'utilities',categoryName: 'Utilities',totalAmount: 1005 },
 *   ],
 *   suppliers: [
 *     { supplierId: 's1', supplierName: 'Premium Meats Trading',
 *       supplierCategory: 'meat', totalAmount: 8632, invoiceCount: 4, lastInvoiceDate: '2026-05-27' },
 *   ],
 * })
 *
 * // Expected output (abridged):
 * // report.totalRevenue        → 75890
 * // report.totalCogs           → 24285   (sum of invoice items)
 * // report.foodCostPercent     → 32.00   (24285 / 75890 × 100)
 * // report.grossProfit         → 51605
 * // report.grossMarginPercent  → 68.00
 * // report.operatingExpenses   → 12715   (rent + salaries + utilities)
 * // report.netProfit           → 38890
 * // report.netMarginPercent    → 51.25
 */
export function calculatePnL(input: PnLInput): PnLReport {
  const { businessId, month, salesData, cogsFromInvoices, allExpenses, suppliers } = input

  // ── 1. Revenue ───────────────────────────────────────────────────────────────
  const ch = salesData.byChannel
  const revenue: RevenueBreakdown = {
    dineIn:    round2(ch.dineIn),
    takeaway:  round2(ch.takeaway),
    grabFood:  round2(ch.grabFood),
    foodpanda: round2(ch.foodpanda),
    shopeeFood:round2(ch.shopeeFood),
    catering:  round2(ch.catering),
    other:     round2(ch.other),
    total:     round2(salesData.totalRevenue),
  }
  const totalRevenue = revenue.total

  // ── 2. COGS ─────────────────────────────────────────────────────────────────
  // Source A: confirmed invoice line items (primary source — most accurate)
  const cogsMap = new Map<string, number>()
  for (const item of cogsFromInvoices) {
    const key = item.category
    cogsMap.set(key, (cogsMap.get(key) ?? 0) + item.totalAmount)
  }

  // Source B: manually-entered food-cost expenses only (source='manual').
  // Uses manualAmount to exclude invoice_scan expenses — those are already
  // counted in Source A via confirmed invoice_items. Without this filter,
  // saving an invoice would double-count the food cost.
  for (const exp of allExpenses) {
    if (FOOD_COST_KINDS.has(exp.categoryKind) && exp.manualAmount > 0) {
      const key = exp.categoryKind
      cogsMap.set(key, (cogsMap.get(key) ?? 0) + exp.manualAmount)
    }
  }

  // Build sorted COGS line items
  const cogsItems: CogsLineItem[] = Array.from(cogsMap.entries())
    .filter(([, amount]) => amount > 0)
    .map(([category, amount]) => {
      const labels = COGS_LABELS[category] ?? { en: category, zh: category }
      return {
        category:     category as FoodCostCategory,
        label:        labels.en,
        labelZh:      labels.zh,
        amount:       round2(amount),
        pctOfRevenue: safePct(amount, totalRevenue),
      }
    })
    .sort((a, b) => b.amount - a.amount)

  const totalCogs         = round2(cogsItems.reduce((s, c) => s + c.amount, 0))
  const foodCostPercent   = safePct(totalCogs, totalRevenue)

  // ── 3. Gross profit ──────────────────────────────────────────────────────────
  const grossProfit        = round2(totalRevenue - totalCogs)
  const grossMarginPercent = safePct(grossProfit, totalRevenue)

  // ── 4. Operating expenses ────────────────────────────────────────────────────
  const opexMap = new Map<string, { name: string; total: number }>()
  for (const exp of allExpenses) {
    if (OPEX_KINDS.has(exp.categoryKind)) {
      const key = exp.categoryKind
      const entry = opexMap.get(key)
      if (entry) {
        entry.total += exp.totalAmount
      } else {
        opexMap.set(key, { name: exp.categoryName, total: exp.totalAmount })
      }
    }
  }

  const opexItems: OpexLineItem[] = Array.from(opexMap.entries())
    .filter(([, { total }]) => total > 0)
    .map(([category, { total }]) => {
      const labels = OPEX_LABELS[category] ?? { en: category, zh: category }
      return {
        category:     category as OperatingExpenseCategory,
        label:        labels.en,
        labelZh:      labels.zh,
        amount:       round2(total),
        pctOfRevenue: safePct(total, totalRevenue),
      }
    })
    .sort((a, b) => b.amount - a.amount)

  const operatingExpenses = round2(opexItems.reduce((s, i) => s + i.amount, 0))

  // ── 5. Net profit ────────────────────────────────────────────────────────────
  const netProfit        = round2(grossProfit - operatingExpenses)
  const netMarginPercent = safePct(netProfit, totalRevenue)

  // ── 6. Top expense category ──────────────────────────────────────────────────
  // Merge all line items into one list and find the single largest.
  const allItems: Array<{ label: string; labelZh: string; amount: number }> = [
    ...cogsItems,
    ...opexItems,
  ]
  const topItem = allItems.length > 0
    ? allItems.reduce((max, item) => (item.amount > max.amount ? item : max))
    : null

  // ── 7. Top suppliers (top 3) ─────────────────────────────────────────────────
  const topSuppliers: TopSupplierSummary[] = suppliers.slice(0, 3).map(s => ({
    supplierId:   s.supplierId,
    supplierName: s.supplierName,
    totalSpend:   round2(s.totalAmount),
    pctOfCogs:    safePct(s.totalAmount, totalCogs),
  }))
  const topSupplier = topSuppliers[0] ?? null

  // ── 8. Insights ──────────────────────────────────────────────────────────────
  const insights = buildInsights({
    totalRevenue, totalCogs, foodCostPercent,
    grossMarginPercent, netMarginPercent,
    operatingExpenses, topSupplier, daysLogged: salesData.daysLogged,
  })

  // ── 9. hasData guard ─────────────────────────────────────────────────────────
  const hasData = totalRevenue > 0 || totalCogs > 0 || operatingExpenses > 0

  return {
    businessId,
    month,
    daysLogged:          salesData.daysLogged,
    hasData,
    revenue,
    totalRevenue,
    cogsItems,
    totalCogs,
    foodCostPercent,
    grossProfit,
    grossMarginPercent,
    opexItems,
    operatingExpenses,
    netProfit,
    netMarginPercent,
    topExpenseCategory:   topItem?.label    ?? null,
    topExpenseCategoryZh: topItem?.labelZh  ?? null,
    topSupplier,
    topSuppliers,
    insights,
  }
}

// ─── Insight builder ──────────────────────────────────────────────────────────

/**
 * Generates plain-language P&L insights based on the calculated numbers.
 * These are heuristic rules — not LLM-generated — so they work offline and
 * at zero cost. The AI summary in the P&L report panel upgrades to real LLM
 * generation in Phase 3.
 *
 * F&B industry benchmarks used:
 *   Food cost %  : < 28% excellent · 28–35% good · 35–40% review · > 40% critical
 *   Gross margin : > 65% good · 55–65% ok · < 55% review
 *   Net margin   : > 15% good · 5–15% ok · < 5% review · < 0% loss
 */
function buildInsights(params: {
  totalRevenue:       number
  totalCogs:          number
  foodCostPercent:    number
  grossMarginPercent: number
  netMarginPercent:   number
  operatingExpenses:  number
  topSupplier:        TopSupplierSummary | null
  daysLogged:         number
}): PnLInsight[] {
  const {
    totalRevenue, foodCostPercent,
    grossMarginPercent, netMarginPercent,
    topSupplier,
  } = params

  if (totalRevenue === 0) return []

  const out: PnLInsight[] = []

  // ── Food cost insight ───────────────────────────────────────────────────────
  const fcStatus: PnLInsight['status'] =
    foodCostPercent < 28  ? 'good'    :
    foodCostPercent < 35  ? 'good'    :
    foodCostPercent < 40  ? 'warning' : 'critical'

  const fcCommentEn =
    foodCostPercent < 28  ? 'Excellent food cost — well below the 28% target.' :
    foodCostPercent < 35  ? 'Food cost is within the healthy range (< 35%).' :
    foodCostPercent < 40  ? 'Food cost is slightly high. Review supplier pricing or portion sizes.' :
                            'Food cost is critical (> 40%). Immediate review recommended.'

  const fcCommentZh =
    foodCostPercent < 28  ? '食材成本非常理想，远低于28%的目标。' :
    foodCostPercent < 35  ? '食材成本处于健康范围（< 35%）。' :
    foodCostPercent < 40  ? '食材成本略偏高，建议检查供应商定价或份量控制。' :
                            '食材成本严重偏高（> 40%），需要立即检视。'

  out.push({
    metricKey: 'food_cost_pct',
    labelEn:   'Food Cost %',
    labelZh:   '食材成本率',
    value:     `${foodCostPercent.toFixed(1)}%`,
    status:    fcStatus,
    commentEn: fcCommentEn,
    commentZh: fcCommentZh,
  })

  // ── Gross margin insight ────────────────────────────────────────────────────
  const gmStatus: PnLInsight['status'] =
    grossMarginPercent >= 65 ? 'good'    :
    grossMarginPercent >= 55 ? 'neutral' : 'warning'

  out.push({
    metricKey: 'gross_margin',
    labelEn:   'Gross Margin',
    labelZh:   '毛利率',
    value:     `${grossMarginPercent.toFixed(1)}%`,
    status:    gmStatus,
    commentEn: grossMarginPercent >= 65
      ? 'Strong gross margin — your ingredient cost is well-controlled.'
      : grossMarginPercent >= 55
      ? 'Gross margin is acceptable but has room to improve.'
      : 'Gross margin is under pressure. Check ingredient costs and menu pricing.',
    commentZh: grossMarginPercent >= 65
      ? '毛利率表现强劲，食材成本控制良好。'
      : grossMarginPercent >= 55
      ? '毛利率尚可，仍有改善空间。'
      : '毛利率受到压力，请检查食材成本和菜单定价。',
  })

  // ── Net margin insight ──────────────────────────────────────────────────────
  const nmStatus: PnLInsight['status'] =
    netMarginPercent >= 15 ? 'good'    :
    netMarginPercent >= 5  ? 'neutral' :
    netMarginPercent >= 0  ? 'warning' : 'critical'

  out.push({
    metricKey: 'net_margin',
    labelEn:   'Net Margin',
    labelZh:   '净利率',
    value:     `${netMarginPercent.toFixed(1)}%`,
    status:    nmStatus,
    commentEn: netMarginPercent >= 15
      ? 'Net margin is healthy — the business is profitable.'
      : netMarginPercent >= 5
      ? 'Net margin is slim but positive. Look for ways to reduce fixed costs.'
      : netMarginPercent >= 0
      ? 'Net margin is near break-even. Urgent cost review needed.'
      : 'Business is running at a loss this month. Immediate action required.',
    commentZh: netMarginPercent >= 15
      ? '净利率健康，业务盈利状况良好。'
      : netMarginPercent >= 5
      ? '净利率偏薄但仍为正值，建议寻找降低固定成本的方式。'
      : netMarginPercent >= 0
      ? '净利率接近盈亏平衡，需要紧急审查成本。'
      : '本月处于亏损状态，需要立即采取行动。',
  })

  // ── Top supplier insight ────────────────────────────────────────────────────
  if (topSupplier && topSupplier.pctOfCogs > 50) {
    out.push({
      metricKey: 'supplier_concentration',
      labelEn:   'Supplier Risk',
      labelZh:   '供应商集中风险',
      value:     `${topSupplier.pctOfCogs.toFixed(0)}%`,
      status:    'warning',
      commentEn: `${topSupplier.supplierName} accounts for ${topSupplier.pctOfCogs.toFixed(0)}% of your food cost. Consider diversifying suppliers to reduce dependency.`,
      commentZh: `${topSupplier.supplierName} 占你食材成本的 ${topSupplier.pctOfCogs.toFixed(0)}%。建议增加备用供应商以降低依赖风险。`,
    })
  }

  return out
}

// ─── Async convenience function ───────────────────────────────────────────────

/**
 * Fetches all required data from Supabase and returns a calculated PnLReport.
 * Use this in page components: `const report = await fetchAndCalculatePnL(biz, month)`
 *
 * The current month's year-start is used for supplier spend aggregation so
 * the "top supplier" reflects YTD spend, not just the selected month.
 */
export async function fetchAndCalculatePnL(
  businessId: string,
  month: string,
): Promise<PnLReport> {
  const year = month.slice(0, 4)
  const yearStart = `${year}-01`

  const [salesData, cogsFromInvoices, allExpenses, suppliers] = await Promise.all([
    fetchMonthlySalesBreakdown(businessId, month),
    fetchMonthlyCogs(businessId, month),
    fetchMonthlyOpex(businessId, month),
    fetchSupplierSpendTotals(businessId, yearStart, month),
  ])

  return calculatePnL({ businessId, month, salesData, cogsFromInvoices, allExpenses, suppliers })
}

// ─── Comparison helper ────────────────────────────────────────────────────────

/**
 * Calculates the percentage-point or percentage-change difference between
 * two P&L reports (current vs prior month).
 *
 * Returns null for any metric when the prior value is zero.
 */
export type PnLComparison = {
  revenueChangePct:    number | null   // % change in revenue
  cogsChangePct:       number | null
  grossProfitChangePct:number | null
  netProfitChangePct:  number | null
  foodCostPctDelta:    number          // percentage-point change (e.g. +2.1pp)
  grossMarginDelta:    number
  netMarginDelta:      number
}

export function comparePnL(current: PnLReport, prior: PnLReport): PnLComparison {
  const pctChange = (cur: number, prev: number): number | null =>
    prev === 0 ? null : round2(((cur - prev) / prev) * 100)

  return {
    revenueChangePct:     pctChange(current.totalRevenue,       prior.totalRevenue),
    cogsChangePct:        pctChange(current.totalCogs,          prior.totalCogs),
    grossProfitChangePct: pctChange(current.grossProfit,        prior.grossProfit),
    netProfitChangePct:   pctChange(current.netProfit,          prior.netProfit),
    foodCostPctDelta:     round2(current.foodCostPercent    - prior.foodCostPercent),
    grossMarginDelta:     round2(current.grossMarginPercent - prior.grossMarginPercent),
    netMarginDelta:       round2(current.netMarginPercent   - prior.netMarginPercent),
  }
}

// ─── MYR formatting helper ────────────────────────────────────────────────────

/**
 * Formats a number as MYR currency: "RM 1,234.56"
 * Always uses MYR regardless of locale — per product spec.
 */
export function formatMYR(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Formats a percentage to 1 decimal place: "32.0%"
 */
export function formatPct(pct: number): string {
  return `${pct.toFixed(1)}%`
}
