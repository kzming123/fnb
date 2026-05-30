'use client'

import { useState, useCallback, useEffect } from 'react'
import { FileText, Loader2, ScanLine } from 'lucide-react'

import { InvoiceUploader }  from '@/components/invoice/InvoiceUploader'
import { ScanningState }    from '@/components/invoice/ScanningState'
import { ExtractionResult } from '@/components/invoice/ExtractionResult'
import { Badge }            from '@/components/ui/badge'

import { type ExtractedInvoiceData, type ScanRecord } from '@/lib/mock-data/invoices'
import { type ExtractSuccessResponse } from '@/app/api/invoice-extract/route'
import {
  uploadInvoiceFile,
  saveInvoice,
  createExpenseFromInvoice,
  resolveCategoryId,
  fetchInvoiceHistory,
} from '@/lib/supabase/queries/invoices'
import { fetchSuppliers } from '@/lib/supabase/queries/suppliers'
import { useCurrentBusiness } from '@/lib/supabase/useCurrentBusiness'
import { can } from '@/lib/auth/permissions'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Supplier } from '@/types'

// ─── Supplier name matching ───────────────────────────────────────────────────
// Normalises both strings (lowercase, collapsed whitespace) then tries:
//   1. Exact match
//   2. Substring containment in either direction
// Returns the best-match Supplier, or null when nothing is close enough.

function matchSupplier(extractedName: string, suppliers: Supplier[]): Supplier | null {
  if (!extractedName.trim() || suppliers.length === 0) return null
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ')
  const name = norm(extractedName)
  return (
    suppliers.find(s => norm(s.name) === name) ??
    suppliers.find(s => {
      const sn = norm(s.name)
      return sn.includes(name) || name.includes(sn)
    }) ??
    null
  )
}

// ─── Page state machine ───────────────────────────────────────────────────────

type ScanState = 'idle' | 'scanning' | 'extracted'
type MatchState = 'matched' | 'new' | 'none'

// ─── Scan history list ────────────────────────────────────────────────────────

function statusBadge(status: ScanRecord['status'], t: (k: TranslationKey) => string) {
  if (status === 'confirmed')      return <Badge variant="success">{t('invoice_status_confirmed')}</Badge>
  if (status === 'pending_review') return <Badge variant="warning">{t('invoice_status_pending')}</Badge>
  return <Badge variant="processing">{t('invoice_status_processing')}</Badge>
}

