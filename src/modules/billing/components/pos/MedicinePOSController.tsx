import React, { useMemo } from 'react'
import {
  Package,
  Zap,
  Tag,
  Plus,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  MapPin,
  Pill,
  Clock
} from 'lucide-react'
import { Service, Medicine, InventoryBatch } from '../../../../types'
import ItemTypeahead from '../ItemTypeahead'
import {
  getAvailableUnitsForMedicine,
  formatStockBreakdown,
  getUnitConversionFactor,
  convertToBaseQuantity
} from '../../../../lib/unitConversion'

interface MedicinePOSControllerProps {
  itemType: 'SERVICE' | 'MEDICINE' | 'MISC'
  onChangeItemType: (type: 'SERVICE' | 'MEDICINE' | 'MISC') => void
  services: Service[]
  medicines: Medicine[]
  medicineBatches: InventoryBatch[]
  selectedMed: Medicine | null
  onSelectMedicine: (m: Medicine) => void
  selectedBatch: InventoryBatch | null
  onSelectBatch: (b: InventoryBatch) => void
  selectedService: Service | null
  onSelectService: (s: Service) => void
  itemForm: {
    name: string
    price: string
    quantity: string
    unit: string
    discount: string
    gstPercent: string
  }
  onChangeItemForm: (form: any) => void
  onAddLineItem: () => void
  itemNameInputRef?: React.RefObject<HTMLInputElement | null>
}

