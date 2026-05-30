'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { mockInvoices } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import type { InvoiceStatus } from '@/types'

function statusConfig(status: InvoiceStatus, t: (k: Parameters<ReturnType<typeof useLanguage>['t']>[0]) => string) {
  if (status === 'confirmed')     return { label: t('invoice_status_confirmed'), variant: 'success' as const }
  if (status === 'pending_review') return { label: t('invoice_status_pending'),   variant: 'warning' as const }
  return { label: t('invoice_status_processing'), variant: 'processing' as const }
}

export function RecentInvoices() {
  const { t } = useLanguage()
  const recent = mockInvoices.slice(0, 5)

  return (
    <div className="rounded-2xl bg-white shadow-card border border-gray-100">
      <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-800">{t('dashboard_recent_invoices')}</h3>
        <Link
          href="/invoice-scanner"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          {t('dashboard_view_all')} <ArrowRight size={12} />
        </Link>
      </div>

      <ul className="divide-y divide-gray-50">
        {recent.map((inv) => {
          const { label, variant } = statusConfig(inv.status, t)
          return (
            <li key={inv.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{inv.supplierName}</p>
                <p className="text-xs text-gray-400">
                  {inv.invoiceNumber} · {formatDate(inv.invoiceDate)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-semibold text-gray-800">
                  {formatCurrency(inv.total)}
                </span>
                <Badge variant={variant}>{label}</Badge>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
