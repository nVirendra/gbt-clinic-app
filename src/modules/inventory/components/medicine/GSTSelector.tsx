import React from 'react'
import FreeTextCombobox from '../FreeTextCombobox'
import { Medicine } from '../../../../types'

interface GSTSelectorProps {
  hsnCode: string
  defaultGstPercent: string
  existingMedicines: Medicine[]
  onChangeHSN: (hsn: string) => void
  onChangeGST: (gst: string) => void
  disabled?: boolean
}

export const STANDARD_PHARMA_HSNS = [
  { value: '3004', label: 'Medicaments (Tablets / Capsules / Syrups)', meta: '12% GST' },
  { value: '300490', label: 'Other Medicaments Formulations', meta: '12% GST' },
  { value: '3005', label: 'Wadding, Gauze, Bandages, Dressings', meta: '12% GST' },
  { value: '3006', label: 'Pharmaceutical Preparations / Reagents', meta: '12% GST' },
  { value: '3002', label: 'Vaccines, Sera, Toxins, Blood Products', meta: '5% GST' },
  { value: '3003', label: 'Bulk Medicaments', meta: '12% GST' },
  { value: '3001', label: 'Glands & Organs for Organo-Therapeutic Uses', meta: '5% GST' }
]

export const GST_SLABS = ['0', '5', '12', '18', '28']

export const GSTSelector: React.FC<GSTSelectorProps> = ({
  hsnCode,
  defaultGstPercent,
  existingMedicines,
  onChangeHSN,
  onChangeGST,
  disabled
}) => {
  const usedHsns = Array.from(
    new Set(existingMedicines.map((m) => m.hsn_code).filter(Boolean) as string[])
  ).map((hsn) => ({ value: hsn, label: 'Used in Inventory Master' }))

  const hsnOptions = [
    ...STANDARD_PHARMA_HSNS,
    ...usedHsns.filter((u) => !STANDARD_PHARMA_HSNS.some((s) => s.value === u.value))
  ]

  const handleSelectHSNOption = (selectedHsn: string) => {
    onChangeHSN(selectedHsn)
    if (selectedHsn.startsWith('3002') || selectedHsn.startsWith('3001')) {
      onChangeGST('5')
    } else if (
      selectedHsn.startsWith('3004') ||
      selectedHsn.startsWith('3005') ||
      selectedHsn.startsWith('3006') ||
      selectedHsn.startsWith('3003')
    ) {
      onChangeGST('12')
    }
  }

  const gstNum = parseFloat(defaultGstPercent)
  const isGstValid = !isNaN(gstNum) && gstNum >= 0 && gstNum <= 100

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* HSN Code Combobox */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            HSN Code <span className="text-slate-400 font-normal lowercase">(Auto-fills GST%)</span>
          </label>
          <FreeTextCombobox
            value={hsnCode}
            onChange={(val: string) => onChangeHSN(val)}
            onSelectOption={handleSelectHSNOption}
            options={hsnOptions}
            placeholder="e.g. 300490"
          />
        </div>

        {/* GST Percentage */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Default GST Rate (%) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            disabled={disabled}
            placeholder="12"
            value={defaultGstPercent}
            onChange={(e) => onChangeGST(e.target.value)}
            className={`w-full py-2 px-3.5 rounded-xl border text-sm font-mono font-bold focus:outline-none focus:ring-2 ${
              !isGstValid
                ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                : 'border-slate-200 focus:ring-cyan-500'
            }`}
          />
        </div>
      </div>

      {/* Quick GST Slab Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Quick GST Slab:</span>
        {GST_SLABS.map((slab) => (
          <button
            key={slab}
            type="button"
            disabled={disabled}
            onClick={() => onChangeGST(slab)}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              defaultGstPercent === slab
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {slab}% GST
          </button>
        ))}
      </div>
    </div>
  )
}
