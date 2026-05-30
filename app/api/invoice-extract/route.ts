import { NextRequest, NextResponse } from 'next/server'
import {
  extractInvoice,
  validateInput,
  type InvoiceExtraction,
  type ExtractionInput,
} from '@/lib/ai/invoice-extractor'

// ─── Response types ───────────────────────────────────────────────────────────

/** Success response shape returned to the client */
export interface ExtractSuccessResponse {
  ok: true
  data: Omit<InvoiceExtraction, '_extractedAt' | '_rawText'>
}

/** Error response shape returned to the client */
export interface ExtractErrorResponse {
  ok: false
  error: string
  /** Machine-readable code for client-side handling */
  code: 'VALIDATION_ERROR' | 'EXTRACTION_FAILED' | 'UNSUPPORTED_INPUT' | 'SERVER_ERROR'
}

export type ExtractResponse = ExtractSuccessResponse | ExtractErrorResponse

// ─── Accepted MIME types ──────────────────────────────────────────────────────

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

// ─── POST /api/invoice-extract ────────────────────────────────────────────────
//
// Accepts three input shapes — choose the one that fits your flow:
//
//   1. multipart/form-data  { file: File }
//      → Browser uploads the raw file directly.  Most common in the scanner UI.
//
//   2. application/json     { fileUrl: string }
//      → File is already in Supabase Storage; pass the signed/public URL.
//        Phase 1+: the OCR provider fetches it server-to-server.
//
//   3. application/json     { base64: string, mimeType: string }
//      → Pre-encoded on the client (useful for mobile / React Native later).

export async function POST(request: NextRequest): Promise<NextResponse<ExtractResponse>> {
  try {
    const contentType = request.headers.get('content-type') ?? ''

    let input: ExtractionInput

    // ── Shape 1: multipart/form-data ─────────────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file     = formData.get('file')

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json<ExtractErrorResponse>(
          { ok: false, error: 'Missing "file" field in form data', code: 'VALIDATION_ERROR' },
          { status: 400 },
        )
      }

      const mimeType = file.type || 'application/octet-stream'
      if (!ALLOWED_MIME.has(mimeType)) {
        return NextResponse.json<ExtractErrorResponse>(
          {
            ok:    false,
            error: `Unsupported file type "${mimeType}". Accepted: JPG, PNG, WebP, PDF.`,
            code:  'VALIDATION_ERROR',
          },
          { status: 415 },
        )
      }

      const MAX_BYTES = 10 * 1024 * 1024
      if (file.size > MAX_BYTES) {
        return NextResponse.json<ExtractErrorResponse>(
          { ok: false, error: 'File exceeds the 10 MB limit', code: 'VALIDATION_ERROR' },
          { status: 413 },
        )
      }

      input = { type: 'file', file }
    }

    // ── Shape 2 + 3: application/json ────────────────────────────────────────
    else if (contentType.includes('application/json')) {
      let body: Record<string, unknown>
      try {
        body = await request.json()
      } catch {
        return NextResponse.json<ExtractErrorResponse>(
          { ok: false, error: 'Request body is not valid JSON', code: 'VALIDATION_ERROR' },
          { status: 400 },
        )
      }

      // Shape 2 — fileUrl
      if (typeof body.fileUrl === 'string') {
        if (!body.fileUrl.startsWith('http')) {
          return NextResponse.json<ExtractErrorResponse>(
            { ok: false, error: 'fileUrl must be an absolute HTTP/HTTPS URL', code: 'VALIDATION_ERROR' },
            { status: 400 },
          )
        }
        input = { type: 'url', fileUrl: body.fileUrl }
      }

      // Shape 3 — base64
      else if (typeof body.base64 === 'string') {
        const mimeType = typeof body.mimeType === 'string' ? body.mimeType : ''
        if (!ALLOWED_MIME.has(mimeType)) {
          return NextResponse.json<ExtractErrorResponse>(
            {
              ok:    false,
              error: `Missing or unsupported mimeType "${mimeType}"`,
              code:  'VALIDATION_ERROR',
            },
            { status: 400 },
          )
        }
        if (body.base64.length === 0) {
          return NextResponse.json<ExtractErrorResponse>(
            { ok: false, error: 'base64 data is empty', code: 'VALIDATION_ERROR' },
            { status: 400 },
          )
        }
        input = { type: 'base64', data: body.base64, mimeType }
      }

      else {
        return NextResponse.json<ExtractErrorResponse>(
          {
            ok:    false,
            error: 'JSON body must contain "fileUrl" (string) or "base64" + "mimeType" (strings)',
            code:  'UNSUPPORTED_INPUT',
          },
          { status: 400 },
        )
      }
    }

    // ── Unknown content type ──────────────────────────────────────────────────
    else {
      return NextResponse.json<ExtractErrorResponse>(
        {
          ok:    false,
          error: 'Use multipart/form-data (file upload) or application/json (fileUrl or base64)',
          code:  'UNSUPPORTED_INPUT',
        },
        { status: 415 },
      )
    }

    // ── Run extractor ─────────────────────────────────────────────────────────
    // validateInput is also called inside extractInvoice, but we call it here
    // first so validation errors produce 400 rather than 500.
    const validationError = validateInput(input)
    if (validationError) {
      return NextResponse.json<ExtractErrorResponse>(
        { ok: false, error: validationError, code: 'VALIDATION_ERROR' },
        { status: 400 },
      )
    }

    const result = await extractInvoice(input)

    // Strip internal audit fields before sending to client
    const { _extractedAt: _, _rawText: __, ...publicData } = result

    return NextResponse.json<ExtractSuccessResponse>({ ok: true, data: publicData })

  } catch (err) {
    // Distinguish a known extraction failure from an unexpected server crash
    const message = err instanceof Error ? err.message : String(err)
    const isValidation = message.toLowerCase().includes('unsupported') ||
                         message.toLowerCase().includes('exceeds') ||
                         message.toLowerCase().includes('empty')

    return NextResponse.json<ExtractErrorResponse>(
      {
        ok:    false,
        error: message,
        code:  isValidation ? 'VALIDATION_ERROR' : 'EXTRACTION_FAILED',
      },
      { status: isValidation ? 400 : 500 },
    )
  }
}

// Only POST is supported
export function GET(): NextResponse<ExtractErrorResponse> {
  return NextResponse.json(
    { ok: false, error: 'Method not allowed. Use POST.', code: 'VALIDATION_ERROR' },
    { status: 405 },
  )
}
