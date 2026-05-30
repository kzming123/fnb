import type {
  Business,
  SalesEntry,
  Supplier,
  Invoice,
  Expense,
  MonthlySummary,
} from '@/types'

// ─── Business ────────────────────────────────────────────────────────────────

export const mockBusiness: Business = {
  id: 'biz-001',
  ownerId: 'user-001',
  name: 'Restaurant ABC',
  type: 'restaurant',
  currency: 'MYR',
  language: 'en',
  address: '12, Jalan Bukit Bintang, 55100 Kuala Lumpur',
  phone: '+60 12-345 6789',
  createdAt: '2026-01-01T00:00:00Z',
}

// ─── Sales (last 30 days) ────────────────────────────────────────────────────

function buildSalesHistory(): SalesEntry[] {
  const entries: SalesEntry[] = []
  const base = new Date('2026-05-29')

  const dailyRevenues = [
    2340, 1980, 2650, 3100, 2890, 2450, 1760,
    2560, 2230, 2890, 3200, 2750, 2100, 1890,
    2670, 2340, 2980, 3450, 3100, 2560, 2210,
    2780, 2450, 3120, 2890, 2650, 2100, 1980,
    2340, 2890,
  ]

  dailyRevenues.forEach((total, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]

    const dineIn = Math.round(total * 0.45 * 100) / 100
    const takeaway = Math.round(total * 0.25 * 100) / 100
    const grab = Math.round(total * 0.15 * 100) / 100
    const foodpanda = Math.round(total * 0.1 * 100) / 100
    const shopee = total - dineIn - takeaway - grab - foodpanda

    entries.push({
      id: `sale-${String(i + 1).padStart(3, '0')}`,
      businessId: 'biz-001',
      entryDate: dateStr,
      totalAmount: String(total),
      channels: {
        dine_in: String(dineIn),
        takeaway: String(takeaway),
        grab: String(grab),
        foodpanda: String(foodpanda),
        shopee: String(Math.round(shopee * 100) / 100),
      },
      createdAt: `${dateStr}T23:00:00Z`,
    })
  })

  return entries
}

export const mockSalesEntries: SalesEntry[] = buildSalesHistory()

// ─── Suppliers ───────────────────────────────────────────────────────────────

