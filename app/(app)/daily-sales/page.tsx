'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Plus, Download, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SalesForm }    from '@/components/daily-sales/SalesForm'
import { SalesTable }   from '@/components/daily-sales/SalesTable'
import { useCurrentBusiness } from '@/lib/supabase/useCurrentBusiness'
import { useToast }           from '@/contexts/ToastContext'
import {
  fetchDailySales,
  upsertDailySales,
  updateDailySalesById,
  softDeleteDailySales,
} from '@/lib/supabase/queries/daily-sales'
import { type SalesEntry } from '@/lib/mock-data/sales'
import { getDemoDailySales } from '@/lib/mock-data/demo'
import { can }               from '@/lib/auth/permissions'
import { useLanguage }       from '@/contexts/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'
import { downloadCSV, csvDate } from '@/lib/utils/csv'
import { EmptyState }    from '@/components/shared/EmptyState'
import { ErrorState }    from '@/components/shared/ErrorState'
import { DemoBanner }    from '@/components/shared/DemoBanner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

// ─── Dynamic month options (current + 2 previous) ────────────────────────────
// Use LOCAL year/month — toISOString() gives UTC which is off-by-one for UTC+ zones.

function getMonthOptions(locale: string) {
  const now = new Date()
  return [0, 1, 2].map(i => {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year  = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return {
      label: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d),
      value: `${year}-${month}`,   // local "YYYY-MM"
    }
  })
}

// ─── Page skeleton ────────────────────────────────────────────────────────────

function DailySalesSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DailySalesPage() {
  const { t, isZh }  = useLanguage()
  const toast         = useToast()
  const { businessId, userId, userRole, loading: bizLoading } = useCurrentBusiness()
  const canAddSales    = can(userRole, 'add_sales')
  const canEditSales   = can(userRole, 'edit_sales')
  const canDeleteSales = can(userRole, 'delete_sales')

  const months    = useMemo(() => getMonthOptions(isZh ? 'zh-CN' : 'en-MY'), [isZh])
  const [filterMonth, setFilterMonth] = useState(months[0].value)

  const [entries,        setEntries]        = useState<SalesEntry[]>([])
  const [dataLoading,    setDataLoading]    = useState(true)
  const [dataError,      setDataError]      = useState('')
  const [showForm,       setShowForm]       = useState(false)
  const [editEntry,      setEditEntry]      = useState<SalesEntry | null>(null)
  const [confirmDeleteId,setConfirmDeleteId]= useState<string | null>(null)
  const [deleteLoading,  setDeleteLoading]  = useState(false)
  const isDemo = !bizLoading && !businessId

  // ── Fetch entries (or use demo data) ──────────────────────────────────────
  useEffect(() => {
    if (bizLoading) return
    if (!businessId) {
      setEntries(getDemoDailySales(filterMonth))
      setDataLoading(false)
      return
    }
    setDataLoading(true)
    fetchDailySales(businessId, filterMonth)
      .then(setEntries)
      .catch(e => setDataError(String(e)))
      .finally(() => setDataLoading(false))
  }, [businessId, bizLoading, filterMonth])

  // ── Close form (also clears edit state) ──────────────────────────────────
  const handleFormClose = useCallback(() => {
    setShowForm(false)
    setEditEntry(null)
  }, [])

  // ── Open edit form ────────────────────────────────────────────────────────
  const handleEdit = useCallback((entry: SalesEntry) => {
    setEditEntry(entry)
    setShowForm(true)
  }, [])

  // ── Submit: add (upsert by date) OR update (by ID) ────────────────────────
  const handleSubmit = useCallback(async (entry: SalesEntry) => {
    try {
      if (editEntry) {
        // Edit mode — update the specific row by its PK
        const saved = await updateDailySalesById(editEntry.id, entry)
        setEntries(prev =>
          prev
            .map(e => e.id === editEntry.id ? saved : e)
            .sort((a, b) => b.date.localeCompare(a.date))
        )
        toast.success(t('sales_updated'))
      } else {
        // Add mode — upsert: updates if same date already exists
        const saved = await upsertDailySales(businessId, userId, entry)
        setEntries(prev => {
          const idx = prev.findIndex(e => e.date === saved.date)
          if (idx >= 0) {
            const next = [...prev]; next[idx] = saved; return next
          }
          return [saved, ...prev].sort((a, b) => b.date.localeCompare(a.date))
        })
        toast.success(
          isZh
            ? `${saved.date} 营业额已保存 — RM ${saved.totalSales.toFixed(2)}`
            : `Sales for ${saved.date} saved — RM ${saved.totalSales.toFixed(2)}`
        )
      }
    } catch (e) {
      toast.error(editEntry ? t('sales_update_failed') : t('error'))
      throw e  // let SalesForm catch it and keep the form open
    }
  }, [businessId, userId, editEntry, toast, isZh, t])

  // ── Delete: show confirmation dialog ─────────────────────────────────────
  const handleDeleteRequest = useCallback((id: string) => {
    setConfirmDeleteId(id)
  }, [])

  // ── Delete: confirmed ─────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmDeleteId) return
    setDeleteLoading(true)
    try {
      await softDeleteDailySales(confirmDeleteId)
      setEntries(prev => prev.filter(e => e.id !== confirmDeleteId))
      toast.success(t('sales_entry_deleted'))
    } catch {
      toast.error(t('sales_delete_failed'))
    } finally {
      setDeleteLoading(false)
      setConfirmDeleteId(null)
    }
  }, [confirmDeleteId, toast, t])

  // ── Month filter change ────────────────────────────────────────────────────
  function handleMonthChange(value: string) {
    setFilterMonth(value)
    setDataError('')
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  function handleExportCSV() {
    const locale   = isZh ? 'zh-CN' : 'en-MY'
    const filename = isZh
      ? `每日营业额_${filterMonth}`
      : `DailySales_${filterMonth}`
    const headers = isZh
      ? ['日期', '总营业额 (RM)', '堂食', '外带', 'GrabFood', 'Foodpanda', 'ShopeeFood', '现金', '银行卡', '电子钱包', '备注']
      : ['Date', 'Total Sales (RM)', 'Dine-in', 'Takeaway', 'GrabFood', 'Foodpanda', 'ShopeeFood', 'Cash', 'Card', 'E-wallet', 'Notes']
    const rows = entries.map(e => [
      csvDate(e.date, locale),
      e.totalSales.toFixed(2),
      e.dineIn.toFixed(2),
      e.takeaway.toFixed(2),
      e.grabFood.toFixed(2),
      e.foodpanda.toFixed(2),
      e.shopeeFood.toFixed(2),
      e.cash.toFixed(2),
      e.card.toFixed(2),
      e.eWallet.toFixed(2),
      e.notes || '',
    ])
    downloadCSV(filename, headers, rows)
  }

  // ── Loading / error ────────────────────────────────────────────────────────
  if (bizLoading || (dataLoading && entries.length === 0)) return <DailySalesSkeleton />

  if (dataError) {
    return (
      <ErrorState
        title={t('error_fetch_title')}
        message={dataError}
        retryLabel={t('error_retry')}
        onRetry={() => {
          setDataError('')
          setDataLoading(true)
          fetchDailySales(businessId, filterMonth)
            .then(setEntries)
            .catch(e => setDataError(String(e)))
            .finally(() => setDataLoading(false))
        }}
      />
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">{t('sales_title')}</h2>
            {isDemo && <DemoBanner />}
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{t('sales_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"
            disabled={entries.length === 0} onClick={handleExportCSV}>
            <Download size={14} /> {t('export_csv')}
          </Button>
          {!isDemo && canAddSales && (
            <Button
              size="sm"
              onClick={() => { setEditEntry(null); setShowForm(v => !v) }}
              className="gap-1.5"
            >
              <Plus size={15} />
              {t('sales_add_entry')}
            </Button>
          )}
        </div>
      </div>

      {/* ── Add / Edit form ──────────────────────────────────────────────────── */}
      {showForm && !isDemo && (
        <SalesForm
          onClose={handleFormClose}
          onSubmit={handleSubmit}
          initialEntry={editEntry ?? undefined}
        />
      )}

      {/* ── Delete confirmation dialog ────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        title={t('sales_delete_title')}
        message={t('sales_delete_message')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* ── Channel split + stats ────────────────────────────────────────────── */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <ChannelSplitCard entries={entries} t={t} />
          <TopDayCard entries={entries} t={t} />
        </div>
      )}

      {/* ── Sales records table ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{t('sales_records_title')}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{entries.length} {t('sales_records_label')}</span>
            <div className="relative">
              <select
                value={filterMonth}
                onChange={e => handleMonthChange(e.target.value)}
                className="h-8 appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-7 text-xs font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {dataLoading ? (
          <Skeleton className="h-48 rounded-2xl" />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<Plus size={24} />}
            title={t('empty_sales_title')}
            description={t('empty_sales_sub')}
            action={{ label: t('empty_sales_action'), onClick: () => setShowForm(true) }}
          />
        ) : (
          <>
            <SalesTable
            entries={entries}
            onEdit={!isDemo && canEditSales   ? handleEdit          : undefined}
            onDelete={!isDemo && canDeleteSales ? handleDeleteRequest : undefined}
          />
            <p className="text-center text-xs text-gray-400 pb-2">
              {isZh
                ? `显示 ${entries.length} 条记录 · 点击行展开详情`
                : `Showing ${entries.length} entries · Click any row to expand`}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Inline helper cards ──────────────────────────────────────────────────────

function ChannelSplitCard({ entries, t }: { entries: SalesEntry[]; t: (k: TranslationKey) => string }) {
  const total    = entries.reduce((s, e) => s + e.totalSales, 0)
  const dineIn   = entries.reduce((s, e) => s + e.dineIn,    0)
  const takeaway = entries.reduce((s, e) => s + e.takeaway,  0)
  const delivery = entries.reduce((s, e) => s + e.grabFood + e.foodpanda + e.shopeeFood, 0)

  if (total === 0) return null

  const bars = [
    { label: t('sales_field_dine_in'),  value: dineIn,   pct: (dineIn   / total) * 100, color: 'bg-indigo-500' },
    { label: t('sales_field_takeaway'), value: takeaway, pct: (takeaway / total) * 100, color: 'bg-emerald-500' },
    { label: t('sales_delivery'),       value: delivery, pct: (delivery / total) * 100, color: 'bg-orange-400' },
  ]

  return (
    <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-card">
      <h3 className="text-sm font-semibold text-gray-800">{t('sales_channel_section')}</h3>
      <p className="mt-0.5 text-xs text-gray-400 mb-4">{t('sales_month_label')}</p>

      <div className="flex h-3 w-full overflow-hidden rounded-full mb-4">
        {bars.map(b => (
          <div key={b.label} className={b.color} style={{ width: `${b.pct}%` }}
            title={`${b.label}: ${b.pct.toFixed(1)}%`} />
        ))}
      </div>

      <div className="space-y-2">
        {bars.map(b => (
          <div key={b.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${b.color}`} />
              <span className="text-xs text-gray-600">{b.label}</span>
            </div>
            <span className="text-xs font-semibold text-gray-800 tabular-nums">
              {b.pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopDayCard({ entries, t }: { entries: SalesEntry[]; t: (k: TranslationKey) => string }) {
  if (entries.length === 0) return null

  const best  = entries.reduce((a, b) => b.totalSales > a.totalSales ? b : a)
  const worst = entries.reduce((a, b) => b.totalSales < a.totalSales ? b : a)
  const avg   = entries.reduce((s, e) => s + e.totalSales, 0) / entries.length

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(n)
  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })

  return (
    <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-card">
      <h3 className="text-sm font-semibold text-gray-800">{t('sales_highlights')}</h3>
      <p className="mt-0.5 text-xs text-gray-400 mb-4">{entries.length} {t('sales_days')}</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
          <div>
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">{t('sales_best_day')}</p>
            <p className="text-xs text-emerald-500">{fmtDate(best.date)}</p>
          </div>
          <p className="text-sm font-bold text-emerald-700 tabular-nums">{fmt(best.totalSales)}</p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
          <div>
            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">{t('sales_lowest_day')}</p>
            <p className="text-xs text-amber-400">{fmtDate(worst.date)}</p>
          </div>
          <p className="text-sm font-bold text-amber-600 tabular-nums">{fmt(worst.totalSales)}</p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{t('sales_avg_daily_label')}</p>
            <p className="text-xs text-gray-400">{entries.length} {t('sales_days')}</p>
          </div>
          <p className="text-sm font-bold text-gray-700 tabular-nums">{fmt(avg)}</p>
        </div>
      </div>
    </div>
  )
}
