import React, { useMemo } from 'react'
import {
  Package,
  Plus,
  Edit2,
  Check,
  Sparkles,
  Lock,
  AlertTriangle,
  Clock,
  HelpCircle
} from 'lucide-react'
import { Medicine, InventoryBatch } from '../../../../types'
import {
  getAvailableUnitsForMedicine,
  convertToBaseQuantity
} from '../../../../lib/unitConversion'
import { UnitSelectorCombobox } from '../UnitSelectorCombobox'

export interface StockInItemFormState {
  medicineId: string
  batchNo: string
  expiryDate: string
  qtyPurchased: string
  unit: string
  freeQty: string
  freeUnit: string
  mrp: string
  discountPercent: string
  gstPercent: string
  purchasePricePerUnit: string
  amount: string
  sellingPricePerUnit: string
}

interface BatchItemEntryPanelProps {
  itemState: StockInItemFormState
  onChange: (updated: StockInItemFormState) => void
  selectedMedicine: Medicine | null
  existingBatches: InventoryBatch[]
  currentInvoiceItems: any[]
  editingIndex: number | null
  onAddItem: () => void
  onCancelEdit: () => void
  onOpenQuickCreateMedicine?: () => void
}

export const BatchItemEntryPanel: React.FC<BatchItemEntryPanelProps> = ({
  itemState,
  onChange,
  selectedMedicine,
  existingBatches,
  currentInvoiceItems,
  editingIndex,
  onAddItem,
  onCancelEdit,
  onOpenQuickCreateMedicine
}) => {
  const availableUnits = useMemo(() => {
    return getAvailableUnitsForMedicine(selectedMedicine)
  }, [selectedMedicine])

  // Quantity change handler (updates computed amount)
  const handleQtyChange = (val: string) => {
    const qty = parseFloat(val) || 0
    const pPrice = parseFloat(itemState.purchasePricePerUnit) || 0
    let newAmt = itemState.amount
    if (qty > 0 && pPrice > 0) {
      newAmt = (qty * pPrice).toFixed(2)
    }
    onChange({
      ...itemState,
      qtyPurchased: val,
      amount: newAmt
    })
  }

  // Rate change handler (updates computed amount)
  const handlePurchasePriceChange = (val: string) => {
    const pPrice = parseFloat(val) || 0
    const qty = parseFloat(itemState.qtyPurchased) || 0
    let newAmt = itemState.amount
    if (qty > 0 && pPrice > 0) {
      newAmt = (qty * pPrice).toFixed(2)
    }
    onChange({
      ...itemState,
      purchasePricePerUnit: val,
      amount: newAmt
    })
  }

  // Amount change handler (updates rate per unit)
  const handleAmountChange = (val: string) => {
    const amt = parseFloat(val) || 0
    const qty = parseFloat(itemState.qtyPurchased) || 0
    let newPPrice = itemState.purchasePricePerUnit
    if (qty > 0 && amt >= 0) {
      newPPrice = (amt / qty).toFixed(2)
    }
    onChange({
      ...itemState,
      amount: val,
      purchasePricePerUnit: newPPrice
    })
  }

  // Duplicate batch check
  const duplicateBatchWarning = useMemo(() => {
    if (!itemState.medicineId || !itemState.batchNo.trim()) return null
    const bNo = itemState.batchNo.trim().toLowerCase()

    const inTable = currentInvoiceItems.some(
      (item, idx) =>
        idx !== editingIndex &&
        item.medicineId === itemState.medicineId &&
        (item.batchNo || '').trim().toLowerCase() === bNo
    )
    if (inTable) return 'This batch is already added in the current invoice table.'

    const inStock = existingBatches.some(
      (b) => b.medicine_id === itemState.medicineId && (b.batch_no || '').trim().toLowerCase() === bNo
    )
    if (inStock) return 'This batch already exists in inventory. Quantities will be merged.'

    return null
  }, [itemState.medicineId, itemState.batchNo, currentInvoiceItems, existingBatches, editingIndex])

  // Expiry date warning
  const expiryWarning = useMemo(() => {
    if (!itemState.expiryDate) return null
    const expiryTimestamp = new Date(itemState.expiryDate).getTime()
    const todayTimestamp = new Date().setHours(0, 0, 0, 0)
    const daysToExpiry = Math.ceil((expiryTimestamp - todayTimestamp) / (1000 * 60 * 60 * 24))

    if (daysToExpiry <= 0) return { type: 'expired', text: 'Expired Batch Date!' }
    if (daysToExpiry <= 90) return { type: 'near', text: `Expiring soon in ${daysToExpiry} days` }
    return null
  }, [itemState.expiryDate])

  // Conversion calculations preview
  const conversionPreview = useMemo(() => {
    if (!selectedMedicine || !itemState.qtyPurchased) return null
    const qty = parseFloat(itemState.qtyPurchased) || 0
    if (qty <= 0) return null

    const basePurchased = convertToBaseQuantity(selectedMedicine, qty, itemState.unit)
    const freeQty = parseFloat(itemState.freeQty) || 0
    const baseFree = convertToBaseQuantity(selectedMedicine, freeQty, itemState.freeUnit || itemState.unit)
    const totalBase = basePurchased + baseFree
    const baseUnitLabel = selectedMedicine.base_unit || selectedMedicine.unit_label || 'Piece'

    const pPrice = parseFloat(itemState.purchasePricePerUnit) || 0
    const perBaseCost = basePurchased > 0 ? (qty * pPrice) / basePurchased : 0

    return {
      basePurchased,
      baseFree,
      totalBase,
      baseUnitLabel,
      perBaseCost
    }
  }, [selectedMedicine, itemState])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 sticky top-2 z-20 transition-all">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-cyan-600" />
          <h4 className="text-sm font-bold text-slate-900">
            {editingIndex !== null ? (
              <span className="text-indigo-600 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4" /> Edit Batch Item #{editingIndex + 1}
              </span>
            ) : (
              <span>Step 2 — Enter Medicine Batch Details</span>
            )}
          </h4>
        </div>

        <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-mono">
            Press Enter to Add Item
          </span>
          {editingIndex !== null && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
            >
              Cancel Editing
            </button>
          )}
        </div>
      </div>

      {/* FAST DATA ENTRY FORM ROW / GRID */}
      <div
        onKeyDown={(e) => {
          if (e.key === 'Enter' || (e.ctrlKey && e.key === 'Enter')) {
            e.preventDefault()
            onAddItem()
          }
        }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3 items-end"
      >
        {/* Batch No */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Batch No.
          </label>
          <input
            type="text"
            placeholder="e.g. B-9021"
            value={itemState.batchNo}
            onChange={(e) => onChange({ ...itemState, batchNo: e.target.value })}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono font-semibold"
          />
        </div>

        {/* Expiry Date (MM/YY Picker) */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Expiry (MM/YY) <span className="text-red-500">*</span>
            </label>
            {expiryWarning && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  expiryWarning.type === 'expired'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {expiryWarning.text}
              </span>
            )}
          </div>
          <input
            type="month"
            value={itemState.expiryDate ? itemState.expiryDate.slice(0, 7) : ''}
            onChange={(e) => onChange({ ...itemState, expiryDate: e.target.value })}
            className={`w-full py-2 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 font-mono font-semibold ${
              expiryWarning?.type === 'expired'
                ? 'border-red-300 bg-red-50/30 focus:ring-red-500'
                : 'border-slate-200 focus:ring-cyan-500'
            }`}
          />
        </div>

        {/* Received Quantity */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Received Qty <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            placeholder="10"
            value={itemState.qtyPurchased}
            onChange={(e) => handleQtyChange(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono font-bold text-slate-900"
          />
        </div>

        {/* Purchase Unit Searchable Combobox */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unit</label>
          <UnitSelectorCombobox
            value={itemState.unit}
            onChange={(selectedUnit: string) =>
              onChange({
                ...itemState,
                unit: selectedUnit,
                freeUnit: itemState.freeUnit || selectedUnit
              })
            }
            availableOptions={availableUnits}
            placeholder="Unit..."
          />
        </div>

        {/* Free Qty */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Free Qty</label>
          <input
            type="number"
            placeholder="0"
            value={itemState.freeQty}
            onChange={(e) => onChange({ ...itemState, freeQty: e.target.value })}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-cyan-700 font-bold"
          />
        </div>

        {/* Purchase Price */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
            <span>Pur. Rate</span>
            {itemState.unit && <span className="text-[10px] text-cyan-600 font-normal lowercase">/{itemState.unit}</span>}
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="₹/unit"
            value={itemState.purchasePricePerUnit}
            onChange={(e) => handlePurchasePriceChange(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono font-bold"
          />
        </div>

        {/* MRP */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">MRP (₹)</label>
          <input
            type="number"
            step="0.01"
            placeholder="150"
            value={itemState.mrp}
            onChange={(e) => {
              const val = e.target.value
              const autoSell = (!itemState.sellingPricePerUnit || itemState.sellingPricePerUnit === itemState.mrp) ? val : itemState.sellingPricePerUnit
              onChange({ ...itemState, mrp: val, sellingPricePerUnit: autoSell })
            }}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono font-semibold"
          />
        </div>

        {/* Selling Price / Sale Rate */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
            <span>Sale Price</span>
            {itemState.unit && <span className="text-[10px] text-cyan-600 font-normal lowercase">/{itemState.unit}</span>}
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="₹/unit"
            value={itemState.sellingPricePerUnit}
            onChange={(e) => onChange({ ...itemState, sellingPricePerUnit: e.target.value })}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono font-bold text-slate-900"
          />
        </div>

        {/* Disc % */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Disc %</label>
          <input
            type="number"
            step="0.01"
            placeholder="0"
            value={itemState.discountPercent}
            onChange={(e) => onChange({ ...itemState, discountPercent: e.target.value })}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
          />
        </div>

        {/* GST % */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GST %</label>
          <input
            type="number"
            step="0.01"
            placeholder="12"
            value={itemState.gstPercent}
            onChange={(e) => onChange({ ...itemState, gstPercent: e.target.value })}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono font-semibold"
          />
        </div>

        {/* COMPUTED READ-ONLY NET AMOUNT */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
            <span>Net Line Total</span>
            <span className="text-[10px] font-extrabold text-cyan-700 bg-cyan-100/90 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" /> AUTO
            </span>
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="Qty × Rate"
            value={itemState.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-cyan-200 bg-cyan-50/70 text-sm font-extrabold text-cyan-950 font-mono focus:outline-none focus:ring-0"
          />
        </div>

        {/* ADD BATCH BUTTON */}
        <div className="lg:col-span-2">
          <button
            type="button"
            onClick={onAddItem}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
              editingIndex !== null
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-500/20'
            }`}
          >
            {editingIndex !== null ? (
              <>
                <Check className="w-4 h-4" /> Update Batch
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add Item Batch
              </>
            )}
          </button>
        </div>
      </div>

      {/* DUPLICATE BATCH WARNING BANNER */}
      {duplicateBatchWarning && (
        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center gap-2 text-amber-900 animate-fade-in font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{duplicateBatchWarning}</span>
        </div>
      )}

      {/* LIVE QUANTITY & PER-UNIT COST PREVIEW BANNER */}
      {conversionPreview && (
        <div className="mt-3 p-3 bg-cyan-50/90 border border-cyan-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 text-cyan-950 font-medium animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
            <div>
              <span>
                Total Base Stock Quantity:{' '}
                <strong className="font-mono text-sm text-cyan-900 font-extrabold">
                  {conversionPreview.basePurchased} {conversionPreview.baseUnitLabel}s
                </strong>
                {conversionPreview.baseFree > 0 && (
                  <span className="text-cyan-800 ml-1 font-mono">
                    (+ {conversionPreview.baseFree} {conversionPreview.baseUnitLabel}s Free ={' '}
                    <strong>{conversionPreview.totalBase} Total {conversionPreview.baseUnitLabel}s</strong>)
                  </span>
                )}
              </span>
            </div>
          </div>

          {conversionPreview.perBaseCost > 0 && (
            <div className="text-[11px] font-mono text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-cyan-200/80 shadow-2xs">
              Equivalent Rate: <strong>₹{conversionPreview.perBaseCost.toFixed(2)} / {conversionPreview.baseUnitLabel}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