export const mockSuppliers: Supplier[] = [
  {
    id: 'sup-001',
    businessId: 'biz-001',
    name: 'Fresh Produce Sdn Bhd',
    category: 'vegetables',
    contactName: 'Ah Kow',
    phone: '+60 11-2345 6789',
    email: 'orders@freshproduce.my',
    monthlySpend: '580.50',
    outstandingAmount: '0.00',
    lastInvoiceDate: '2026-05-26',
    invoiceCount: 18,
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'sup-002',
    businessId: 'biz-001',
    name: 'Premium Meats Trading',
    category: 'meat',
    contactName: 'Rahman',
    phone: '+60 12-876 5432',
    email: 'sales@premiummeats.my',
    monthlySpend: '1250.00',
    outstandingAmount: '0.00',
    lastInvoiceDate: '2026-05-27',
    invoiceCount: 22,
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'sup-003',
    businessId: 'biz-001',
    name: 'Seafood Direct Marketing',
    category: 'seafood',
    contactName: 'Lim Ah Chong',
    phone: '+60 17-654 3210',
    monthlySpend: '980.00',
    outstandingAmount: '0.00',
    lastInvoiceDate: '2026-05-25',
    invoiceCount: 14,
    createdAt: '2026-01-08T00:00:00Z',
  },
  {
    id: 'sup-004',
    businessId: 'biz-001',
    name: 'Pristine Dairy & Food Supply',
    category: 'food',
    contactName: 'Priya',
    phone: '+60 16-543 2109',
    email: 'dairy@pristine.my',
    monthlySpend: '150.00',
    outstandingAmount: '150.00',
    lastInvoiceDate: '2026-05-20',
    invoiceCount: 8,
    notes: 'Net-30 payment terms',
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'sup-005',
    businessId: 'biz-001',
    name: 'Wholesale Dry Goods Hub',
    category: 'food',
    contactName: 'Tan Wei Liang',
    phone: '+60 13-432 1098',
    email: 'orders@wdghub.my',
    monthlySpend: '745.00',
    outstandingAmount: '0.00',
    lastInvoiceDate: '2026-05-22',
    invoiceCount: 16,
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'sup-006',
    businessId: 'biz-001',
    name: 'Beverage & Drinks Co',
    category: 'beverages',
    contactName: 'Kumar',
    phone: '+60 14-321 0987',
    email: 'orders@bdco.my',
    monthlySpend: '430.00',
    outstandingAmount: '0.00',
    lastInvoiceDate: '2026-05-20',
    invoiceCount: 10,
    createdAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'sup-007',
    businessId: 'biz-001',
    name: 'Green Pack Solutions',
    category: 'packaging',
    contactName: 'Michelle',
    phone: '+60 18-210 9876',
    email: 'sales@greenpacks.my',
    monthlySpend: '285.00',
    outstandingAmount: '0.00',
    lastInvoiceDate: '2026-05-18',
    invoiceCount: 6,
    createdAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'sup-008',
    businessId: 'biz-001',
    name: 'Halal Certified Poultry',
    category: 'meat',
    contactName: 'Roslan',
    phone: '+60 19-109 8765',
    monthlySpend: '480.00',
    outstandingAmount: '480.00',
    lastInvoiceDate: '2026-05-12',
    invoiceCount: 11,
    notes: 'JAKIM certified halal — payment due end of month',
    createdAt: '2026-03-15T00:00:00Z',
  },
  {
    id: 'sup-009',
    businessId: 'biz-001',
    name: 'Sauce & Spice Wholesale',
    category: 'food',
    contactName: 'Wong Kah Wai',
    phone: '+60 12-998 7766',
    monthlySpend: '320.00',
    outstandingAmount: '0.00',
    lastInvoiceDate: '2026-05-15',
    invoiceCount: 9,
    notes: 'Bulk discounts for orders above RM500',
    createdAt: '2026-03-20T00:00:00Z',
  },
  {
    id: 'sup-010',
    businessId: 'biz-001',
    name: 'CleanPro Supply Co',
    category: 'cleaning',
    contactName: 'Siti Rahimah',
    phone: '+60 11-7654 3210',
    email: 'supply@cleanpro.my',
    monthlySpend: '180.00',
    outstandingAmount: '0.00',
    lastInvoiceDate: '2026-05-08',
    invoiceCount: 4,
    createdAt: '2026-04-01T00:00:00Z',
  },
]

