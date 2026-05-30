'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign, TrendingUp, ShoppingBasket,
  BarChart3, Wallet, Receipt, Truck, Smartphone,
  Plus, ScanLine, FileBarChart2, ArrowUpRight,
} from 'lucide-react'

import { DemoBanner }            from '@/components/shared/DemoBanner'
import { DEMO_BUSINESS_NAME }   from '@/lib/mock-data/demo'
import { can }                   from '@/lib/auth/permissions'
import { StatCard }              from '@/components/dashboard/StatCard'
import { SalesExpensesChart }   from '@/components/dashboard/SalesExpensesChart'
import { ExpenseCategoryChart } from '@/components/dashboard/ExpenseCategoryChart'
import { MonthlyProfitChart }   from '@/components/dashboard/MonthlyProfitChart'
import { RecentTransactions }   from '@/components/dashboard/RecentTransactions'
import { AIInsightCard }        from '@/components/dashboard/AIInsightCard'
import { DashboardSkeleton }    from '@/components/ui/skeleton'

import { formatCurrency, cn }   from '@/lib/utils'
import { useLanguage }          from '@/contexts/LanguageContext'
import { useCurrentBusiness }   from '@/lib/supabase/useCurrentBusiness'

import {
  fetchTodaySales,
  fetchSalesByDate,
  fetchMonthlyTrend,
  fetchPlatformSales,
  fetchRecentExpenses,
  type TrendPoint,
  type PlatformSalesData,
  type RecentExpense,
  type TodaySalesData,
} from '@/lib/supabase/queries/pnl'

// Single source of truth for all P&L math — the SAME calculator the P&L Report
// uses (lib/finance/pnl-calculator.ts → calculatePnL). This guarantees the
// Dashboard and the P&L Report never disagree, and that invoice_scan expenses
// are not double-counted (the calculator folds them into COGS, not OpEx).
import { fetchAndCalculatePnL } from '@/lib/finance/pnl-calculator'
import type { PnLReport } from '@/types/pnl'

import { fetchInvoiceHistory }  from '@/lib/supabase/queries/invoices'
import type { Transaction }     from '@/lib/mock-data/dashboard'
import type { ExpenseCategoryItem } from '@/components/dashboard/ExpenseCategoryChart'

// ─── Category helpers ──────────────────────────────────────────────────────────

