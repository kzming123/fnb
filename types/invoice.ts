// ─── F&B invoice categories ───────────────────────────────────────────────────
// Single source of truth for the 11 cost/expense categories used across:
//   - AI extraction prompt (lib/ai/invoice-prompt.ts)
//   - InvoiceExtraction type (lib/ai/invoice-extractor.ts)
//   - Category selector UI (components/invoice/ExtractionResult.tsx)
//
// If you add a category here, also update invoice-prompt.ts category guide.

export const FNB_CATEGORIES = [
  'Meat',
  'Seafood',
  'Vegetable',
  'Dry Goods',
  'Beverage',
  'Packaging',
  'Sauce/Seasoning',
  'Cleaning',
  'Equipment',
  'Utilities',
  'Other',
] as const

export type FnBCategory = (typeof FNB_CATEGORIES)[number]

export function isFnBCategory(value: unknown): value is FnBCategory {
  return FNB_CATEGORIES.includes(value as FnBCategory)
}
