import { type FnBCategory, isFnBCategory } from '@/types/invoice'
import { EXTRACTION_PROMPT } from './invoice-prompt'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceExtractionItem {
  itemName:          string
  quantity:          number | null
  unitPrice:         number | null
  amount:            number
  suggestedCategory: FnBCategory | null
}

/**
 * Canonical output from the invoice extractor — returned by both the mock
 * and any real OCR/LLM implementation. The shape matches the API contract in
 * CLAUDE.md §10.1 and the /api/invoice-extract route.
 */
export interface InvoiceExtraction {
  supplierName:          string | null
  invoiceNumber:         string | null
  invoiceDate:           string | null      // ISO date, e.g. "2026-05-22"
  totalAmount:           number | null
  taxAmount:             number | null
  currency:              string             // default "MYR"
  suggestedMainCategory: FnBCategory | null
  suggestedSubCategory:  string | null
  confidenceScore:       number             // 0–1
  items:                 InvoiceExtractionItem[]
  /** ISO datetime the extraction ran — audit log only, not shown in UI */
  _extractedAt:          string
  /** Raw AI/OCR output — stored for Phase 3+ reprocessing, not exposed in API response */
  _rawText?:             string
}

// ─── Input types ──────────────────────────────────────────────────────────────

export type ExtractionInput =
  | { type: 'file';   file: File | Blob }
  | { type: 'url';    fileUrl: string }
  | { type: 'base64'; data: string; mimeType: string }

// ─── Validation ───────────────────────────────────────────────────────────────

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

const MAX_BYTES = 10 * 1024 * 1024  // 10 MB

