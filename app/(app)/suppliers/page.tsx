'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Plus, Search, Phone, Mail, X, Truck, Download,
  AlertCircle, CalendarDays, ReceiptText, Pencil, Trash2, Loader2,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SuppliersSkeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useCurrentBusiness } from '@/lib/supabase/useCurrentBusiness'
import {
  fetchSuppliers,
  insertSupplier,
  updateSupplier,
  softDeleteSupplier,
} from '@/lib/supabase/queries/suppliers'
import { downloadCSV, csvDate } from '@/lib/utils/csv'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { DemoBanner } from '@/components/shared/DemoBanner'
import { can }        from '@/lib/auth/permissions'
import {
  fetchSupplierSpendTotals,
  fetchInvoiceSpendTrend,
  type SupplierSpend,
  type InvoiceSpendMonth,
} from '@/lib/supabase/queries/pnl'
import {
  DEMO_SUPPLIERS,
  DEMO_SUPPLIER_SPEND,
  DEMO_LAST_SUPPLIER_SPEND,
  getDemoSpendTrend,
} from '@/lib/mock-data/demo'
import type { Supplier, SupplierCategory } from '@/types'
import type { TranslationKey } from '@/lib/i18n/translations'

// ─── Category config ──────────────────────────────────────────────────────────

const CAT_STYLE: Record<SupplierCategory, {
  key: TranslationKey; color: string; bg: string; strip: string; chart: string
}> = {
  food:       { key: 'sup_cat_food',       color: 'text-amber-700', bg: 'bg-amber-50',  strip: 'bg-amber-400',  chart: '#f59e0b' },
  seafood:    { key: 'sup_cat_seafood',     color: 'text-blue-700',  bg: 'bg-blue-50',   strip: 'bg-blue-400',   chart: '#3b82f6' },
  meat:       { key: 'sup_cat_meat',        color: 'text-red-700',   bg: 'bg-red-50',    strip: 'bg-red-400',    chart: '#ef4444' },
  vegetables: { key: 'sup_cat_vegetables',  color: 'text-green-700', bg: 'bg-green-50',  strip: 'bg-green-400',  chart: '#22c55e' },
  packaging:  { key: 'sup_cat_packaging',   color: 'text-pink-700',  bg: 'bg-pink-50',   strip: 'bg-pink-400',   chart: '#ec4899' },
  beverages:  { key: 'sup_cat_beverages',   color: 'text-cyan-700',  bg: 'bg-cyan-50',   strip: 'bg-cyan-400',   chart: '#06b6d4' },
  cleaning:   { key: 'sup_cat_cleaning',    color: 'text-teal-700',  bg: 'bg-teal-50',   strip: 'bg-teal-400',   chart: '#14b8a6' },
  others:     { key: 'sup_cat_others',      color: 'text-gray-600',  bg: 'bg-gray-100',  strip: 'bg-gray-400',   chart: '#9ca3af' },
}

const ALL_CATS = Object.keys(CAT_STYLE) as SupplierCategory[]

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  name: string
  category: SupplierCategory
  contactName: string
  phone: string
  email: string
  notes: string
}

const DEFAULT_FORM: FormState = {
  name: '', category: 'food', contactName: '',
  phone: '', email: '', notes: '',
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function currentMonth(): string {
  return new Date().toLocaleDateString('en-CA').slice(0, 7)
}

function nMonthsAgo(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  let tm = m - n
  let ty = y
  while (tm <= 0) { tm += 12; ty-- }
  return `${ty}-${String(tm).padStart(2, '0')}`
}

function prevMonth(month: string): string {
  return nMonthsAgo(month, 1)
}

function formatMonthShort(month: string, isZh: boolean): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  if (isZh) return `${m}月`
  return d.toLocaleDateString('en-MY', { month: 'short', year: '2-digit' })
}

// ─── Spending Analytics Section ───────────────────────────────────────────────

