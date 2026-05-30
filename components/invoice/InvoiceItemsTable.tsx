'use client'

import { Trash2, Plus } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ConfidenceChip } from './ConfidenceScore'
import { INVOICE_CATEGORIES, type ExtractedItem } from '@/lib/mock-data/invoices'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface InvoiceItemsTableProps {
  items:    ExtractedItem[]
  onChange: (items: ExtractedItem[]) => void
}

export function InvoiceItemsTable({ items, onChange }: InvoiceItemsTableProps) {
  const { t } = useLanguage()

  const totalFromItems = items.reduce((s, item) => s + item.lineTotal, 0)

  function updateItem(id: string, field: keyof ExtractedItem, value: string | number) {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        // Auto-recalculate lineTotal when qty or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice') {
          updated.lineTotal = updated.quantity * updated.unitPrice
        }
        return updated
      })
    )
  }

  function deleteItem(id: string) {
    onChange(items.filter((item) => item.id !== id))
  }

  function addItem() {
    const newItem: ExtractedItem = {
      id:          `item-${Date.now()}`,
      description: '',
      unit:        'pcs',
      quantity:    1,
      unitPrice:   0,
      lineTotal:   0,
      category:    'Food Cost - Dry Goods',
      confidence:  1, // manually added = full confidence
    }
    onChange([...items, newItem])
  }

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-gray-100">
      <div className="overflow-x-auto table-scroll">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                {t('invoice_item_name')}
              </th>
              <th className="px-3 py-3 text-center font-semibold text-gray-600 w-20">
                {t('invoice_item_qty')}
              </th>
              <th className="px-3 py-3 text-center font-semibold text-gray-600 w-20">
                {t('invoice_item_unit')}
              </th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600 w-28">
                {t('invoice_item_unit_price')}
              </th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600 w-28">
                {t('invoice_item_total')}
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600">
                {t('invoice_category_field')}
              </th>
              <th className="px-3 py-3 w-8" />
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50 bg-white">
            {items.map((item) => {
              const lowConf = item.confidence < 0.7
              return (
                <tr
                  key={item.id}
                  className={cn(
                    'group transition-colors',
                    lowConf ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-gray-50/60'
                  )}
                >
                  {/* Description */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className={cn(
                          'w-full min-w-[140px] rounded-lg border px-2.5 py-1.5 text-xs text-gray-800',
                          'focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow',
                          lowConf
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-gray-200 bg-white'
                        )}
                      />
                      <ConfidenceChip score={item.confidence} />
                    </div>
                  </td>

                  {/* Qty */}
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
                    />
                  </td>

                  {/* Unit */}
                  <td className="px-3 py-2.5">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
                    />
                  </td>

                  {/* Unit price */}
                  <td className="px-3 py-2.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium pointer-events-none">RM</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-gray-200 bg-white pl-7 pr-2 py-1.5 text-right text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
                      />
                    </div>
                  </td>

                  {/* Line total — read-only, computed */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-semibold text-gray-800 tabular-nums">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-2.5">
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                      className="w-full min-w-[160px] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
                    >
                      {INVOICE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>

                  {/* Delete */}
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                      title={t('invoice_delete_item')}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Footer with totals */}
          <tfoot>
            {/* Add row button */}
            <tr className="border-t border-gray-100 bg-gray-50/40">
              <td colSpan={7} className="px-4 py-2">
                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Plus size={13} />
                  {t('invoice_add_item')}
                </button>
              </td>
            </tr>
            {/* Subtotal from items */}
            <tr className="border-t border-gray-200 bg-gray-50">
              <td colSpan={4} className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                {t('invoice_item_total')} ({items.length} items)
              </td>
              <td className="px-3 py-3 text-right">
                <span className="text-sm font-bold text-indigo-700 tabular-nums">
                  {formatCurrency(totalFromItems)}
                </span>
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
