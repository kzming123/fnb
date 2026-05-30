'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Trash2, ScanLine, FileText, Paperclip, X, Pencil, Loader2, Download, Receipt, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ExpensesSkeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useCurrentBusiness } from '@/lib/supabase/useCurrentBusiness'
import {
  fetchExpenses,
  fetchExpenseCategories,
  insertExpense,
  updateExpense,
  softDeleteExpense,
  uploadExpenseAttachment,
  type ExpenseCategory,
} from '@/lib/supabase/queries/expenses'
import { fetchSuppliers } from '@/lib/supabase/queries/suppliers'
import type { Expense, ExpenseCategoryKind, PaymentMethod, Supplier } from '@/types'
import type { TranslationKey } from '@/lib/i18n/translations'
import { downloadCSV, csvDate } from '@/lib/utils/csv'
import { EmptyState }  from '@/components/shared/EmptyState'
import { ErrorState }  from '@/components/shared/ErrorState'
import { DemoBanner }  from '@/components/shared/DemoBanner'
import { getDemoExpenses, DEMO_SUPPLIERS } from '@/lib/mock-data/demo'
import { can }         from '@/lib/auth/permissions'

// ─── Category config ──────────────────────────────────────────────────────────

type CatGroup = 'food' | 'operating'

const CAT_STYLE: Record<ExpenseCategoryKind, { group: CatGroup; color: string; bg: string }> = {
  meat:                { group: 'food',      color: 'text-red-700',    bg: 'bg-red-50' },
  seafood:             { group: 'food',      color: 'text-blue-700',   bg: 'bg-blue-50' },
  vegetables:          { group: 'food',      color: 'text-green-700',  bg: 'bg-green-50' },
  dry_goods:           { group: 'food',      color: 'text-amber-700',  bg: 'bg-amber-50' },
  beverages:           { group: 'food',      color: 'text-cyan-700',   bg: 'bg-cyan-50' },
  packaging:           { group: 'food',      color: 'text-pink-700',   bg: 'bg-pink-50' },
  sauce_seasoning:     { group: 'food',      color: 'text-orange-700', bg: 'bg-orange-50' },
  rent:                { group: 'operating', color: 'text-purple-700', bg: 'bg-purple-50' },
  salaries:            { group: 'operating', color: 'text-indigo-700', bg: 'bg-indigo-50' },
  utilities:           { group: 'operating', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  marketing:           { group: 'operating', color: 'text-rose-700',   bg: 'bg-rose-50' },
  repairs:             { group: 'operating', color: 'text-slate-700',  bg: 'bg-slate-100' },
  cleaning:            { group: 'operating', color: 'text-teal-700',   bg: 'bg-teal-50' },
  pos_software:        { group: 'operating', color: 'text-violet-700', bg: 'bg-violet-50' },
  delivery_commission: { group: 'operating', color: 'text-sky-700',    bg: 'bg-sky-50' },
  others:              { group: 'operating', color: 'text-gray-600',   bg: 'bg-gray-100' },
}

const CAT_KEY: Record<ExpenseCategoryKind, TranslationKey> = {
  meat:                'cat_meat',
  seafood:             'cat_seafood',
  vegetables:          'cat_vegetables',
  dry_goods:           'cat_dry_goods',
  beverages:           'cat_beverages',
  packaging:           'cat_packaging',
  sauce_seasoning:     'exp_cat_sauce',
  rent:                'expenses_cat_rent',
  salaries:            'expenses_cat_salaries',
  utilities:           'expenses_cat_utilities',
  marketing:           'expenses_cat_marketing',
  repairs:             'exp_cat_repairs',
  cleaning:            'exp_cat_cleaning',
  pos_software:        'exp_cat_pos',
  delivery_commission: 'exp_cat_delivery_comm',
  others:              'expenses_cat_others',
}

const PAY_KEY: Record<PaymentMethod, TranslationKey> = {
  cash:          'expenses_pay_cash',
  card:          'expenses_pay_card',
  bank_transfer: 'expenses_pay_transfer',
  ewallet:       'expenses_pay_ewallet',
}

// Food Cost (COGS) categories — these feed into the P&L food cost calculation
const COGS_KINDS: ExpenseCategoryKind[] = [
  'meat', 'seafood', 'vegetables', 'dry_goods',
  'beverages', 'packaging', 'sauce_seasoning',
]

// Operating expense categories — below-the-line on the P&L
const OPEX_KINDS: ExpenseCategoryKind[] = [
  'rent', 'salaries', 'utilities', 'marketing',
  'repairs', 'cleaning', 'pos_software',
  'delivery_commission', 'others',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

type FormState = {
  date: string
  categoryKind: ExpenseCategoryKind
  amount: string
  supplierId: string | null   // null = "No Supplier / Other"
  paymentMethod: PaymentMethod
  description: string
  attachment: File | null
}

const DEFAULT_FORM: FormState = {
  date: TODAY, categoryKind: 'meat', amount: '', supplierId: null,
  paymentMethod: 'cash', description: '', attachment: null,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CatBadge({ kind, t }: { kind: ExpenseCategoryKind; t: (k: TranslationKey) => string }) {
  const s = CAT_STYLE[kind]
  return (
    <span className={cn('inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', s.bg, s.color)}>
      {t(CAT_KEY[kind])}
    </span>
  )
}

function SummaryCard({ label, amount, sub, dark = false, ringClass = '' }: {
  label: string; amount: number; sub?: string; dark?: boolean; ringClass?: string
}) {
  return (
    <div className={cn(
      'rounded-2xl p-4 flex flex-col gap-1',
      dark ? 'bg-gray-900' : `bg-white ring-1 shadow-card ${ringClass || 'ring-gray-100'}`,
    )}>
      <p className={cn('text-xs font-medium', dark ? 'text-gray-400' : 'text-gray-500')}>{label}</p>
      <p className={cn('text-xl font-bold tabular-nums', dark ? 'text-white' : 'text-gray-900')}>
        {formatCurrency(amount)}
      </p>
      {sub && <p className={cn('text-[11px]', dark ? 'text-gray-500' : 'text-gray-400')}>{sub}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const { t, isZh } = useLanguage()
  const fileRef = useRef<HTMLInputElement>(null)
  const { businessId, userId, userRole, loading: bizLoading } = useCurrentBusiness()
  const canAdd    = can(userRole, 'add_expenses')
  const canEdit   = can(userRole, 'edit_expenses')
  const canDelete = can(userRole, 'delete_expenses')
  const toast = useToast()

  // ── State ─────────────────────────────────────────────────────────────────
  const [expenses,    setExpenses]    = useState<Expense[]>([])
  const [categories,  setCategories]  = useState<ExpenseCategory[]>([])
  const [suppliers,   setSuppliers]   = useState<Supplier[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError,   setDataError]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState('')
  const [confirmId,       setConfirmId]       = useState<string | null>(null)
  const [deleteLoading,   setDeleteLoading]   = useState(false)

  const [showForm,  setShowForm]  = useState(false)
  const [editId,    setEditId]    = useState<string | null>(null)
  const [catFilter, setCatFilter] = useState<ExpenseCategoryKind | 'all'>('all')
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')
  const [form,      setForm]      = useState<FormState>(DEFAULT_FORM)
  const [formError, setFormError] = useState('')
  const isDemo = !bizLoading && !businessId

  // ── Load data (or use demo data) ──────────────────────────────────────────
  useEffect(() => {
    if (bizLoading) return
    if (!businessId) {
      setExpenses(getDemoExpenses())
      setSuppliers(DEMO_SUPPLIERS)
      setDataLoading(false)
      return
    }
    setDataLoading(true)
    Promise.all([
      fetchExpenses(businessId),
      fetchExpenseCategories(businessId),
      fetchSuppliers(businessId),
    ])
      .then(([exps, cats, sups]) => {
        setExpenses(exps)
        setCategories(cats)
        setSuppliers(sups)
      })
      .catch(e => setDataError(String(e)))
      .finally(() => setDataLoading(false))
  }, [businessId, bizLoading])

  // ── Derived ───────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    let food = 0, operating = 0
    for (const e of expenses) {
      const amt = parseFloat(e.amount)
      if (CAT_STYLE[e.categoryKind]?.group === 'food') food      += amt
      else                                              operating += amt
    }
    return { total: food + operating, food, operating }
  }, [expenses])

  const filtered = useMemo(() => expenses.filter(e => {
    if (catFilter !== 'all' && e.categoryKind !== catFilter) return false
    if (dateFrom && e.expenseDate < dateFrom) return false
    if (dateTo   && e.expenseDate > dateTo)   return false
    return true
  }), [expenses, catFilter, dateFrom, dateTo])

  const filteredTotal = useMemo(
    () => filtered.reduce((s, e) => s + parseFloat(e.amount), 0),
    [filtered]
  )

  // ── Look up category_id by kind ───────────────────────────────────────────
  function categoryIdFor(kind: ExpenseCategoryKind): string {
    return categories.find(c => c.type === kind)?.id ?? ''
  }

  // ── CSV export (uses current filters) ─────────────────────────────────────
  function handleExportCSV() {
    const locale = isZh ? 'zh-CN' : 'en-MY'
    const filename = isZh ? '开销记录' : 'Expenses'
    const headers  = isZh
      ? ['日期', '类别', '供应商/收款方', '金额 (RM)', '付款方式', '来源']
      : ['Date', 'Category', 'Vendor / Payee', 'Amount (RM)', 'Payment Method', 'Source']
    const rows: (string | number)[][] = filtered.map(e => [
      csvDate(e.expenseDate, locale),
      e.categoryName,
      e.supplierName ?? e.vendor ?? '',
      parseFloat(e.amount).toFixed(2),
      e.paymentMethod ?? '',
      e.source ?? 'manual',
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

  const openEdit = useCallback((exp: Expense) => {
    setEditId(exp.id)
    setForm({
      date:          exp.expenseDate,
      categoryKind:  exp.categoryKind,
      amount:        exp.amount,
      supplierId:    exp.supplierId ?? null,
      paymentMethod: exp.paymentMethod ?? 'cash',
      // For invoice_scan or legacy expenses with no supplier_id, put the
      // description text into the notes field so it's visible when editing.
      description:   exp.supplierId ? '' : (exp.vendor ?? ''),
      attachment:    null,
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
    // ── Validation — block bad input before it reaches Supabase ──────────────
    const amt = parseFloat(form.amount)
    if (!form.date) {
      setFormError(t('validation_date_required'))
      return
    }
    if (!form.categoryKind) {
      setFormError(t('validation_category_required'))
      return
    }
    if (form.amount.trim() !== '' && amt < 0) {
      setFormError(t('validation_amount_negative'))
      return
    }
    if (!form.amount || Number.isNaN(amt) || amt <= 0) {
      setFormError(t('validation_amount_positive'))
      return
    }
    const catId = categoryIdFor(form.categoryKind)
    if (!catId) {
      setSaveError(t('expenses_cats_not_loaded'))
      return
    }

    setSaving(true)
    setSaveError('')
    try {
      // Upload attachment if provided
      // INTEGRATION POINT — 'expense-attachments' bucket must exist in Supabase Storage
      let attachmentUrl: string | null = null
      if (form.attachment) {
        attachmentUrl = await uploadExpenseAttachment(form.attachment, userId)
      }

      const descriptionText = form.description.trim() || undefined

      if (editId) {
        const updated = await updateExpense(editId, {
          category_id:    catId,
          expense_date:   form.date,
          amount:         parseFloat(form.amount),
          payment_method: form.paymentMethod,
          description:    descriptionText,
          supplier_id:    form.supplierId,
        })
        setExpenses(prev =>
          prev.map(e => e.id === editId ? updated : e)
             .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
        )
        toast.success(t('expenses_updated'))
      } else {
        const created = await insertExpense(businessId, userId, {
          category_id:    catId,
          expense_date:   form.date,
          amount:         parseFloat(form.amount),
          payment_method: form.paymentMethod,
          description:    descriptionText,
          supplier_id:    form.supplierId,
          attachment_url: attachmentUrl,
        })
        setExpenses(prev =>
          [created, ...prev].sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
        )
        toast.success(t('expenses_recorded'))
      }
      closeForm()
    } catch (e) {
      setSaveError(String(e))
      toast.error(t('expenses_save_failed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!confirmId) return
    setDeleteLoading(true)
    try {
      await softDeleteExpense(confirmId)
      setExpenses(prev => prev.filter(e => e.id !== confirmId))
      toast.success(t('expenses_deleted'))
    } catch {
      toast.error(t('expenses_delete_failed'))
    } finally {
      setDeleteLoading(false)
      setConfirmId(null)
    }
  }

  const hasFilters = catFilter !== 'all' || !!dateFrom || !!dateTo

  const pct = (n: number) =>
    totals.total > 0 ? `${((n / totals.total) * 100).toFixed(1)}%` : '—'

  function FieldLabel({ k }: { k: TranslationKey }) {
    return <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t(k)}</label>
  }

  const inputCls  = 'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow'
  const selectCls = `${inputCls} text-gray-700`

  // ── Loading / error states ────────────────────────────────────────────────
  if (bizLoading || dataLoading) return <ExpensesSkeleton />

  if (dataError) {
    return (
      <ErrorState
        title={t('error_fetch_title')}
        message={dataError}
        retryLabel={t('error_retry')}
        onRetry={() => {
          setDataError('')
          setDataLoading(true)
          Promise.all([fetchExpenses(businessId), fetchExpenseCategories(businessId)])
            .then(([exps, cats]) => { setExpenses(exps); setCategories(cats) })
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
            <h2 className="text-lg font-bold text-gray-900">{t('expenses_title')}</h2>
            {isDemo && <DemoBanner />}
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{t('expenses_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" className="gap-1.5"
            disabled={filtered.length === 0} onClick={handleExportCSV}>
            <Download size={14} />{t('export_csv')}
          </Button>
          {!isDemo && canAdd && (
            <Button size="sm" className="gap-1.5" onClick={() => showForm ? closeForm() : openAdd()}>
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? t('cancel') : t('add_expense')}
            </Button>
          )}
        </div>
      </div>

      {/* ── Save error ───────────────────────────────────────────────────── */}
      {saveError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
          {saveError}
        </div>
      )}

      {/* ── Add / Edit Expense Form ───────────────────────────────────────── */}
      {showForm && (
        <div className="rounded-2xl bg-white p-5 ring-1 ring-indigo-100 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-gray-800">
            {editId ? t('expenses_edit_title') : t('expenses_add_title')}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="expenses_date" />
              <input type="date" value={form.date}
                onChange={e => setField('date', e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="expenses_category" />
              <select value={form.categoryKind}
                onChange={e => setField('categoryKind', e.target.value as ExpenseCategoryKind)}
                className={selectCls}
              >
                <optgroup label={t('expenses_group_cogs')}>
                  {COGS_KINDS.map(k => (
                    <option key={k} value={k}>{t(CAT_KEY[k])}</option>
                  ))}
                </optgroup>
                <optgroup label={t('expenses_group_operating')}>
                  {OPEX_KINDS.map(k => (
                    <option key={k} value={k}>{t(CAT_KEY[k])}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="expenses_amount" />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">RM</span>
                <input type="number" min="0" step="0.01"
                  value={form.amount}
                  onChange={e => { setField('amount', e.target.value); setFormError('') }}
                  placeholder="0.00"
                  className={cn(inputCls, 'pl-9', formError ? 'border-red-400 focus:ring-red-400' : '')}
                />
              </div>
              {formError && <p className="text-[11px] text-red-500">{formError}</p>}
            </div>

            {/* Supplier */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="expenses_supplier" />
              <select
                value={form.supplierId ?? ''}
                onChange={e => setField('supplierId', e.target.value || null)}
                className={selectCls}
              >
                <option value="">{t('expenses_no_supplier')}</option>
                {suppliers.length > 0 && (
                  <optgroup label={t('expenses_select_supplier')}>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <Link
                href="/suppliers"
                className="flex items-center gap-1 self-start text-[11px] text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                <ExternalLink size={10} />
                {t('expenses_add_new_supplier')}
              </Link>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="expenses_payment_method" />
              <select value={form.paymentMethod}
                onChange={e => setField('paymentMethod', e.target.value as PaymentMethod)}
                className={selectCls}
              >
                <option value="cash">{t('expenses_pay_cash')}</option>
                <option value="card">{t('expenses_pay_card')}</option>
                <option value="bank_transfer">{t('expenses_pay_transfer')}</option>
                <option value="ewallet">{t('expenses_pay_ewallet')}</option>
              </select>
            </div>

            {/* Source — always Manual for form entries */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="expenses_source" />
              <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/80 px-3">
                <FileText size={13} className="text-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-600">{t('expenses_source_manual')}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel k="expenses_description" />
            <textarea rows={2} value={form.description}
              onChange={e => setField('description', e.target.value)}
              placeholder={t('optional')}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-300"
            />
          </div>

          {/* Attachment
              INTEGRATION POINT — uploadExpenseAttachment() in lib/supabase/queries/expenses.ts
              handles upload to Supabase Storage bucket 'expense-attachments'.
              Bucket must be created in the Supabase dashboard first. */}
          {!editId && (
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="expenses_attach" />
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) setField('attachment', f); e.target.value = '' }}
              />
              {form.attachment ? (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <Paperclip size={13} className="text-indigo-500 shrink-0" />
                  <span className="flex-1 text-sm text-gray-700 truncate">{form.attachment.name}</span>
                  <button onClick={() => setField('attachment', null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-left"
                >
                  <Paperclip size={13} />
                  {t('expenses_attach')}
                </button>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
              {saving ? t('saving') : t('save')}
            </Button>
            <Button size="sm" variant="outline" onClick={closeForm}>{t('cancel')}</Button>
          </div>
        </div>
      )}

      {/* ── Summary Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <SummaryCard dark label={t('expenses_summary_total')} amount={totals.total}
          sub={`${expenses.length} ${t('expenses_transactions')}`}
        />
        <SummaryCard label={t('expenses_summary_food')} amount={totals.food}
          sub={pct(totals.food)} ringClass="ring-amber-100"
        />
        <SummaryCard label={t('expenses_summary_operating')} amount={totals.operating}
          sub={pct(totals.operating)} ringClass="ring-indigo-100"
        />
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('expenses_category')}</label>
          <select value={catFilter}
            onChange={e => setCatFilter(e.target.value as ExpenseCategoryKind | 'all')}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[180px]"
          >
            <option value="all">{t('expenses_filter_all')}</option>
            <optgroup label={t('expenses_group_cogs')}>
              {COGS_KINDS.map(k => <option key={k} value={k}>{t(CAT_KEY[k])}</option>)}
            </optgroup>
            <optgroup label={t('expenses_group_operating')}>
              {OPEX_KINDS.map(k => <option key={k} value={k}>{t(CAT_KEY[k])}</option>)}
            </optgroup>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('expenses_date_from')}</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('expenses_date_to')}</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {hasFilters && (
          <button onClick={() => { setCatFilter('all'); setDateFrom(''); setDateTo('') }}
            className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={13} />{t('cancel')}
          </button>
        )}

        <div className="ml-auto self-end text-xs text-gray-400 pb-1 tabular-nums">
          {filtered.length} / {expenses.length} &middot; {formatCurrency(filteredTotal)}
        </div>
      </div>

      {/* ── Confirm delete dialog ──────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmId !== null}
        title={t('expenses_delete_title')}
        message={t('expenses_delete_message')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmId(null)}
      />

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Receipt size={24} />}
            title={hasFilters ? t('expenses_no_records') : t('empty_expenses_title')}
            description={hasFilters ? undefined : t('empty_expenses_sub')}
            action={!hasFilters ? { label: t('empty_expenses_action'), onClick: openAdd } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[740px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{t('expenses_date')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('expenses_supplier')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('expenses_category')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 whitespace-nowrap">{t('rm')} {t('total')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{t('expenses_payment_method')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{t('expenses_source')}</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {filtered.map(exp => {
                  const isInvoice = exp.source === 'invoice_scan'
                  return (
                    <tr key={exp.id} className="group hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-gray-500 tabular-nums whitespace-nowrap">
                        {formatDate(exp.expenseDate)}
                      </td>

                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="font-medium text-gray-800 truncate">
                          {exp.supplierName ?? exp.vendor ?? exp.categoryName}
                        </p>
                        {exp.vendor && !exp.supplierName && exp.source === 'invoice_scan' && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{exp.vendor}</p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <CatBadge kind={exp.categoryKind} t={t} />
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span className="font-bold text-gray-900 tabular-nums">
                          {formatCurrency(exp.amount)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500">
                          {exp.paymentMethod ? t(PAY_KEY[exp.paymentMethod]) : '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
                          isInvoice
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-gray-100 text-gray-600'
                        )}>
                          {isInvoice ? <ScanLine size={10} /> : <FileText size={10} />}
                          {isInvoice ? t('expenses_source_invoice') : t('expenses_source_manual')}
                        </span>
                      </td>

                      {/* Edit + Delete */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <button
                              onClick={() => openEdit(exp)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-indigo-50 hover:text-indigo-500 transition-all"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setConfirmId(exp.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-gray-500">
                    {filtered.length} {t('total').toLowerCase()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-indigo-700 tabular-nums">
                      {formatCurrency(filteredTotal)}
                    </span>
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