// ─── Invoices ────────────────────────────────────────────────────────────────

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    businessId: 'biz-001',
    supplierId: 'sup-002',
    supplierName: 'Premium Meats Trading',
    invoiceNumber: 'PMT-2026-0892',
    invoiceDate: '2026-05-27',
    total: '1250.00',
    currency: 'MYR',
    fileUrl: null,
    status: 'confirmed',
    items: [
      { id: 'ii-001', invoiceId: 'inv-001', description: 'Chicken Breast (10kg)', category: 'meat', quantity: '10', unitPrice: '22.00', lineTotal: '220.00' },
      { id: 'ii-002', invoiceId: 'inv-001', description: 'Pork Belly (5kg)', category: 'meat', quantity: '5', unitPrice: '38.00', lineTotal: '190.00' },
      { id: 'ii-003', invoiceId: 'inv-001', description: 'Beef Tenderloin (3kg)', category: 'meat', quantity: '3', unitPrice: '65.00', lineTotal: '195.00' },
      { id: 'ii-004', invoiceId: 'inv-001', description: 'Duck (4 pcs)', category: 'meat', quantity: '4', unitPrice: '45.00', lineTotal: '180.00' },
      { id: 'ii-005', invoiceId: 'inv-001', description: 'Lamb Shoulder (2kg)', category: 'meat', quantity: '2', unitPrice: '82.50', lineTotal: '165.00' },
      { id: 'ii-006', invoiceId: 'inv-001', description: 'Minced Pork (5kg)', category: 'meat', quantity: '5', unitPrice: '26.00', lineTotal: '130.00' },
      { id: 'ii-007', invoiceId: 'inv-001', description: 'Chicken Wings (5kg)', category: 'meat', quantity: '5', unitPrice: '14.00', lineTotal: '70.00' },
      { id: 'ii-008', invoiceId: 'inv-001', description: 'Pork Ribs (3kg)', category: 'meat', quantity: '3', unitPrice: '33.33', lineTotal: '100.00' },
    ],
    createdAt: '2026-05-27T10:00:00Z',
  },
  {
    id: 'inv-002',
    businessId: 'biz-001',
    supplierId: 'sup-001',
    supplierName: 'Fresh Produce Sdn Bhd',
    invoiceNumber: 'FP-2026-1145',
    invoiceDate: '2026-05-26',
    total: '580.50',
    currency: 'MYR',
    fileUrl: null,
    status: 'confirmed',
    items: [
      { id: 'ii-009', invoiceId: 'inv-002', description: 'Spinach (5kg)', category: 'vegetables', quantity: '5', unitPrice: '8.00', lineTotal: '40.00' },
      { id: 'ii-010', invoiceId: 'inv-002', description: 'Kai Lan (8kg)', category: 'vegetables', quantity: '8', unitPrice: '6.50', lineTotal: '52.00' },
      { id: 'ii-011', invoiceId: 'inv-002', description: 'Choy Sum (10kg)', category: 'vegetables', quantity: '10', unitPrice: '5.50', lineTotal: '55.00' },
      { id: 'ii-012', invoiceId: 'inv-002', description: 'Tomatoes (15kg)', category: 'vegetables', quantity: '15', unitPrice: '4.50', lineTotal: '67.50' },
      { id: 'ii-013', invoiceId: 'inv-002', description: 'Onions (20kg)', category: 'vegetables', quantity: '20', unitPrice: '3.50', lineTotal: '70.00' },
      { id: 'ii-014', invoiceId: 'inv-002', description: 'Garlic (5kg)', category: 'vegetables', quantity: '5', unitPrice: '12.00', lineTotal: '60.00' },
      { id: 'ii-015', invoiceId: 'inv-002', description: 'Ginger (3kg)', category: 'vegetables', quantity: '3', unitPrice: '9.00', lineTotal: '27.00' },
      { id: 'ii-016', invoiceId: 'inv-002', description: 'Lemongrass (2kg)', category: 'vegetables', quantity: '2', unitPrice: '7.00', lineTotal: '14.00' },
      { id: 'ii-017', invoiceId: 'inv-002', description: 'Bird Eye Chili (2kg)', category: 'vegetables', quantity: '2', unitPrice: '22.00', lineTotal: '44.00' },
      { id: 'ii-018', invoiceId: 'inv-002', description: 'Pandan Leaves (1kg)', category: 'vegetables', quantity: '1', unitPrice: '6.00', lineTotal: '6.00' },
      { id: 'ii-019', invoiceId: 'inv-002', description: 'Beansprouts (10kg)', category: 'vegetables', quantity: '10', unitPrice: '3.50', lineTotal: '35.00' },
      { id: 'ii-020', invoiceId: 'inv-002', description: 'Spring Onion (3kg)', category: 'vegetables', quantity: '3', unitPrice: '8.00', lineTotal: '24.00' },
      { id: 'ii-021', invoiceId: 'inv-002', description: 'Coriander (2kg)', category: 'vegetables', quantity: '2', unitPrice: '16.00', lineTotal: '32.00' },
      { id: 'ii-022', invoiceId: 'inv-002', description: 'Lady Fingers (5kg)', category: 'vegetables', quantity: '5', unitPrice: '6.50', lineTotal: '32.50' },
      { id: 'ii-023', invoiceId: 'inv-002', description: 'Brinjal (4kg)', category: 'vegetables', quantity: '4', unitPrice: '5.00', lineTotal: '20.00' },
    ],
    createdAt: '2026-05-26T09:30:00Z',
  },
  {
    id: 'inv-003',
    businessId: 'biz-001',
    supplierId: 'sup-003',
    supplierName: 'Seafood Direct Marketing',
    invoiceNumber: 'SDM-2026-0441',
    invoiceDate: '2026-05-25',
    total: '980.00',
    currency: 'MYR',
    fileUrl: null,
    status: 'confirmed',
    items: [
      { id: 'ii-024', invoiceId: 'inv-003', description: 'Tiger Prawns (3kg)', category: 'seafood', quantity: '3', unitPrice: '95.00', lineTotal: '285.00' },
      { id: 'ii-025', invoiceId: 'inv-003', description: 'Sea Bass (4kg)', category: 'seafood', quantity: '4', unitPrice: '65.00', lineTotal: '260.00' },
      { id: 'ii-026', invoiceId: 'inv-003', description: 'Squid (5kg)', category: 'seafood', quantity: '5', unitPrice: '28.00', lineTotal: '140.00' },
      { id: 'ii-027', invoiceId: 'inv-003', description: 'Clams (3kg)', category: 'seafood', quantity: '3', unitPrice: '22.00', lineTotal: '66.00' },
      { id: 'ii-028', invoiceId: 'inv-003', description: 'Crab (2kg)', category: 'seafood', quantity: '2', unitPrice: '72.00', lineTotal: '144.00' },
      { id: 'ii-029', invoiceId: 'inv-003', description: 'Fish Paste (2kg)', category: 'seafood', quantity: '2', unitPrice: '42.50', lineTotal: '85.00' },
    ],
    createdAt: '2026-05-25T08:00:00Z',
  },
  {
    id: 'inv-004',
    businessId: 'biz-001',
    supplierId: 'sup-005',
    supplierName: 'Wholesale Dry Goods Hub',
    invoiceNumber: 'WDG-2026-0234',
    invoiceDate: '2026-05-22',
    total: '745.00',
    currency: 'MYR',
    fileUrl: null,
    status: 'confirmed',
    items: [
      { id: 'ii-030', invoiceId: 'inv-004', description: 'Rice Jasmine (25kg)', category: 'dry_goods', quantity: '1', unitPrice: '95.00', lineTotal: '95.00' },
      { id: 'ii-031', invoiceId: 'inv-004', description: 'Cooking Oil (18L)', category: 'dry_goods', quantity: '2', unitPrice: '82.00', lineTotal: '164.00' },
      { id: 'ii-032', invoiceId: 'inv-004', description: 'Soy Sauce 5L', category: 'dry_goods', quantity: '3', unitPrice: '28.00', lineTotal: '84.00' },
      { id: 'ii-033', invoiceId: 'inv-004', description: 'Oyster Sauce 5L', category: 'dry_goods', quantity: '2', unitPrice: '35.00', lineTotal: '70.00' },
      { id: 'ii-034', invoiceId: 'inv-004', description: 'Salt (1kg x 10)', category: 'dry_goods', quantity: '1', unitPrice: '22.00', lineTotal: '22.00' },
      { id: 'ii-035', invoiceId: 'inv-004', description: 'Sugar (5kg)', category: 'dry_goods', quantity: '4', unitPrice: '14.50', lineTotal: '58.00' },
      { id: 'ii-036', invoiceId: 'inv-004', description: 'Noodles Dried (5kg)', category: 'dry_goods', quantity: '6', unitPrice: '18.00', lineTotal: '108.00' },
      { id: 'ii-037', invoiceId: 'inv-004', description: 'Sesame Oil 750ml', category: 'dry_goods', quantity: '4', unitPrice: '36.00', lineTotal: '144.00' },
    ],
    createdAt: '2026-05-22T10:30:00Z',
  },
  {
    id: 'inv-005',
    businessId: 'biz-001',
    supplierId: 'sup-006',
    supplierName: 'Beverage & Drinks Co',
    invoiceNumber: 'BDC-2026-0567',
    invoiceDate: '2026-05-20',
    total: '430.00',
    currency: 'MYR',
    fileUrl: null,
    status: 'pending_review',
    items: [
      { id: 'ii-038', invoiceId: 'inv-005', description: 'Soft Drinks Assorted (24 cans)', category: 'beverages', quantity: '5', unitPrice: '36.00', lineTotal: '180.00' },
      { id: 'ii-039', invoiceId: 'inv-005', description: 'Mineral Water 500ml (24 btl)', category: 'beverages', quantity: '6', unitPrice: '18.00', lineTotal: '108.00' },
      { id: 'ii-040', invoiceId: 'inv-005', description: 'Fresh Milk 2L', category: 'dairy', quantity: '10', unitPrice: '8.50', lineTotal: '85.00' },
      { id: 'ii-041', invoiceId: 'inv-005', description: 'Lemon Tea Packet (20s)', category: 'beverages', quantity: '5', unitPrice: '11.40', lineTotal: '57.00' },
    ],
    createdAt: '2026-05-20T14:00:00Z',
  },
  {
    id: 'inv-006',
    businessId: 'biz-001',
    supplierId: 'sup-007',
    supplierName: 'Green Pack Solutions',
    invoiceNumber: 'GPS-2026-0189',
    invoiceDate: '2026-05-18',
    total: '285.00',
    currency: 'MYR',
    fileUrl: null,
    status: 'confirmed',
    items: [
      { id: 'ii-042', invoiceId: 'inv-006', description: 'Takeaway Boxes (500 pcs)', category: 'packaging', quantity: '2', unitPrice: '65.00', lineTotal: '130.00' },
      { id: 'ii-043', invoiceId: 'inv-006', description: 'Paper Bags (200 pcs)', category: 'packaging', quantity: '3', unitPrice: '28.00', lineTotal: '84.00' },
      { id: 'ii-044', invoiceId: 'inv-006', description: 'Plastic Cutlery Set (100 pcs)', category: 'packaging', quantity: '3', unitPrice: '14.00', lineTotal: '42.00' },
      { id: 'ii-045', invoiceId: 'inv-006', description: 'Cling Film Roll', category: 'packaging', quantity: '3', unitPrice: '9.67', lineTotal: '29.00' },
    ],
    createdAt: '2026-05-18T09:00:00Z',
  },
]

