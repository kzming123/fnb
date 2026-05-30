'use client'

import { Fragment, useState } from 'react'
import { ChevronDown, Trash2, FileEdit, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'
import type { SalesEntry } from '@/lib/mock-data/sales'
import { cn } from '@/lib/utils'

// ─── Column definitions ───────────────────────────────────────────────────────

// ─── Mobile expanded row ──────────────────────────────────────────────────────

function ExpandedRow({ entry, t }: { entry: SalesEntry; t: (k: TranslationKey) => string }) {
  return (
    <tr className="bg-indigo-50/40">
      <td colSpan={12} className="px-4 py-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Channels */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500 mb-1.5">
              {t('sales_channel_section')}
            </p>
            {[
              { label: t('sales_field_dine_in'),   value: entry.dineIn,    color: 'text-indigo-700' },
              { label: t('sales_field_takeaway'),   value: entry.takeaway,  color: 'text-emerald-700' },
              { label: t('sales_field_grab'),       value: entry.grabFood,  color: 'text-green-700' },
              { label: t('sales_field_foodpanda'),  value: entry.foodpanda, color: 'text-pink-700' },
              { label: t('sales_field_shopee'),     value: entry.shopeeFood,color: 'text-orange-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-0.5">
                <span className="text-xs text-gray-500">{label}</span>
                <span className={cn('text-xs font-semibold tabular-nums', value > 0 ? color : 'text-gray-300')}>
                  {value > 0 ? formatCurrency(value) : '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Payments */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-500 mb-1.5">
              {t('sales_payment_section')}
            </p>
            {[
              { label: t('sales_field_cash'),    value: entry.cash,    color: 'text-emerald-700' },
              { label: t('sales_field_card'),    value: entry.card,    color: 'text-blue-700' },
              { label: t('sales_field_ewallet'), value: entry.eWallet, color: 'text-purple-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-0.5">
                <span className="text-xs text-gray-500">{label}</span>
                <span className={cn('text-xs font-semibold tabular-nums', value > 0 ? color : 'text-gray-300')}>
                  {value > 0 ? formatCurrency(value) : '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Summary</p>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-xs text-gray-500">{t('sales_total_label')}</span>
              <span className="text-xs font-bold text-indigo-700 tabular-nums">{formatCurrency(entry.totalSales)}</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-xs text-gray-500">{t('sales_total_payments')}</span>
              <span className="text-xs font-bold tabular-nums text-gray-700">{formatCurrency(entry.totalPayments)}</span>
            </div>
            {Math.abs(entry.totalSales - entry.totalPayments) > 0.01 && (
              <div className="mt-1 flex items-center gap-1">
                <Badge variant="warning" className="text-[10px]">
                  {t('sales_unbalanced')} RM {Math.abs(entry.totalSales - entry.totalPayments).toFixed(2)}
                </Badge>
              </div>
            )}
          </div>

          {/* Platform Commission */}
          {(entry.grabFood > 0 || entry.foodpanda > 0 || entry.shopeeFood > 0) && (
            <div className="sm:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-500 mb-1.5">
                {t('platform_commission_section')}
              </p>
              {[
                { label: 'GrabFood',  gross: entry.grabFood,   comm: entry.grabFoodCommission,  rate: 0.30 },
                { label: 'Foodpanda', gross: entry.foodpanda,  comm: entry.foodpandaCommission, rate: 0.30 },
                { label: 'ShopeeFood',gross: entry.shopeeFood, comm: entry.shopeeCommission,    rate: 0.25 },
              ].filter(r => r.gross > 0).map(r => {
                const isEst = r.comm == null
                const eff   = r.comm ?? r.gross * r.rate
                const net   = r.gross - eff
                return (
                  <div key={r.label} className="py-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{r.label}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 tabular-nums">
                          -{formatCurrency(eff)}
                          {isEst && (
                            <span className="ml-0.5 text-amber-500">{t('platform_estimated_badge')}</span>
                          )}
                        </span>
                        <span className="text-xs font-semibold text-green-700 tabular-nums">
                          = {formatCurrency(net)}
                        </span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">{t('sales_note')}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{entry.notes}</p>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── SalesTable ───────────────────────────────────────────────────────────────

interface SalesTableProps {
  entries:   SalesEntry[]
  onEdit?:   (entry: SalesEntry) => void
  onDelete?: (id: string) => void
}

export function SalesTable({ entries, onEdit, onDelete }: SalesTableProps) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggleRow = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id))

  // Month subtotals
  const totalSales    = entries.reduce((s, e) => s + e.totalSales,    0)
  const totalDineIn   = entries.reduce((s, e) => s + e.dineIn,        0)
  const totalTakeaway = entries.reduce((s, e) => s + e.takeaway,      0)
  const totalGrab     = entries.reduce((s, e) => s + e.grabFood,      0)
  const totalPanda    = entries.reduce((s, e) => s + e.foodpanda,     0)
  const totalShopee   = entries.reduce((s, e) => s + e.shopeeFood,    0)
  const totalCash     = entries.reduce((s, e) => s + e.cash,          0)
  const totalCard     = entries.reduce((s, e) => s + e.card,          0)
  const totalEWallet  = entries.reduce((s, e) => s + e.eWallet,       0)

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-white py-20 ring-1 ring-gray-100 shadow-card">
        <p className="text-sm text-gray-400">{t('sales_no_entries')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-100 shadow-card overflow-hidden">
      <div className="overflow-x-auto table-scroll">
        <table className="w-full text-xs min-w-[780px]">
          <thead>
            {/* Group row */}
            <tr className="bg-gray-50/80">
              <th rowSpan={2} className="px-4 py-2 text-left font-semibold text-gray-600 border-b border-gray-100">
                {t('date')}
              </th>
              <th colSpan={5} className="px-2 py-1.5 text-center font-semibold text-indigo-600 border-b border-indigo-100 bg-indigo-50/50">
                {t('sales_channel_section')}
              </th>
              <th className="px-2 py-1.5 text-center font-bold text-gray-700 border-b border-gray-200 bg-gray-100/60">
                {t('total')}
              </th>
              <th colSpan={3} className="px-2 py-1.5 text-center font-semibold text-emerald-600 border-b border-emerald-100 bg-emerald-50/50">
                {t('sales_payment_section')}
              </th>
              <th rowSpan={2} className="px-3 py-2 text-left font-semibold text-gray-500 border-b border-gray-100">
                {t('note')}
              </th>
              <th rowSpan={2} className="px-3 py-2 border-b border-gray-100 w-16" />
            </tr>
            {/* Sub-header row */}
            <tr className="bg-gray-50/40 border-b border-gray-100">
              {/* Channel cols */}
              <th className="px-2 py-2 text-right font-medium text-gray-500 whitespace-nowrap">Dine-in</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500 whitespace-nowrap">Takeaway</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500 whitespace-nowrap">Grab</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500 whitespace-nowrap">Panda</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500 whitespace-nowrap">Shopee</th>
              {/* Total col */}
              <th className="px-3 py-2 text-right font-bold text-gray-700 bg-gray-100/40 whitespace-nowrap">
                {t('sales_total_label')}
              </th>
              {/* Payment cols */}
              <th className="px-2 py-2 text-right font-medium text-gray-500 whitespace-nowrap">{t('sales_cash_pct')}</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500 whitespace-nowrap">{t('sales_card_pct')}</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500 whitespace-nowrap">{t('sales_ewallet_pct')}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {entries.map((entry) => {
              const isExpanded = expanded === entry.id
              const isToday = entry.date === new Date().toISOString().split('T')[0]
              const balanced = Math.abs(entry.totalSales - entry.totalPayments) < 0.01

              return (
                <Fragment key={entry.id}>
                  <tr
                    onClick={() => toggleRow(entry.id)}
                    className={cn(
                      'group cursor-pointer transition-colors',
                      isExpanded ? 'bg-indigo-50/30' : 'hover:bg-gray-50/60'
                    )}
                  >
                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isExpanded
                          ? <ChevronDown size={13} className="text-indigo-500" />
                          : <ChevronRight size={13} className="text-gray-300" />
                        }
                        <div>
                          <p className={cn('font-medium', isToday ? 'text-indigo-600' : 'text-gray-700')}>
                            {formatDate(entry.date, 'en-MY', { day: 'numeric', month: 'short' })}
                          </p>
                          {isToday && (
                            <span className="text-[10px] font-semibold text-indigo-500">TODAY</span>
                          )}
                          {entry.notes && !isToday && (
                            <span className="text-[10px] text-amber-500">★</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Channel cells */}
                    {[entry.dineIn, entry.takeaway, entry.grabFood, entry.foodpanda, entry.shopeeFood].map((v, i) => (
                      <td key={i} className="px-2 py-3 text-right tabular-nums text-gray-600">
                        {v > 0 ? formatCurrency(v) : <span className="text-gray-200">—</span>}
                      </td>
                    ))}

                    {/* Total */}
                    <td className="px-3 py-3 text-right bg-indigo-50/20">
                      <span className="font-bold text-indigo-700 tabular-nums">
                        {formatCurrency(entry.totalSales)}
                      </span>
                      {!balanced && (
                        <span className="ml-1 text-amber-500">⚠</span>
                      )}
                    </td>

                    {/* Payment cells */}
                    {[entry.cash, entry.card, entry.eWallet].map((v, i) => (
                      <td key={i} className="px-2 py-3 text-right tabular-nums text-gray-600">
                        {v > 0 ? formatCurrency(v) : <span className="text-gray-200">—</span>}
                      </td>
                    ))}

                    {/* Notes preview */}
                    <td className="px-3 py-3 max-w-[120px]">
                      <p className="truncate text-gray-400">{entry.notes || ''}</p>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(entry)}
                            title="Edit"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          >
                            <FileEdit size={13} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(entry.id)}
                            title="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {isExpanded && <ExpandedRow entry={entry} t={t} />}
                </Fragment>
              )
            })}
          </tbody>

          {/* Subtotal footer */}
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-4 py-3 text-xs font-bold text-gray-600">{t('sales_month_subtotal')}</td>
              {[totalDineIn, totalTakeaway, totalGrab, totalPanda, totalShopee].map((v, i) => (
                <td key={i} className="px-2 py-3 text-right text-xs font-semibold text-gray-700 tabular-nums">
                  {formatCurrency(v)}
                </td>
              ))}
              <td className="px-3 py-3 text-right bg-indigo-50/50">
                <span className="text-sm font-bold text-indigo-700 tabular-nums">
                  {formatCurrency(totalSales)}
                </span>
              </td>
              {[totalCash, totalCard, totalEWallet].map((v, i) => (
                <td key={i} className="px-2 py-3 text-right text-xs font-semibold text-gray-700 tabular-nums">
                  {formatCurrency(v)}
                </td>
              ))}
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
