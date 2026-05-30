'use client'

import { useState } from 'react'
import {
  UtensilsCrossed, ShoppingBag,
  Bike, CreditCard, Wallet, Banknote,
  CheckCircle2, AlertCircle, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { blankForm, formToEntry, type SalesFormState, type SalesEntry } from '@/lib/mock-data/sales'
import { cn, localDateStr } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toNum  = (v: string) => parseFloat(v) || 0
const today  = () => localDateStr()   // local timezone — NOT toISOString()

// ─── Channel row ─────────────────────────────────────────────────────────────

function ChannelRow({
  icon, iconBg, iconColor, label, fieldKey, value, onChange, placeholder,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  label: string
  fieldKey: string
  value: string
  onChange: (key: string, val: string) => void
  placeholder: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconBg, iconColor)}>
        {icon}
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none select-none">
            RM
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className="h-8 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm tabular-nums text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-shadow"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Entry → form state (for edit mode) ──────────────────────────────────────

function entryToForm(e: SalesEntry): SalesFormState {
  const s = (n: number) => (n > 0 ? String(n) : '')
  return {
    date:               e.date,
    dineIn:             s(e.dineIn),
    takeaway:           s(e.takeaway),
    grabFood:           s(e.grabFood),
    foodpanda:          s(e.foodpanda),
    shopeeFood:         s(e.shopeeFood),
    grabFoodCommission: e.grabFoodCommission  != null ? String(e.grabFoodCommission)  : '',
    foodpandaCommission:e.foodpandaCommission != null ? String(e.foodpandaCommission) : '',
    shopeeCommission:   e.shopeeCommission    != null ? String(e.shopeeCommission)    : '',
    cash:               s(e.cash),
    card:               s(e.card),
    eWallet:            s(e.eWallet),
    notes:              e.notes,
  }
}

// ─── SalesForm ────────────────────────────────────────────────────────────────

interface SalesFormProps {
  onClose:       () => void
  onSubmit:      (entry: SalesEntry) => Promise<void>
  /** When provided, form opens in edit mode pre-filled with this entry's data */
  initialEntry?: SalesEntry
}

export function SalesForm({ onClose, onSubmit, initialEntry }: SalesFormProps) {
  const { t } = useLanguage()
  const isEdit = !!initialEntry

  const [form, setForm] = useState<SalesFormState>(() =>
    initialEntry ? entryToForm(initialEntry) : { ...blankForm, date: today() }
  )
  const [submitting, setSubmitting] = useState(false)
  const [formError,  setFormError]  = useState('')

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }))
    setFormError('')
  }

  // Auto-computed totals
  const totalSales =
    toNum(form.dineIn) + toNum(form.takeaway) + toNum(form.grabFood) +
    toNum(form.foodpanda) + toNum(form.shopeeFood)

  const totalPayments = toNum(form.cash) + toNum(form.card) + toNum(form.eWallet)

  const diff = Math.abs(totalSales - totalPayments)
  const isBalanced = diff < 0.01
  const hasAnySales = totalSales > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    // ── Validation — block bad input before it reaches Supabase ──────────────
    // Reject negatives in any channel, payment, or commission field.
    const numericValues = [
      form.dineIn, form.takeaway, form.grabFood, form.foodpanda, form.shopeeFood,
      form.cash, form.card, form.eWallet,
      form.grabFoodCommission, form.foodpandaCommission, form.shopeeCommission,
    ]
    if (numericValues.some(v => v.trim() !== '' && parseFloat(v) < 0)) {
      setFormError(t('validation_amount_negative'))
      return
    }
    if (!form.date) {
      setFormError(t('validation_date_required'))
      return
    }
    if (!hasAnySales) {
      setFormError(t('validation_sales_min'))
      return
    }

    setSubmitting(true)
    try {
      // In edit mode, preserve the original ID so updateDailySalesById can target it
      const entryId = initialEntry?.id ?? `tmp-${Date.now()}`
      await onSubmit(formToEntry(form, entryId))
      if (!isEdit) setForm({ ...blankForm, date: today() })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const placeholder = t('sales_placeholder_amount')

  return (
    <div className="rounded-2xl bg-white ring-1 ring-indigo-100 shadow-lg overflow-hidden">
      {/* Form header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-indigo-50/50 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <UtensilsCrossed size={13} className="text-white" />
          </div>
          <p className="text-sm font-semibold text-gray-800">
            {isEdit ? t('sales_edit_entry') : t('sales_add_entry')}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-5">
          {/* Date */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('sales_date')}</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              required
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>

          {/* Two-column grid on desktop */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* ── Left: Sales by Channel ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <span className="h-4 w-0.5 rounded-full bg-indigo-500" />
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {t('sales_channel_section')}
                </p>
              </div>

              {/* In-store group */}
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 pl-11">
                {t('sales_in_store')}
              </p>

              <ChannelRow
                icon={<UtensilsCrossed size={14} />}
                iconBg="bg-indigo-50" iconColor="text-indigo-600"
                label={t('sales_field_dine_in')}
                fieldKey="dineIn" value={form.dineIn}
                onChange={set} placeholder={placeholder}
              />
              <ChannelRow
                icon={<ShoppingBag size={14} />}
                iconBg="bg-emerald-50" iconColor="text-emerald-600"
                label={t('sales_field_takeaway')}
                fieldKey="takeaway" value={form.takeaway}
                onChange={set} placeholder={placeholder}
              />

              {/* Delivery group */}
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 pl-11 pt-1">
                {t('sales_delivery')}
              </p>

              <ChannelRow
                icon={<Bike size={14} />}
                iconBg="bg-green-50" iconColor="text-green-600"
                label={t('sales_field_grab')}
                fieldKey="grabFood" value={form.grabFood}
                onChange={set} placeholder={placeholder}
              />
              <ChannelRow
                icon={<Bike size={14} />}
                iconBg="bg-pink-50" iconColor="text-pink-600"
                label={t('sales_field_foodpanda')}
                fieldKey="foodpanda" value={form.foodpanda}
                onChange={set} placeholder={placeholder}
              />
              <ChannelRow
                icon={<Bike size={14} />}
                iconBg="bg-orange-50" iconColor="text-orange-500"
                label={t('sales_field_shopee')}
                fieldKey="shopeeFood" value={form.shopeeFood}
                onChange={set} placeholder={placeholder}
              />

              {/* Channel total */}
              <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-2.5 mt-2">
                <p className="text-xs font-semibold text-indigo-700">{t('sales_total_label')}</p>
                <p className="text-base font-bold text-indigo-700 tabular-nums">
                  RM {totalSales.toFixed(2)}
                </p>
              </div>
            </div>

            {/* ── Right: Payment Method + Notes ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <span className="h-4 w-0.5 rounded-full bg-emerald-500" />
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {t('sales_payment_section')}
                </p>
              </div>

              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 pl-11">
                {t('sales_payment_method')}
              </p>

              <ChannelRow
                icon={<Banknote size={14} />}
                iconBg="bg-emerald-50" iconColor="text-emerald-600"
                label={t('sales_field_cash')}
                fieldKey="cash" value={form.cash}
                onChange={set} placeholder={placeholder}
              />
              <ChannelRow
                icon={<CreditCard size={14} />}
                iconBg="bg-blue-50" iconColor="text-blue-600"
                label={t('sales_field_card')}
                fieldKey="card" value={form.card}
                onChange={set} placeholder={placeholder}
              />
              <ChannelRow
                icon={<Wallet size={14} />}
                iconBg="bg-purple-50" iconColor="text-purple-600"
                label={t('sales_field_ewallet')}
                fieldKey="eWallet" value={form.eWallet}
                onChange={set} placeholder={placeholder}
              />

              {/* Payment total + balance indicator */}
              <div className={cn(
                'flex items-center justify-between rounded-xl px-4 py-2.5 mt-2',
                totalPayments === 0
                  ? 'bg-gray-50'
                  : isBalanced
                  ? 'bg-emerald-50'
                  : 'bg-amber-50'
              )}>
                <div className="flex items-center gap-1.5">
                  {totalPayments === 0 ? null : isBalanced ? (
                    <CheckCircle2 size={13} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={13} className="text-amber-600" />
                  )}
                  <p className={cn(
                    'text-xs font-semibold',
                    totalPayments === 0
                      ? 'text-gray-500'
                      : isBalanced
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  )}>
                    {totalPayments === 0
                      ? t('sales_total_payments')
                      : isBalanced
                      ? t('sales_balanced')
                      : `${t('sales_unbalanced')}: RM ${diff.toFixed(2)}`
                    }
                  </p>
                </div>
                <p className={cn(
                  'text-base font-bold tabular-nums',
                  totalPayments === 0 ? 'text-gray-500' : isBalanced ? 'text-emerald-700' : 'text-amber-700'
                )}>
                  RM {totalPayments.toFixed(2)}
                </p>
              </div>

              {/* Notes */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {t('sales_note')}
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="e.g. Public holiday, heavy rain, Raya..."
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-shadow"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Platform Commission Section ── */}
        {(toNum(form.grabFood) > 0 || toNum(form.foodpanda) > 0 || toNum(form.shopeeFood) > 0) && (
          <div className="border-t border-dashed border-indigo-100 pt-4 mx-5 mb-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-4 w-0.5 rounded-full bg-orange-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('platform_commission_section')}
              </p>
              <span className="ml-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                {t('platform_estimated_badge')}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3 pl-2">
              {t('platform_commission_hint')}
            </p>

            <div className="space-y-3">
              {(
                [
                  { gross: form.grabFood,   commVal: form.grabFoodCommission,  commKey: 'grabFoodCommission'  as const, label: 'GrabFood',   rate: 0.30, color: 'text-green-700',  bg: 'bg-green-50' },
                  { gross: form.foodpanda,  commVal: form.foodpandaCommission, commKey: 'foodpandaCommission' as const, label: 'Foodpanda',  rate: 0.30, color: 'text-pink-700',   bg: 'bg-pink-50' },
                  { gross: form.shopeeFood, commVal: form.shopeeCommission,    commKey: 'shopeeCommission'    as const, label: 'ShopeeFood', rate: 0.25, color: 'text-orange-600', bg: 'bg-orange-50' },
                ]
              ).filter(row => toNum(row.gross) > 0)
               .map(({ gross: grossStr, commVal, commKey, label, rate, color, bg }) => {
                const gross = toNum(grossStr)
                const commVal2 = commVal
                const commParsed = commVal2.trim() === '' ? null : parseFloat(commVal2) || null
                const effectiveComm = commParsed ?? gross * rate
                const net = gross - effectiveComm
                const isEstimated = commParsed === null

                return (
                  <div key={label} className={`rounded-xl ${bg} p-3 space-y-2`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-bold ${color}`}>{label}</p>
                      {isEstimated && (
                        <span className="text-[10px] text-amber-600 font-medium">
                          {rate * 100}% {t('platform_estimated_badge')}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {/* Gross — read only */}
                      <div>
                        <p className="text-gray-500 mb-0.5">{t('platform_gross')}</p>
                        <p className={`font-semibold tabular-nums ${color}`}>RM {gross.toFixed(2)}</p>
                      </div>
                      {/* Commission input */}
                      <div>
                        <p className="text-gray-500 mb-0.5">{t('platform_commission_label')}</p>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={commVal2}
                          placeholder={`Est. ${(gross * rate).toFixed(2)}`}
                          onChange={e => set(commKey, e.target.value)}
                          className="h-7 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs tabular-nums text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                      </div>
                      {/* Net — read only */}
                      <div>
                        <p className="text-gray-500 mb-0.5">{t('platform_net_received')}</p>
                        <p className={`font-bold tabular-nums ${color}`}>
                          RM {net.toFixed(2)}
                          {isEstimated && <span className="text-[9px] ml-0.5 opacity-60">~</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Validation error */}
        {formError && (
          <div className="mx-5 mb-1 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {formError}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3.5">
          <p className="text-xs text-gray-400">
            {hasAnySales ? `${t('sales_total_label')}: RM ${totalSales.toFixed(2)}` : ''}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!hasAnySales || submitting}
            >
              {submitting
                ? t('saving')
                : isEdit
                ? t('sales_update_btn')
                : t('save')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
