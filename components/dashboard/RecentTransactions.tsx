'use client'

import Link from 'next/link'
import { ArrowRight, TrendingUp, FileText, Receipt } from 'lucide-react'
import { recentTransactions, type Transaction, type TxType, type TxStatus } from '@/lib/mock-data/dashboard'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'

// ─── Type config ─────────────────────────────────────────────────────────────

function typeConfig(type: TxType, t: (k: TranslationKey) => string) {
  switch (type) {
    case 'sale':
      return {
        label: t('dashboard_type_sale'),
        icon: TrendingUp,
        dot:  'bg-emerald-500',
        bg:   'bg-emerald-50',
        text: 'text-emerald-600',
      }
    case 'invoice':
      return {
        label: t('dashboard_type_invoice'),
        icon: FileText,
        dot:  'bg-indigo-500',
        bg:   'bg-indigo-50',
        text: 'text-indigo-600',
      }
    case 'expense':
      return {
        label: t('dashboard_type_expense'),
        icon: Receipt,
        dot:  'bg-orange-400',
        bg:   'bg-orange-50',
        text: 'text-orange-600',
      }
  }
}

function statusBadge(status: TxStatus, t: (k: TranslationKey) => string) {
  if (status === 'completed')     return <Badge variant="success">{t('transaction_completed')}</Badge>
  if (status === 'confirmed')     return <Badge variant="secondary">{t('invoice_status_confirmed')}</Badge>
  return <Badge variant="warning">{t('invoice_status_pending')}</Badge>
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecentTransactionsProps {
  /** Real transactions from Supabase. Falls back to mock data when undefined. */
  transactions?: Transaction[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { t, isZh } = useLanguage()

  // undefined → demo mode → use mock; [] → real user, no data → empty state
  const useMock = transactions === undefined
  const isEmpty = !useMock && (!transactions || transactions.length === 0)
  const txList  = useMock ? recentTransactions : (transactions ?? [])

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{t('dashboard_recent_transactions')}</h3>
          <p className="mt-0.5 text-xs text-gray-400">{t('dashboard_30_days')}</p>
        </div>
        <Link
          href="/invoice-scanner"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          {t('dashboard_view_report')} <ArrowRight size={12} />
        </Link>
      </div>

      {/* Empty state for real users with no transactions yet */}
      {isEmpty && (
        <div className="flex items-center justify-center py-12 text-center px-4">
          <div>
            <p className="text-sm font-medium text-gray-400">
              {isZh ? '暂无交易记录' : 'No transactions yet'}
            </p>
            <p className="mt-1 text-xs text-gray-300">
              {isZh ? '记录每日营业额或扫描发票后，记录将显示在这里' : 'Log daily sales or scan an invoice to get started'}
            </p>
          </div>
        </div>
      )}

      {/* Table — scrollable on mobile */}
      {!isEmpty && (
      <div className="overflow-x-auto table-scroll">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/60">
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">{t('date')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('status')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Description</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">{t('invoice_amount')}</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">{t('status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {txList.map((tx) => {
              const cfg = typeConfig(tx.type, t)
              const Icon = cfg.icon
              const isIncoming = tx.amount > 0
              return (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Date */}
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(tx.date, 'en-MY', { day: 'numeric', month: 'short' })}
                  </td>

                  {/* Type pill */}
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                        <Icon size={14} className={cfg.text} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate max-w-[200px]">
                          {tx.description}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[200px]">
                          {tx.subtext}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <span className={`font-semibold tabular-nums ${isIncoming ? 'text-emerald-600' : 'text-gray-700'}`}>
                      {isIncoming ? '+' : ''}{formatCurrency(tx.amount)}
                    </span>
                  </td>

                  {/* Status badge */}
                  <td className="px-5 py-3.5">
                    {statusBadge(tx.status, t)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      )}

      {/* Money summary footer — only when there are transactions */}
      {!isEmpty && (
        <div className="flex items-center justify-between border-t border-gray-50 bg-gray-50/40 px-5 py-3">
          <div className="flex items-center gap-6 text-xs">
            <span className="text-gray-400">
              {txList.filter((tx) => tx.amount > 0).length} {t('dashboard_type_sale').toLowerCase()}s
            </span>
            <span className="text-gray-400">
              {txList.filter((tx) => tx.amount < 0).length} {t('nav_expenses').toLowerCase()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-400">{t('total')}:</span>
            <span className={`font-bold tabular-nums ${
              txList.reduce((s, tx) => s + tx.amount, 0) >= 0
                ? 'text-emerald-600'
                : 'text-red-600'
            }`}>
              {formatCurrency(txList.reduce((s, tx) => s + tx.amount, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
