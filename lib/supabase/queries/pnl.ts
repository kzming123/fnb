import { createClient } from '@/lib/supabase/client'

// ─── Platform commission rates ────────────────────────────────────────────────
// Industry-standard defaults for Malaysia. Actual rates vary by merchant
// agreement; the UI labels these as "estimated".
export const PLATFORM_COMMISSION_RATES = {
  grabFood:   0.30,
  foodpanda:  0.30,
  shopeeFood: 0.25,
} as const

export type Platform = keyof typeof PLATFORM_COMMISSION_RATES

// ─── Shared row types ─────────────────────────────────────────────────────────

type SalesRow = {
  sale_date?:        string
  dine_in_sales:     string
  takeaway_sales:    string
  grabfood_sales:    string
  foodpanda_sales:   string
  shopeefood_sales:  string
  catering_sales:    string
  other_sales:       string
}

type InvoiceItemRow = {
  amount:             string
  suggested_category: string | null
}

type _InvoiceWithItems = {
  id:            string
  supplier_id:   string | null
  invoice_date:  string
  total_amount:  string
  status:        string
  invoice_number: string | null
  ai_extracted_json: Record<string, unknown> | null
  invoice_items: InvoiceItemRow[]
  suppliers: { id: string; name: string; category: string } | null
}

type _ExpenseRow = {
  id:           string
  expense_date: string
  amount:       string
  description:  string | null
  expense_categories: { type: string; name: string } | null
}

// ─── Exported types ───────────────────────────────────────────────────────────

export type ChannelBreakdown = {
  dineIn:     number
  takeaway:   number
  grabFood:   number
  foodpanda:  number
  shopeeFood: number
  catering:   number
  other:      number
}

export type MonthlySalesData = {
  month:        string   // "YYYY-MM"
  totalRevenue: number
  byChannel:    ChannelBreakdown
  daysLogged:   number
}

export type TodaySalesData = {
  date:         string   // "YYYY-MM-DD"
  totalRevenue: number
  byChannel:    ChannelBreakdown
}

export type CogsByCategory = {
  category:    string   // e.g. "meat", "seafood", "dry_goods"
  totalAmount: number
}

export type OpexByCategory = {
  categoryKind:  string
  categoryName:  string
  totalAmount:   number
  // Amount from manually-entered expenses only (source='manual').
  // Used by the P&L calculator to avoid double-counting food-cost expenses
  // that were auto-created from confirmed invoices (those are already in COGS
  // via invoice_items).
  manualAmount:  number
}

export type SupplierSpend = {
  supplierId:       string
  supplierName:     string
  supplierCategory: string
  totalAmount:      number
  invoiceCount:     number
  lastInvoiceDate:  string | null
}

export type PlatformSalesData = {
  platform:            Platform
  totalSales:          number
  /** Commission from the DB (user-confirmed). null when not yet entered. */
  actualCommission:    number | null
  /** Estimated commission from standard rate (always available). */
  estimatedCommission: number
  commissionRate:      number
  /** true if actualCommission is null and we fell back to estimated rate */
  isEstimated:         boolean
  /** The commission value to use for calculations: actual if available, else estimated */
  effectiveCommission: number
  netReceived:         number
}

export type PnLSummary = {
  month:          string
  totalRevenue:   number
  salesByChannel: ChannelBreakdown
  daysLogged:     number
  // COGS — sourced from confirmed invoice items only
  cogsByCategory: CogsByCategory[]
  totalCogs:      number
  grossProfit:    number
  grossMarginPct: number
  // Operating expenses
  opexByCategory: OpexByCategory[]
  totalOpex:      number
  // Bottom line
  netProfit:      number
  netMarginPct:   number
  foodCostPct:    number
}

export type DashboardStats = {
  todaySales:   number
  todayDate:    string
  mtdRevenue:   number
  mtdExpenses:  number   // totalCogs + totalOpex this month
  mtdCogs:      number
  foodCostPct:  number   // 0 when no revenue (avoids divide-by-zero)
  daysLogged:   number
}

export type TrendPoint = {
  month:      string   // "YYYY-MM"
  revenue:    number
  expenses:   number
  profit:     number
  daysLogged: number
}