function ScanHistoryList({ records, t }: { records: ScanRecord[]; t: (k: TranslationKey) => string }) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={<ScanLine size={24} />}
        title={t('empty_invoice_title')}
        description={t('empty_invoice_sub')}
      />
    )
  }

  return (
    <div className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{t('invoice_history_title')}</h3>
          <p className="mt-0.5 text-xs text-gray-400">{records.length} {t('invoice_scanned_count')}</p>
        </div>
      </div>

      <ul className="divide-y divide-gray-50">
        {records.map((rec) => (
          <li
            key={rec.id}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
              <FileText size={16} className="text-indigo-500" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{rec.supplierName}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {rec.invoiceNumber} · {formatDate(rec.invoiceDate)}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-sm font-bold text-gray-800 tabular-nums">
                {formatCurrency(rec.totalAmount)}
              </span>
              {statusBadge(rec.status, t)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoiceScannerPage() {
  const { t, isZh } = useLanguage()
  const { businessId, userId, userRole, loading: bizLoading } = useCurrentBusiness()
  const canScan = can(userRole, 'scan_invoices')
  const toast = useToast()

  const [scanState,    setScanState]    = useState<ScanState>('idle')
  const [extracted,    setExtracted]    = useState<ExtractedInvoiceData | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [history,      setHistory]      = useState<ScanRecord[]>([])
  const [histLoading,  setHistLoading]  = useState(true)
  const [suppliers,    setSuppliers]    = useState<Supplier[]>([])
  const [matchState,   setMatchState]   = useState<MatchState>('none')

  // ── Load scan history + supplier list from DB ──────────────────────────────
  useEffect(() => {
    if (bizLoading || !businessId) return
    setHistLoading(true)
    Promise.all([
      fetchInvoiceHistory(businessId),
      fetchSuppliers(businessId),
    ])
      .then(([hist, sups]) => { setHistory(hist); setSuppliers(sups) })
      .catch(() => {})
      .finally(() => setHistLoading(false))
  }, [businessId, bizLoading])

  // ── Convert API response → ExtractedInvoiceData (ExtractionResult component shape) ──
  function toExtractedInvoiceData(src: ExtractSuccessResponse['data']): ExtractedInvoiceData {
    const subtotal = (src.totalAmount ?? 0) - (src.taxAmount ?? 0)
    return {
      supplierName:      src.supplierName  ?? 'Unknown Supplier',
      invoiceNumber:     src.invoiceNumber ?? '',
      invoiceDate:       src.invoiceDate   ?? new Date().toISOString().split('T')[0],
      subtotal,
      taxAmount:         src.taxAmount     ?? 0,
      totalAmount:       src.totalAmount   ?? 0,
      currency:          src.currency      ?? 'MYR',
      // suggestedMainCategory is the new canonical field; fall back to 'Other' if null
      suggestedCategory: src.suggestedMainCategory ?? 'Other',
      confidence:        src.confidenceScore,
      extractedAt:       new Date().toISOString(),
      items: src.items.map((item, i) => ({
        id:          `item-${i + 1}`,
        description: item.itemName,
        unit:        'pcs',
        quantity:    item.quantity    ?? 0,
        unitPrice:   item.unitPrice   ?? 0,
        lineTotal:   item.amount,
        category:    item.suggestedCategory ?? 'Other',
        confidence:  src.confidenceScore,
      })),
    }
  }

  // ── Call /api/invoice-extract ─────────────────────────────────────────────
  async function callExtractAPI(file: File): Promise<ExtractedInvoiceData> {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/invoice-extract', {
      method: 'POST',
      body:   formData,
    })

    const json = await res.json() as ExtractSuccessResponse | { ok: false; error: string }
    if (!json.ok) throw new Error((json as { ok: false; error: string }).error)

    return toExtractedInvoiceData((json as ExtractSuccessResponse).data)
  }

  // ── Trigger scan ──────────────────────────────────────────────────────────
  const handleScan = useCallback(async (file: File) => {
    setScanState('scanning')
    setUploadedFile(file)
    try {
      const result = await callExtractAPI(file)

      // Match the extracted supplier name against the supplier directory
      const matched = matchSupplier(result.supplierName, suppliers)
      const ms: MatchState = result.supplierName.trim()
        ? (matched ? 'matched' : 'new')
        : 'none'
      setMatchState(ms)
      setExtracted({ ...result, supplierId: matched?.id ?? null })
      setScanState('extracted')
    } catch {
      setScanState('idle')
      setUploadedFile(null)
      toast.error(t('invoice_scan_error'))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, suppliers])

  // ── Save extracted invoice to Supabase ───────────────────────────────────
  const handleSave = useCallback(async (data: ExtractedInvoiceData) => {
    // 1. Upload file to Supabase Storage → returns storage path
    //    INTEGRATION POINT — uploadInvoiceFile() in lib/supabase/queries/invoices.ts
    //    The 'invoice-files' bucket must exist in your Supabase project.
    let fileUrl: string | null = null
    if (uploadedFile) {
      fileUrl = await uploadInvoiceFile(uploadedFile, userId)
    }

    // 2. Write invoice header + line items to DB
    await saveInvoice(businessId, userId, data, fileUrl)

    // 3. Create a linked expense record so the invoice spend appears in the
    //    Expenses page and feeds into the P&L report automatically.
    //    Resolves the category_id by matching suggestedCategory → expense_category.type.
    const categoryId = await resolveCategoryId(businessId, data.suggestedCategory)
    if (categoryId) {
      await createExpenseFromInvoice(businessId, userId, data, categoryId)
    }

    // 4. Prepend to the local history list so the user sees it immediately
    const record: ScanRecord = {
      id:            `${Date.now()}`,
      supplierName:  data.supplierName,
      invoiceNumber: data.invoiceNumber,
      invoiceDate:   data.invoiceDate,
      totalAmount:   data.totalAmount,
      status:        'confirmed',
      savedAt:       new Date().toISOString(),
    }
    setHistory(prev => [record, ...prev])
    toast.success(
      isZh
        ? `发票已保存 — RM ${data.totalAmount.toFixed(2)} 已记入开销`
        : `Invoice saved — RM ${data.totalAmount.toFixed(2)} added to expenses`
    )
  }, [businessId, userId, uploadedFile, toast, isZh])

  // ── Reset to idle ─────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setScanState('idle')
    setExtracted(null)
    setUploadedFile(null)
    setMatchState('none')
  }, [])

  // Block roles that cannot scan invoices (accountant, etc.)
  if (!bizLoading && businessId && !canScan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <ScanLine size={36} className="text-gray-300" />
        <p className="text-base font-semibold text-gray-700">{t('access_denied_title')}</p>
        <p className="text-sm text-gray-400 max-w-xs">{t('access_denied_sub')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">{t('invoice_title')}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{t('invoice_subtitle')}</p>
      </div>

      {/* ── How it works — show only on idle ──────────────────────────────── */}
      {scanState === 'idle' && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { step: '1', icon: '📤', title: 'Upload',  sub: 'JPG, PNG or PDF' },
            { step: '2', icon: '🤖', title: 'AI Reads', sub: t('invoice_scanning') },
            { step: '3', icon: '✅', title: 'Verify & Save', sub: t('invoice_save_expense') },
          ].map((s) => (
            <div key={s.step} className="flex flex-col gap-2 rounded-xl bg-white p-4 ring-1 ring-gray-100 shadow-card text-center">
              <span className="text-2xl">{s.icon}</span>
              <p className="text-xs font-bold text-gray-700">{s.title}</p>
              <p className="text-[11px] text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Upload / Scan / Result area ──────────────────────────────────────── */}
      {scanState === 'idle'      && <InvoiceUploader onScan={handleScan} />}
      {scanState === 'scanning'  && <ScanningState />}
      {scanState === 'extracted' && extracted && (
        <ExtractionResult
          data={extracted}
          onReset={handleReset}
          onSave={handleSave}
          suppliers={suppliers}
          initialSupplierId={extracted.supplierId ?? null}
          matchState={matchState}
        />
      )}

      {/* ── Recent scan history ───────────────────────────────────────────────── */}
      {(scanState === 'idle' || scanState === 'extracted') && (
        histLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
            <Loader2 size={15} className="animate-spin" />
            <span className="text-xs">Loading history…</span>
          </div>
        ) : (
          <ScanHistoryList records={history} t={t} />
        )
      )}
    </div>
  )
}