export function validateInput(input: ExtractionInput): string | null {
  if (input.type === 'file') {
    if (input.file.size > MAX_BYTES) return 'File exceeds 10 MB limit'
    if (!ALLOWED_MIME.has(input.file.type)) {
      return `Unsupported file type "${input.file.type}". Upload JPG, PNG, WebP, or PDF.`
    }
  }
  if (input.type === 'base64') {
    if (!ALLOWED_MIME.has(input.mimeType)) {
      return `Unsupported MIME type "${input.mimeType}"`
    }
    if (!input.data || input.data.length === 0) return 'base64 data is empty'
  }
  if (input.type === 'url') {
    if (!input.fileUrl || !input.fileUrl.startsWith('http')) {
      return 'fileUrl must be a valid HTTP/HTTPS URL'
    }
  }
  return null
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// Realistic F&B invoice — this is what the real extractor should return for a
// similar invoice. Used as fallback when no AI API key is configured.

const MOCK_RESULT: Omit<InvoiceExtraction, '_extractedAt'> = {
  supplierName:          'ABC Frozen Food Sdn Bhd',
  invoiceNumber:         'INV-2026-0522',
  invoiceDate:           '2026-05-22',
  totalAmount:           1280.50,
  taxAmount:             76.83,
  currency:              'MYR',
  suggestedMainCategory: 'Seafood',
  suggestedSubCategory:  'Frozen Seafood',
  confidenceScore:       0.92,
  items: [
    { itemName: 'Frozen Prawn (White)',           quantity: 10, unitPrice: 30.00, amount: 300.00, suggestedCategory: 'Seafood'   },
    { itemName: 'Chicken Breast (Boneless)',       quantity: 20, unitPrice: 12.00, amount: 240.00, suggestedCategory: 'Meat'      },
    { itemName: 'Cooking Oil — 5L Bottle',         quantity:  5, unitPrice: 85.00, amount: 425.00, suggestedCategory: 'Dry Goods' },
    { itemName: 'Takeaway Packaging Box (50 pcs)', quantity: 10, unitPrice: 18.00, amount: 180.00, suggestedCategory: 'Packaging' },
    { itemName: 'Delivery & Handling',             quantity:  1, unitPrice: 58.67, amount:  58.67, suggestedCategory: 'Other'     },
  ],
}

// ─── Mock extractor ───────────────────────────────────────────────────────────
// Simulates ~2 s of processing so the scanning animation plays.
// Used when USE_MOCK_AI=true, or when no OPENAI_API_KEY is configured.

async function mockExtract(_input: ExtractionInput): Promise<InvoiceExtraction> {
  await new Promise(r => setTimeout(r, 2000))
  return { ...MOCK_RESULT, _extractedAt: new Date().toISOString() }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert any ExtractionInput to base64 + MIME type for vision API calls. */
async function toBase64AndMime(
  input: ExtractionInput,
): Promise<{ base64: string; mimeType: string }> {
  if (input.type === 'base64') {
    return { base64: input.data, mimeType: input.mimeType }
  }
  if (input.type === 'file') {
    const buf = Buffer.from(await input.file.arrayBuffer())
    return { base64: buf.toString('base64'), mimeType: input.file.type }
  }
  // type === 'url' — fetch from Supabase Storage or any public URL
  const res = await fetch(input.fileUrl)
  if (!res.ok) {
    throw new Error(`Failed to fetch invoice file (${res.status}): ${input.fileUrl}`)
  }
  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const mimeType    = contentType.split(';')[0].trim()
  const buf         = Buffer.from(await res.arrayBuffer())
  return { base64: buf.toString('base64'), mimeType }
}

/** Parse and validate the raw JSON string returned by any AI provider. */
function parseAiResponse(rawText: string): Omit<InvoiceExtraction, '_extractedAt'> {
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error(`AI returned invalid JSON: ${rawText.slice(0, 200)}`)
  }

  const safeNum = (v: unknown): number | null => {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  const safeCategory = (v: unknown): FnBCategory | null =>
    isFnBCategory(v) ? v : null

  const items: InvoiceExtractionItem[] = Array.isArray(parsed.items)
    ? (parsed.items as unknown[]).map((it) => {
        const item = it as Record<string, unknown>
        return {
          itemName:          String(item.itemName ?? ''),
          quantity:          safeNum(item.quantity),
          unitPrice:         safeNum(item.unitPrice),
          amount:            safeNum(item.amount) ?? 0,
          suggestedCategory: safeCategory(item.suggestedCategory),
        }
      })
    : []

  return {
    supplierName:          typeof parsed.supplierName === 'string'          ? parsed.supplierName          : null,
    invoiceNumber:         typeof parsed.invoiceNumber === 'string'         ? parsed.invoiceNumber         : null,
    invoiceDate:           typeof parsed.invoiceDate === 'string'           ? parsed.invoiceDate           : null,
    totalAmount:           safeNum(parsed.totalAmount),
    taxAmount:             safeNum(parsed.taxAmount),
    currency:              typeof parsed.currency === 'string'              ? parsed.currency              : 'MYR',
    suggestedMainCategory: safeCategory(parsed.suggestedMainCategory),
    suggestedSubCategory:  typeof parsed.suggestedSubCategory === 'string'  ? parsed.suggestedSubCategory  : null,
    confidenceScore:       typeof parsed.confidenceScore === 'number'       ? parsed.confidenceScore       : 0.5,
    items,
  }
}

// ─── Real extractor — OpenAI GPT-4o Vision ────────────────────────────────────
//
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  REAL AI CALL — OpenAI GPT-4o Vision                                        ║
// ║  Activated when OPENAI_API_KEY is set in .env.local                         ║
// ║  Model: gpt-4o  (vision + JSON mode)                                        ║
// ║  Cost estimate: ~$0.005–$0.02 per invoice depending on image resolution     ║
// ║  No npm package required — uses native fetch against the REST API            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * PDF extraction via the OpenAI Responses API.
 * Unlike Chat Completions, the Responses API accepts application/pdf as a
 * native file input — no image conversion required.
 */
async function openAiExtractPdf(base64: string): Promise<InvoiceExtraction> {
  const apiKey = process.env.OPENAI_API_KEY!

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:        'gpt-4o',
      instructions: EXTRACTION_PROMPT,
      text:         { format: { type: 'json_object' } },
      input: [
        {
          role:    'user',
          content: [
            {
              type:      'input_file',
              filename:  'invoice.pdf',
              file_data: `data:application/pdf;base64,${base64}`,
            },
            {
              type: 'input_text',
              text: 'Extract all invoice data from this PDF and return the JSON.',
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI Responses API error ${response.status}: ${errText.slice(0, 300)}`)
  }

  const json = await response.json() as {
    output: Array<{ type: string; content: Array<{ type: string; text: string }> }>
  }

  const rawText = json.output?.[0]?.content?.[0]?.text ?? ''
  const extraction = parseAiResponse(rawText)

  return {
    ...extraction,
    _extractedAt: new Date().toISOString(),
    _rawText:     rawText,
  }
}

async function openAiExtract(input: ExtractionInput): Promise<InvoiceExtraction> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const { base64, mimeType } = await toBase64AndMime(input)

  // PDFs go through the Responses API which supports them natively.
  // Images (JPG/PNG/WebP) use Chat Completions with image_url below.
  if (mimeType === 'application/pdf') {
    return openAiExtractPdf(base64)
  }

  // ── REAL AI MODEL CALL — OpenAI GPT-4o Vision API ────────────────────────
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:           'gpt-4o',
      response_format: { type: 'json_object' },
      max_tokens:      1024,
      messages: [
        {
          role:    'system',
          content: EXTRACTION_PROMPT,
        },
        {
          role:    'user',
          content: [
            {
              type:      'image_url',
              // Base64 data URL — works for JPG, PNG, WebP
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
            },
            {
              type: 'text',
              text: 'Extract all invoice data from this image and return the JSON.',
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${errText.slice(0, 300)}`)
  }

  const json = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }

  const rawText = json.choices[0]?.message?.content ?? ''
  const extraction = parseAiResponse(rawText)

  return {
    ...extraction,
    _extractedAt: new Date().toISOString(),
    _rawText:     rawText,  // stored for audit / reprocessing
  }
}

// ─── Alternative: Anthropic Claude Vision ─────────────────────────────────────
//
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  ALTERNATIVE REAL AI CALL — Anthropic Claude Vision                         ║
// ║  To activate: check process.env.ANTHROPIC_API_KEY in extractInvoice() and  ║
// ║  replace the openAiExtract() call with this function.                       ║
// ║                                                                              ║
// ║  Recommended models:                                                         ║
// ║  - claude-haiku-4-5-20251001  (fast, low cost — good for clear invoices)   ║
// ║  - claude-sonnet-4-6           (bilingual EN/ZH-CN, complex layouts)        ║
// ║                                                                              ║
// ║  async function anthropicExtract(input): Promise<InvoiceExtraction> {       ║
// ║    const { base64, mimeType } = await toBase64AndMime(input)                ║
// ║    // REAL AI MODEL CALL — Anthropic Messages API ↓                         ║
// ║    const response = await fetch('https://api.anthropic.com/v1/messages', {  ║
// ║      method: 'POST',                                                         ║
// ║      headers: {                                                              ║
// ║        'x-api-key':         process.env.ANTHROPIC_API_KEY!,                ║
// ║        'anthropic-version': '2023-06-01',                                   ║
// ║        'content-type':      'application/json',                             ║
// ║      },                                                                      ║
// ║      body: JSON.stringify({                                                  ║
// ║        model:      'claude-haiku-4-5-20251001',                             ║
// ║        max_tokens: 1024,                                                     ║
// ║        // Prompt caching reduces cost on repeated calls (schema is stable)  ║
// ║        system: [{ type: 'text', text: EXTRACTION_PROMPT,                    ║
// ║                   cache_control: { type: 'ephemeral' } }],                  ║
// ║        messages: [{ role: 'user', content: [                                ║
// ║          { type: 'image', source: {                                          ║
// ║              type: 'base64', media_type: mimeType, data: base64 } },        ║
// ║          { type: 'text', text: 'Extract invoice data. Return JSON only.' }  ║
// ║        ]}]                                                                   ║
// ║      })                                                                      ║
// ║    })                                                                        ║
// ║    const json = await response.json()                                        ║
// ║    const rawText = json.content[0].text                                      ║
// ║    return { ...parseAiResponse(rawText),                                     ║
// ║             _extractedAt: new Date().toISOString(), _rawText: rawText }      ║
// ║  }                                                                           ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract structured data from an invoice image or PDF.
 *
 * Routing logic (all checked server-side — keys never reach the client):
 *   USE_MOCK_AI=true                    → ALWAYS mock, even if a key is set
 *   USE_MOCK_AI!=true + OPENAI_API_KEY  → real extraction via GPT-4o Vision
 *   USE_MOCK_AI!=true + no key          → graceful mock fallback + dev warning
 *
 * USE_MOCK_AI lets you keep client demos predictable and free even when a real
 * key is configured on the deployment. It is a server-only variable (NOT
 * prefixed NEXT_PUBLIC), so neither it nor the API key is exposed to the browser.
 *
 * The function signature is stable — callers never change when the backend swaps.
 */
export async function extractInvoice(input: ExtractionInput): Promise<InvoiceExtraction> {
  const validationError = validateInput(input)
  if (validationError) throw new Error(validationError)

  // Explicit mock switch — forces the mock extractor regardless of API keys.
  const forceMock = process.env.USE_MOCK_AI === 'true'

  // ── REAL AI PATH — mock not forced AND a key is configured ────────────────
  if (!forceMock && process.env.OPENAI_API_KEY) {
    // REAL AI MODEL CALL ↓  (see openAiExtract above for full implementation)
    return openAiExtract(input)

    // Add Anthropic support here when ANTHROPIC_API_KEY is configured:
    // if (process.env.ANTHROPIC_API_KEY) return anthropicExtract(input)
  }

  // ── GRACEFUL FALLBACK — real AI was wanted but no key is available ─────────
  if (!forceMock && !process.env.OPENAI_API_KEY) {
    console.warn(
      '[invoice-extractor] USE_MOCK_AI is not "true" but OPENAI_API_KEY is missing — ' +
      'falling back to MOCK extraction. Set OPENAI_API_KEY to enable real AI, ' +
      'or set USE_MOCK_AI=true to silence this warning.'
    )
  }

  // ── MOCK PATH — USE_MOCK_AI=true, or no key configured ────────────────────
  return mockExtract(input)
}
