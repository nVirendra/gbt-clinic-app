import React, { useRef } from 'react'
import { Tag, ShieldAlert, Plus } from 'lucide-react'
import { Medicine } from '../../../../types'
import FreeTextCombobox from '../FreeTextCombobox'

export interface IdentificationState {
  name: string
  strength: string
  genericName: string
  manufacturer: string
  pack: string
}

interface MedicineIdentificationProps {
  state: IdentificationState
  onChange: (updated: IdentificationState) => void
  existingMedicines: Medicine[]
  editingMedId?: string | null
  duplicateMatch?: Medicine | null
  onQuickAddManufacturer?: () => void
  disabled?: boolean
}

export const STRENGTH_SUGGESTIONS = [
  '500 mg',
  '650 mg',
  '250 mg',
  '100 mg',
  '50 mg',
  '10 mg',
  '5 mg',
  '250 mg/5 ml',
  '125 mg/5 ml',
  '10 mg/ml',
  '5% w/w',
  '1% w/v',
  '0.5%',
  '1000 IU',
  '400000 IU',
  '40 mg + 10 mg',
  '500 mg + 65 mg'
]

export const MedicineIdentification: React.FC<MedicineIdentificationProps> = ({
  state,
  onChange,
  existingMedicines,
  duplicateMatch,
  onQuickAddManufacturer,
  disabled
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Collect unique Generic Names from existing medicines
  const genericOptions = Array.from(
    new Set(existingMedicines.map((m) => m.generic_name).filter(Boolean) as string[])
  ).map((g) => ({ value: g }))

  // Collect unique Manufacturers from existing medicines
  const manufacturerOptions = Array.from(
    new Set(existingMedicines.map((m) => m.manufacturer).filter(Boolean) as string[])
  ).map((m) => ({ value: m }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-cyan-700">
        <Tag className="w-4 h-4 text-cyan-500" /> 1. Medicine Identification
      </div>

      <div className="space-y-3">
        {/* Name & Strength row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Medicine Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              disabled={disabled}
              placeholder="e.g. PARACETAMOL or DOLOMED 500"
              value={state.name}
              onChange={(e) => onChange({ ...state, name: e.target.value.toUpperCase() })}
              className={`w-full py-2.5 px-3.5 rounded-xl border text-sm font-bold uppercase focus:outline-none focus:ring-2 ${
                !state.name.trim()
                  ? 'border-slate-200 focus:ring-cyan-500'
                  : duplicateMatch
                  ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                  : 'border-slate-200 focus:ring-cyan-500'
              }`}
            />
            {!state.name.trim() && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">Medicine name is required.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Strength
            </label>
            <input
              type="text"
              disabled={disabled}
              placeholder="e.g. 500 mg, 250 mg/5 ml"
              value={state.strength}
              onChange={(e) => onChange({ ...state, strength: e.target.value })}
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Quick Strength Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Quick Strength:</span>
          {STRENGTH_SUGGESTIONS.slice(0, 8).map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...state, strength: chip })}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                state.strength === chip
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Duplicate Combination Warning */}
        {duplicateMatch && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs flex items-start gap-2 text-red-900 animate-fade-in">
            <ShieldAlert className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Duplicate Medicine Combination Restricted!</span>
              <div className="text-[11px] text-red-800 mt-0.5 leading-relaxed">
                A medicine with combination: Name <strong className="text-red-950">"{duplicateMatch.name}"</strong>
                {duplicateMatch.strength && <>, Strength <strong className="text-red-950">"{duplicateMatch.strength}"</strong></>}
                , Form <strong className="text-red-950">"{duplicateMatch.type}"</strong>
                {duplicateMatch.pack && <>, Pack <strong className="text-red-950">"{duplicateMatch.pack}"</strong></>}
                {duplicateMatch.manufacturer && <>, Manufacturer <strong className="text-red-950">"{duplicateMatch.manufacturer}"</strong></>}
                {' '}already exists in inventory master.
              </div>
            </div>
          </div>
        )}

        {/* Generic Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Generic Formula / Active Ingredient(s)
          </label>
          <FreeTextCombobox
            value={state.genericName}
            onChange={(val: string) => onChange({ ...state, genericName: val })}
            options={genericOptions}
            placeholder="e.g. Paracetamol, Amoxicillin + Clavulanic Acid"
          />
        </div>

        {/* Manufacturer & Pack Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Manufacturer / Brand
              </label>
              {onQuickAddManufacturer && (
                <button
                  type="button"
                  onClick={onQuickAddManufacturer}
                  className="text-[10px] font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Quick Add
                </button>
              )}
            </div>
            <FreeTextCombobox
              value={state.manufacturer}
              onChange={(val: string) => onChange({ ...state, manufacturer: val })}
              options={manufacturerOptions}
              placeholder="e.g. Cipla, Sun Pharma, Mankind"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Pack Size / Description
            </label>
            <input
              type="text"
              disabled={disabled}
              placeholder="e.g. 10x10 Strips, 100ml Bottle, 20g Tube"
              value={state.pack}
              onChange={(e) => onChange({ ...state, pack: e.target.value })}
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
