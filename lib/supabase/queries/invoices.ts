import { createClient } from '@/lib/supabase/client'
import type { ExtractedInvoiceData } from '@/lib/mock-data/invoices'
import type { ScanRecord } from '@/lib/mock-data/invoices'

// Maps display category labels → DB enum values.
// Supports both the legacy "Food Cost - X" format and the current short FnBCategory format.

// invoice_items.suggested_category check constraint:
//   meat | seafood | vegetables | dry_goods | beverages | packaging | sauce_seasoning | others
const DISPLAY_CAT_TO_DB: Record<string, string> = {
  // Legacy format (kept for backward compat with existing data)
  'Food Cost - Seafood':    'seafood',
  'Food Cost - Meat':       'meat',
  'Food Cost - Vegetables': 'vegetables',
  'Food Cost - Dry Goods':  'dry_goods',
  'Food Cost - Dairy':      'others',
  'Food Cost - Beverages':  'beverages',
  'Food Cost - Packaging':  'packaging',
  'Operating - Utilities':  'others',
  'Operating - Marketing':  'others',
  'Operating - Others':     'others',
  // Current FnBCategory short format (from types/invoice.ts)
  'Meat':            'meat',
  'Seafood':         'seafood',
  'Vegetable':       'vegetables',
  'Dry Goods':       'dry_goods',
  'Beverage':        'beverages',
  'Packaging':       'packaging',
  'Sauce/Seasoning': 'sauce_seasoning',
  'Cleaning':        'others',   // not in invoice_items check — map to others
  'Equipment':       'others',
  'Utilities':       'others',
  'Other':           'others',
}

// expense_categories.type check constraint includes all food + operating kinds.
const DISPLAY_CAT_TO_KIND: Record<string, string> = {
  // Legacy format
  'Food Cost - Seafood':    'seafood',
  'Food Cost - Meat':       'meat',
  'Food Cost - Vegetables': 'vegetables',
  'Food Cost - Dry Goods':  'dry_goods',
  'Food Cost - Dairy':      'others',
  'Food Cost - Beverages':  'beverages',
  'Food Cost - Packaging':  'packaging',
  'Operating - Utilities':  'utilities',
  'Operating - Marketing':  'marketing',
  'Operating - Others':     'others',
  // Current FnBCategory short format
  'Meat':            'meat',
  'Seafood':         'seafood',
  'Vegetable':       'vegetables',
  'Dry Goods':       'dry_goods',
  'Beverage':        'beverages',
  'Packaging':       'packaging',
  'Sauce/Seasoning': 'sauce_seasoning',
  'Cleaning':        'cleaning',
  'Equipment':       'others',
  'Utilities':       'utilities',
  'Other':           'others',
}

// Upload the raw invoice file to the 'invoice-files' Supabase Storage bucket.
// INTEGRATION POINT — bucket must exist in Supabase dashboard:
//   Storage → New bucket → Name: invoice-files  (Private, max 10 MB)
//   Allowed MIME: image/jpeg, image/png, image/webp, application/pdf
//   Storage RLS: users can only read/write their own {user_id}/ prefix
export async function uploadInvoiceFile(file: File, userId: string): Promise<string> {
  const supabase = createClient()
  const ext  = file.name.split('.').pop() ?? 'bin'
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('invoice-files')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error(error.message)
  return path
}

// Save a confirmed invoice + its line items to the DB.
// Returns the newly created invoice UUID.
export async function saveInvoice(
  businessId: string,
  userId: string,
  data: ExtractedInvoiceData,
  fileUrl: string | null,
): Promise<string> {
  const supabase = createClient()

  // 1. Insert invoice header
  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .insert({
      business_id:      businessId,
      user_id:          userId,
      supplier_id:      data.supplierId ?? null,
      invoice_number:   data.invoiceNumber,
      invoice_date:     data.invoiceDate,
      total_amount:     data.totalAmount,
      tax_amount:       data.taxAmount,
      confidence_score: data.confidence,
      status:           'confirmed',
      file_url:         fileUrl,
      // Store full extraction JSON for audit; real OCR output goes here in Phase 1+
      ai_extracted_json: data,
    })
    .select('id')
    .single()
  if (invErr) throw new Error(invErr.message)

  // 2. Insert invoice line items
  if (data.items.length > 0) {
    const items = data.items.map(item => ({
      invoice_id:         inv.id,
      item_name:          item.description,
      quantity:           item.quantity,
      unit_price:         item.unitPrice,
      amount:             item.lineTotal,
      suggested_category: DISPLAY_CAT_TO_DB[item.category] ?? 'others',
    }))
    const { error: itemsErr } = await supabase.from('invoice_items').insert(items)
    if (itemsErr) throw new Error(itemsErr.message)
  }

  return inv.id
}

// Create an expense record that is linked to a saved invoice.
// Looks up the expense_category row by kind so the foreign key is correct.
export async function createExpenseFromInvoice(
  businessId: string,
  userId: string,
  data: ExtractedInvoiceData,
  categoryId: string,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('expenses').insert({
    business_id:    businessId,
    user_id:        userId,
    category_id:    categoryId,
    expense_date:   data.invoiceDate,
    amount:         data.totalAmount,
    supplier_id:    data.supplierId ?? null,
    // Description stores vendor + invoice number for easy identification
    description:    `${data.supplierName} — INV ${data.invoiceNumber}`,
    source:         'invoice_scan',
  })
  if (error) throw new Error(error.message)
}

// Resolve the category_id for a given suggestedCategory display label.
// Returns the id of the matching expense_category row (or the first 'others' row as fallback).
export async function resolveCategoryId(
  businessId: string,
  suggestedCategory: string,
): Promise<string | null> {
  const kind = DISPLAY_CAT_TO_KIND[suggestedCategory] ?? 'others'
  const supabase = createClient()
  const { data } = await supabase
    .from('expense_categories')
    .select('id')
    .eq('business_id', businessId)
    .eq('type', kind)
    .single()
  return data?.id ?? null
}

// Fetch recent invoices for the scan history list.
// Supplier name is extracted from the stored ai_extracted_json.
export async function fetchInvoiceHistory(businessId: string): Promise<ScanRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, invoice_date, total_amount, status, ai_extracted_json')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .order('invoice_date', { ascending: false })
    .limit(20)
  if (error) throw new Error(error.message)

  return (data ?? []).map(row => {
    const json = row.ai_extracted_json as Record<string, unknown> | null
    return {
      id:            row.id as string,
      supplierName:  (json?.supplierName as string) ?? 'Unknown Supplier',
      invoiceNumber: (row.invoice_number as string) ?? '',
      invoiceDate:   row.invoice_date as string,
      totalAmount:   parseFloat(String(row.total_amount)),
      status:        (row.status as ScanRecord['status']) ?? 'processing',
      savedAt:       row.invoice_date as string,
    }
  })
}