// ─── Expenses ────────────────────────────────────────────────────────────────

export const mockExpenses: Expense[] = [
  // ── Food cost — from invoice scans ──────────────────────────────────────────
  { id: 'exp-001', businessId: 'biz-001', categoryId: 'cat-meat', categoryName: 'Meat', categoryKind: 'meat', expenseDate: '2026-05-27', amount: '1250.00', vendor: 'Premium Meats Trading', note: 'INV PMT-2026-0892', paymentMethod: 'bank_transfer', source: 'invoice_scan', createdAt: '2026-05-27T10:00:00Z' },
  { id: 'exp-002', businessId: 'biz-001', categoryId: 'cat-seafood', categoryName: 'Seafood', categoryKind: 'seafood', expenseDate: '2026-05-25', amount: '980.00', vendor: 'Seafood Direct Marketing', note: 'INV SDM-2026-0441', paymentMethod: 'bank_transfer', source: 'invoice_scan', createdAt: '2026-05-25T08:00:00Z' },
  { id: 'exp-003', businessId: 'biz-001', categoryId: 'cat-veg', categoryName: 'Vegetables', categoryKind: 'vegetables', expenseDate: '2026-05-26', amount: '580.50', vendor: 'Fresh Produce Sdn Bhd', note: 'INV FP-2026-1145', paymentMethod: 'bank_transfer', source: 'invoice_scan', createdAt: '2026-05-26T09:30:00Z' },
  { id: 'exp-004', businessId: 'biz-001', categoryId: 'cat-dry', categoryName: 'Dry Goods', categoryKind: 'dry_goods', expenseDate: '2026-05-22', amount: '745.00', vendor: 'Wholesale Dry Goods Hub', note: 'INV WDG-2026-0234', paymentMethod: 'bank_transfer', source: 'invoice_scan', createdAt: '2026-05-22T10:30:00Z' },
  { id: 'exp-005', businessId: 'biz-001', categoryId: 'cat-bev', categoryName: 'Beverages', categoryKind: 'beverages', expenseDate: '2026-05-20', amount: '430.00', vendor: 'Beverage & Drinks Co', note: 'INV BDC-2026-0567', paymentMethod: 'cash', source: 'invoice_scan', createdAt: '2026-05-20T14:00:00Z' },
  { id: 'exp-006', businessId: 'biz-001', categoryId: 'cat-pack', categoryName: 'Packaging', categoryKind: 'packaging', expenseDate: '2026-05-18', amount: '285.00', vendor: 'Green Pack Solutions', note: 'INV GPS-2026-0189', paymentMethod: 'bank_transfer', source: 'invoice_scan', createdAt: '2026-05-18T09:00:00Z' },
  { id: 'exp-007', businessId: 'biz-001', categoryId: 'cat-sauce', categoryName: 'Sauce & Seasoning', categoryKind: 'sauce_seasoning', expenseDate: '2026-05-15', amount: '320.00', vendor: 'Sauce & Spice Wholesale', note: 'Monthly seasoning restock', paymentMethod: 'cash', source: 'manual', createdAt: '2026-05-15T10:00:00Z' },
  // ── Operating ─────────────────────────────────────────────────────────────
  { id: 'exp-008', businessId: 'biz-001', categoryId: 'cat-rent', categoryName: 'Rent', categoryKind: 'rent', expenseDate: '2026-05-01', amount: '4500.00', vendor: 'LL Property Management', note: 'May 2026 monthly rent', paymentMethod: 'bank_transfer', source: 'manual', createdAt: '2026-05-01T10:00:00Z' },
  { id: 'exp-009', businessId: 'biz-001', categoryId: 'cat-util', categoryName: 'Utilities', categoryKind: 'utilities', expenseDate: '2026-05-05', amount: '820.00', vendor: 'TNB', note: 'April electricity bill', paymentMethod: 'ewallet', source: 'manual', createdAt: '2026-05-05T10:00:00Z' },
  { id: 'exp-010', businessId: 'biz-001', categoryId: 'cat-util', categoryName: 'Utilities', categoryKind: 'utilities', expenseDate: '2026-05-06', amount: '185.00', vendor: 'Air Selangor', note: 'April water bill', paymentMethod: 'ewallet', source: 'manual', createdAt: '2026-05-06T10:00:00Z' },
  { id: 'exp-011', businessId: 'biz-001', categoryId: 'cat-sal', categoryName: 'Salaries', categoryKind: 'salaries', expenseDate: '2026-05-31', amount: '9800.00', vendor: 'Staff Payroll May 2026', note: '4 staff: 2 kitchen, 1 service, 1 cashier', paymentMethod: 'bank_transfer', source: 'manual', createdAt: '2026-05-31T10:00:00Z' },
  { id: 'exp-012', businessId: 'biz-001', categoryId: 'cat-mktg', categoryName: 'Marketing', categoryKind: 'marketing', expenseDate: '2026-05-10', amount: '350.00', vendor: 'Meta Ads', note: 'Facebook & Instagram — Raya campaign', paymentMethod: 'card', source: 'manual', createdAt: '2026-05-10T10:00:00Z' },
  { id: 'exp-013', businessId: 'biz-001', categoryId: 'cat-mktg', categoryName: 'Marketing', categoryKind: 'marketing', expenseDate: '2026-05-18', amount: '200.00', vendor: 'Google Ads', note: 'Google Business promotion', paymentMethod: 'card', source: 'manual', createdAt: '2026-05-18T10:00:00Z' },
  { id: 'exp-014', businessId: 'biz-001', categoryId: 'cat-repair', categoryName: 'Repairs', categoryKind: 'repairs', expenseDate: '2026-05-14', amount: '230.00', vendor: 'Plumber Services', note: 'Kitchen drain blockage repair', paymentMethod: 'cash', source: 'manual', createdAt: '2026-05-14T10:00:00Z' },
  { id: 'exp-015', businessId: 'biz-001', categoryId: 'cat-repair', categoryName: 'Repairs', categoryKind: 'repairs', expenseDate: '2026-05-22', amount: '450.00', vendor: 'Sharp Equipment Sdn Bhd', note: 'Commercial fridge compressor service', paymentMethod: 'cash', source: 'manual', createdAt: '2026-05-22T10:00:00Z' },
  { id: 'exp-016', businessId: 'biz-001', categoryId: 'cat-clean', categoryName: 'Cleaning', categoryKind: 'cleaning', expenseDate: '2026-05-08', amount: '180.00', vendor: 'CleanPro Services', note: 'Monthly deep cleaning service', paymentMethod: 'cash', source: 'manual', createdAt: '2026-05-08T10:00:00Z' },
  { id: 'exp-017', businessId: 'biz-001', categoryId: 'cat-pos', categoryName: 'POS / Software', categoryKind: 'pos_software', expenseDate: '2026-05-01', amount: '150.00', vendor: 'Slurp POS', note: 'Monthly subscription', paymentMethod: 'card', source: 'manual', createdAt: '2026-05-01T09:00:00Z' },
  { id: 'exp-018', businessId: 'biz-001', categoryId: 'cat-deliv', categoryName: 'Delivery Commission', categoryKind: 'delivery_commission', expenseDate: '2026-05-31', amount: '1850.00', vendor: 'GrabFood Malaysia', note: 'May 2026 platform commission (deducted)', paymentMethod: 'bank_transfer', source: 'manual', createdAt: '2026-05-31T09:00:00Z' },
]

