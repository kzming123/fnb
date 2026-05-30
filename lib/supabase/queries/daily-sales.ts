import { createClient } from '@/lib/supabase/client'
import type { SalesEntry } from '@/lib/mock-data/sales'

// ─── DB row → SalesEntry ──────────────────────────────────────────────────────

type Row = {
  id: string
  sale_date: string
  dine_in_sales: string
  takeaway_sales: string
  grabfood_sales: string
  foodpanda_sales: string
  shopeefood_sales: string
  catering_sales: string
  other_sales: string
  // Commission columns — null until user enters actual amounts
  grabfood_commission:   string | null
  foodpanda_commission:  string | null
  shopeefood_commission: string | null
  cash_payment: string
  card_payment: string
  ewallet_payment: string
  other_payment: string
  notes: string | null
}

function pf(v: string | null | undefined): number {
  return parseFloat(String(v ?? '0')) || 0
}

function pfOrNull(v: string | null | undefined): number | null {
  if (v == null) return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

function mapRow(row: Row): SalesEntry {
  const dineIn     = pf(row.dine_in_sales)
  const takeaway   = pf(row.takeaway_sales)
  const grabFood   = pf(row.grabfood_sales)
  const foodpanda  = pf(row.foodpanda_sales)
  const shopeeFood = pf(row.shopeefood_sales)
  const cash       = pf(row.cash_payment)
  const card       = pf(row.card_payment)
  const eWallet    = pf(row.ewallet_payment)

  return {
    id:            row.id,
    date:          row.sale_date,
    dineIn, takeaway, grabFood, foodpanda, shopeeFood,
    totalSales:    dineIn + takeaway + grabFood + foodpanda + shopeeFood,
    grabFoodCommission:  pfOrNull(row.grabfood_commission),
    foodpandaCommission: pfOrNull(row.foodpanda_commission),
    shopeeCommission:    pfOrNull(row.shopeefood_commission),
    cash, card, eWallet,
    totalPayments: cash + card + eWallet,
    notes:         row.notes ?? '',
  }
}

// ─── Fetch entries for a month ────────────────────────────────────────────────
// month: "YYYY-MM" e.g. "2026-05"

export async function fetchDailySales(
  businessId: string,
  month: string,
): Promise<SalesEntry[]> {
  const supabase = createClient()
  const from = `${month}-01`
  // Compute next-month boundary using pure string arithmetic — avoids
  // toISOString() timezone pitfall (UTC vs local) for UTC+ timezones.
  const [year, mon] = month.split('-').map(Number)
  const nextYear    = mon === 12 ? year + 1 : year
  const nextMon     = mon === 12 ? 1 : mon + 1
  const to          = `${nextYear}-${String(nextMon).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('daily_sales')
    .select('id,sale_date,dine_in_sales,takeaway_sales,grabfood_sales,foodpanda_sales,shopeefood_sales,catering_sales,other_sales,grabfood_commission,foodpanda_commission,shopeefood_commission,cash_payment,card_payment,ewallet_payment,other_payment,notes')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .gte('sale_date', from)
    .lt('sale_date', to)
    .order('sale_date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(row => mapRow(row as Row))
}

// ─── Upsert (insert or update if same date exists) ───────────────────────────
// PostgreSQL ON CONFLICT cannot target a partial index (WHERE deleted_at IS NULL),
// so we implement upsert manually: check if an active row exists for that date,
// then UPDATE it or INSERT a new one.

export async function upsertDailySales(
  businessId: string,
  userId: string,
  entry: SalesEntry,
): Promise<SalesEntry> {
  const supabase = createClient()

  const values = {
    dine_in_sales:         entry.dineIn,
    takeaway_sales:        entry.takeaway,
    grabfood_sales:        entry.grabFood,
    foodpanda_sales:       entry.foodpanda,
    shopeefood_sales:      entry.shopeeFood,
    catering_sales:        0,
    other_sales:           0,
    grabfood_commission:   entry.grabFoodCommission  ?? null,
    foodpanda_commission:  entry.foodpandaCommission ?? null,
    shopeefood_commission: entry.shopeeCommission    ?? null,
    cash_payment:          entry.cash,
    card_payment:          entry.card,
    ewallet_payment:       entry.eWallet,
    other_payment:         0,
    notes:                 entry.notes || null,
  }

  // 1. Check whether an active entry already exists for this business + date
  const { data: existing } = await supabase
    .from('daily_sales')
    .select('id')
    .eq('business_id', businessId)
    .eq('sale_date', entry.date)
    .is('deleted_at', null)
    .maybeSingle()

  let data: Row
  let error: { message: string } | null

  if (existing?.id) {
    // 2a. Row exists — update it
    const res = await supabase
      .from('daily_sales')
      .update(values)
      .eq('id', existing.id)
      .select('*')
      .single()
    data  = res.data as Row
    error = res.error
  } else {
    // 2b. No row — insert a new one
    const res = await supabase
      .from('daily_sales')
      .insert({ business_id: businessId, user_id: userId, sale_date: entry.date, ...values })
      .select('*')
      .single()
    data  = res.data as Row
    error = res.error
  }

  if (error) throw new Error(error.message)
  return mapRow(data)
}

// ─── Update by ID (used for edit mode — avoids date-conflict issues) ─────────
// Unlike upsertDailySales, this targets the specific row by PK and can safely
// change the sale_date without accidentally creating a duplicate row.

export async function updateDailySalesById(
  id: string,
  entry: SalesEntry,
): Promise<SalesEntry> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('daily_sales')
    .update({
      sale_date:             entry.date,
      dine_in_sales:         entry.dineIn,
      takeaway_sales:        entry.takeaway,
      grabfood_sales:        entry.grabFood,
      foodpanda_sales:       entry.foodpanda,
      shopeefood_sales:      entry.shopeeFood,
      catering_sales:        0,
      other_sales:           0,
      grabfood_commission:   entry.grabFoodCommission  ?? null,
      foodpanda_commission:  entry.foodpandaCommission ?? null,
      shopeefood_commission: entry.shopeeCommission    ?? null,
      cash_payment:          entry.cash,
      card_payment:          entry.card,
      ewallet_payment:       entry.eWallet,
      other_payment:         0,
      notes:                 entry.notes || null,
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapRow(data as Row)
}

// ─── Soft delete ──────────────────────────────────────────────────────────────

export async function softDeleteDailySales(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('daily_sales')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
