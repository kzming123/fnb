'use client'

import { useState, useCallback } from 'react'
import {
  FileDown, FileSpreadsheet, Sparkles,
  FileBarChart2, RefreshCw, TrendingUp, TrendingDown,
  Building2, CheckCircle2, AlertTriangle, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/contexts/ToastContext'
import { useCurrentBusiness } from '@/lib/supabase/useCurrentBusiness'
import { can } from '@/lib/auth/permissions'
import { formatCurrency, cn } from '@/lib/utils'
import type { TranslationKey } from '@/lib/i18n/translations'
import { EmptyState } from '@/components/shared/EmptyState'
import { fetchAndCalculatePnL } from '@/lib/finance/pnl-calculator'
import { DemoBanner } from '@/components/shared/DemoBanner'
import { DEMO_BUSINESS_NAME } from '@/lib/mock-data/demo'
import type { PnLReport, TopSupplierSummary } from '@/types/pnl'
import { downloadCSV } from '@/lib/utils/csv'
import { buildPnLHTML, printPnL, type PnLPrintInput } from '@/lib/utils/pdf'

// ─── Legacy display shape ─────────────────────────────────────────────────────
// Keeps the existing render components (PnlRow, CogsChart, P&L statement)
// unchanged — the adapter maps PnLReport → PnLData at generate time.

type PnLData = {
  revenue: number; dineIn: number; takeaway: number
  grabFood: number; foodpanda: number; catering: number; shopeeFood: number
  totalCogs: number; meat: number; seafood: number; vegetables: number
  dryGoods: number; beverages: number; packaging: number; sauce: number
  grossProfit: number; grossMarginPct: number
  rent: number; salary: number; utilities: number; marketing: number
  repairs: number; cleaning: number; posSoftware: number
  deliveryComm: number; opexOthers: number; totalOpex: number
  netProfit: number; netMarginPct: number
  biggestCogs: string; month: number; year: number
}

type PageState = 'idle' | 'generating' | 'ready' | 'empty'

// ─── Adapter: PnLReport → PnLData ─────────────────────────────────────────────

function reportToPnLData(report: PnLReport, month: number, year: number): PnLData {
  const getCogs = (cat: string) => report.cogsItems.find(c => c.category === cat)?.amount ?? 0
  const getOpex = (cat: string) => report.opexItems.find(c => c.category === cat)?.amount ?? 0

  const meat       = getCogs('meat')
  const seafood    = getCogs('seafood')
  const vegetables = getCogs('vegetables')
  const dryGoods   = getCogs('dry_goods')
  const beverages  = getCogs('beverages')
  const packaging  = getCogs('packaging')
  const sauce      = getCogs('sauce_seasoning')

  // Find the largest COGS category key for the AI summary
  const cogsMap: Record<string, number> = { meat, seafood, vegetables, dryGoods, beverages, packaging, sauce }
  const biggestCogs = (Object.entries(cogsMap)
    .sort((a, b) => b[1] - a[1])[0]?.[0]) ?? 'meat'

  return {
    revenue: report.totalRevenue,
    dineIn:  report.revenue.dineIn,
    takeaway: report.revenue.takeaway,
    grabFood: report.revenue.grabFood,
    foodpanda: report.revenue.foodpanda,
    catering:  report.revenue.catering,
    shopeeFood: report.revenue.shopeeFood,
    totalCogs: report.totalCogs,
    meat, seafood, vegetables, dryGoods, beverages, packaging, sauce,
    grossProfit:    report.grossProfit,
    grossMarginPct: report.grossMarginPercent,
    rent:         getOpex('rent'),
    salary:       getOpex('salaries'),
    utilities:    getOpex('utilities'),
    marketing:    getOpex('marketing'),
    repairs:      getOpex('repairs'),
    cleaning:     getOpex('cleaning'),
    posSoftware:  getOpex('pos_software'),
    deliveryComm: getOpex('delivery_commission'),
    opexOthers:   getOpex('others'),
    totalOpex:    report.operatingExpenses,
    netProfit:    report.netProfit,
    netMarginPct: report.netMarginPercent,
    biggestCogs,
    month,
    year,
  }
}

// ─── Mock fallback — Kopitiam Demo Sdn Bhd ────────────────────────────────────
// Base numbers tuned for a realistic Malaysian kopitiam:
//   Revenue ~RM 74,940  |  Food cost 35.8%  |  Net margin 18.4%

const MONTH_FACTORS = [0.74, 0.76, 0.84, 0.90, 1.00, 0.98, 0.88, 0.87, 0.91, 0.94, 0.88, 0.95]

function generateMockPnL(month: number, year: number): PnLData {
  const f   = MONTH_FACTORS[month] ?? 1
  // Kopitiam Demo Sdn Bhd base revenue: RM 74,940
  const rev = Math.round(74_940 * f)

  // Revenue by channel
  const dineIn    = Math.round(rev * 0.50)
  const takeaway  = Math.round(rev * 0.25)
  const grabFood  = Math.round(rev * 0.15)
  const foodpanda = Math.round(rev * 0.10)
  const shopeeFood = 0
  const catering  = rev - dineIn - takeaway - grabFood - foodpanda

  // COGS at 35.8% — realistic Malaysian kopitiam food cost
  const totalCogs  = Math.round(rev * 0.358)
  const meat       = Math.round(totalCogs * 0.343)  // Premium Meats Trading
  const seafood    = Math.round(totalCogs * 0.228)  // Seafood Direct Market
  const vegetables = Math.round(totalCogs * 0.142)  // Fresh Produce Sdn Bhd
  const dryGoods   = Math.round(totalCogs * 0.136)  // Wholesale Dry Goods
  const beverages  = Math.round(totalCogs * 0.082)  // Beverage Supply Hub
  const packaging  = Math.round(totalCogs * 0.037)  // Green Pack Solutions
  const sauce      = totalCogs - meat - seafood - vegetables - dryGoods - beverages - packaging

  const grossProfit    = rev - totalCogs
  const grossMarginPct = (grossProfit / rev) * 100

  // Operating expenses — realistic kopitiam breakdown
  const rent         = Math.round(6_500 * (f * 0.2 + 0.8))  // mostly fixed; slight factor for partial months
  const salary       = Math.round(19_800 * (f * 0.15 + 0.85))
  const utilities    = Math.round(1_750 * (f * 0.5 + 0.5))
  const marketing    = Math.round(950 * f)
  const repairs      = Math.round(750 * (f * 0.6 + 0.4))
  const cleaning     = Math.round(420 * (f * 0.4 + 0.6))
  const posSoftware  = 350
  const deliveryComm = Math.round(rev * 0.051)  // GrabFood 15% × 30% + Foodpanda 10% × 30%
  const opexOthers   = Math.round(450 * f)
  const totalOpex    = rent + salary + utilities + marketing + repairs + cleaning + posSoftware + deliveryComm + opexOthers

  const netProfit    = grossProfit - totalOpex
  const netMarginPct = (netProfit / rev) * 100

  const cogsMap = { meat, seafood, vegetables, dryGoods, beverages, packaging, sauce }
  const biggestCogs = Object.entries(cogsMap).sort((a, b) => b[1] - a[1])[0][0]

  return {
    revenue: rev, dineIn, takeaway, grabFood, foodpanda, shopeeFood, catering,
    totalCogs, meat, seafood, vegetables, dryGoods, beverages, packaging, sauce,
    grossProfit, grossMarginPct, rent, salary, utilities, marketing, repairs,
    cleaning, posSoftware, deliveryComm, opexOthers, totalOpex,
    netProfit, netMarginPct, biggestCogs, month, year,
  }
}

// ─── AI summary (heuristic, no API call) ──────────────────────────────────────

const COGS_LABEL_KEY: Record<string, TranslationKey> = {
  meat: 'cat_meat', seafood: 'cat_seafood', vegetables: 'cat_vegetables',
  dryGoods: 'cat_dry_goods', beverages: 'cat_beverages', packaging: 'cat_packaging',
  sauce: 'exp_cat_sauce',
}

function buildAiSummary(d: PnLData, t: (k: TranslationKey) => string, isZh: boolean): string {
  const foodPct = d.revenue > 0 ? ((d.totalCogs / d.revenue) * 100).toFixed(1) : '0.0'
  const netPct  = d.netMarginPct.toFixed(1)
  const bigCat  = t(COGS_LABEL_KEY[d.biggestCogs] ?? 'cat_meat')
  const pct     = parseFloat(foodPct)

  if (isZh) {
    const verdict = pct < 28 ? '对餐厅来说非常理想' : pct < 35 ? '处于合理范围' : pct < 40 ? '略偏高，建议检查供应商价格' : '偏高，需要立即关注'
    return `你本月营业额是 ${formatCurrency(d.revenue)}。食材成本为 ${foodPct}%，${verdict}。净利润率是 ${netPct}%。最大食材支出类别是${bigCat}。`
  }
  const verdict = pct < 28 ? 'excellent for a restaurant' : pct < 35 ? 'within a healthy range' : pct < 40 ? 'slightly high — consider reviewing supplier pricing' : 'high — immediate review recommended'
  return `Revenue this month is ${formatCurrency(d.revenue)}. Food cost is ${foodPct}%, which is ${verdict}. Net profit margin is ${netPct}%. Your biggest food cost category is ${bigCat}.`
}

// ─── P&L row helpers ──────────────────────────────────────────────────────────

function PnlRow({
  label, value, pct, indent = false, bold = false, colorClass = 'text-gray-700',
}: {
  label: string; value: number; pct?: number
  indent?: boolean; bold?: boolean; colorClass?: string
}) {
  return (
    <div className={cn('flex items-center gap-3 py-2', indent && 'pl-5')}>
      <p className={cn('flex-1 text-sm', bold ? 'font-bold text-gray-900' : 'font-normal text-gray-600')}>
        {label}
      </p>
      {pct !== undefined && (
        <p className="hidden sm:block w-12 text-right text-[11px] text-gray-400 tabular-nums shrink-0">
          {pct.toFixed(1)}%
        </p>
      )}
      <p className={cn('w-32 shrink-0 text-right tabular-nums', bold ? 'text-base font-bold' : 'text-sm font-medium', colorClass)}>
        {formatCurrency(value)}
      </p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
      {children}
    </p>
  )
}

function RowDivider() {
  return <div className="border-t border-gray-100 my-1" />
}

// ─── COGS mini bar chart ──────────────────────────────────────────────────────

const COGS_COLORS: Record<string, string> = {
  meat: '#ef4444', seafood: '#3b82f6', vegetables: '#22c55e',
  dryGoods: '#f59e0b', beverages: '#8b5cf6', packaging: '#ec4899', sauce: '#f97316',
}

function CogsChart({ data }: { data: PnLData }) {
  const { t } = useLanguage()
  const items = [
    { key: 'meat',       label: t('cat_meat'),       value: data.meat },
    { key: 'seafood',    label: t('cat_seafood'),     value: data.seafood },
    { key: 'vegetables', label: t('cat_vegetables'),  value: data.vegetables },
    { key: 'dryGoods',   label: t('cat_dry_goods'),   value: data.dryGoods },
    { key: 'beverages',  label: t('cat_beverages'),   value: data.beverages },
    { key: 'packaging',  label: t('cat_packaging'),   value: data.packaging },
    { key: 'sauce',      label: t('exp_cat_sauce'),   value: data.sauce },
  ].filter(i => i.value > 0).sort((a, b) => b.value - a.value)

  if (items.length === 0) return null
  const max = items[0].value

  return (
    <div className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-card p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
        {t('reports_cogs')}
      </p>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: COGS_COLORS[item.key] ?? '#94a3b8' }} />
            <p className="w-24 text-xs font-medium text-gray-600 shrink-0 truncate">{item.label}</p>
            <div className="flex-1 min-w-0">
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(item.value / max) * 100}%`, backgroundColor: COGS_COLORS[item.key] ?? '#94a3b8' }}
                />
              </div>
            </div>
            <p className="w-20 text-right text-xs font-semibold text-gray-700 tabular-nums shrink-0">
              {formatCurrency(item.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Top Suppliers card ───────────────────────────────────────────────────────

function TopSuppliersCard({ suppliers, totalCogs }: { suppliers: TopSupplierSummary[]; totalCogs: number }) {
  const { t } = useLanguage()

  return (
    <div className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-card p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
        {t('pnl_top_suppliers')}
      </p>

      {suppliers.length === 0 ? (
        <p className="text-sm text-gray-400">{t('pnl_no_suppliers')}</p>
      ) : (
        <div className="space-y-3">
          {suppliers.map((s, i) => (
            <div key={s.supplierId} className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600 shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{s.supplierName}</p>
                <p className="text-[11px] text-gray-400">
                  {s.pctOfCogs.toFixed(1)}% {t('pnl_of_food_cost')}
                  {totalCogs > 0 && (
                    <span className="ml-1.5">
                      · {t('pnl_supplier_ytd')}
                    </span>
                  )}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-700 tabular-nums shrink-0">
                {formatCurrency(s.totalSpend)}
              </p>
            </div>
          ))}
        </div>
      )}

      {suppliers.length > 0 && (
        <p className="mt-4 text-[11px] text-gray-400 border-t border-gray-50 pt-3">
          {t('pnl_sourced_invoices')}
        </p>
      )}
    </div>
  )
}

// ─── Insight chips ────────────────────────────────────────────────────────────

function InsightChips({ report, isZh }: { report: PnLReport; isZh: boolean }) {
  if (report.insights.length === 0) return null

  const iconFor = (status: string) => {
    if (status === 'good')    return <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
    if (status === 'warning') return <AlertTriangle size={11} className="text-amber-400 shrink-0" />
    if (status === 'critical')return <AlertTriangle size={11} className="text-red-400 shrink-0" />
    return <Info size={11} className="text-indigo-300 shrink-0" />
  }

  return (
    <div className="mt-3 space-y-1.5">
      {report.insights.map(ins => (
        <div key={ins.metricKey} className="flex items-start gap-2 text-xs text-indigo-100">
          {iconFor(ins.status)}
          <span>{isZh ? ins.commentZh : ins.commentEn}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PnlReportPage() {
  const { t, isZh } = useLanguage()
  const toast = useToast()
  const { businessId, businessName, userRole, loading: bizLoading } = useCurrentBusiness()
  const canViewPnl     = can(userRole, 'view_pnl')
  const canExport      = can(userRole, 'export_reports')

  const currentYear = new Date().getFullYear()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear,  setSelectedYear]  = useState(currentYear)
  const [pageState,  setPageState]  = useState<PageState>('idle')
  const [data,       setData]       = useState<PnLData | null>(null)
  const [report,     setReport]     = useState<PnLReport | null>(null)
  const [isLiveData, setIsLiveData] = useState(false)

  // ── Generate report ──────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setPageState('generating')
    setData(null)
    setReport(null)

    // Demo mode: no real business, fall back to mock after a short delay
    if (!businessId) {
      setTimeout(() => {
        setData(generateMockPnL(selectedMonth, selectedYear))
        setIsLiveData(false)
        setPageState('ready')
      }, 1200)
      return
    }

    try {
      const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
      const pnlReport = await fetchAndCalculatePnL(businessId, monthStr)

      if (!pnlReport.hasData) {
        setPageState('empty')
        return
      }

      setData(reportToPnLData(pnlReport, selectedMonth, selectedYear))
      setReport(pnlReport)
      setIsLiveData(true)
      setPageState('ready')
    } catch {
      toast.error(isZh ? '加载失败，请重试。' : 'Failed to load report. Please try again.')
      setPageState('idle')
    }
  }, [businessId, selectedMonth, selectedYear, isZh, toast])

  function handleMonthChange(m: number) {
    setSelectedMonth(m)
    setPageState('idle')
    setData(null)
    setReport(null)
  }

  function handleYearChange(y: number) {
    setSelectedYear(y)
    setPageState('idle')
    setData(null)
    setReport(null)
  }

  function handleExportPDF() {
    if (!data) return
    const input: PnLPrintInput = {
      businessName:       displayName,
      period:             periodStr,
      generatedOn,
      isZh,
      totalRevenue:       data.revenue,
      dineIn:             data.dineIn,
      takeaway:           data.takeaway,
      grabFood:           data.grabFood,
      foodpanda:          data.foodpanda,
      shopeeFood:         data.shopeeFood,
      catering:           data.catering,
      totalCogs:          data.totalCogs,
      foodCostPercent:    data.revenue > 0 ? (data.totalCogs / data.revenue) * 100 : 0,
      cogsItems: [
        { label: t('cat_meat'),       amount: data.meat },
        { label: t('cat_seafood'),    amount: data.seafood },
        { label: t('cat_vegetables'), amount: data.vegetables },
        { label: t('cat_dry_goods'),  amount: data.dryGoods },
        { label: t('cat_beverages'),  amount: data.beverages },
        { label: t('cat_packaging'),  amount: data.packaging },
        { label: t('exp_cat_sauce'),  amount: data.sauce },
      ].filter(c => c.amount > 0),
      grossProfit:        data.grossProfit,
      grossMarginPercent: data.grossMarginPct,
      operatingExpenses:  data.totalOpex,
      opexItems: [
        { label: t('expenses_cat_rent'),      amount: data.rent },
        { label: t('expenses_cat_salaries'),  amount: data.salary },
        { label: t('expenses_cat_utilities'), amount: data.utilities },
        { label: t('expenses_cat_marketing'), amount: data.marketing },
        { label: t('exp_cat_repairs'),        amount: data.repairs },
        { label: t('exp_cat_cleaning'),       amount: data.cleaning },
        { label: t('exp_cat_pos'),            amount: data.posSoftware },
        { label: t('exp_cat_delivery_comm'),  amount: data.deliveryComm },
        { label: t('expenses_cat_others'),    amount: data.opexOthers },
      ].filter(o => o.amount > 0),
      netProfit:          data.netProfit,
      netMarginPercent:   data.netMarginPct,
      daysLogged:         report?.daysLogged,
      aiSummary:          aiSummary || undefined,
      topSuppliers:       report?.topSuppliers.map(s => ({
        name:        s.supplierName,
        totalSpend:  s.totalSpend,
        pctOfCogs:   s.pctOfCogs,
      })),
    }
    printPnL(buildPnLHTML(input))
  }

  function handleExportCSV() {
    if (!data) return
    const filename = isZh
      ? `盈亏报表_${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
      : `PnL_${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

    const headers = isZh
      ? ['类别', '项目', '金额 (RM)', '占营业额 (%)']
      : ['Section', 'Item', 'Amount (RM)', '% of Revenue']

    const r = data.revenue
    const pctStr = (v: number) => r > 0 ? ((v / r) * 100).toFixed(1) : '0.0'
    const secRevenue = isZh ? '营业额' : 'Revenue'
    const secCogs    = isZh ? '食材成本' : 'COGS'
    const secOpex    = isZh ? '运营费用' : 'Operating Expenses'

    const rows: (string | number)[][] = [
      [secRevenue, isZh ? '堂食'     : 'Dine-in',   data.dineIn,    pctStr(data.dineIn)],
      [secRevenue, isZh ? '外带'     : 'Takeaway',  data.takeaway,  pctStr(data.takeaway)],
      [secRevenue, 'GrabFood',                       data.grabFood,  pctStr(data.grabFood)],
      [secRevenue, 'Foodpanda',                      data.foodpanda, pctStr(data.foodpanda)],
      ...(data.shopeeFood > 0 ? [[secRevenue, 'ShopeeFood', data.shopeeFood, pctStr(data.shopeeFood)]] as (string|number)[][] : []),
      ...(data.catering  > 0 ? [[secRevenue, isZh ? '宴席' : 'Catering', data.catering, pctStr(data.catering)]] as (string|number)[][] : []),
      [secRevenue, isZh ? '合计'     : 'Total',     data.revenue,   '100.0'],
      ['', '', '', ''],
      [secCogs, t('cat_meat'),       data.meat,       pctStr(data.meat)],
      [secCogs, t('cat_seafood'),    data.seafood,    pctStr(data.seafood)],
      [secCogs, t('cat_vegetables'), data.vegetables, pctStr(data.vegetables)],
      [secCogs, t('cat_dry_goods'),  data.dryGoods,   pctStr(data.dryGoods)],
      [secCogs, t('cat_beverages'),  data.beverages,  pctStr(data.beverages)],
      [secCogs, t('cat_packaging'),  data.packaging,  pctStr(data.packaging)],
      [secCogs, t('exp_cat_sauce'),  data.sauce,      pctStr(data.sauce)],
      [secCogs, isZh ? '合计' : 'Total', data.totalCogs, pctStr(data.totalCogs)],
      ['', '', '', ''],
      [isZh ? '毛利润' : 'Gross Profit', '', data.grossProfit, data.grossMarginPct.toFixed(1)],
      ['', '', '', ''],
      [secOpex, t('expenses_cat_rent'),      data.rent,         pctStr(data.rent)],
      [secOpex, t('expenses_cat_salaries'),  data.salary,       pctStr(data.salary)],
      [secOpex, t('expenses_cat_utilities'), data.utilities,    pctStr(data.utilities)],
      [secOpex, t('expenses_cat_marketing'), data.marketing,    pctStr(data.marketing)],
      [secOpex, t('exp_cat_repairs'),        data.repairs,      pctStr(data.repairs)],
      [secOpex, t('exp_cat_cleaning'),       data.cleaning,     pctStr(data.cleaning)],
      [secOpex, t('exp_cat_pos'),            data.posSoftware,  pctStr(data.posSoftware)],
      [secOpex, t('exp_cat_delivery_comm'),  data.deliveryComm, pctStr(data.deliveryComm)],
      [secOpex, t('expenses_cat_others'),    data.opexOthers,   pctStr(data.opexOthers)],
      [secOpex, isZh ? '合计' : 'Total',    data.totalOpex,    pctStr(data.totalOpex)],
      ['', '', '', ''],
      [isZh ? '净利润' : 'Net Profit', '', data.netProfit, data.netMarginPct.toFixed(1)],
    ]

    downloadCSV(filename, headers, rows)
  }

  function monthLabel(m: number) {
    return new Intl.DateTimeFormat(isZh ? 'zh-CN' : 'en-US', { month: 'long' })
      .format(new Date(selectedYear, m, 1))
  }

  const periodStr = data
    ? isZh
      ? `${selectedYear}年${selectedMonth + 1}月`
      : `${monthLabel(selectedMonth)} 1 – ${new Date(selectedYear, selectedMonth + 1, 0).getDate()}, ${selectedYear}`
    : ''

  const generatedOn = new Intl.DateTimeFormat(isZh ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date())

  const aiSummary = data ? buildAiSummary(data, t, isZh) : ''
  const foodPct   = data && data.revenue > 0 ? ((data.totalCogs / data.revenue) * 100).toFixed(1) : '—'

  const isDemo = !businessId && !bizLoading
  const displayName = businessName || (isDemo ? DEMO_BUSINESS_NAME : 'My Business')

  // Block non-permitted roles (staff) — sidebar hides the link but guard the page too
  if (!bizLoading && businessId && !canViewPnl) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <FileBarChart2 size={36} className="text-gray-300" />
        <p className="text-base font-semibold text-gray-700">{t('access_denied_title')}</p>
        <p className="text-sm text-gray-400 max-w-xs">{t('access_denied_sub')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('reports_title')}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{t('reports_subtitle')}</p>
        </div>
        {isLiveData ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('pnl_data_live')}
          </span>
        ) : isDemo ? (
          <DemoBanner />
        ) : null}
      </div>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">

        {/* Year selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {t('year')}
          </label>
          <select
            value={selectedYear}
            onChange={e => handleYearChange(Number(e.target.value))}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {[currentYear - 1, currentYear].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Month selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {t('reports_select_month')}
          </label>
          <select
            value={selectedMonth}
            onChange={e => handleMonthChange(Number(e.target.value))}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[160px]"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{monthLabel(i)}</option>
            ))}
          </select>
        </div>

        {/* Generate */}
        <Button
          onClick={handleGenerate}
          disabled={pageState === 'generating' || bizLoading}
          className="h-10 gap-2"
        >
          {pageState === 'generating'
            ? <RefreshCw size={14} className="animate-spin" />
            : <FileBarChart2 size={14} />}
          {pageState === 'generating' ? t('pnl_generating') : t('generate_report')}
        </Button>

        {/* Export — hidden for roles without export_reports permission */}
        {canExport && (
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" className="h-10 gap-1.5"
              disabled={pageState !== 'ready'} onClick={handleExportPDF}>
              <FileDown size={14} />{t('export_pdf')}
            </Button>
            <Button variant="outline" size="sm" className="h-10 gap-1.5"
              disabled={pageState !== 'ready'} onClick={handleExportCSV}>
              <FileSpreadsheet size={14} />{t('export_csv')}
            </Button>
          </div>
        )}
      </div>

      {/* ── Idle ───────────────────────────────────────────────────────────── */}
      {pageState === 'idle' && (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl bg-white ring-1 ring-gray-100 shadow-card py-16 text-center px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <FileBarChart2 size={28} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-800">{t('pnl_idle_title')}</p>
            <p className="mt-1.5 text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">{t('pnl_idle_sub')}</p>
          </div>
          <Button onClick={handleGenerate} disabled={bizLoading} className="gap-2 px-6">
            <FileBarChart2 size={15} />
            {t('generate_report')}
          </Button>
        </div>
      )}

      {/* ── Generating ─────────────────────────────────────────────────────── */}
      {pageState === 'generating' && (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl bg-white ring-1 ring-indigo-100 shadow-card py-16">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-500" />
            <Sparkles size={22} className="text-indigo-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-800">{t('pnl_generating')}</p>
            <p className="mt-1 text-xs text-gray-400">
              {t('pnl_reading_data')}
            </p>
          </div>
        </div>
      )}

      {/* ── Empty state (no data for chosen month) ─────────────────────────── */}
      {pageState === 'empty' && (
        <EmptyState
          icon={<FileBarChart2 size={24} />}
          title={t('empty_pnl_month_title')}
          description={t('empty_pnl_month_sub')}
          action={{
            label: t('pnl_try_another_month'),
            onClick: () => setPageState('idle'),
            variant: 'outline',
          }}
          variant="page"
        />
      )}

      {/* ── Report ─────────────────────────────────────────────────────────── */}
      {pageState === 'ready' && data && (
        <>
          {/* AI / Insight banner */}
          <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="shrink-0" />
              <span className="text-sm font-bold">{t('pnl_ai_title')}</span>
              <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide">
                {isLiveData ? t('pnl_data_live') : t('pnl_ai_badge')}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-indigo-100">{aiSummary}</p>
            {/* Real-data insights */}
            {report && <InsightChips report={report} isZh={isZh} />}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                `${t('food_cost')} ${foodPct}%`,
                `${t('reports_gross_margin')} ${data.grossMarginPct.toFixed(1)}%`,
                `${t('reports_net_margin')} ${data.netMarginPct.toFixed(1)}%`,
              ].map(label => (
                <span key={label} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  {label}
                </span>
              ))}
              {report && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  {t('pnl_days_logged')}: {report.daysLogged}
                </span>
              )}
            </div>
          </div>

          {/* Summary stat cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: t('reports_revenue'),
                value: data.revenue,
                sub: t('pnl_total_revenue_sub'),
                pctBadge: '100%',
                color: 'text-indigo-700', bg: 'bg-indigo-50', ring: 'ring-indigo-100',
                icon: TrendingUp,
              },
              {
                label: t('reports_cogs'),
                value: data.totalCogs,
                sub: t('pnl_ingredient_cost_sub'),
                pctBadge: `${foodPct}%`,
                color: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-100',
                icon: TrendingDown,
              },
              {
                label: t('reports_gross_profit'),
                value: data.grossProfit,
                sub: t('pnl_after_ingredient'),
                pctBadge: `${data.grossMarginPct.toFixed(1)}%`,
                color: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-100',
                icon: TrendingUp,
              },
              {
                label: t('reports_net_profit'),
                value: data.netProfit,
                sub: t('pnl_what_you_keep'),
                pctBadge: `${data.netMarginPct.toFixed(1)}%`,
                color: data.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700',
                bg:    data.netProfit >= 0 ? 'bg-emerald-50'    : 'bg-red-50',
                ring:  data.netProfit >= 0 ? 'ring-emerald-100' : 'ring-red-100',
                icon:  data.netProfit >= 0 ? TrendingUp : TrendingDown,
              },
            ].map(card => {
              const Icon = card.icon
              return (
                <div key={card.label} className={cn('rounded-2xl p-4 ring-1', card.bg, card.ring)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Icon size={13} className={cn(card.color, 'opacity-70')} />
                      <p className={cn('text-xs font-semibold', card.color, 'opacity-75')}>{card.label}</p>
                    </div>
                    <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', card.bg, card.color, 'opacity-80 ring-1', card.ring)}>
                      {card.pctBadge}
                    </span>
                  </div>
                  <p className={cn('text-xl font-bold tabular-nums leading-tight', card.color)}>
                    {formatCurrency(card.value)}
                  </p>
                  <p className={cn('mt-1 text-[11px]', card.color, 'opacity-60')}>{card.sub}</p>
                </div>
              )
            })}
          </div>

          {/* COGS chart + Top Suppliers side by side */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CogsChart data={data} />
            <TopSuppliersCard
              suppliers={report?.topSuppliers ?? []}
              totalCogs={data.totalCogs}
            />
          </div>

          {/* P&L Statement ──────────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-card overflow-hidden">

            {/* Document header */}
            <div className="bg-gray-900 px-6 py-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building2 size={12} className="text-gray-400" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  {displayName}
                </p>
              </div>
              <h3 className="mt-1 text-sm font-bold text-white">{t('reports_title')}</h3>
              <p className="mt-0.5 text-[11px] text-gray-400">{periodStr}</p>
            </div>

            <div className="px-5 sm:px-7 py-4">

              {/* REVENUE */}
              <SectionLabel>{t('reports_revenue')}</SectionLabel>
              <PnlRow indent label={t('sales_field_dine_in')}   value={data.dineIn}    pct={data.revenue > 0 ? (data.dineIn    / data.revenue) * 100 : 0} colorClass="text-indigo-600" />
              <PnlRow indent label={t('sales_field_takeaway')}  value={data.takeaway}  pct={data.revenue > 0 ? (data.takeaway  / data.revenue) * 100 : 0} colorClass="text-indigo-600" />
              <PnlRow indent label={t('sales_field_grab')}      value={data.grabFood}  pct={data.revenue > 0 ? (data.grabFood  / data.revenue) * 100 : 0} colorClass="text-indigo-600" />
              <PnlRow indent label={t('sales_field_foodpanda')} value={data.foodpanda} pct={data.revenue > 0 ? (data.foodpanda / data.revenue) * 100 : 0} colorClass="text-indigo-600" />
              {data.shopeeFood > 0 && (
                <PnlRow indent label={t('pnl_shopeefood')}      value={data.shopeeFood} pct={data.revenue > 0 ? (data.shopeeFood / data.revenue) * 100 : 0} colorClass="text-indigo-600" />
              )}
              {data.catering > 0 && (
                <PnlRow indent label={t('pnl_catering')}        value={data.catering}  pct={data.revenue > 0 ? (data.catering  / data.revenue) * 100 : 0} colorClass="text-indigo-600" />
              )}
              <div className="border-t border-gray-200 mt-1 pt-1">
                <PnlRow bold label={t('reports_revenue')} value={data.revenue} pct={100} colorClass="text-indigo-700" />
              </div>

              <RowDivider />

              {/* COGS */}
              <SectionLabel>{t('reports_cogs')}</SectionLabel>
              {data.meat       > 0 && <PnlRow indent label={t('cat_meat')}       value={data.meat}       pct={data.revenue > 0 ? (data.meat       / data.revenue) * 100 : 0} colorClass="text-red-600" />}
              {data.seafood    > 0 && <PnlRow indent label={t('cat_seafood')}    value={data.seafood}    pct={data.revenue > 0 ? (data.seafood    / data.revenue) * 100 : 0} colorClass="text-red-600" />}
              {data.vegetables > 0 && <PnlRow indent label={t('cat_vegetables')} value={data.vegetables} pct={data.revenue > 0 ? (data.vegetables / data.revenue) * 100 : 0} colorClass="text-red-600" />}
              {data.dryGoods   > 0 && <PnlRow indent label={t('cat_dry_goods')}  value={data.dryGoods}   pct={data.revenue > 0 ? (data.dryGoods   / data.revenue) * 100 : 0} colorClass="text-red-600" />}
              {data.beverages  > 0 && <PnlRow indent label={t('cat_beverages')}  value={data.beverages}  pct={data.revenue > 0 ? (data.beverages  / data.revenue) * 100 : 0} colorClass="text-red-600" />}
              {data.packaging  > 0 && <PnlRow indent label={t('cat_packaging')}  value={data.packaging}  pct={data.revenue > 0 ? (data.packaging  / data.revenue) * 100 : 0} colorClass="text-red-600" />}
              {data.sauce      > 0 && <PnlRow indent label={t('exp_cat_sauce')}  value={data.sauce}      pct={data.revenue > 0 ? (data.sauce      / data.revenue) * 100 : 0} colorClass="text-red-600" />}
              {data.totalCogs === 0 && (
                <p className="pl-5 py-2 text-sm text-gray-400">{t('pnl_no_suppliers')}</p>
              )}
              <div className="border-t border-gray-200 mt-1 pt-1">
                <PnlRow bold label={t('reports_cogs')} value={data.totalCogs} pct={data.revenue > 0 ? (data.totalCogs / data.revenue) * 100 : 0} colorClass="text-red-700" />
              </div>

              <RowDivider />

              {/* GROSS PROFIT */}
              <div className="my-2">
                <div className={cn('flex items-center justify-between rounded-xl px-4 py-3',
                  data.grossProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50')}>
                  <div>
                    <p className={cn('text-sm font-bold', data.grossProfit >= 0 ? 'text-emerald-800' : 'text-red-800')}>
                      {t('reports_gross_profit')}
                    </p>
                    <p className={cn('text-xs mt-0.5', data.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {t('reports_gross_margin')}: {data.grossMarginPct.toFixed(1)}%
                    </p>
                  </div>
                  <p className={cn('text-xl font-bold tabular-nums', data.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                    {formatCurrency(data.grossProfit)}
                  </p>
                </div>
              </div>

              <RowDivider />

              {/* OPERATING EXPENSES */}
              <SectionLabel>{t('reports_operating_expenses')}</SectionLabel>
              {data.rent        > 0 && <PnlRow indent label={t('expenses_cat_rent')}      value={data.rent}         pct={data.revenue > 0 ? (data.rent         / data.revenue) * 100 : 0} colorClass="text-orange-600" />}
              {data.salary      > 0 && <PnlRow indent label={t('expenses_cat_salaries')}  value={data.salary}       pct={data.revenue > 0 ? (data.salary       / data.revenue) * 100 : 0} colorClass="text-orange-600" />}
              {data.utilities   > 0 && <PnlRow indent label={t('expenses_cat_utilities')} value={data.utilities}    pct={data.revenue > 0 ? (data.utilities    / data.revenue) * 100 : 0} colorClass="text-orange-600" />}
              {data.marketing   > 0 && <PnlRow indent label={t('expenses_cat_marketing')} value={data.marketing}    pct={data.revenue > 0 ? (data.marketing    / data.revenue) * 100 : 0} colorClass="text-orange-600" />}
              {data.repairs     > 0 && <PnlRow indent label={t('exp_cat_repairs')}        value={data.repairs}      pct={data.revenue > 0 ? (data.repairs      / data.revenue) * 100 : 0} colorClass="text-orange-600" />}
              {data.cleaning    > 0 && <PnlRow indent label={t('exp_cat_cleaning')}       value={data.cleaning}     pct={data.revenue > 0 ? (data.cleaning     / data.revenue) * 100 : 0} colorClass="text-orange-600" />}
              {data.posSoftware > 0 && <PnlRow indent label={t('exp_cat_pos')}            value={data.posSoftware}  pct={data.revenue > 0 ? (data.posSoftware  / data.revenue) * 100 : 0} colorClass="text-orange-600" />}
              {data.deliveryComm> 0 && <PnlRow indent label={t('exp_cat_delivery_comm')}  value={data.deliveryComm} pct={data.revenue > 0 ? (data.deliveryComm / data.revenue) * 100 : 0} colorClass="text-orange-600" />}
              {data.opexOthers  > 0 && <PnlRow indent label={t('expenses_cat_others')}    value={data.opexOthers}   pct={data.revenue > 0 ? (data.opexOthers   / data.revenue) * 100 : 0} colorClass="text-orange-600" />}
              {data.totalOpex === 0 && (
                <p className="pl-5 py-2 text-sm text-gray-400">
                  {t('pnl_no_opex_recorded')}
                </p>
              )}
              <div className="border-t border-gray-200 mt-1 pt-1">
                <PnlRow bold label={t('reports_operating_expenses')} value={data.totalOpex} pct={data.revenue > 0 ? (data.totalOpex / data.revenue) * 100 : 0} colorClass="text-orange-700" />
              </div>

              <RowDivider />

              {/* NET PROFIT */}
              <div className="mt-2 mb-1">
                <div className={cn(
                  'flex items-center justify-between rounded-2xl px-5 py-4 ring-1',
                  data.netProfit >= 0 ? 'bg-emerald-50 ring-emerald-100' : 'bg-red-50 ring-red-100',
                )}>
                  <div>
                    <p className={cn('text-sm font-bold uppercase tracking-wide', data.netProfit >= 0 ? 'text-emerald-800' : 'text-red-800')}>
                      {t('reports_net_profit_label')}
                    </p>
                    <p className={cn('text-xs mt-0.5', data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {t('reports_net_margin')}: {data.netMarginPct.toFixed(1)}%
                    </p>
                  </div>
                  <p className={cn('text-2xl font-bold tabular-nums', data.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                    {formatCurrency(data.netProfit)}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-3 flex items-center justify-between">
              <p className="text-[11px] text-gray-400">
                {t('reports_generated_on')} {generatedOn}
              </p>
              {!isLiveData && (
                <span className="text-[10px] font-semibold text-gray-400 rounded-full bg-gray-100 px-2 py-0.5">
                  {t('pnl_data_demo')}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