// ─── Monthly P&L ─────────────────────────────────────────────────────────────

export const mockMonthlySummary: MonthlySummary = {
  businessId: 'biz-001',
  year: 2026,
  month: 5,
  revenue: '75890.00',
  cogs: '24285.50',   // total of all invoices (confirmed)
  grossProfit: '51604.50',
  grossMarginPct: 68.0,
  operatingExpenses: '16535.00',
  netProfit: '35069.50',
  netMarginPct: 46.2,
  generatedAt: '2026-05-29T00:00:00Z',
}

// ─── Dashboard chart data ────────────────────────────────────────────────────

export const mockRevenueChartData = mockSalesEntries
  .slice(0, 30)
  .reverse()
  .map((entry, i) => ({
    date: entry.entryDate,
    revenue: parseFloat(entry.totalAmount),
    expenses: [380, 290, 450, 520, 410, 380, 290, 420, 350, 480, 510, 440, 320, 295,
      430, 380, 475, 560, 495, 415, 345, 445, 390, 510, 460, 420, 335, 310, 375, 465][i] ?? 350,
  }))

export const mockFoodCostData = [
  { category: 'Meat', amount: 8640, color: '#ef4444' },
  { category: 'Seafood', amount: 4900, color: '#3b82f6' },
  { category: 'Vegetables', amount: 3480, color: '#22c55e' },
  { category: 'Dry Goods', amount: 3680, color: '#f59e0b' },
  { category: 'Beverages', amount: 2150, color: '#8b5cf6' },
  { category: 'Packaging', amount: 855, color: '#ec4899' },
  { category: 'Dairy', amount: 580, color: '#06b6d4' },
]

// ─── Supplier YTD spend ───────────────────────────────────────────────────────

export const mockSupplierSpend: Record<string, string> = {
  'sup-001': '8,240.00',
  'sup-002': '22,150.00',
  'sup-003': '14,580.00',
  'sup-004': '3,460.00',
  'sup-005': '9,320.00',
  'sup-006': '5,180.00',
  'sup-007': '2,850.00',
  'sup-008': '7,640.00',
}