function SpendingAnalyticsSection({
  currentSpend,
  lastSpend,
  trend,
}: {
  currentSpend: SupplierSpend[]
  lastSpend:    SupplierSpend[]
  trend:        InvoiceSpendMonth[]
}) {
  const { t, isZh } = useLanguage()

  const totalCurrent   = currentSpend.reduce((s, c) => s + c.totalAmount, 0)
  const totalLast      = lastSpend.reduce((s, c) => s + c.totalAmount, 0)
  const totalInvoices  = currentSpend.reduce((s, c) => s + c.invoiceCount, 0)
  const avgInvoice     = totalInvoices > 0 ? totalCurrent / totalInvoices : 0
  const spendChange    = totalLast > 0
    ? ((totalCurrent - totalLast) / totalLast) * 100
    : null

  const hasData = totalCurrent > 0 || trend.length > 0

  if (!hasData) {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-card p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
          {t('sup_spending_analytics')}
        </p>
        <p className="text-sm text-gray-400">{t('sup_no_spend_data')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-card p-5 space-y-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
        {t('sup_spending_analytics')}
      </p>

      {/* ── Stat row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

        {/* This month */}
        <div className="rounded-xl bg-indigo-50 ring-1 ring-indigo-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
            {t('sup_this_month_spend')}
          </p>
          <p className="mt-1 text-lg font-bold text-indigo-700 tabular-nums leading-tight">
            {totalCurrent > 0
              ? `RM ${totalCurrent.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              : '—'}
          </p>
          {spendChange !== null && (
            <p className={cn(
              'mt-1 text-[11px] font-semibold flex items-center gap-0.5',
              spendChange >= 0 ? 'text-red-500' : 'text-emerald-600'
            )}>
              {spendChange >= 0 ? '↑' : '↓'} {Math.abs(spendChange).toFixed(1)}%
              <span className="font-normal text-gray-400 ml-1">{t('sup_spend_change')}</span>
            </p>
          )}
        </div>

        {/* Last month */}
        <div className="rounded-xl bg-gray-50 ring-1 ring-gray-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {t('sup_last_month_spend')}
          </p>
          <p className="mt-1 text-lg font-bold text-gray-700 tabular-nums leading-tight">
            {totalLast > 0
              ? `RM ${totalLast.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              : '—'}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            {t('sup_confirmed_invoices')}
          </p>
        </div>

        {/* Invoice count */}
        <div className="rounded-xl bg-gray-50 ring-1 ring-gray-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {t('sup_total_invoices')}
          </p>
          <p className="mt-1 text-lg font-bold text-gray-700 tabular-nums leading-tight">
            {totalInvoices}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            {t('sup_invoice_count')}
          </p>
        </div>

        {/* Avg invoice */}
        <div className="rounded-xl bg-gray-50 ring-1 ring-gray-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {t('sup_avg_invoice')}
          </p>
          <p className="mt-1 text-lg font-bold text-gray-700 tabular-nums leading-tight">
            {avgInvoice > 0
              ? `RM ${avgInvoice.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              : '—'}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            {t('sup_per_invoice')}
          </p>
        </div>
      </div>

      {/* ── 3-month trend bars ────────────────────────────────────────── */}
      {trend.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            {t('sup_spending_trend')}
          </p>
          <div className="flex items-end gap-2 h-20">
            {(() => {
              const max = Math.max(...trend.map(p => p.totalAmount), 1)
              return trend.map(pt => {
                const pct = (pt.totalAmount / max) * 100
                return (
                  <div key={pt.month} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                    <p className="text-[10px] text-gray-600 tabular-nums font-semibold">
                      {pt.totalAmount > 0
                        ? `RM ${(pt.totalAmount / 1000).toFixed(1)}k`
                        : '—'}
                    </p>
                    <div className="w-full flex items-end" style={{ height: 40 }}>
                      <div
                        className="w-full rounded-t-md bg-indigo-500 transition-all duration-500"
                        style={{ height: `${Math.max(pct, pt.totalAmount > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 truncate w-full text-center">
                      {formatMonthShort(pt.month, isZh)}
                    </p>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Custom tooltip for chart ─────────────────────────────────────────────────

function ChartTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ value: number; payload: { fullName: string } }>
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-semibold">{payload[0].payload.fullName}</p>
      <p className="mt-0.5 tabular-nums">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

// ─── Supplier card ────────────────────────────────────────────────────────────

function SupplierCard({ supplier, t, onEdit, onDelete }: {
  supplier: Supplier
  t: (k: TranslationKey) => string
  onEdit?: (s: Supplier) => void
  onDelete?: (id: string) => void
}) {
  const style        = CAT_STYLE[supplier.category]
  const monthly      = parseFloat(supplier.monthlySpend    || '0')
  const outstanding  = parseFloat(supplier.outstandingAmount || '0')
  const hasOutstanding = outstanding > 0

  return (
    <div className="group relative rounded-2xl bg-white ring-1 ring-gray-100 shadow-card hover:shadow-md transition-shadow overflow-hidden">
      {/* Category colour strip */}
      <div className={cn('h-1 w-full', style.strip)} />

      {/* Action buttons — reveal on hover */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onEdit && (
            <button
              onClick={() => onEdit(supplier)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100 text-gray-400 hover:text-indigo-600 hover:ring-indigo-200 transition-colors"
              title="Edit supplier"
            >
              <Pencil size={12} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(supplier.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100 text-gray-400 hover:text-red-500 hover:ring-red-200 transition-colors"
              title="Delete supplier"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3 pr-16">
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-gray-900 leading-snug truncate">
              {supplier.name}
            </h4>
            {supplier.contactName && (
              <p className="text-xs text-gray-500 mt-0.5">{supplier.contactName}</p>
            )}
          </div>
          <span className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            style.bg, style.color
          )}>
            {t(style.key)}
          </span>
        </div>

        {/* Contact info */}
        <div className="space-y-1 mb-4">
          {supplier.phone && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Phone size={11} className="shrink-0 text-gray-400" />
              {supplier.phone}
            </p>
          )}
          {supplier.email && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Mail size={11} className="shrink-0 text-gray-400" />
              <span className="truncate">{supplier.email}</span>
            </p>
          )}
          {supplier.notes && (
            <p className="text-[11px] text-gray-400 italic truncate mt-1">
              {supplier.notes}
            </p>
          )}
        </div>

        {/* Metrics strip */}
        <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-3">
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide truncate">
              {t('suppliers_monthly_spend')}
            </p>
            <p className="mt-0.5 text-sm font-bold text-gray-900 tabular-nums">
              {formatCurrency(monthly)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide truncate">
              {t('suppliers_outstanding')}
            </p>
            <p className={cn(
              'mt-0.5 text-sm font-bold tabular-nums flex items-center gap-1',
              hasOutstanding ? 'text-amber-600' : 'text-gray-400'
            )}>
              {hasOutstanding && <AlertCircle size={11} className="shrink-0" />}
              {hasOutstanding ? formatCurrency(outstanding) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide truncate">
              {t('suppliers_last_invoice')}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-gray-600 flex items-center gap-1">
              <CalendarDays size={10} className="text-gray-400 shrink-0" />
              {supplier.lastInvoiceDate
                ? formatDate(supplier.lastInvoiceDate)
                : <span className="text-gray-300">{t('suppliers_no_invoice')}</span>
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const { t, isZh } = useLanguage()
  const { businessId, userId, userRole, loading: bizLoading } = useCurrentBusiness()
  const canAdd    = can(userRole, 'add_suppliers')
  const canEdit   = can(userRole, 'edit_suppliers')
  const canDelete = can(userRole, 'delete_suppliers')
  const toast = useToast()

  // ── State ─────────────────────────────────────────────────────────────────
  const [suppliers,    setSuppliers]    = useState<Supplier[]>([])
  const [currentSpend, setCurrentSpend] = useState<SupplierSpend[]>([])
  const [lastSpend,    setLastSpend]    = useState<SupplierSpend[]>([])
  const [spendTrend,   setSpendTrend]   = useState<InvoiceSpendMonth[]>([])
  const [dataLoading,  setDataLoading]  = useState(true)
  const [dataError,    setDataError]    = useState('')
  const [saving,       setSaving]       = useState(false)
  const [saveError,    setSaveError]    = useState('')
  // Confirm dialog
  const [confirmId,      setConfirmId]      = useState<string | null>(null)
  const [deleteLoading,  setDeleteLoading]  = useState(false)

  const [showForm,   setShowForm]   = useState(false)
  const [editId,     setEditId]     = useState<string | null>(null)
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState<SupplierCategory | 'all'>('all')
  const [form,       setForm]       = useState<FormState>(DEFAULT_FORM)
  const [formError,  setFormError]  = useState('')

  const isDemo = !bizLoading && !businessId

  // ── Load suppliers + spending data (or demo data) ─────────────────────────
  useEffect(() => {
    if (bizLoading) return

    if (!businessId) {
      setSuppliers(DEMO_SUPPLIERS)
      setCurrentSpend(DEMO_SUPPLIER_SPEND)
      setLastSpend(DEMO_LAST_SUPPLIER_SPEND)
      setSpendTrend(getDemoSpendTrend(currentMonth()))
      setDataLoading(false)
      return
    }

    setDataLoading(true)
    const month   = currentMonth()
    const last    = prevMonth(month)
    const twoAgo  = nMonthsAgo(month, 2)

    Promise.all([
      fetchSuppliers(businessId),
      fetchSupplierSpendTotals(businessId, month, month),
      fetchSupplierSpendTotals(businessId, last, last),
      fetchInvoiceSpendTrend(businessId, twoAgo, month),
    ])
      .then(([sups, cur, prev, trend]) => {
        const spendMap = new Map(cur.map(s => [s.supplierId, s]))
        const merged = sups.map(s => ({
          ...s,
          monthlySpend:    String(spendMap.get(s.id)?.totalAmount ?? 0),
          invoiceCount:    spendMap.get(s.id)?.invoiceCount ?? 0,
          lastInvoiceDate: spendMap.get(s.id)?.lastInvoiceDate ?? s.lastInvoiceDate,
        }))
        setSuppliers(merged)
        setCurrentSpend(cur)
        setLastSpend(prev)
        setSpendTrend(trend)
      })
      .catch(e => setDataError(String(e)))
      .finally(() => setDataLoading(false))
  }, [businessId, bizLoading])

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalMonthly     = useMemo(() => currentSpend.reduce((s, c) => s + c.totalAmount, 0), [currentSpend])
  const totalOutstanding = useMemo(() => suppliers.reduce((s, sup) => s + parseFloat(sup.outstandingAmount || '0'), 0), [suppliers])

  const top5 = useMemo(() =>
    [...suppliers]
      .sort((a, b) => parseFloat(b.monthlySpend || '0') - parseFloat(a.monthlySpend || '0'))
      .slice(0, 5)
      .map(s => ({
        name:     s.name.length > 20 ? s.name.slice(0, 18) + '…' : s.name,
        fullName: s.name,
        amount:   parseFloat(s.monthlySpend || '0'),
        category: s.category,
      })),
    [suppliers]
  )

  const filtered = useMemo(() => suppliers.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.contactName?.toLowerCase().includes(q)
    const matchCat    = catFilter === 'all' || s.category === catFilter
    return matchSearch && matchCat
  }), [suppliers, search, catFilter])

  // ── CSV export (uses current search + category filter) ────────────────────
  function handleExportCSV() {
    const locale = isZh ? 'zh-CN' : 'en-MY'
    const filename = isZh ? '供应商名录' : 'Suppliers'
    const headers  = isZh
      ? ['供应商名称', '类别', '本月支出 (RM)', '发票数量', '最后发票日期', '联系人', '电话', '电邮', '备注']
      : ['Supplier Name', 'Category', 'Monthly Spend (RM)', 'Invoices', 'Last Invoice', 'Contact', 'Phone', 'Email', 'Notes']
    const rows: (string | number)[][] = filtered.map(s => [
      s.name,
      t(CAT_STYLE[s.category].key),
      parseFloat(s.monthlySpend ?? '0').toFixed(2),
      s.invoiceCount ?? 0,
      s.lastInvoiceDate ? csvDate(s.lastInvoiceDate, locale) : '',
      s.contactName ?? '',
      s.phone  ?? '',
      s.email  ?? '',
      s.notes  ?? '',
    ])
    downloadCSV(filename, headers, rows)
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  const openAdd = useCallback(() => {
    setEditId(null)
    setForm(DEFAULT_FORM)
    setFormError('')
    setSaveError('')
    setShowForm(true)
  }, [])

  const openEdit = useCallback((s: Supplier) => {
    setEditId(s.id)
    setForm({
      name:        s.name,
      category:    s.category,
      contactName: s.contactName ?? '',
      phone:       s.phone       ?? '',
      email:       s.email       ?? '',
      notes:       s.notes       ?? '',
    })
    setFormError('')
    setSaveError('')
    setShowForm(true)
  }, [])

  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditId(null)
    setForm(DEFAULT_FORM)
    setFormError('')
    setSaveError('')
  }, [])

  async function handleSave() {
    if (!form.name.trim()) { setFormError(t('required')); return }
    setSaving(true)
    setSaveError('')
    try {
      const payload = {
        name:           form.name.trim(),
        category:       form.category,
        contact_person: form.contactName || undefined,
        phone:          form.phone       || undefined,
        email:          form.email       || undefined,
        notes:          form.notes       || undefined,
      }

      if (editId) {
        const updated = await updateSupplier(editId, payload)
        setSuppliers(prev => prev.map(s => s.id === editId ? updated : s))
        toast.success(isZh ? `${form.name}已更新` : `${form.name} updated`)
      } else {
        const created = await insertSupplier(businessId, userId, payload)
        setSuppliers(prev => [created, ...prev])
        toast.success(isZh ? `${form.name}已添加` : `${form.name} added`)
      }
      closeForm()
    } catch (e) {
      setSaveError(String(e))
      toast.error(t('suppliers_save_failed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!confirmId) return
    setDeleteLoading(true)
    try {
      const name = suppliers.find(s => s.id === confirmId)?.name ?? t('suppliers_title')
      await softDeleteSupplier(confirmId)
      setSuppliers(prev => prev.filter(s => s.id !== confirmId))
      toast.success(isZh ? `${name}已移除` : `${name} removed`)
    } catch {
      toast.error(t('suppliers_delete_failed'))
    } finally {
      setDeleteLoading(false)
      setConfirmId(null)
    }
  }

  const inputCls  = 'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-300'
  const selectCls = `${inputCls} text-gray-700`

  function FieldLabel({ k }: { k: TranslationKey }) {
    return <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t(k)}</label>
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (bizLoading || dataLoading) return <SuppliersSkeleton />

  if (dataError) {
    return (
      <ErrorState
        title={t('error_fetch_title')}
        message={dataError}
        retryLabel={t('error_retry')}
        onRetry={() => {
          setDataError('')
          setDataLoading(true)
          fetchSuppliers(businessId)
            .then(setSuppliers)
            .catch(e => setDataError(String(e)))
            .finally(() => setDataLoading(false))
        }}
      />
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">{t('suppliers_title')}</h2>
            {isDemo && <DemoBanner />}
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{t('suppliers_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" className="gap-1.5"
            disabled={filtered.length === 0} onClick={handleExportCSV}>
            <Download size={14} />{t('export_csv')}
          </Button>
          {!isDemo && canAdd && (
            <Button size="sm" className="gap-1.5" onClick={() => showForm ? closeForm() : openAdd()}>
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? t('cancel') : t('suppliers_add')}
            </Button>
          )}
        </div>
      </div>

      {/* ── Save error ──────────────────────────────────────────────────── */}
      {saveError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
          {saveError}
        </div>
      )}

      {/* ── Add / Edit Form ───────────────────────────────────────────────── */}
      {showForm && (
        <div className="rounded-2xl bg-white p-5 ring-1 ring-indigo-100 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-gray-800">
            {editId ? t('suppliers_edit_title') : t('suppliers_add_title')}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel k="suppliers_name" />
              <input type="text" value={form.name}
                onChange={e => { setField('name', e.target.value); setFormError('') }}
                placeholder="e.g. ABC Frozen Food Sdn Bhd"
                className={cn(inputCls, formError ? 'border-red-400 focus:ring-red-400' : '')}
              />
              {formError && <p className="text-[11px] text-red-500">{formError}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="suppliers_category" />
              <select value={form.category}
                onChange={e => setField('category', e.target.value as SupplierCategory)}
                className={selectCls}
              >
                {ALL_CATS.map(k => <option key={k} value={k}>{t(CAT_STYLE[k].key)}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="suppliers_contact" />
              <input type="text" value={form.contactName}
                onChange={e => setField('contactName', e.target.value)}
                placeholder={t('optional')} className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="suppliers_phone" />
              <input type="tel" value={form.phone}
                onChange={e => setField('phone', e.target.value)}
                placeholder="+60 12-345 6789" className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="suppliers_email" />
              <input type="email" value={form.email}
                onChange={e => setField('email', e.target.value)}
                placeholder="supplier@email.com" className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel k="suppliers_notes" />
              <input type="text" value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder={t('optional')} className={inputCls}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
              {saving ? t('saving') : t('save')}
            </Button>
            <Button size="sm" variant="outline" onClick={closeForm}>{t('cancel')}</Button>
          </div>
        </div>
      )}

      {/* ── Summary Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-gray-900 p-4 text-center">
          <p className="text-2xl font-bold text-white tabular-nums">{suppliers.length}</p>
          <p className="mt-1 text-xs text-gray-400">{t('suppliers_total')}</p>
        </div>
        <div className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-card p-4 text-center">
          <p className="text-xl font-bold text-indigo-600 tabular-nums">{formatCurrency(totalMonthly)}</p>
          <p className="mt-1 text-xs text-gray-500">{t('suppliers_total_monthly')}</p>
        </div>
        <div className={cn(
          'rounded-2xl p-4 text-center ring-1 shadow-card',
          totalOutstanding > 0 ? 'bg-amber-50 ring-amber-100' : 'bg-white ring-gray-100'
        )}>
          <p className={cn(
            'text-xl font-bold tabular-nums',
            totalOutstanding > 0 ? 'text-amber-600' : 'text-gray-400'
          )}>
            {formatCurrency(totalOutstanding)}
          </p>
          <p className={cn('mt-1 text-xs', totalOutstanding > 0 ? 'text-amber-500' : 'text-gray-500')}>
            {t('suppliers_outstanding')}
          </p>
        </div>
      </div>

      {/* ── Spending Analytics ───────────────────────────────────────────── */}
      <SpendingAnalyticsSection
        currentSpend={currentSpend}
        lastSpend={lastSpend}
        trend={spendTrend}
      />

      {/* ── Top 5 Chart ──────────────────────────────────────────────────── */}
      {top5.length > 0 && (
        <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <ReceiptText size={15} className="text-indigo-500" />
            <h3 className="text-sm font-bold text-gray-800">{t('suppliers_top5_title')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart layout="vertical" data={top5} margin={{ left: 8, right: 48, top: 0, bottom: 0 }}>
              <YAxis
                dataKey="name"
                type="category"
                width={145}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <XAxis type="number" hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {top5.map((entry, i) => (
                  <Cell key={i} fill={CAT_STYLE[entry.category as SupplierCategory]?.chart ?? '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Search + Category Filter ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('suppliers_search')}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-card"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>

        <select value={catFilter}
          onChange={e => setCatFilter(e.target.value as SupplierCategory | 'all')}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[170px]"
        >
          <option value="all">{t('suppliers_filter_all')}</option>
          {ALL_CATS.map(k => <option key={k} value={k}>{t(CAT_STYLE[k].key)}</option>)}
        </select>

        <p className="self-center text-xs text-gray-400 ml-auto">
          {filtered.length} / {suppliers.length}
        </p>
      </div>

      {/* ── Confirm delete dialog ──────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmId !== null}
        title={t('suppliers_delete_title')}
        message={t('suppliers_delete_message')}
        confirmLabel={t('suppliers_remove')}
        cancelLabel={t('cancel')}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmId(null)}
      />

      {/* ── Supplier Cards ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Truck size={24} />}
          title={search || catFilter !== 'all' ? t('suppliers_no_records') : t('empty_suppliers_title')}
          description={!search && catFilter === 'all' ? t('empty_suppliers_sub') : undefined}
          action={!search && catFilter === 'all' ? { label: t('empty_suppliers_action'), onClick: openAdd } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(supplier => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              t={t}
              onEdit={canEdit   ? openEdit              : undefined}
              onDelete={canDelete ? id => setConfirmId(id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
