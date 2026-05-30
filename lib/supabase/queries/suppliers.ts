import { createClient } from '@/lib/supabase/client'
import type { Supplier, SupplierCategory } from '@/types'

// Map DB snake_case row to Supplier type
// monthlySpend / outstandingAmount / lastInvoiceDate are not stored in the DB;
// they're computed fields. We omit them here — the UI defaults gracefully to '0' / null.
function mapRow(row: Record<string, unknown>): Supplier {
  return {
    id:               row.id as string,
    businessId:       row.business_id as string,
    name:             row.name as string,
    category:         row.category as SupplierCategory,
    contactName:      (row.contact_person as string) || undefined,
    phone:            (row.phone as string) || undefined,
    email:            (row.email as string) || undefined,
    notes:            (row.notes as string) || undefined,
    monthlySpend:     '0.00',
    outstandingAmount: '0.00',
    lastInvoiceDate:  null,
    invoiceCount:     0,
    createdAt:        row.created_at as string,
  }
}

export async function fetchSuppliers(businessId: string): Promise<Supplier[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, business_id, name, category, contact_person, phone, email, notes, created_at')
    .eq('business_id', businessId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function insertSupplier(
  businessId: string,
  userId: string,
  payload: {
    name: string
    category: SupplierCategory
    contact_person?: string
    phone?: string
    email?: string
    notes?: string
  },
): Promise<Supplier> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ business_id: businessId, user_id: userId, ...payload })
    .select('id, business_id, name, category, contact_person, phone, email, notes, created_at')
    .single()
  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function updateSupplier(
  id: string,
  payload: {
    name?: string
    category?: SupplierCategory
    contact_person?: string
    phone?: string
    email?: string
    notes?: string
  },
): Promise<Supplier> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .update(payload)
    .eq('id', id)
    .select('id, business_id, name, category, contact_person, phone, email, notes, created_at')
    .single()
  if (error) throw new Error(error.message)
  return mapRow(data)
}

// Soft delete — preserves linked invoices / expenses
export async function softDeleteSupplier(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('suppliers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