export const MedicinePOSController: React.FC<MedicinePOSControllerProps> = ({
  itemType,
  onChangeItemType,
  services,
  medicines,
  medicineBatches,
  selectedMed,
  onSelectMedicine,
  selectedBatch,
  onSelectBatch,
  selectedService,
  onSelectService,
  itemForm,
  onChangeItemForm,
  onAddLineItem,
  itemNameInputRef
}) => {
  // Sort batches for FEFO (earliest expiry first)
  const sortedBatches = useMemo(() => {
    return [...medicineBatches].sort((a, b) => {
      const timeA = new Date(a.expiry_date).getTime()
      const timeB = new Date(b.expiry_date).getTime()
      return timeA - timeB
    })
  }, [medicineBatches])

  // FEFO Recommended Batch (first non-expired batch with available stock)
  const fefoBatchId = useMemo(() => {
    const today = Date.now()
    const valid = sortedBatches.find(
      (b) => new Date(b.expiry_date).getTime() > today && b.qty_available > 0
    )
    return valid ? valid.id : sortedBatches[0]?.id
  }, [sortedBatches])

  // Current stock breakdown for selected medicine & batch
  const stockSummary = useMemo(() => {
    if (!selectedMed || !selectedBatch) return null
    return formatStockBreakdown(selectedMed, selectedBatch.qty_available)
  }, [selectedMed, selectedBatch])

  // Conversion factor & live converted stock preview
  const conversionPreview = useMemo(() => {
    if (!selectedMed || !itemForm.quantity) return null
    const qty = parseInt(itemForm.quantity) || 0
    if (qty <= 0) return null

    const baseQty = convertToBaseQuantity(selectedMed, qty, itemForm.unit || selectedMed.base_unit || 'Piece')
    const baseUnitLabel = selectedMed.base_unit || selectedMed.unit_label || 'Piece'

    return {
      baseQty,
      baseUnitLabel
    }
  }, [selectedMed, itemForm.quantity, itemForm.unit])

  return (
    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-xs">
      {/* ITEM TYPE TABS — MEDICINE IS PRIMARY */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div className="flex items-center space-x-2">
          {[
            { id: 'MEDICINE', label: 'Medicine Sale (Primary)', icon: Package },
            { id: 'SERVICE', label: 'Service Item', icon: Zap },
            { id: 'MISC', label: 'Custom / Misc Charge', icon: Tag }
          ].map((tab) => {
            const Icon = tab.icon
            const isSelected = itemType === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeItemType(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? tab.id === 'MEDICINE'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                      : 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Selected Medicine Stock Alert Badge */}
        {itemType === 'MEDICINE' && selectedBatch && (
          <div className="flex items-center space-x-2 text-xs">
            {new Date(selectedBatch.expiry_date).getTime() <= Date.now() ? (
              <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-xl font-bold border border-red-200">
                <ShieldAlert className="h-3.5 w-3.5 text-red-600" /> Expired Batch! (Blocked)
              </span>
            ) : new Date(selectedBatch.expiry_date).getTime() - Date.now() <= 90 * 24 * 60 * 60 * 1000 ? (
              <span className="flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-xl font-bold border border-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Expiring Soon (
                {new Date(selectedBatch.expiry_date).toLocaleDateString('en-GB')})
              </span>
            ) : selectedBatch.qty_available <= 10 ? (
              <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-3 py-1 rounded-xl font-bold border border-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Low Stock (
                {stockSummary ? stockSummary.breakdown : `${selectedBatch.qty_available} units`})
              </span>
            ) : (
              <span className="bg-cyan-50 text-cyan-950 px-3 py-1 rounded-xl font-bold border border-cyan-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> Available Stock (
                {stockSummary ? stockSummary.breakdown : `${selectedBatch.qty_available} units`})
              </span>
            )}
          </div>
        )}
      </div>

      {/* FAST ENTRY GRID */}
      <div
        onKeyDown={(e) => {
          if (e.key === 'Enter' || (e.ctrlKey && e.key === 'Enter')) {
            e.preventDefault()
            onAddLineItem()
          }
        }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3 items-end"
      >
        {/* Item Typeahead Search Input */}
        <div className={itemType === 'MEDICINE' ? 'lg:col-span-3' : 'lg:col-span-5'}>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            {itemType === 'SERVICE'
              ? 'Search Service *'
              : itemType === 'MEDICINE'
              ? 'Search Medicine (Name / Generic / Pack) *'
              : 'Charge Description *'}
          </label>
          <ItemTypeahead
            itemType={itemType}
            services={services}
            medicines={medicines}
            value={itemForm.name}
            onChange={(val: string) => onChangeItemForm({ ...itemForm, name: val })}
            onSelectService={onSelectService}
            onSelectMedicine={onSelectMedicine}
            inputRef={itemNameInputRef}
          />
        </div>

        {/* Medicine Batch Selection Dropdown */}
        {itemType === 'MEDICINE' && (
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
              <span>Select Batch *</span>
              <span className="text-[10px] text-cyan-700 font-extrabold lowercase">FEFO Priority</span>
            </label>
            <select
              value={selectedBatch ? selectedBatch.id : ''}
              onChange={(e) => {
                const b = sortedBatches.find((x) => x.id === e.target.value)
                if (b && selectedMed) {
                  onSelectBatch(b)
                  const unitToUse =
                    itemForm.unit || selectedMed.inner_unit || selectedMed.base_unit || 'Strip'
                  const factor = getUnitConversionFactor(selectedMed, unitToUse)
                  onChangeItemForm({
                    ...itemForm,
                    price: (b.selling_price_per_unit * factor).toFixed(2)
                  })
                }
              }}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white font-mono font-bold text-slate-900"
            >
              {sortedBatches.map((b) => {
                const isFEFO = b.id === fefoBatchId
                const isExpired = new Date(b.expiry_date).getTime() <= Date.now()
                const breakdown = selectedMed
                  ? formatStockBreakdown(selectedMed, b.qty_available).breakdown
                  : `${b.qty_available} Pcs`

                return (
                  <option key={b.id} value={b.id} disabled={isExpired}>
                    {isFEFO ? '✓ [FEFO] ' : ''}
                    {b.batch_no} (Exp: {new Date(b.expiry_date).toLocaleDateString('en-GB')}) —{' '}
                    {breakdown} {isExpired ? ' [EXPIRED]' : ''}
                  </option>
                )
              })}
              {sortedBatches.length === 0 && <option value="">No Active Stock Batches</option>}
            </select>
          </div>
        )}

        {/* Quantity */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Qty *</label>
          <input
            type="number"
            min="1"
            value={itemForm.quantity}
            onChange={(e) => onChangeItemForm({ ...itemForm, quantity: e.target.value })}
            placeholder="1"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-center font-bold font-mono text-slate-900"
          />
        </div>

        {/* Billing Unit Selector (For Medicines) */}
        {itemType === 'MEDICINE' && (
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unit</label>
            <select
              value={itemForm.unit}
              onChange={(e) => {
                const newUnit = e.target.value
                const factor = selectedMed ? getUnitConversionFactor(selectedMed, newUnit) : 1
                const newPrice = selectedBatch
                  ? (selectedBatch.selling_price_per_unit * factor).toFixed(2)
                  : itemForm.price
                onChangeItemForm({ ...itemForm, unit: newUnit, price: newPrice })
              }}
              className="w-full py-2.5 px-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {getAvailableUnitsForMedicine(selectedMed).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Unit Selling Price */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
            <span>Price (₹)</span>
            {itemType === 'MEDICINE' && itemForm.unit && (
              <span className="text-[10px] text-cyan-600 font-normal lowercase">/{itemForm.unit}</span>
            )}
          </label>
          <input
            type="number"
            step="0.01"
            value={itemForm.price}
            onChange={(e) => onChangeItemForm({ ...itemForm, price: e.target.value })}
            placeholder="0.00"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-right font-mono font-bold"
          />
        </div>

        {/* Discount (₹) */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Disc (₹)</label>
          <input
            type="number"
            step="0.01"
            value={itemForm.discount}
            onChange={(e) => onChangeItemForm({ ...itemForm, discount: e.target.value })}
            placeholder="0"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-right text-red-600 font-mono font-medium"
          />
        </div>

        {/* GST % */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GST %</label>
          <input
            type="number"
            value={itemForm.gstPercent}
            onChange={(e) => onChangeItemForm({ ...itemForm, gstPercent: e.target.value })}
            placeholder="12"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-right font-mono font-semibold"
          />
        </div>

        {/* Add Button */}
        <div className={itemType === 'MEDICINE' ? 'lg:col-span-1' : 'lg:col-span-2'}>
          <button
            type="button"
            onClick={onAddLineItem}
            className="w-full flex items-center justify-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      {/* LIVE CONVERTED STOCK DEDUCTION PREVIEW BANNER */}
      {conversionPreview && itemType === 'MEDICINE' && (
        <div className="p-3 bg-cyan-50/90 border border-cyan-200 rounded-xl text-xs flex items-center justify-between text-cyan-950 font-medium animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
            <span>
              Stock Deduction: Equivalent to{' '}
              <strong className="font-mono text-sm text-cyan-900 font-extrabold">
                {conversionPreview.baseQty} {conversionPreview.baseUnitLabel}s
              </strong>
            </span>
          </div>
          {selectedBatch?.mrp && (
            <div className="text-[11px] font-mono text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-cyan-200/80 shadow-2xs">
              MRP: <strong>₹{selectedBatch.mrp.toFixed(2)}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
