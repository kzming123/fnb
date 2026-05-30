// ─── Invoice Scanner mock data ────────────────────────────────────────────────

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExtractedItem {
  id: string
  description: string
  unit: string
  quantity: number
  unitPrice: number
  lineTotal: number
  category: string
  /** 0–1: fields with confidence < 0.7 should be highlighted for review */
  confidence: number
}

export interface ExtractedInvoiceData {
  supplierName:  string
  invoiceNumber: string
  invoiceDate:   string
  subtotal:      number
  taxAmount:     number
  totalAmount:   number
  currency:      string
  suggestedCategory: string
  /** 0–1 overall document confidence */
  confidence: number
  items: ExtractedItem[]
  /** ISO datetime the extraction ran */
  extractedAt: string
  /** Linked supplier from the Suppliers directory — null when unmatched or not yet linked */
  supplierId?: string | null
}

// ─── Food-cost category options ───────────────────────────────────────────────

export const INVOICE_CATEGORIES = [
  'Food Cost - Seafood',
  'Food Cost - Meat',
  'Food Cost - Vegetables',
  'Food Cost - Dry Goods',
  'Food Cost - Dairy',
  'Food Cost - Beverages',
  'Food Cost - Packaging',
  'Operating - Utilities',
  'Operating - Marketing',
  'Operating - Others',
] as const

export type InvoiceCategory = (typeof INVOICE_CATEGORIES)[number]

// ─── Mock extraction result ───────────────────────────────────────────────────
// Matches the user-specified example exactly.
// Items subtotal: 300 + 240 + 425 + 180 + 58.67 = 1,203.67
// Tax (SST 6.38%): 76.83
// Total: 1,280.50

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  INTEGRATION POINT — replace mockExtractInvoice() body with real API call  ║
// ║  when connecting OCR + Vision/LLM service.                                 ║
// ║  The function signature and return type must stay the same so the UI       ║
// ║  continues to work without changes.                                        ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export const mockExtractedInvoice: ExtractedInvoiceData = {
  supplierName:      'ABC Frozen Food Sdn Bhd',
  invoiceNumber:     'INV-2026-0522',
  invoiceDate:       '2026-05-22',
  subtotal:          1203.67,
  taxAmount:           76.83,
  totalAmount:       1280.50,
  currency:          'MYR',
  suggestedCategory: 'Food Cost - Seafood',
  confidence:        0.87,
  extractedAt:       new Date().toISOString(),
  items: [
    {
      id: 'item-1',
      description: 'Frozen Prawn (White)',
      unit:        'kg',
      quantity:    10,
      unitPrice:   30.00,
      lineTotal:   300.00,
      category:    'Food Cost - Seafood',
      confidence:  0.95,
    },
    {
      id: 'item-2',
      description: 'Chicken Breast (Boneless)',
      unit:        'kg',
      quantity:    20,
      unitPrice:   12.00,
      lineTotal:   240.00,
      category:    'Food Cost - Meat',
      confidence:  0.92,
    },
    {
      id: 'item-3',
      description: 'Cooking Oil — 5L Bottle',
      unit:        'carton',
      quantity:    5,
      unitPrice:   85.00,
      lineTotal:   425.00,
      category:    'Food Cost - Dry Goods',
      confidence:  0.88,
    },
    {
      id: 'item-4',
      description: 'Takeaway Packaging Box (50 pcs)',
      unit:        'pack',
      quantity:    10,
      unitPrice:   18.00,
      lineTotal:   180.00,
      category:    'Food Cost - Packaging',
      confidence:  0.84,
    },
    {
      id: 'item-5',
      description: 'Delivery & Handling',
      unit:        'trip',
      quantity:    1,
      unitPrice:   58.67,
      lineTotal:   58.67,
      // Low confidence — OCR often misreads handwritten delivery charges
      category:    'Operating - Others',
      confidence:  0.61,
    },
  ],
}

// ─── Mock extractor function ──────────────────────────────────────────────────
// Simulates 2.8 s processing time (detect → read → extract steps).
// REPLACE the body of this function with a real API call:
//   Option A: Google Document AI (REST or @google-cloud/documentai)
//   Option B: AWS Textract (standard or Analyze Expense)
//   Option C: Mistral OCR (pixtral-12b-2409 or mistral-ocr-latest)
//   Option D: OpenAI GPT-4o Vision (base64 image + JSON schema prompt)
//   Option E: Anthropic Claude claude-opus-4-7 Vision (messages API)
// The function must return ExtractedInvoiceData regardless of provider.

export async function mockExtractInvoice(_file: File | Blob): Promise<ExtractedInvoiceData> {
  // Simulate stepped processing time
  await new Promise((r) => setTimeout(r, 2800))
  return { ...mockExtractedInvoice, extractedAt: new Date().toISOString() }
}

// ─── Scan history (for the bottom list) ──────────────────────────────────────

export interface ScanRecord {
  id:           string
  supplierName: string
  invoiceNumber:string
  invoiceDate:  string
  totalAmount:  number
  status:       'confirmed' | 'pending_review' | 'processing'
  savedAt:      string
}

export const mockScanHistory: ScanRecord[] = [
  { id: 'sc-01', supplierName: 'Premium Meats Trading',    invoiceNumber: 'PMT-2026-0892', invoiceDate: '2026-05-27', totalAmount: 1250.00, status: 'confirmed',      savedAt: '2026-05-27T10:00:00Z' },
  { id: 'sc-02', supplierName: 'Fresh Produce Sdn Bhd',   invoiceNumber: 'FP-2026-1145',  invoiceDate: '2026-05-26', totalAmount:  580.50, status: 'confirmed',      savedAt: '2026-05-26T09:30:00Z' },
  { id: 'sc-03', supplierName: 'Seafood Direct Marketing', invoiceNumber: 'SDM-2026-0441', invoiceDate: '2026-05-25', totalAmount:  980.00, status: 'confirmed',      savedAt: '2026-05-25T08:00:00Z' },
  { id: 'sc-04', supplierName: 'Wholesale Dry Goods Hub',  invoiceNumber: 'WDG-2026-0234', invoiceDate: '2026-05-22', totalAmount:  745.00, status: 'confirmed',      savedAt: '2026-05-22T10:30:00Z' },
  { id: 'sc-05', supplierName: 'Beverage & Drinks Co',     invoiceNumber: 'BDC-2026-0567', invoiceDate: '2026-05-20', totalAmount:  430.00, status: 'pending_review', savedAt: '2026-05-20T14:00:00Z' },
]