export type InvoiceSummary = {
  id:            string
  supplierName:  string | null
  invoiceNumber: string | null
  invoiceDate:   string
  totalAmount:   number
  status:        string
  supplierId:    string | null
}

export type InvoiceItemDetail = {
  id:                string
  invoiceId:         string
  itemName:          string
  quantity:          number | null
  unitPrice:         number | null
  amount:            number
  suggestedCategory: string | null
}

export type RecentExpense = {
  id:           string
  categoryKind: string
  categoryName: string
  expenseDate:  string
  amount:       number
  vendor:       string | null
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

// Safe numeric parse — Supabase returns numeric(12,2) columns as strings.
function p(v: string | number | null | undefined): number {
  if (v == null) return 0
  const n = typeof v === 'number' ? v : parseFloat(v)
  return isNaN(n) ? 0 : n
}

// Compute the date range [from, to) for a given "YYYY-MM" month string.
function monthBoundaries(month: string): { from: string; to: string } {
  const [year, mon] = month.split('-').map(Number)
  const nextYear = mon === 12 ? year + 1 : year
  const nextMon  = mon === 12 ? 1 : mon + 1
  return {
    from: `${month}-01`,
    to:   `${nextYear}-${String(nextMon).padStart(2, '0')}-01`,
  }
}

// Compute [from, to) across a range of months, e.g. "2026-01" to "2026-06".
function rangeBoundaries(fromMonth: string, toMonth: string): { from: string; to: string } {
  const { to } = monthBoundaries(toMonth)
  return { from: `${fromMonth}-01`, to }
}

function aggregateSalesRows(rows: SalesRow[]): ChannelBreakdown {
  const acc: ChannelBreakdown = {
    dineIn: 0, takeaway: 0, grabFood: 0,
    foodpanda: 0, shopeeFood: 0, catering: 0, other: 0,
  }
  for (const row of rows) {
    acc.dineIn     += p(row.dine_in_sales)
    acc.takeaway   += p(row.takeaway_sales)
    acc.grabFood   += p(row.grabfood_sales)
    acc.foodpanda  += p(row.foodpanda_sales)
    acc.shopeeFood += p(row.shopeefood_sales)
    acc.catering   += p(row.catering_sales)
    acc.other      += p(row.other_sales)
  }
  return acc
}

function channelTotal(b: ChannelBreakdown): number {
  return b.dineIn + b.takeaway + b.grabFood + b.foodpanda + b.shopeeFood + b.catering + b.other
}

// ─── 1. Daily sales queries ───────────────────────────────────────────────────

/**
 * Sum daily sales by channel for a single month.
 * month: "YYYY-MM"
 */
export async function fetchMonthlySalesBreakdown(
  businessId: string,
  month: string,
): Promise<MonthlySalesData> {
  const supabase = createClient()
  const { from, to } = monthBoundaries(month)

  const { data, error } = await supabase
    .from('daily_sales')
    .select('dine_in_sales, takeaway_sales, grabfood_sales, foodpanda_sales, shopeefood_sales, catering_sales, other_sales')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .gte('sale_date', from)
    .lt('sale_date', to)

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as SalesRow[]
  const byChannel = aggregateSalesRows(rows)

  return {
    month,
    totalRevenue: channelTotal(byChannel),
    byChannel,
    daysLogged: rows.length,
  }
}

/**
 * Today's sales entry, or null if the user has not logged today yet.
 */
export async function fetchTodaySales(businessId: string): Promise<TodaySalesData | null> {
  const supabase = createClient()
  // Use local date in "YYYY-MM-DD" format to avoid UTC-shift issues
  const today = new Date().toLocaleDateString('en-CA')  // en-CA formats as YYYY-MM-DD

  const { data, error } = await supabase
    .from('daily_sales')
    .select('dine_in_sales, takeaway_sales, grabfood_sales, foodpanda_sales, shopeefood_sales, catering_sales, other_sales')
    .eq('business_id', businessId)
    .eq('sale_date', today)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const byChannel = aggregateSalesRows([data as SalesRow])
  return { date: today, totalRevenue: channelTotal(byChannel), byChannel }
}

/**
 * Total revenue for a single calendar date. Returns 0 when no entry exists.
 * Used for day-on-day comparisons (e.g. today vs yesterday in the hero banner).
 */
export async function fetchSalesByDate(businessId: string, date: string): Promise<number> {
  const supabase = createClient()
  const { data } = await supabase
    .from('daily_sales')
    .select('dine_in_sales, takeaway_sales, grabfood_sales, foodpanda_sales, shopeefood_sales, catering_sales, other_sales')
    .eq('business_id', businessId)
    .eq('sale_date', date)
    .is('deleted_at', null)
    .maybeSingle()
  if (!data) return 0
  return channelTotal(aggregateSalesRows([data as SalesRow]))
}

/**
 * Multi-month revenue trend, fetched in one query (not per-month calls).
 * fromMonth / toMonth: "YYYY-MM", both inclusive.
 */
export async function fetchSalesTrend(
  businessId: string,
  fromMonth: string,
  toMonth: string,
): Promise<Array<{ month: string; revenue: number; daysLogged: number }>> {
  const supabase = createClient()
  const { from, to } = rangeBoundaries(fromMonth, toMonth)

  const { data, error } = await supabase
    .from('daily_sales')
    .select('sale_date, dine_in_sales, takeaway_sales, grabfood_sales, foodpanda_sales, shopeefood_sales, catering_sales, other_sales')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .gte('sale_date', from)
    .lt('sale_date', to)
    .order('sale_date', { ascending: true })

  if (error) throw new Error(error.message)

  const byMonth: Record<string, { revenue: number; days: number }> = {}
  for (const row of (data ?? []) as (SalesRow & { sale_date: string })[]) {
    const m = row.sale_date.slice(0, 7)
    if (!byMonth[m]) byMonth[m] = { revenue: 0, days: 0 }
    byMonth[m].revenue += channelTotal(aggregateSalesRows([row]))
    byMonth[m].days++
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { revenue, days }]) => ({ month, revenue, daysLogged: days }))
}