const OPEX_COLORS: Record<string, string> = {
  meat:                '#ef4444',
  seafood:             '#3b82f6',
  vegetables:          '#22c55e',
  dry_goods:           '#f59e0b',
  beverages:           '#8b5cf6',
  packaging:           '#ec4899',
  sauce_seasoning:     '#f97316',
  rent:                '#a855f7',
  salaries:            '#f59e0b',
  utilities:           '#3b82f6',
  marketing:           '#ec4899',
  repairs:             '#94a3b8',
  cleaning:            '#06b6d4',
  pos_software:        '#64748b',
  delivery_commission: '#f97316',
  others:              '#94a3b8',
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

function currentMonth(): string {
  return new Date().toLocaleDateString('en-CA').slice(0, 7)
}

function prevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, '0')}`
}

function sixMonthsAgo(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const target = m - 5
  if (target > 0) return `${y}-${String(target).padStart(2, '0')}`
  return `${y - 1}-${String(target + 12).padStart(2, '0')}`
}

// ─── Internal data shape ───────────────────────────────────────────────────────

type RawData = {
  businessName:   string
  today:          TodaySalesData | null
  yesterdaySales: number
  // Fully-calculated P&L for the current + previous month (same engine as the
  // P&L Report). All KPI cards derive from these, so the two pages always agree.
  current:        PnLReport
  last:           PnLReport
  trend:          TrendPoint[]
  platforms:      PlatformSalesData[]
  recentExpenses: RecentExpense[]
  recentInvoices: Awaited<ReturnType<typeof fetchInvoiceHistory>>
}

// ─── Derived KPIs (computed from RawData) ─────────────────────────────────────

function derive(d: RawData) {
  const c = d.current   // current-month P&L report
  const l = d.last      // previous-month P&L report

  const todaySales = d.today?.totalRevenue ?? 0
  const yest       = d.yesterdaySales
  const todayVsYesterday = yest > 0 ? ((todaySales - yest) / yest) * 100 : 0

  // ── Core P&L numbers — taken straight from the calculator ────────────────────
  // No bespoke COGS/OpEx math here anymore: every figure comes from the same
  // engine as the P&L Report, so invoice_scan expenses can't be double-counted
  // and manual food expenses are correctly classified as COGS.
  const mtdRevenue  = c.totalRevenue
  const mtdCogs     = c.totalCogs
  const mtdOpex     = c.operatingExpenses
  const grossProfit = c.grossProfit
  const netProfit   = c.netProfit
  // Total Expenses = COGS + Operating Expenses (food cost IS included).
  const totalExpenses = c.totalCogs + c.operatingExpenses

  const lastRev         = l.totalRevenue
  const lastGrossProfit = l.grossProfit
  const lastNetProfit   = l.netProfit
  const lastTotalExp    = l.totalCogs + l.operatingExpenses

  const pct = (cur: number, prev: number) =>
    prev > 0 ? ((cur - prev) / prev) * 100 : undefined

  const foodCostPct     = c.foodCostPercent
  const lastFoodCostPct = l.foodCostPercent
  const grossMarginPct  = c.grossMarginPercent
  const netMarginPct    = c.netMarginPercent

  // Top supplier comes from the report too (same period/logic), so the
  // Dashboard "Top Supplier" card matches the P&L Report exactly.
  const topSupplier  = c.topSupplier
  const lastTopSpend = l.topSupplier?.totalSpend ?? 0
  const topSupplierGrowth = pct(topSupplier?.totalSpend ?? 0, lastTopSpend)

  const totalPlatformComm   = d.platforms.reduce((s, p) => s + p.effectiveCommission, 0)
  const totalPlatformNet    = d.platforms.reduce((s, p) => s + p.netReceived,         0)
  const platformCommPct     = mtdRevenue > 0 ? (totalPlatformComm / mtdRevenue) * 100 : 0
  const anyPlatformEstimated = d.platforms.some(p => p.isEstimated)

  // Build expense category chart data: COGS lump + individual opex items.
  // opexItems already excludes food-cost categories (those live inside COGS),
  // so nothing is shown twice.
  const expChartItems: ExpenseCategoryItem[] = []
  if (mtdCogs > 0) {
    expChartItems.push({
      name:   'Food Cost (COGS)',
      nameZh: '食材成本（COGS）',
      amount: mtdCogs,
      color:  '#6366f1',
      pct:    0,
    })
  }
  for (const item of c.opexItems) {
    expChartItems.push({
      name:   item.label,
      nameZh: item.labelZh,
      amount: item.amount,
      color:  OPEX_COLORS[item.category] ?? '#94a3b8',
      pct:    0,
    })
  }
  const grandTotal = expChartItems.reduce((s, i) => s + i.amount, 0)
  expChartItems.forEach(i => { i.pct = grandTotal > 0 ? (i.amount / grandTotal) * 100 : 0 })
  expChartItems.sort((a, b) => b.amount - a.amount)

  // Build recent transactions list
  const recentTx: Transaction[] = [
    ...d.recentInvoices.slice(0, 5).map(inv => ({
      id:          inv.id,
      date:        inv.invoiceDate,
      type:        'invoice' as const,
      description: inv.supplierName || 'Supplier Invoice',
      subtext:     `Invoice ${inv.invoiceNumber || '—'}`,
      amount:      -inv.totalAmount,
      // 'processing' is not a valid TxStatus in the Transaction type
      status:      (inv.status === 'processing' ? 'pending_review' : inv.status) as 'confirmed' | 'pending_review',
    })),
    ...d.recentExpenses.slice(0, 5).map(exp => ({
      id:          exp.id,
      date:        exp.expenseDate,
      type:        'expense' as const,
      description: exp.vendor ?? exp.categoryName,
      subtext:     exp.categoryName,
      amount:      -exp.amount,
      status:      'completed' as const,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)

  return {
    todaySales, todayVsYesterday,
    mtdRevenue, mtdCogs, mtdOpex, grossProfit, netProfit, totalExpenses,
    lastRev, lastGrossProfit, lastNetProfit, lastTotalExp,
    foodCostPct, lastFoodCostPct, grossMarginPct, netMarginPct,
    topSupplier, topSupplierGrowth,
    totalPlatformComm, totalPlatformNet, platformCommPct, anyPlatformEstimated,
    expChartItems, grandTotal,
    recentTx,
    pct,
    lastTopSpend,
  }
}

// ─── Greeting helper ───────────────────────────────────────────────────────────

function greetingKey() {
  const h = new Date().getHours()
  if (h < 12) return 'dashboard_greeting_morning'  as const
  if (h < 18) return 'dashboard_greeting_afternoon' as const
  return 'dashboard_greeting_evening' as const
}

// ─── Quick action button ───────────────────────────────────────────────────────

function QuickAction({
  href, icon: Icon, label, sub, accent,
}: {
  href:  string
  icon:  React.ElementType
  label: string
  sub:   string
  accent: 'indigo' | 'emerald' | 'amber'
}) {
  const colors = {
    indigo:  { bg: 'bg-indigo-50 hover:bg-indigo-100',   icon: 'text-indigo-600',  border: 'border-indigo-100' },
    emerald: { bg: 'bg-emerald-50 hover:bg-emerald-100', icon: 'text-emerald-600', border: 'border-emerald-100' },
    amber:   { bg: 'bg-amber-50 hover:bg-amber-100',     icon: 'text-amber-600',   border: 'border-amber-100' },
  }
  const c = colors[accent]
  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col gap-2 rounded-2xl border p-4 transition-all duration-150',
        'hover:shadow-md active:scale-[0.98]',
        c.bg, c.border,
      )}
    >
      <div className="flex items-start justify-between">
        <Icon size={20} className={c.icon} />
        <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800 leading-tight">{label}</p>
        <p className="mt-0.5 text-[11px] text-gray-500">{sub}</p>
      </div>
    </Link>
  )
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-4 w-1 shrink-0 rounded-full bg-indigo-500" aria-hidden />
      <div>
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Hero stat (the two big numbers in the dark banner) ─────────────────────────

function HeroStat({
  label, value, delta, deltaLabel, firstMonthLabel,
}: {
  label: string
  value: string
  delta?: number
  deltaLabel: string
  firstMonthLabel?: string
}) {
  const hasDelta = typeof delta === 'number'
  const up = hasDelta && (delta as number) >= 0
  return (
    <div className="text-right">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold leading-tight tabular-nums text-white">{value}</p>
      {hasDelta ? (
        <span className={cn(
          'mt-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
          up ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300',
        )}>
          {up ? '+' : ''}{(delta as number).toFixed(1)}%
          <span className="font-normal text-slate-400">{deltaLabel}</span>
        </span>
      ) : (
        firstMonthLabel && <span className="mt-1.5 inline-block text-[11px] text-slate-500">{firstMonthLabel}</span>
      )}
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export function DashboardContent() {
  const { t, isZh } = useLanguage()
  const { businessId, businessName, userRole, loading: bizLoading, error: bizError } = useCurrentBusiness()
  const canViewProfit = can(userRole, 'view_net_profit')
  const canViewPnl    = can(userRole, 'view_pnl')

  type LoadState = 'loading' | 'ready' | 'demo'
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [raw,       setRaw]       = useState<RawData | null>(null)

  useEffect(() => {
    if (bizLoading) return

    // No business = demo mode (show mock data, no Supabase calls)
    if (bizError || !businessId) {
      setLoadState('demo')
      return
    }

    let cancelled = false

    async function load() {
      try {
        const _today = new Date().toLocaleDateString('en-CA')
        const yesterday = (() => {
          const d = new Date(); d.setDate(d.getDate() - 1)
          return d.toLocaleDateString('en-CA')
        })()
        const month  = currentMonth()
        const last   = prevMonth(month)
        const sixAgo = sixMonthsAgo(month)

        const [
          todayData, yesterdaySales,
          currentReport, lastReport,
          trend, platforms,
          recentExpenses, recentInvoices,
        ] = await Promise.all([
          fetchTodaySales(businessId),
          fetchSalesByDate(businessId, yesterday),
          // Same calculator the P&L Report uses — one source of truth.
          fetchAndCalculatePnL(businessId, month),
          fetchAndCalculatePnL(businessId, last),
          fetchMonthlyTrend(businessId, sixAgo, month),
          fetchPlatformSales(businessId, month),
          fetchRecentExpenses(businessId, 5),
          fetchInvoiceHistory(businessId),
        ])

        if (cancelled) return

        setRaw({
          businessName: businessName || 'My Business',
          today: todayData,
          yesterdaySales,
          current: currentReport,
          last:    lastReport,
          trend, platforms,
          recentExpenses,
          recentInvoices: recentInvoices.slice(0, 5),
        })
        setLoadState('ready')
      } catch {
        if (!cancelled) setLoadState('demo')
      }
    }

    load()
    return () => { cancelled = true }
  }, [bizLoading, bizError, businessId, businessName])

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loadState === 'loading') return <DashboardSkeleton />

  // ── Derived values (real or mock) ──────────────────────────────────────────
  const kpi = raw ? derive(raw) : null
  const isDemo = loadState === 'demo'
  const bizDisplayName = raw?.businessName || (isDemo ? DEMO_BUSINESS_NAME : 'My Business')

  // Hero date label
  const dateLabel = new Date().toLocaleDateString(isZh ? 'zh-CN' : 'en-MY', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // ── Display values ─────────────────────────────────────────────────────────
  // IMPORTANT: gate every demo fallback on `isDemo`, not on `??`.
  // The `??` operator cannot distinguish "kpi is null (demo)" from "kpi exists
  // but the metric is undefined (new real user with no data yet)".
  // Without this gate, Kopitiam demo numbers would appear on real empty accounts.
  //
  //   isDemo = true  → kpi is null → show impressive Kopitiam Demo numbers
  //   isDemo = false → kpi is set  → show real data (zeros are fine and correct)

  const todaySales         = isDemo ? 2_840.00  : (kpi?.todaySales    ?? 0)
  const todayVsYesterday   = isDemo ? 5.8       : (kpi?.todayVsYesterday ?? 0)
  const monthSales         = isDemo ? 74_940.00 : (kpi?.mtdRevenue    ?? 0)
  const monthSalesGrowth   = isDemo ? 6.4
    : (kpi ? kpi.pct(kpi.mtdRevenue, kpi.lastRev) : undefined)
  const foodCostPct        = isDemo ? 35.8      : (kpi?.foodCostPct   ?? 0)
  const foodCostDelta      = isDemo ? 1.3
    : (kpi ? kpi.foodCostPct - kpi.lastFoodCostPct : 0)
  const grossProfit        = isDemo ? 48_140.00 : (kpi?.grossProfit   ?? 0)
  const grossMarginPct     = isDemo ? 64.2      : (kpi?.grossMarginPct ?? 0)
  const grossProfitGrowth  = isDemo ? 4.2
    : (kpi ? kpi.pct(kpi.grossProfit, kpi.lastGrossProfit) : undefined)
  const netProfit          = isDemo ? 13_770.00 : (kpi?.netProfit     ?? 0)
  const netMarginPct       = isDemo ? 18.4      : (kpi?.netMarginPct  ?? 0)
  const netProfitGrowth    = isDemo ? 3.1
    : (kpi ? kpi.pct(kpi.netProfit, kpi.lastNetProfit) : undefined)
  const totalExpenses      = isDemo ? 61_170.00 : (kpi?.totalExpenses ?? 0)
  const expensesGrowth     = isDemo ? 4.8
    : (kpi ? kpi.pct(kpi.totalExpenses, kpi.lastTotalExp) : undefined)
  // Top supplier — real users with no confirmed invoices see '—', not demo data
  const topSupplierName    = isDemo ? 'Premium Meats Trading'
    : (kpi?.topSupplier?.supplierName ?? '—')
  const topSupplierSpend   = isDemo ? 9_200.00  : (kpi?.topSupplier?.totalSpend ?? 0)
  const topSupplierGrowthVal = isDemo ? undefined : kpi?.topSupplierGrowth
  // Platform commission
  const totalPlatformComm  = isDemo ? 3_850.00 : (kpi?.totalPlatformComm ?? 0)
  const totalPlatformNet   = isDemo ? (74_940 * 0.25 - 3_850) : (kpi?.totalPlatformNet ?? 0)
  const _platformCommPct   = isDemo ? 5.1 : (kpi?.platformCommPct ?? 0)
  const anyPlatformEstimated = isDemo ? true : (kpi?.anyPlatformEstimated ?? true)

  return (
    <div className="space-y-7">

      {/* ── Hero banner ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-5 py-6 shadow-hero ring-1 ring-white/10 sm:px-7 sm:py-7">
        {/* Subtle dotted texture + soft indigo glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2.5">
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-300/80">
                {dateLabel}
              </p>
              {isDemo && <DemoBanner />}
            </div>
            <h1 className="text-xl font-bold leading-tight text-white sm:text-2xl">
              {t(greetingKey())}, {bizDisplayName}
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              {t('dashboard_overview')}
            </p>
          </div>

          <div className="flex shrink-0 gap-5 sm:gap-7">
            <HeroStat
              label={t('sales_today_label')}
              value={formatCurrency(todaySales)}
              delta={todayVsYesterday}
              deltaLabel={t('dashboard_vs_yesterday')}
            />
            <div className="w-px self-stretch bg-white/10" />
            <HeroStat
              label={t('sales_month_label')}
              value={formatCurrency(monthSales)}
              delta={monthSalesGrowth}
              deltaLabel={t('dashboard_vs_last_month')}
              firstMonthLabel={t('dashboard_first_month')}
            />
          </div>
        </div>
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────────── */}
      <section className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
          {t('dashboard_quick_actions')}
        </p>
        <div className={`grid gap-3 ${canViewPnl ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {can(userRole, 'add_sales') && (
            <QuickAction href="/daily-sales"     icon={Plus}          label={t('dashboard_log_sales_short')} sub={t('dashboard_2_min_day')}  accent="emerald" />
          )}
          {can(userRole, 'scan_invoices') && (
            <QuickAction href="/invoice-scanner" icon={ScanLine}      label={t('invoice_scan_btn')}          sub={t('dashboard_ai_scan')}    accent="indigo"  />
          )}
          {canViewPnl && (
            <QuickAction href="/pnl-report"      icon={FileBarChart2} label={t('dashboard_monthly_pnl')}    sub={t('dashboard_see_profit')} accent="amber"   />
          )}
        </div>
      </section>

      {/* ── KPI stat cards ────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title={t('dashboard_key_numbers')} />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">

          <StatCard
            title={t('today_sales')}
            value={formatCurrency(todaySales)}
            trend={todayVsYesterday}
            trendLabel={t('dashboard_vs_yesterday')}
            accent="indigo"
            icon={<DollarSign size={17} />}
          />
          <StatCard
            title={t('this_month_sales')}
            value={formatCurrency(monthSales)}
            trend={monthSalesGrowth}
            trendLabel={t('dashboard_vs_last_month')}
            accent="emerald"
            icon={<TrendingUp size={17} />}
          />
          <StatCard
            title={t('food_cost')}
            value={`${foodCostPct.toFixed(1)}%`}
            trend={foodCostDelta}
            trendLabel={t('dashboard_vs_last_month')}
            subtitle={`${t('dashboard_target')} < 35% ${foodCostPct < 35 ? '✓' : '⚠'}`}
            accent="amber"
            invertTrend
            icon={<ShoppingBasket size={17} />}
            badge={foodCostPct < 35 ? t('dashboard_good') : t('dashboard_warning')}
          />
          {canViewProfit && (
            <StatCard
              title={t('gross_profit')}
              value={formatCurrency(grossProfit)}
              trend={grossProfitGrowth}
              trendLabel={t('dashboard_vs_last_month')}
              subtitle={`${grossMarginPct.toFixed(1)}% ${t('dashboard_gross_margin_label')}`}
              accent="emerald"
              icon={<BarChart3 size={17} />}
            />
          )}
          {canViewProfit && (
            <StatCard
              title={t('net_profit')}
              value={formatCurrency(netProfit)}
              trend={netProfitGrowth}
              trendLabel={t('dashboard_vs_last_month')}
              subtitle={`${netMarginPct.toFixed(1)}% ${t('dashboard_net_margin_label')}`}
              accent="emerald"
              icon={<Wallet size={17} />}
            />
          )}
          <StatCard
            title={t('dashboard_total_expenses')}
            value={formatCurrency(totalExpenses)}
            trend={expensesGrowth}
            trendLabel={t('dashboard_vs_last_month')}
            subtitle={t('dashboard_incl_cogs')}
            accent="red"
            invertTrend
            icon={<Receipt size={17} />}
          />
          <StatCard
            title={t('dashboard_top_supplier')}
            value={formatCurrency(topSupplierSpend)}
            trend={topSupplierGrowthVal}
            trendLabel={t('dashboard_vs_last_month')}
            subtitle={topSupplierName}
            accent="purple"
            invertTrend
            icon={<Truck size={17} />}
          />
          <StatCard
            title={t('dashboard_platform_commission')}
            value={formatCurrency(totalPlatformComm)}
            subtitle={`${t('platform_net_received')}: ${formatCurrency(totalPlatformNet)}${anyPlatformEstimated ? ` (${t('platform_estimated_badge')})` : ''}`}
            accent="slate"
            invertTrend
            icon={<Smartphone size={17} />}
          />
        </div>
      </section>

      {/* ── Charts row 1 ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader
          title={t('dashboard_revenue_cost')}
          sub={t('dashboard_30_days')}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SalesExpensesChart isDemo={isDemo} />
          </div>
          <div className="lg:col-span-2">
            {/*
              undefined → demo mode → chart renders mock data (looks great in demo)
              []        → real user with no expenses → chart renders empty state
              [items]   → real expenses → chart renders real data
            */}
            <ExpenseCategoryChart
              data={isDemo ? undefined : (kpi?.expChartItems ?? [])}
              total={kpi?.grandTotal}
            />
          </div>
        </div>
      </section>

      {/* ── Charts row 2 ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader
          title={t('dashboard_profit_trend')}
          sub={t('dashboard_6_months')}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {/* undefined = demo mode (mock chart); [] = real user no data (empty state) */}
            <MonthlyProfitChart data={isDemo ? undefined : (raw?.trend ?? [])} />
          </div>
          <div className="lg:col-span-2">
            <AIInsightCard isDemo={isDemo} />
          </div>
        </div>
      </section>

      {/* ── Recent transactions ───────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader
          title={t('dashboard_recent_transactions')}
          sub={t('dashboard_30_days')}
        />
        {/* undefined = demo mode (mock list); [] = real user no data (empty state) */}
        <RecentTransactions
          transactions={isDemo ? undefined : (kpi?.recentTx ?? [])}
        />
      </section>

    </div>
  )
}
