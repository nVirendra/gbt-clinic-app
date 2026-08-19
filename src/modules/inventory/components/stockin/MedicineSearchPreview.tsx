import React from 'react'
import { Pill, Sparkles, Package, MapPin, Tag, Plus, Check } from 'lucide-react'
import { Medicine } from '../../../../types'
import MedicineTypeahead from '../MedicineTypeahead'
import { formatStockBreakdown, getLiveConversionSummary } from '../../../../lib/unitConversion'

interface MedicineSearchPreviewProps {
  medicines: Medicine[]
  selectedMedicineId: string
  onSelectMedicine: (medicine: Medicine | null) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
  onOpenQuickCreateMedicine?: () => void
  disabled?: boolean
}

export const MedicineSearchPreview: React.FC<MedicineSearchPreviewProps> = ({
  medicines,
  selectedMedicineId,
  onSelectMedicine,
  inputRef,
  onOpenQuickCreateMedicine,
  disabled
}) => {
  const selectedMed = medicines.find((m) => m.id === selectedMedicineId)

  const stockSummary = selectedMed
    ? formatStockBreakdown(
        selectedMed,
        selectedMed.batches?.reduce((sum, b: any) => sum + (b.qty_available || 0), 0) || 0
      )
    : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Search / Select Medicine <span className="text-red-500">*</span>
        </label>
        {onOpenQuickCreateMedicine && (
          <button
            type="button"
            disabled={disabled}
            onClick={onOpenQuickCreateMedicine}
            className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 cursor-pointer bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Quick Create Medicine
          </button>
        )}
      </div>

      {/* Medicine Typeahead Search */}
      <MedicineTypeahead
        medicines={medicines}
        value={selectedMedicineId}
        onChange={onSelectMedicine}
        inputRef={inputRef}
      />

      {/* SELECTED MEDICINE RICH INFORMATION PREVIEW CARD */}
      {selectedMed && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 space-y-3 animate-fade-in text-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-cyan-950 text-cyan-400 rounded-xl border border-cyan-800 shrink-0">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{selectedMed.name}</span>
                  {selectedMed.strength && (
                    <span className="text-xs font-semibold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-mono">
                      {selectedMed.strength}
                    </span>
                  )}
                  <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {selectedMed.type}
                  </span>
                </h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300 text-[11px] mt-1">
                  {selectedMed.generic_name && <span>Generic: <strong>{selectedMed.generic_name}</strong></span>}
                  {selectedMed.manufacturer && <span>Brand: <strong>{selectedMed.manufacturer}</strong></span>}
                  {selectedMed.pack && <span>Pack Size: <strong className="font-mono text-cyan-200">{selectedMed.pack}</strong></span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-800">
                GST {selectedMed.default_gst_percent}%
              </span>
              {selectedMed.hsn_code && (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  HSN: {selectedMed.hsn_code}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-[11px]">
            {/* Packaging Summary */}
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Packaging Setup</span>
                <span className="font-mono font-bold text-cyan-300">{getLiveConversionSummary(selectedMed)}</span>
              </div>
            </div>

            {/* Current Stock */}
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Current Stock</span>
                <span className="font-bold text-white">
                  {stockSummary ? stockSummary.breakdown : `${selectedMed.batches?.reduce((s, b: any) => s + (b.qty_available || 0), 0) || 0} Units`}
                </span>
              </div>
            </div>

            {/* Storage Rack / Shelf */}
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Rack / Shelf Location</span>
                <span className="font-mono font-bold text-amber-300">
                  {selectedMed.rack_no || 'Not Assigned'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
