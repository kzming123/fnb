// ─── P&L report types ─────────────────────────────────────────────────────────
// These types describe the output of the P&L calculation engine in
// lib/finance/pnl-calculator.ts.  They are intentionally separate from the
// raw Supabase query types in lib/supabase/queries/pnl.ts — the calculator
// is a pure transformation layer between raw DB data and display-ready results.

// ─── Category enums ───────────────────────────────────────────────────────────

/**
 * F&B food-cost categories.  These map directly to invoice_items.suggested_category
 * and the food-cost subset of expense_categories.type.
 */
export type FoodCostCategory =
  | 'meat'
  | 'seafood'
  | 'vegetables'
  | 'dry_goods'
  | 'beverages'
  | 'packaging'
  | 'sauce_seasoning'
  | 'others'

/**
 * Operating expense categories (non-food-cost).
 * These map to the opex subset of expense_categories.type.
 */
export type OperatingExpenseCategory =
  | 'rent'
  | 'salaries'
  | 'utilities'
  | 'marketing'
  | 'repairs'
  | 'cleaning'
  | 'pos_software'
  | 'delivery_commission'
  | 'others'

// ─── Revenue ──────────────────────────────────────────────────────────────────

/** Revenue broken down by sales channel. */
export type RevenueBreakdown = {
  dineIn:     number
  takeaway:   number
  grabFood:   number
  foodpanda:  number
  shopeeFood: number
  catering:   number
  other:      number
  total:      number
}

// ─── Line items ───────────────────────────────────────────────────────────────

/** One row in the COGS section of the P&L statement. */
export type CogsLineItem = {
  category:     FoodCostCategory
  label:        string   // display label in EN
  labelZh:      string   // display label in ZH
  amount:       number
  /** Percentage of total revenue (not of total COGS). */
  pctOfRevenue: number
}

/** One row in the operating expenses section. */
export type OpexLineItem = {
  category:     OperatingExpenseCategory
  label:        string
  labelZh:      string
  amount:       number
  /** Percentage of total revenue. */
  pctOfRevenue: number
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export type TopSupplierSummary = {
  supplierId:   string
  supplierName: string
  totalSpend:   number
  /** Percentage of total COGS this supplier represents. */
  pctOfCogs:    number
}

/** One-line insight for a single metric (used in the AI summary panel). */
export type PnLInsight = {
  metricKey:    string   // e.g. "food_cost_pct"
  labelEn:      string
  labelZh:      string
  value:        string   // formatted for display, e.g. "32.0%"
  status:       'good' | 'warning' | 'critical' | 'neutral'
  commentEn:    string
  commentZh:    string
}

// ─── Calculator input ─────────────────────────────────────────────────────────

import type {
  MonthlySalesData,
  CogsByCategory,
  OpexByCategory,
  SupplierSpend,
} from '@/lib/supabase/queries/pnl'

/**
 * Raw data assembled from Supabase queries, ready to be fed into calculatePnL().
 * All query calls are done before this point — the calculator itself is pure.
 */
export type PnLInput = {
  businessId:        string
  month:             string           // "YYYY-MM"
  salesData:         MonthlySalesData
  /** COGS sourced from confirmed invoice line items. */
  cogsFromInvoices:  CogsByCategory[]
  /**
   * All expense entries for the month (food-cost + opex categories combined).
   * The calculator splits them by category kind internally.
   */
  allExpenses:       OpexByCategory[]
  /** YTD supplier spend totals, sorted descending. */
  suppliers:         SupplierSpend[]
}

// ─── Calculator output ────────────────────────────────────────────────────────

/** Fully calculated, display-ready P&L report for one calendar month. */
export type PnLReport = {
  // ── Identity ────────────────────────────────────────────────────────────────
  businessId:          string
  month:               string   // "YYYY-MM"
  daysLogged:          number
  /**
   * True when there is at least one revenue or expense entry.
   * False means the UI should show an empty-state prompt instead of zeros.
   */
  hasData:             boolean

  // ── Revenue ─────────────────────────────────────────────────────────────────
  revenue:             RevenueBreakdown
  totalRevenue:        number

  // ── Cost of Goods Sold ───────────────────────────────────────────────────────
  /** Individual COGS line items, sorted by amount descending. */
  cogsItems:           CogsLineItem[]
  totalCogs:           number
  /** totalCogs / totalRevenue × 100. Zero when no revenue. */
  foodCostPercent:     number

  // ── Gross profit ────────────────────────────────────────────────────────────
  grossProfit:         number
  /** grossProfit / totalRevenue × 100. */
  grossMarginPercent:  number

  // ── Operating expenses ───────────────────────────────────────────────────────
  /** Individual opex line items, sorted by amount descending. */
  opexItems:           OpexLineItem[]
  operatingExpenses:   number

  // ── Net profit ──────────────────────────────────────────────────────────────
  netProfit:           number
  /** netProfit / totalRevenue × 100. */
  netMarginPercent:    number

  // ── Insights ─────────────────────────────────────────────────────────────────
  /** The single largest combined expense category (COGS + opex), or null if no data. */
  topExpenseCategory:  string | null
  topExpenseCategoryZh: string | null
  /** #1 supplier by spend this period, or null if no confirmed invoices. */
  topSupplier:         TopSupplierSummary | null
  /** Top 3 suppliers by spend, sorted descending. Empty when no confirmed invoices. */
  topSuppliers:        TopSupplierSummary[]
  /** Machine-generated one-paragraph insights derived from the numbers. */
  insights:            PnLInsight[]
}