// ─── 2. COGS queries (from confirmed invoice items) ───────────────────────────

/**
 * Food cost totals grouped by ingredient category for a single month.
 * Only counts invoices with status = 'confirmed'.
 * Returns an empty array when no confirmed invoices exist — callers should
 * surface an empty-state prompt ("Confirm your invoices to see food cost data").
 */
export async function fetchMonthlyCogs(
  businessId: string,
  month: string,
): Promise<CogsByCategory[]> {
  const supabase = createClient()
  const { from, to } = monthBoundaries(month)

  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_items(amount, suggested_category)')
    .eq('business_id', businessId)
    .eq('status', 'confirmed')
    .is('deleted_at', null)
    .gte('invoice_date', from)
    .lt('invoice_date', to)

  if (error) throw new Error(error.message)

  const totals: Record<string, number> = {}
  for (const inv of (data ?? []) as { id: string; invoice_items: InvoiceItemRow[] }[]) {
    for (const item of (inv.invoice_items ?? [])) {
      const cat = item.suggested_category ?? 'others'
      totals[cat] = (totals[cat] ?? 0) + p(item.amount)
    }
  }

  return Object.entries(totals)
    .map(([category, totalAmount]) => ({ category, totalAmount }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
}

/**
 * List of invoices for a given month, with supplier name resolved from
 * ai_extracted_json (the name the AI/user entered at scan time).
 */
export async function fetchMonthlyInvoices(
  businessId: string,
  month: string,
): Promise<InvoiceSummary[]> {
  const supabase = createClient()
  const { from, to } = monthBoundaries(month)

  const { data, error } = await supabase
    .from('invoices')
    .select('id, supplier_id, invoice_number, invoice_date, total_amount, status, ai_extracted_json')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .gte('invoice_date', from)
    .lt('invoice_date', to)
    .order('invoice_date', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map(row => {
    const json = row.ai_extracted_json as Record<string, unknown> | null
    return {
      id:            row.id as string,
      supplierName:  (json?.supplierName as string | null) ?? null,
      invoiceNumber: row.invoice_number as string | null,
      invoiceDate:   row.invoice_date as string,
      totalAmount:   p(row.total_amount as string),
      status:        row.status as string,
      supplierId:    row.supplier_id as string | null,
    }
  })
}

/**
 * Fetch invoice line items by a list of invoice IDs.
 * Useful for building detailed COGS breakdowns when you already have the IDs.
 */
export async function fetchInvoiceItemsByInvoiceIds(
  invoiceIds: string[],
): Promise<InvoiceItemDetail[]> {
  if (invoiceIds.length === 0) return []

  const supabase = createClient()

  const { data, error } = await supabase
    .from('invoice_items')
    .select('id, invoice_id, item_name, quantity, unit_price, amount, suggested_category')
    .in('invoice_id', invoiceIds)

  if (error) throw new Error(error.message)

  return (data ?? []).map(row => ({
    id:                row.id as string,
    invoiceId:         row.invoice_id as string,
    itemName:          row.item_name as string,
    quantity:          row.quantity != null ? p(row.quantity as string) : null,
    unitPrice:         row.unit_price != null ? p(row.unit_price as string) : null,
    amount:            p(row.amount as string),
    suggestedCategory: row.suggested_category as string | null,
  }))
}

// ─── 3. Operating expense queries ─────────────────────────────────────────────

/**
 * Operating expenses grouped by category kind for a single month.
 * Both food-cost categories (meat, seafood…) and opex (rent, salaries…)
 * are included so the P&L can split them as needed.
 */
export async function fetchMonthlyOpex(
  businessId: string,
  month: string,
): Promise<OpexByCategory[]> {
  const supabase = createClient()
  const { from, to } = monthBoundaries(month)

  const { data, error } = await supabase
    .from('expenses')
    .select('amount, source, expense_categories(type, name)')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .gte('expense_date', from)
    .lt('expense_date', to)

  if (error) throw new Error(error.message)

  type OpexRow = {
    amount:             string
    source:             string
    expense_categories: { type: string; name: string } | null
  }
  const totals: Record<string, { name: string; total: number; manual: number }> = {}
  for (const row of (data ?? []) as unknown as OpexRow[]) {
    const kind   = row.expense_categories?.type ?? 'others'
    const name   = row.expense_categories?.name ?? 'Others'
    const amount = p(row.amount)
    if (!totals[kind]) totals[kind] = { name, total: 0, manual: 0 }
    totals[kind].total  += amount
    if (row.source === 'manual') totals[kind].manual += amount
  }

  return Object.entries(totals)
    .map(([categoryKind, { name: categoryName, total: totalAmount, manual: manualAmount }]) => ({
      categoryKind,
      categoryName,
      totalAmount,
      manualAmount,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
}

/**
 * Multi-month expense trend, fetched in one query.
 */
export async function fetchExpenseTrend(
  businessId: string,
  fromMonth: string,
  toMonth: string,
): Promise<Array<{ month: string; totalAmount: number }>> {
  const supabase = createClient()
  const { from, to } = rangeBoundaries(fromMonth, toMonth)

  const { data, error } = await supabase
    .from('expenses')
    .select('expense_date, amount')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .gte('expense_date', from)
    .lt('expense_date', to)

  if (error) throw new Error(error.message)

  const byMonth: Record<string, number> = {}
  for (const row of (data ?? []) as { expense_date: string; amount: string }[]) {
    const m = row.expense_date.slice(0, 7)
    byMonth[m] = (byMonth[m] ?? 0) + p(row.amount)
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, totalAmount]) => ({ month, totalAmount }))
}

/**
 * Recent expenses for the activity feed on the dashboard.
 */
export async function fetchRecentExpenses(
  businessId: string,
  limit = 10,
): Promise<RecentExpense[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('expenses')
    .select('id, expense_date, amount, description, expense_categories(type, name)')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .order('expense_date', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  type RecentRow = {
    id: string; expense_date: string; amount: string; description: string | null
    expense_categories: { type: string; name: string } | null
  }
  return (data ?? []).map(row => {
    const r = row as unknown as RecentRow
    return {
      id:           r.id,
      categoryKind: r.expense_categories?.type ?? 'others',
      categoryName: r.expense_categories?.name ?? 'Others',
      expenseDate:  r.expense_date,
      amount:       p(r.amount),
      vendor:       r.description ?? null,
    }
  })
}

// ─── Invoice spend trend (for supplier analytics) ────────────────────────────

export type InvoiceSpendMonth = {
  month:        string   // "YYYY-MM"
  totalAmount:  number
  invoiceCount: number
}

/**
 * Total supplier spend per month across the given range.
 * Combines confirmed invoices + manual expenses with a linked supplier_id.
 * Invoice-scan expenses are excluded (already counted via their parent invoice).
 * Used to render the 3-month spending trend chart on the Suppliers page.
 */
export async function fetchInvoiceSpendTrend(
  businessId: string,
  fromMonth: string,
  toMonth: string,
): Promise<InvoiceSpendMonth[]> {
  const supabase = createClient()
  const { from, to } = rangeBoundaries(fromMonth, toMonth)

  const [invoiceRes, expenseRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('invoice_date, total_amount')
      .eq('business_id', businessId)
      .eq('status', 'confirmed')
      .is('deleted_at', null)
      .gte('invoice_date', from)
      .lt('invoice_date', to),
    supabase
      .from('expenses')
      .select('expense_date, amount')
      .eq('business_id', businessId)
      .eq('source', 'manual')
      .is('deleted_at', null)
      .not('supplier_id', 'is', null)
      .gte('expense_date', from)
      .lt('expense_date', to),
  ])

  if (invoiceRes.error) throw new Error(invoiceRes.error.message)
  if (expenseRes.error) throw new Error(expenseRes.error.message)

  const byMonth: Record<string, { total: number; count: number }> = {}

  for (const row of (invoiceRes.data ?? []) as { invoice_date: string; total_amount: string }[]) {
    const m = row.invoice_date.slice(0, 7)
    if (!byMonth[m]) byMonth[m] = { total: 0, count: 0 }
    byMonth[m].total += p(row.total_amount)
    byMonth[m].count++
  }

  for (const row of (expenseRes.data ?? []) as { expense_date: string; amount: string }[]) {
    const m = row.expense_date.slice(0, 7)
    if (!byMonth[m]) byMonth[m] = { total: 0, count: 0 }
    byMonth[m].total += p(row.amount)
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { total, count }]) => ({
      month,
      totalAmount:  total,
      invoiceCount: count,
    }))
}

// ─── 4. Supplier spending queries ─────────────────────────────────────────────

/**
 * Total spend per supplier within the given month range.
 * Combines two sources to avoid double-counting:
 *   • Confirmed invoices (source: invoice scanner) — contributes to invoiceCount
 *   • Manual expenses linked to a supplier (source='manual') — amount only
 * Invoice-scan expenses are excluded from the expense query because they are
 * already represented by their parent invoice record.
 * fromMonth / toMonth: "YYYY-MM", both inclusive.
 */
export async function fetchSupplierSpendTotals(
  businessId: string,
  fromMonth: string,
  toMonth: string,
): Promise<SupplierSpend[]> {
  const supabase = createClient()
  const { from, to } = rangeBoundaries(fromMonth, toMonth)

  const [invoiceRes, expenseRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('supplier_id, invoice_date, total_amount, suppliers(id, name, category)')
      .eq('business_id', businessId)
      .eq('status', 'confirmed')
      .is('deleted_at', null)
      .not('supplier_id', 'is', null)
      .gte('invoice_date', from)
      .lt('invoice_date', to),
    supabase
      .from('expenses')
      .select('supplier_id, expense_date, amount, suppliers(id, name, category)')
      .eq('business_id', businessId)
      .eq('source', 'manual')
      .is('deleted_at', null)
      .not('supplier_id', 'is', null)
      .gte('expense_date', from)
      .lt('expense_date', to),
  ])

  if (invoiceRes.error) throw new Error(invoiceRes.error.message)
  if (expenseRes.error) throw new Error(expenseRes.error.message)

  type InvRow = {
    supplier_id: string | null
    invoice_date: string
    total_amount: string
    suppliers: { id: string; name: string; category: string } | null
  }
  type ExpRow = {
    supplier_id: string | null
    expense_date: string
    amount: string
    suppliers: { id: string; name: string; category: string } | null
  }

  const bySupplier: Record<string, SupplierSpend> = {}

  for (const row of (invoiceRes.data ?? []) as unknown as InvRow[]) {
    if (!row.supplier_id || !row.suppliers) continue
    const sid = row.supplier_id
    if (!bySupplier[sid]) {
      bySupplier[sid] = {
        supplierId:       sid,
        supplierName:     row.suppliers.name,
        supplierCategory: row.suppliers.category,
        totalAmount:      0,
        invoiceCount:     0,
        lastInvoiceDate:  null,
      }
    }
    bySupplier[sid].totalAmount  += p(row.total_amount)
    bySupplier[sid].invoiceCount++
    if (!bySupplier[sid].lastInvoiceDate || row.invoice_date > bySupplier[sid].lastInvoiceDate!) {
      bySupplier[sid].lastInvoiceDate = row.invoice_date
    }
  }

  // Add manual expense amounts (source='manual') to supplier totals.
  // These won't increment invoiceCount — semantics of that field remain "invoice count only".
  for (const row of (expenseRes.data ?? []) as unknown as ExpRow[]) {
    if (!row.supplier_id || !row.suppliers) continue
    const sid = row.supplier_id
    if (!bySupplier[sid]) {
      bySupplier[sid] = {
        supplierId:       sid,
        supplierName:     row.suppliers.name,
        supplierCategory: row.suppliers.category,
        totalAmount:      0,
        invoiceCount:     0,
        lastInvoiceDate:  null,
      }
    }
    bySupplier[sid].totalAmount += p(row.amount)
  }

  return Object.values(bySupplier).sort((a, b) => b.totalAmount - a.totalAmount)
}

// ─── 5. Platform commission queries ───────────────────────────────────────────

/**
 * Aggregated platform (GrabFood / Foodpanda / ShopeeFood) sales and estimated
 * commissions for a month. Returns only platforms with non-zero sales.
 */
export async function fetchPlatformSales(
  businessId: string,
  month: string,
): Promise<PlatformSalesData[]> {
  const supabase = createClient()
  const { from, to } = monthBoundaries(month)

  const { data, error } = await supabase
    .from('daily_sales')
    .select('grabfood_sales, foodpanda_sales, shopeefood_sales, grabfood_commission, foodpanda_commission, shopeefood_commission')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .gte('sale_date', from)
    .lt('sale_date', to)

  if (error) throw new Error(error.message)

  type PlatformRow = {
    grabfood_sales:        string
    foodpanda_sales:       string
    shopeefood_sales:      string
    grabfood_commission:   string | null
    foodpanda_commission:  string | null
    shopeefood_commission: string | null
  }
  const rows = (data ?? []) as PlatformRow[]

  // Sum sales and confirmed commissions separately
  const salesTotals: Record<Platform, number>       = { grabFood: 0, foodpanda: 0, shopeeFood: 0 }
  const commTotals:  Record<Platform, number | null>= { grabFood: null, foodpanda: null, shopeeFood: null }
  let grabCommSum = 0, pandaCommSum = 0, shopeeCommSum = 0
  let grabHasComm = false, pandaHasComm = false, shopeeHasComm = false

  for (const row of rows) {
    salesTotals.grabFood   += p(row.grabfood_sales)
    salesTotals.foodpanda  += p(row.foodpanda_sales)
    salesTotals.shopeeFood += p(row.shopeefood_sales)
    if (row.grabfood_commission   != null) { grabCommSum  += p(row.grabfood_commission);  grabHasComm  = true }
    if (row.foodpanda_commission  != null) { pandaCommSum += p(row.foodpanda_commission); pandaHasComm = true }
    if (row.shopeefood_commission != null) { shopeeCommSum+= p(row.shopeefood_commission);shopeeHasComm= true }
  }
  commTotals.grabFood   = grabHasComm  ? grabCommSum  : null
  commTotals.foodpanda  = pandaHasComm ? pandaCommSum : null
  commTotals.shopeeFood = shopeeHasComm? shopeeCommSum: null

  return (Object.entries(salesTotals) as [Platform, number][])
    .filter(([, sales]) => sales > 0)
    .map(([platform, totalSales]) => {
      const commissionRate    = PLATFORM_COMMISSION_RATES[platform]
      const actualCommission  = commTotals[platform]
      const estimatedCommission = totalSales * commissionRate
      const isEstimated       = actualCommission === null
      const effectiveCommission = actualCommission ?? estimatedCommission
      return {
        platform,
        totalSales,
        actualCommission,
        estimatedCommission,
        commissionRate,
        isEstimated,
        effectiveCommission,
        netReceived: totalSales - effectiveCommission,
      }
    })
    .sort((a, b) => b.totalSales - a.totalSales)
}

// ─── 6. Orchestrators ─────────────────────────────────────────────────────────

/**
 * Full P&L summary for a month. Runs revenue, COGS, and opex queries in
 * parallel and assembles the result. This is the primary function consumed
 * by the P&L report page.
 */
export async function fetchPnLSummary(
  businessId: string,
  month: string,
): Promise<PnLSummary> {
  const [salesData, cogsList, opexList] = await Promise.all([
    fetchMonthlySalesBreakdown(businessId, month),
    fetchMonthlyCogs(businessId, month),
    fetchMonthlyOpex(businessId, month),
  ])

  const totalCogs = cogsList.reduce((s, c) => s + c.totalAmount, 0)
  const totalOpex = opexList.reduce((s, c) => s + c.totalAmount, 0)
  const rev       = salesData.totalRevenue
  const grossProfit = rev - totalCogs
  const netProfit   = grossProfit - totalOpex

  return {
    month,
    totalRevenue:   rev,
    salesByChannel: salesData.byChannel,
    daysLogged:     salesData.daysLogged,
    cogsByCategory: cogsList,
    totalCogs,
    grossProfit,
    grossMarginPct: rev > 0 ? (grossProfit / rev) * 100 : 0,
    opexByCategory: opexList,
    totalOpex,
    netProfit,
    netMarginPct:   rev > 0 ? (netProfit / rev) * 100 : 0,
    foodCostPct:    rev > 0 ? (totalCogs / rev) * 100 : 0,
  }
}

/**
 * Key stats for the dashboard header cards. Runs all queries in parallel.
 */
export async function fetchDashboardStats(businessId: string): Promise<DashboardStats> {
  const today        = new Date().toLocaleDateString('en-CA')
  const currentMonth = today.slice(0, 7)

  const [todaySalesData, mtdSales, mtdCogsList, mtdOpexList] = await Promise.all([
    fetchTodaySales(businessId),
    fetchMonthlySalesBreakdown(businessId, currentMonth),
    fetchMonthlyCogs(businessId, currentMonth),
    fetchMonthlyOpex(businessId, currentMonth),
  ])

  const mtdCogs = mtdCogsList.reduce((s, c) => s + c.totalAmount, 0)
  const mtdOpex = mtdOpexList.reduce((s, c) => s + c.totalAmount, 0)
  const rev     = mtdSales.totalRevenue

  return {
    todaySales:  todaySalesData?.totalRevenue ?? 0,
    todayDate:   today,
    mtdRevenue:  rev,
    mtdExpenses: mtdCogs + mtdOpex,
    mtdCogs,
    foodCostPct: rev > 0 ? (mtdCogs / rev) * 100 : 0,
    daysLogged:  mtdSales.daysLogged,
  }
}

/**
 * Multi-month revenue + expense trend for the dashboard profit chart.
 * Fetches all sales and expenses in two queries (one per table) regardless
 * of how many months are requested, then groups in-memory.
 */
export async function fetchMonthlyTrend(
  businessId: string,
  fromMonth: string,
  toMonth: string,
): Promise<TrendPoint[]> {
  const [salesTrend, expenseTrend] = await Promise.all([
    fetchSalesTrend(businessId, fromMonth, toMonth),
    fetchExpenseTrend(businessId, fromMonth, toMonth),
  ])

  // Build a union of all months present in either dataset
  const months = new Set([
    ...salesTrend.map(p => p.month),
    ...expenseTrend.map(p => p.month),
  ])

  const salesMap   = new Map(salesTrend.map(p => [p.month, p]))
  const expenseMap = new Map(expenseTrend.map(p => [p.month, p]))

  return Array.from(months)
    .sort()
    .map(month => {
      const rev      = salesMap.get(month)?.revenue    ?? 0
      const expenses = expenseMap.get(month)?.totalAmount ?? 0
      return {
        month,
        revenue:    rev,
        expenses,
        profit:     rev - expenses,
        daysLogged: salesMap.get(month)?.daysLogged ?? 0,
      }
    })
}
