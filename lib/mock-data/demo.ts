/**
 * Demo data for "Kopitiam Demo Sdn Bhd"
 * Shown when no real Supabase business is loaded (unauthenticated visitors).
 * Never touches the database — all values are computed in-memory.
 */

import type { Supplier, Expense, SupplierCategory } from '@/types'
import type { SupplierSpend, InvoiceSpendMonth } from '@/lib/supabase/queries/pnl'
import type { SalesEntry } from '@/lib/mock-data/sales'

// ─── Business identity ────────────────────────────────────────────────────────

export const DEMO_BUSINESS_NAME = 'Kopitiam Demo Sdn Bhd'

// ─── Daily Sales ──────────────────────────────────────────────────────────────
// Generates entries for the current month up to yesterday.
// Channel split: dine-in 50 | takeaway 25 | GrabFood 15 | Foodpanda 10
// Payment split: cash 35 | card 40 | e-wallet 25

// Base daily sales by day-of-week (0=Sun … 6=Sat) — kopitiam pattern
const DOW_BASE = [2950, 2500, 2600, 2650, 2800, 3200, 3500]

// Per-day-of-month micro-variation so each entry looks naturally different
const DAY_DELTA = [
   0,  90, -110,  180,  -70,  140, -180,  260,  -90,   60,
-160, 200,  -40,   90, -130,  240,  -70,  130, -180,  110,
 -90, 230,  -40,  170, -110,  280,  -70,  190,  -90,  140, 60,
]

// Special-day notes (by 1-indexed day of month)
const DAY_NOTES: Record<number, string> = {
  1: 'First of month',
  5: 'Labour Day',
}

