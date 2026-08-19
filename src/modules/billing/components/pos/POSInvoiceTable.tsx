import React, { useState } from 'react'
import { Package, Zap, Trash2, Layers, AlertTriangle } from 'lucide-react'

export interface SelectedItem {
  id: string // service id / batch id / temp id
  itemType: 'SERVICE' | 'MEDICINE' | 'MISC'
  serviceId?: string
  batchId?: string
  name: string
  price: number
  quantity: number
  discount: number
  gstPercent: number
  lineTotal: number
  availableQty?: number // for medicine validation
}

interface POSInvoiceTableProps {
  items: SelectedItem[]
  recentlyAddedIndex: number | null
  onUpdateLineItem: (index: number, field: 'quantity' | 'discount' | 'gstPercent', val: string) => void
  onRemoveLineItem: (index: number) => void
}

export const POSInvoiceTable: React.FC<POSInvoiceTableProps> = ({
  items,
  recentlyAddedIndex,
  onUpdateLineItem,
  onRemoveLineItem
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col min-h-[260px] shadow-2xs">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-600" />
          <h4 className="text-sm font-bold text-slate-900">Step 3 — POS Invoice Items Review</h4>
        </div>
        <span className="text-xs font-mono font-bold bg-white text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full min-w-[640px] text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3">Type</th>
              <th className="px-5 py-3">Particulars (Item / Batch / Service)</th>
              <th className="px-4 py-3 text-right">Unit Price</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-right">Discount</th>
              <th className="px-4 py-3 text-right">GST %</th>
              <th className="px-5 py-3 text-right">Net Total</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center bg-slate-50/30">
                  <div className="max-w-xs mx-auto space-y-2">
                    <Package className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No items added to invoice yet.</p>
                    <p className="text-xs text-slate-400">
                      Search and select medicines or services in Step 2 above to add items.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const isRecentlyAdded = recentlyAddedIndex === index

                return (
                  <tr
                    key={`${item.id}-${index}`}
                    className={`transition-colors duration-500 ${
                      isRecentlyAdded ? 'bg-cyan-50/90 font-medium' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="px-4 py-3">
                      {item.itemType === 'MEDICINE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-cyan-100 text-cyan-800 border border-cyan-200 font-mono">
                          <Package className="w-3 h-3" /> Medicine
                        </span>
                      ) : item.itemType === 'SERVICE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                          <Zap className="w-3 h-3 text-amber-600" /> Service
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          Custom
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3 font-bold text-slate-900">{item.name}</td>

                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                      ₹{item.price.toFixed(2)}
                    </td>

                    {/* INLINE EDITABLE QTY */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => onUpdateLineItem(index, 'quantity', e.target.value)}
                        className="w-16 py-1 px-2 border border-slate-200 rounded-lg text-center font-bold font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </td>

                    {/* INLINE EDITABLE DISCOUNT */}
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => onUpdateLineItem(index, 'discount', e.target.value)}
                        className="w-20 py-1 px-2 border border-slate-200 rounded-lg text-right font-mono font-medium text-xs text-red-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </td>

                    {/* INLINE EDITABLE GST % */}
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        value={item.gstPercent}
                        onChange={(e) => onUpdateLineItem(index, 'gstPercent', e.target.value)}
                        className="w-16 py-1 px-2 border border-slate-200 rounded-lg text-right font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </td>

                    <td className="px-5 py-3 text-right font-extrabold text-cyan-900 font-mono">
                      ₹{item.lineTotal.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveLineItem(index)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
