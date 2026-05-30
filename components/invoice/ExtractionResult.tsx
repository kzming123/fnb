'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, CheckCircle2, AlertCircle, RotateCcw, Save, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfidenceScore } from './ConfidenceScore'
import { InvoiceItemsTable } from './InvoiceItemsTable'
import { useLanguage } from '@/contexts/LanguageContext'
import { INVOICE_CATEGORIES, type ExtractedInvoiceData, type ExtractedItem } from '@/lib/mock-data/invoices'
import { formatCurrency, cn } from '@/lib/utils'
import type { Supplier } from '@/types'

// ─── Editable field ───────────────────────────────────────────────────────────

function EditField({
  label, value, onChange, type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow placeholder:text-gray-300"
      />
    </div>
  )
}

// ─── Total reconciliation badge ───────────────────────────────────────────────

function TotalCheck({ invoiceTotal, itemsTotal }: { invoiceTotal: number; itemsTotal: number }) {
  const { t } = useLanguage()
  const diff      = Math.abs(invoiceTotal - itemsTotal)
  const matched   = diff < 0.02
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
      matched ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
    )}>
      {matched
        ? <CheckCircle2 size={13} />
        : <AlertCircle size={13} />
      }
      {matched
        ? t('invoice_total_check')
        : `${t('invoice_total_mismatch')} — RM ${diff.toFixed(2)}`
      }
    </div>
  )
}

// ─── ExtractionResult ─────────────────────────────────────────────────────────

interface ExtractionResultProps {
  data:               ExtractedInvoiceData
  onReset:            () => void
  /** async — may upload to Supabase Storage + write to DB; throw to surface an error */
  onSave:             (data: ExtractedInvoiceData) => Promise<void>
  /** All suppliers in this business — used to populate the supplier selector */
  suppliers:          Supplier[]
  /** Supplier ID pre-selected by name matching (null = no match found) */
  initialSupplierId:  string | null
  /** 'matched' = auto-matched, 'new' = name detected but no match, 'none' = no name */
  matchState:         'matched' | 'new' | 'none'
}

export function ExtractionResult({
  data, onReset, onSave,
  suppliers, initialSupplierId, matchState,
}: ExtractionResultProps) {
  const { t } = useLanguage()

  // Editable meta state (includes supplierId so user can override the auto-match)
  const [meta, setMeta] = useState({
    supplierName:      data.supplierName,
    invoiceNumber:     data.invoiceNumber,
    invoiceDate:       data.invoiceDate,
    subtotal:          data.subtotal.toFixed(2),
    taxAmount:         data.taxAmount.toFixed(2),
    totalAmount:       data.totalAmount.toFixed(2),
    suggestedCategory: data.suggestedCategory,
    supplierId:        initialSupplierId,
  })

  const [items, setItems] = useState<ExtractedItem[]>(data.items)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [saveError, setSaveError] = useState('')

  const metaSet = (key: keyof typeof meta) => (v: string) =>
    setMeta((m) => ({ ...m, [key]: v }))

  const itemsTotal = items.reduce((s, item) => s + item.lineTotal, 0)

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      await onSave({
        ...data,
        ...meta,
        subtotal:    parseFloat(meta.subtotal)    || 0,
        taxAmount:   parseFloat(meta.taxAmount)   || 0,
        totalAmount: parseFloat(meta.totalAmount) || 0,
        items,
      })
      setSaved(true)
    } catch (e) {
      setSaveError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header banner ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold">{t('invoice_extract_title')}</p>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-100">
                {t('invoice_mock_label')}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-indigo-200">{t('invoice_edit_warning')}</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 self-start rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-100 hover:bg-white/20 transition-colors"
        >
          <RotateCcw size={12} />
          {t('invoice_scan_another')}
        </button>
      </div>

      {/* ── Main card ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Left — editable invoice meta */}
        <div className="lg:col-span-2 flex flex-col gap-5 rounded-2xl bg-white p-5 ring-1 ring-gray-100 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {t('invoice_meta_section')}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <EditField
              label={t('invoice_supplier_field')}
              value={meta.supplierName}
              onChange={metaSet('supplierName')}
            />
            <EditField
              label={t('invoice_number_field')}
              value={meta.invoiceNumber}
              onChange={metaSet('invoiceNumber')}
            />
            <EditField
              label={t('invoice_date_field')}
              value={meta.invoiceDate}
              onChange={metaSet('invoiceDate')}
              type="date"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {t('invoice_category_field')}
              </label>
              <select
                value={meta.suggestedCategory}
                onChange={(e) => metaSet('suggestedCategory')(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
              >
                {INVOICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount row */}
          <div className="grid grid-cols-3 gap-3">
            <EditField
              label={t('invoice_subtotal_field')}
              value={meta.subtotal}
              onChange={metaSet('subtotal')}
              type="number"
            />
            <EditField
              label={t('invoice_tax_field')}
              value={meta.taxAmount}
              onChange={metaSet('taxAmount')}
              type="number"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {t('invoice_total_field')}
              </label>
              <div className="rounded-lg bg-indigo-600 px-3 py-2">
                <p className="text-sm font-bold text-white tabular-nums">
                  {formatCurrency(parseFloat(meta.totalAmount) || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Total reconciliation */}
          <TotalCheck
            invoiceTotal={parseFloat(meta.totalAmount) || 0}
            itemsTotal={itemsTotal}
          />

          {/* ── Supplier link ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2.5">

            {/* Match status banner — only shown when a name was extracted */}
            {matchState !== 'none' && (
              <div className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold',
                meta.supplierId
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
              )}>
                {meta.supplierId
                  ? <CheckCircle2 size={13} className="shrink-0" />
                  : <AlertCircle  size={13} className="shrink-0" />
                }
                {meta.supplierId
                  ? t('invoice_supplier_found')
                  : t('invoice_new_supplier_detected')
                }
              </div>
            )}

            {/* Supplier selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {t('invoice_match_supplier')}
              </label>
              <select
                value={meta.supplierId ?? ''}
                onChange={e => setMeta(m => ({ ...m, supplierId: e.target.value || null }))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
              >
                <option value="">{t('expenses_no_supplier')}</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {/* "Create Supplier" link — only shown when no match was found */}
              {matchState === 'new' && !meta.supplierId && (
                <Link
                  href="/suppliers"
                  className="flex items-center gap-1 self-start text-[11px] text-indigo-500 hover:text-indigo-700 transition-colors font-medium"
                >
                  <ExternalLink size={10} />
                  {t('invoice_create_supplier')}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right — confidence + action */}
        <div className="flex flex-col gap-4">
          <ConfidenceScore score={data.confidence} />

          {/* Mock API note */}
          <div className="rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              {t('invoice_integration_note')}
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              {t('invoice_mock_note')}
            </p>
          </div>

          {/* Save error */}
          {saveError && (
            <div className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-600 ring-1 ring-red-100">
              {saveError}
            </div>
          )}

          {/* Save CTA */}
          {saved ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-4 py-3.5 ring-1 ring-emerald-100">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-700">{t('invoice_save_success')}</p>
            </div>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="w-full gap-2 shadow-lg shadow-indigo-200/50"
            >
              <Save size={16} />
              {saving ? t('saving') : t('invoice_save_expense')}
            </Button>
          )}
        </div>
      </div>

      {/* ── Items table ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100 shadow-card">
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
          {t('invoice_items_section')}
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 normal-case tracking-normal">
            {items.length} {t('invoice_items_label')}
          </span>
        </p>
        <InvoiceItemsTable items={items} onChange={setItems} />
      </div>
    </div>
  )
}
