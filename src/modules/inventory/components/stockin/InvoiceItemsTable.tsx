import React, { useState } from 'react'
import { Layers, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react'
import { Medicine } from '../../../../types'
import { formatExpiryDisplay } from '../../../../lib/formatDate'

interface InvoiceItemsTableProps {
  items: any[]
  medicines: Medicine[]
  editingIndex: number | null
  recentlyAddedIndex: number | null
  onEditItem: (index: number) => void
  onDeleteItem: (index: number) => void
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({
  items,
  medicines,
  editingIndex,
  recentlyAddedIndex,
  onEditItem,
  onDeleteItem
}) => {
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null)

  // Compute table totals
  const totalBilledQty = items.reduce((sum, item) => sum + (item.qtyPurchased || 0), 0)
  const totalFreeQty = items.reduce((sum, item) => sum + (item.freeQty || 0), 0)
  const totalTaxable = items.reduce((sum, item) => sum + (item.taxableAmount || 0), 0)
  const totalGst = items.reduce(
    (sum, item) => sum + (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0),
    0
  )
  const grandTotal = totalTaxable + totalGst

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-cyan-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Step 3 — Review Received Invoice Items
              <span className="text-xs font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-200/80 px-2.5 py-0.5 rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">Inspect medicines, batches, quantities, tax slabs, and rates added to invoice</p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 px-2">Total Billed Qty: <strong className="text-slate-900">{totalBilledQty}</strong></span>
            {totalFreeQty > 0 && <span className="text-emerald-700 font-bold px-2 bg-emerald-50 rounded border border-emerald-200/60">Free: +{totalFreeQty}</span>}
            <span className="text-slate-500 px-2">Taxable: <strong className="text-slate-900">₹{totalTaxable.toFixed(2)}</strong></span>
            <span className="text-cyan-700 font-bold px-2">GST: ₹{totalGst.toFixed(2)}</span>
            <span className="bg-slate-900 text-cyan-300 font-extrabold px-3 py-1 rounded-lg">Total: ₹{grandTotal.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto relative rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider">
              <th className="px-4 py-3 sticky left-0 bg-slate-900 text-cyan-400 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] min-w-[220px]">
                Medicine Particulars
              </th>
              <th className="px-4 py-3">HSN / GST</th>
              <th className="px-4 py-3">Batch No</th>
              <th className="px-4 py-3">Expiry Date</th>
              <th className="px-4 py-3 text-right">Qty & Unit</th>
              <th className="px-4 py-3 text-right">Free</th>
              <th className="px-4 py-3 text-right">MRP</th>
              <th className="px-4 py-3 text-right">Disc %</th>
              <th className="px-4 py-3 text-right">Pur. Rate</th>
              <th className="px-4 py-3 text-right">Sell Rate</th>
              <th className="px-4 py-3 text-right min-w-[110px]">Net Total</th>
              <th className="px-4 py-3 text-right min-w-[130px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item: any, index: number) => {
              const med = medicines.find((m) => m.id === item.medicineId)
              const itemTotal =
                (item.taxableAmount || 0) +
                (item.cgstAmount || 0) +
                (item.sgstAmount || 0) +
                (item.igstAmount || 0)
              const isRecentlyAdded = recentlyAddedIndex === index
              const isBeingEdited = editingIndex === index

              // Check expiry warnings
              let expiryBadge = null
              if (item.expiryDate) {
                const expTime = new Date(item.expiryDate).getTime()
                const nowTime = new Date().setHours(0, 0, 0, 0)
                const daysLeft = Math.ceil((expTime - nowTime) / (1000 * 60 * 60 * 24))
                if (daysLeft <= 0) {
                  expiryBadge = <span className="text-[9px] font-extrabold bg-red-100 text-red-800 px-1.5 py-0.5 rounded uppercase">Expired</span>
                } else if (daysLeft <= 90) {
                  expiryBadge = <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">Near Exp ({daysLeft}d)</span>
                }
              }

              return (
                <tr
                  key={index}
                  className={`transition-colors duration-300 ${
                    isRecentlyAdded
                      ? 'bg-cyan-50/90 font-medium'
                      : isBeingEdited
                      ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Sticky Medicine Column */}
                  <td className="px-4 py-3 font-semibold text-slate-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="font-bold text-slate-900">{med?.name || 'Medicine'}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                      {med?.strength && <span className="font-semibold text-cyan-800">{med.strength}</span>}
                      {med?.type && <span className="font-mono uppercase font-bold text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">{med.type}</span>}
                      {med?.pack && <span>&middot; Pack: {med.pack}</span>}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs font-mono">
                    <div>{med?.hsn_code || item.hsn_code || '---'}</div>
                    <span className="text-[10px] bg-cyan-50 text-cyan-800 border border-cyan-200/80 font-sans px-1.5 py-0.5 rounded font-bold">
                      GST {item.gstPercent ?? med?.default_gst_percent ?? 12}%
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">
                    {item.batchNo || 'N/A'}
                  </td>

                  <td className="px-4 py-3 text-xs font-mono">
                    <div>{formatExpiryDisplay(item.expiryDate)}</div>
                    {expiryBadge && <div className="mt-0.5">{expiryBadge}</div>}
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {item.qtyPurchased}{' '}
                    <span className="text-[11px] font-sans font-normal text-slate-500">
                      {item.unit || 'Unit'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-cyan-700 font-semibold">
                    {item.freeQty > 0 ? (
                      <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 text-xs font-bold">
                        +{item.freeQty} {item.freeUnit || item.unit || ''}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                    {item.mrp > 0 ? `₹${item.mrp.toFixed(2)}` : '-'}
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                    {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-semibold">₹{item.purchasePricePerUnit.toFixed(2)}</td>

                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                    ₹{item.sellingPricePerUnit.toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-extrabold text-cyan-950 bg-cyan-50/40">
                    ₹{itemTotal.toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEditItem(index)}
                        className="px-2.5 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmIndex(index)}
                        className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {items.length === 0 && (
              <tr>
                <td colSpan={12} className="px-6 py-12 text-center bg-slate-50/40">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto border border-cyan-100">
                      <Package className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">No items added to this purchase invoice yet.</p>
                    <p className="text-xs text-slate-500">
                      Select a medicine in Step 2 above or scan an invoice to populate items, then press{' '}
                      <kbd className="px-1.5 py-0.5 bg-white border rounded text-[11px] font-mono shadow-2xs">Enter</kbd> to add.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CONFIRMATION DIALOG FOR DELETE ITEM */}
      {deleteConfirmIndex !== null && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900">Remove Item from Invoice?</h4>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove{' '}
              <strong className="text-slate-900">
                {medicines.find((m) => m.id === items[deleteConfirmIndex]?.medicineId)?.name}
              </strong>{' '}
              (Batch: {items[deleteConfirmIndex]?.batchNo || 'N/A'}) from this invoice?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmIndex(null)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteItem(deleteConfirmIndex)
                  setDeleteConfirmIndex(null)
                }}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Remove Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
