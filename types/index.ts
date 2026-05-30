// ─── Domain types ────────────────────────────────────────────────────────────

export type BusinessType =
  | 'restaurant'
  | 'cafe'
  | 'bakery'
  | 'cloud_kitchen'
  | 'food_stall'

export type Language = 'en' | 'zh-CN'

export interface Business {
  id: string
  ownerId: string
  name: string
  type: BusinessType
  currency: string
  language: Language
  logoUrl?: string
  address?: string
  phone?: string
  createdAt: string
}

// ─── Sales ───────────────────────────────────────────────────────────────────

export type SalesChannel =
  | 'dine_in'
  | 'takeaway'
  | 'grab'
  | 'foodpanda'
  | 'shopee'
  | 'others'

export interface SalesEntry {
  id: string
  businessId: string
  entryDate: string      // ISO date e.g. "2026-05-15"
  totalAmount: string    // decimal string e.g. "2340.00"
  channels: Partial<Record<SalesChannel, string>>
  note?: string
  createdAt: string
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

export type SupplierCategory =
  | 'food'
  | 'seafood'
  | 'meat'
  | 'vegetables'
  | 'packaging'
  | 'beverages'
  | 'cleaning'
  | 'others'

export interface Supplier {
  id: string
  businessId: string
  name: string
  category: SupplierCategory
  contactName?: string
  phone?: string
  email?: string
  notes?: string
  /** Computed / derived — total spend this calendar month */
  monthlySpend?: string
  /** Outstanding unpaid balance */
  outstandingAmount?: string
  /** ISO date of the most recent invoice */
  lastInvoiceDate?: string | null
  /** Total invoices received from this supplier */
  invoiceCount?: number
  createdAt: string
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'processing' | 'pending_review' | 'confirmed'

export type FoodCategory =
  | 'meat'
  | 'seafood'
  | 'vegetables'
  | 'dairy'
  | 'dry_goods'
  | 'beverages'
  | 'packaging'
  | 'others'

export interface InvoiceItem {
  id: string
  invoiceId: string
  description: string
  category: FoodCategory | null
  quantity: string | null
  unitPrice: string | null
  lineTotal: string
}

export interface Invoice {
  id: string
  businessId: string
  supplierId: string | null
  supplierName: string
  invoiceNumber: string | null
  invoiceDate: string
  total: string
  currency: string
  fileUrl: string | null
  status: InvoiceStatus
  extractedJson?: ExtractedInvoice | null
  items: InvoiceItem[]
  createdAt: string
}

// ─── AI Extraction ───────────────────────────────────────────────────────────

export interface ExtractedInvoice {
  supplierName: string | null
  invoiceNumber: string | null
  invoiceDate: string | null
  currency: string
  subtotal: string | null
  tax: string | null
  total: string | null
  items: Array<{
    description: string
    category: string | null
    quantity: string | null
    unitPrice: string | null
    lineTotal: string | null
  }>
  confidence: number
  rawText?: string
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'ewallet'
export type ExpenseSource  = 'manual' | 'invoice_scan'

export type ExpenseCategoryKind =
  // Food cost
  | 'meat' | 'seafood' | 'vegetables' | 'dry_goods' | 'beverages'
  | 'packaging' | 'sauce_seasoning'
  // Operating
  | 'rent' | 'salaries' | 'utilities' | 'marketing'
  | 'repairs' | 'cleaning' | 'pos_software' | 'delivery_commission'
  | 'others'

export interface ExpenseCategory {
  id: string
  businessId: string
  name: string
  kind: ExpenseCategoryKind
}

export interface Expense {
  id: string
  businessId: string
  categoryId: string
  categoryName: string
  categoryKind: ExpenseCategoryKind
  expenseDate: string
  amount: string
  supplierId?: string | null
  supplierName?: string        // resolved from JOIN — preferred display name
  vendor?: string              // legacy: from description column (invoice_scan / old entries)
  note?: string
  paymentMethod?: PaymentMethod
  source?: ExpenseSource
  attachmentUrl?: string | null
  createdAt: string
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface MonthlySummary {
  businessId: string
  year: number
  month: number           // 1-12
  revenue: string
  cogs: string
  grossProfit: string
  grossMarginPct: number  // 0-100
  operatingExpenses: string
  netProfit: string
  netMarginPct: number
  generatedAt: string
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export interface ApiResult<T> {
  ok: true
  data: T
}

export interface ApiError {
  ok: false
  error: string
}

export type ApiResponse<T> = ApiResult<T> | ApiError
