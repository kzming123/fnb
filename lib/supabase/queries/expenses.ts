import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpenseCategoryKind, PaymentMethod, ExpenseSource } from '@/types'

type ExpenseRow = {
  id: string
  business_id: string
  category_id: string
  expense_date: string
  amount: string
  payment_method: string | null
  description: string | null
  attachment_url: string | null
  source: string
  supplier_id: string | null
  created_at: string
  expense_categories: { name: string; type: string } | null
  suppliers:          { id: string; name: string } | null
}

function mapRow(row: ExpenseRow): Expense {
  return {
    id:            row.id,
    businessId:    row.business_id,
    categoryId:    row.category_id,
    categoryName:  row.expense_categories?.name ?? '',
    categoryKind:  (row.expense_categories?.type ?? 'others') as ExpenseCategoryKind,
    expenseDate:   row.expense_date,
    amount:        String(row.amount),
    supplierId:    row.supplier_id,
    supplierName:  row.suppliers?.name,
    // `vendor` keeps the description column text for backward compat display
    // (used by invoice_scan expenses and legacy entries with no supplier_id)
    vendor:        row.description ?? undefined,
    paymentMethod: (row.payment_method as PaymentMethod) ?? undefined,
    source:        (row.source as ExpenseSource) ?? 'manual',
    attachmentUrl: row.attachment_url,
    createdAt:     row.created_at,
  }
}

export async function fetchExpenses(businessId: string): Promise<Expense[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*, expense_categories(name, type), suppliers(id, name)')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .order('expense_date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(row => mapRow(row as ExpenseRow))
}

export type ExpenseCategory = { id: string; name: string; type: ExpenseCategoryKind }

export async function fetchExpenseCategories(businessId: string): Promise<ExpenseCategory[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expense_categories')
    .select('id, name, type')
    .eq('business_id', businessId)
    .order('type')
  if (error) throw new Error(error.message)
  return (data ?? []) as ExpenseCategory[]
}

export async function insertExpense(
  businessId: string,
  userId: string,
  payload: {
    category_id: string
    expense_date: string
    amount: number
    payment_method?: string
    description?: string
    source?: string
    supplier_id?: string | null
    attachment_url?: string | null
  },
): Promise<Expense> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenses')
    .insert({ business_id: businessId, user_id: userId, source: 'manual', ...payload })
    .select('*, expense_categories(name, type), suppliers(id, name)')
    .single()
  if (error) throw new Error(error.message)
  return mapRow(data as ExpenseRow)
}

export async function updateExpense(
  id: string,
  payload: {
    category_id?: string
    expense_date?: string
    amount?: number
    payment_method?: string
    description?: string
    supplier_id?: string | null
  },
): Promise<Expense> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', id)
    .select('*, expense_categories(name, type), suppliers(id, name)')
    .single()
  if (error) throw new Error(error.message)
  return mapRow(data as ExpenseRow)
}

// Soft delete — keeps history for P&L
export async function softDeleteExpense(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// Upload a receipt/attachment to Supabase Storage.
// INTEGRATION POINT — requires the 'expense-attachments' bucket to be created
// in Supabase dashboard: Storage → New bucket → Name: expense-attachments (Private, max 10 MB)
export async function uploadExpenseAttachment(file: File, userId: string): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('expense-attachments')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error(error.message)
  return path
}