export function getDemoDailySales(filterMonth: string): SalesEntry[] {
  const today = new Date()
  const todayYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  // Only return data for the current month; prior months show empty
  if (filterMonth !== todayYM) return []

  const year  = today.getFullYear()
  const month = today.getMonth()           // 0-indexed
  const lastDay = Math.min(today.getDate() - 1, 27)
  if (lastDay <= 0) return []

  const entries: SalesEntry[] = []

  for (let day = 1; day <= lastDay; day++) {
    const dow   = new Date(year, month, day).getDay()
    const base  = DOW_BASE[dow]
    const delta = DAY_DELTA[day - 1] ?? 0
    const total = base + delta

    const dineIn    = Math.round(total * 0.50)
    const takeaway  = Math.round(total * 0.25)
    const grabFood  = Math.round(total * 0.15)
    const foodpanda = total - dineIn - takeaway - grabFood

    const cash    = Math.round(total * 0.35)
    const card    = Math.round(total * 0.40)
    const eWallet = total - cash - card

    const mm = String(month + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')

    entries.push({
      id:   `demo-s-${day}`,
      date: `${year}-${mm}-${dd}`,
      dineIn, takeaway, grabFood, foodpanda, shopeeFood: 0,
      totalSales:    total,
      cash, card, eWallet,
      totalPayments: total,
      notes: DAY_NOTES[day] ?? '',
    })
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date))
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

const DEMO_BIZ = 'demo-biz-001'

interface DemoSupplier {
  id: string; name: string; category: SupplierCategory
  contactName?: string; phone?: string; email?: string; notes?: string
  monthlySpend: string; invoiceCount: number; lastInvoiceDate: string
}

const RAW_SUPPLIERS: DemoSupplier[] = [
  {
    id: 'demo-sup-1', name: 'Premium Meats Trading',       category: 'meat',
    contactName: 'Ahmad Fadzil',     phone: '+60 12-345 6789', email: 'orders@premiummeats.my',
    notes: 'Halal certified. Delivers Mon / Wed / Fri.',
    monthlySpend: '9200.00', invoiceCount: 4,
    lastInvoiceDate: demoDate(-3),
  },
  {
    id: 'demo-sup-2', name: 'Seafood Direct Market',        category: 'seafood',
    contactName: 'Tan Wei Liang',    phone: '+60 16-234 5678', email: 'fresh@seafooddirect.my',
    notes: 'Live and frozen. Order by 5 PM for next-day delivery.',
    monthlySpend: '6100.00', invoiceCount: 3,
    lastInvoiceDate: demoDate(-5),
  },
  {
    id: 'demo-sup-3', name: 'Fresh Produce Sdn Bhd',        category: 'vegetables',
    contactName: 'Muthu Krishnan',   phone: '+60 11-876 5432', email: 'fresh@freshproduce.my',
    notes: 'Daily delivery. Cameron Highlands veg available.',
    monthlySpend: '3800.00', invoiceCount: 8,
    lastInvoiceDate: demoDate(-1),
  },
  {
    id: 'demo-sup-4', name: 'Wholesale Dry Goods',          category: 'food',
    contactName: 'Lee Chun Huat',    phone: '+60 3-8888 1234',  email: 'sales@wholesaledry.my',
    notes: 'Bi-weekly delivery. Bulk pricing above RM 2,000.',
    monthlySpend: '3650.00', invoiceCount: 2,
    lastInvoiceDate: demoDate(-8),
  },
  {
    id: 'demo-sup-5', name: 'Beverage Supply Hub',           category: 'beverages',
    contactName: 'Siti Norfazlin',   phone: '+60 12-999 0011', email: 'orders@beveragehub.my',
    notes: 'Soft drinks, bottled water, syrups. Monthly min order RM 1,500.',
    monthlySpend: '2200.00', invoiceCount: 2,
    lastInvoiceDate: demoDate(-6),
  },
  {
    id: 'demo-sup-6', name: 'Green Pack Solutions',          category: 'packaging',
    contactName: 'Kelvin Ng',        phone: '+60 3-7777 8899', email: 'kelvin@greenpack.my',
    notes: 'Eco-friendly takeaway boxes and cups. Monthly delivery.',
    monthlySpend: '980.00', invoiceCount: 1,
    lastInvoiceDate: demoDate(-10),
  },
  {
    id: 'demo-sup-7', name: 'Cleaning Pro Malaysia',         category: 'cleaning',
    contactName: 'Razak Ibrahim',    phone: '+60 17-456 7890', email: 'razak@cleaningpro.my',
    notes: 'Kitchen degreaser, dishwash, mop heads. Monthly order.',
    monthlySpend: '420.00', invoiceCount: 1,
    lastInvoiceDate: demoDate(-12),
  },
]

export const DEMO_SUPPLIERS: Supplier[] = RAW_SUPPLIERS.map(s => ({
  id:               s.id,
  businessId:       DEMO_BIZ,
  name:             s.name,
  category:         s.category,
  contactName:      s.contactName,
  phone:            s.phone,
  email:            s.email,
  notes:            s.notes,
  monthlySpend:     s.monthlySpend,
  outstandingAmount:'0.00',
  lastInvoiceDate:  s.lastInvoiceDate,
  invoiceCount:     s.invoiceCount,
  createdAt:        '2026-01-15T08:00:00Z',
}))

// Spending analytics — used in the SpendingAnalyticsSection
export const DEMO_SUPPLIER_SPEND: SupplierSpend[] = RAW_SUPPLIERS.map(s => ({
  supplierId:       s.id,
  supplierName:     s.name,
  supplierCategory: s.category,
  totalAmount:      parseFloat(s.monthlySpend),
  invoiceCount:     s.invoiceCount,
  lastInvoiceDate:  s.lastInvoiceDate,
})).sort((a, b) => b.totalAmount - a.totalAmount)

// Last month spend (slightly lower than current — shows positive trend)
export const DEMO_LAST_SUPPLIER_SPEND: SupplierSpend[] = DEMO_SUPPLIER_SPEND.map(s => ({
  ...s,
  totalAmount:  Math.round(s.totalAmount * 0.91),
  invoiceCount: Math.max(1, s.invoiceCount - 1),
}))

// 3-month spend trend
export function getDemoSpendTrend(currentMonth: string): InvoiceSpendMonth[] {
  const [y, m] = currentMonth.split('-').map(Number)
  const months = [-2, -1, 0].map(offset => {
    let tm = m + offset
    let ty = y
    while (tm <= 0) { tm += 12; ty-- }
    return `${ty}-${String(tm).padStart(2, '0')}`
  })
  const totals = [19_200, 23_800, 26_350]
  return months.map((month, i) => ({
    month,
    totalAmount:  totals[i],
    invoiceCount: [11, 14, 16][i],
  }))
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export function getDemoExpenses(): Expense[] {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = (n: number) => `${y}-${m}-${String(n).padStart(2, '0')}`

  return [
    // ── Food Cost (COGS) — invoice scan entries ──────────────────────────────
    mkExp('demo-e-01', 'demo-cat-meat',    'meat',            'Meat',            '9200.00', d(3),  'invoice_scan', 'demo-sup-1', 'Premium Meats Trading'),
    mkExp('demo-e-02', 'demo-cat-sea',     'seafood',         'Seafood',         '6100.00', d(5),  'invoice_scan', 'demo-sup-2', 'Seafood Direct Market'),
    mkExp('demo-e-03', 'demo-cat-veg',     'vegetables',      'Vegetables',      '3800.00', d(2),  'invoice_scan', 'demo-sup-3', 'Fresh Produce Sdn Bhd'),
    mkExp('demo-e-04', 'demo-cat-dry',     'dry_goods',       'Dry Goods',       '3650.00', d(8),  'invoice_scan', 'demo-sup-4', 'Wholesale Dry Goods'),
    mkExp('demo-e-05', 'demo-cat-bev',     'beverages',       'Beverages',       '2200.00', d(6),  'invoice_scan', 'demo-sup-5', 'Beverage Supply Hub'),
    mkExp('demo-e-06', 'demo-cat-pack',    'packaging',       'Packaging',       '980.00',  d(10), 'invoice_scan', 'demo-sup-6', 'Green Pack Solutions'),
    mkExp('demo-e-07', 'demo-cat-sauce',   'sauce_seasoning', 'Sauce & Seasoning','870.00', d(4),  'manual',       null,         'Local Sundry Shop'),

    // ── Operating Expenses ─────────────────────────────────────────────────
    mkExp('demo-e-08', 'demo-cat-rent',    'rent',                'Rent',                   '6500.00',  d(1),  'manual', null, 'Taman Melawati Shophouse'),
    mkExp('demo-e-09', 'demo-cat-sal',     'salaries',            'Salaries',               '19800.00', d(28), 'manual', null, 'Monthly payroll (5 staff)'),
    mkExp('demo-e-10', 'demo-cat-util',    'utilities',           'Utilities',              '1750.00',  d(15), 'manual', null, 'TNB + Indah Water'),
    mkExp('demo-e-11', 'demo-cat-mkt',     'marketing',           'Marketing',              '950.00',   d(7),  'manual', null, 'Facebook & Instagram Ads'),
    mkExp('demo-e-12', 'demo-cat-clean',   'cleaning',            'Cleaning',               '420.00',   d(12), 'invoice_scan', 'demo-sup-7', 'Cleaning Pro Malaysia'),
    mkExp('demo-e-13', 'demo-cat-pos',     'pos_software',        'POS / Software',         '350.00',   d(1),  'manual', null, 'StoreHub POS Monthly'),
    mkExp('demo-e-14', 'demo-cat-del',     'delivery_commission', 'Delivery Platform Commission','3850.00', d(20), 'manual', null, 'GrabFood + Foodpanda commission'),
    mkExp('demo-e-15', 'demo-cat-rep',     'repairs',             'Repairs',                '750.00',   d(18), 'manual', null, 'Kitchen exhaust hood repair'),
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function demoDate(daysOffset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  return d.toISOString().split('T')[0]
}

function mkExp(
  id: string,
  categoryId: string,
  categoryKind: Expense['categoryKind'],
  categoryName: string,
  amount: string,
  expenseDate: string,
  source: Expense['source'],
  supplierId: string | null,
  vendor?: string,
): Expense {
  return {
    id,
    businessId:   DEMO_BIZ,
    categoryId,
    categoryName,
    categoryKind,
    expenseDate,
    amount,
    supplierId,
    supplierName: supplierId ? vendor : undefined,
    vendor:       supplierId ? undefined : vendor,
    paymentMethod: source === 'manual' ? 'bank_transfer' : undefined,
    source,
    attachmentUrl: null,
    createdAt:    `${expenseDate}T08:00:00Z`,
  }
}
