import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Sparkles, X, Check, Package, Layers, AlertTriangle, ShieldAlert } from 'lucide-react'
import { Medicine } from '../../../../types'
import { DosageFormSelector, getDosageFormConfig, DosageFormOption } from './DosageFormSelector'
import { MedicineIdentification, IdentificationState } from './MedicineIdentification'
import { PackagingBuilder, PackagingState } from './PackagingBuilder'
import { GSTSelector } from './GSTSelector'
import { StorageLocationSelector } from './StorageLocationSelector'
import { toast } from 'sonner'

export interface MedicineModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: any, options?: { keepOpen?: boolean }) => Promise<void>
  editingMed: Medicine | null
  existingMedicines: Medicine[]
  initialFormValues?: Partial<{
    name: string
    strength: string
    genericName: string
    manufacturer: string
    pack: string
    type: string
    unitLabel: string
    hsnCode: string
    rackNo: string
    reorderLevel: string
    defaultGstPercent: string
  }>
}

export const RedesignedMedicineModal: React.FC<MedicineModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingMed,
  existingMedicines,
  initialFormValues
}) => {
  // 1. Identification state
  const [idState, setIdState] = useState<IdentificationState>({
    name: '',
    strength: '',
    genericName: '',
    manufacturer: '',
    pack: ''
  })

  // 2. Dosage Form state
  const [dosageForm, setDosageForm] = useState<DosageFormOption>(getDosageFormConfig('TABLET'))

  // 3. Packaging state
  const [pkgState, setPkgState] = useState<PackagingState>({
    purchaseUnit: 'Box',
    innerUnit: 'Strip',
    baseUnit: 'Tablet',
    unitsPerInner: 10,
    innerUnitsPerPurchase: 10,
    saleUnit: 'Tablet',
    canSellLoose: false,
    hasInnerLevel: true
  })

  // 4. Compliance & Storage state
  const [hsnCode, setHsnCode] = useState('')
  const [defaultGstPercent, setDefaultGstPercent] = useState('12')
  const [rackNo, setRackNo] = useState('')
  const [reorderLevel, setReorderLevel] = useState('10')

  // UI Flow & Warning state
  const [submitting, setSubmitting] = useState(false)
  const [showStockWarningModal, setShowStockWarningModal] = useState(false)
  const [pendingSubmitPayload, setPendingSubmitPayload] = useState<any | null>(null)

  // Initialize form when modal opens or editingMed changes
  useEffect(() => {
    if (isOpen) {
      if (editingMed) {
        const dFormConfig = getDosageFormConfig(editingMed.type || 'TABLET')
        setDosageForm(dFormConfig)

        const getVal = (snakeKey: string, camelKey: string, fallback: any) => {
          const val = (editingMed as any)[snakeKey] ?? (editingMed as any)[camelKey]
          return val !== null && val !== undefined && val !== '' ? val : fallback
        }

        const bUnit = String(getVal('base_unit', 'baseUnit', dFormConfig.defaultBaseUnit))
        const iUnit = String(getVal('inner_unit', 'innerUnit', dFormConfig.defaultInnerUnit))
        const pUnit = String(getVal('purchase_unit', 'purchaseUnit', dFormConfig.defaultPurchaseUnit))
        const unitsPerInner = parseFloat(getVal('units_per_inner', 'unitsPerInner', dFormConfig.defaultUnitsPerInner)) || 1
        const innerUnitsPerPurchase = parseFloat(getVal('inner_units_per_purchase', 'innerUnitsPerPurchase', dFormConfig.defaultInnerUnitsPerPurchase)) || 1

        const isInnerDistinct = iUnit.trim().toLowerCase() !== bUnit.trim().toLowerCase() && unitsPerInner > 1

        setIdState({
          name: editingMed.name || '',
          strength: editingMed.strength || '',
          genericName: getVal('generic_name', 'genericName', ''),
          manufacturer: editingMed.manufacturer || '',
          pack: editingMed.pack || ''
        })

        setPkgState({
          purchaseUnit: pUnit,
          innerUnit: iUnit,
          baseUnit: bUnit,
          unitsPerInner,
          innerUnitsPerPurchase,
          saleUnit: bUnit,
          canSellLoose: dFormConfig.isMeasurable,
          hasInnerLevel: isInnerDistinct
        })

        setHsnCode(getVal('hsn_code', 'hsnCode', ''))
        setDefaultGstPercent(String(getVal('default_gst_percent', 'defaultGstPercent', 12)))
        setRackNo(getVal('rack_no', 'rackNo', ''))
        setReorderLevel(String(getVal('reorder_level', 'reorderLevel', 10)))
      } else if (initialFormValues) {
        const dFormConfig = getDosageFormConfig(initialFormValues.type || 'TABLET')
        setDosageForm(dFormConfig)

        setIdState({
          name: initialFormValues.name || '',
          strength: initialFormValues.strength || '',
          genericName: initialFormValues.genericName || '',
          manufacturer: initialFormValues.manufacturer || '',
          pack: initialFormValues.pack || ''
        })

        setPkgState({
          purchaseUnit: dFormConfig.defaultPurchaseUnit,
          innerUnit: dFormConfig.defaultInnerUnit,
          baseUnit: dFormConfig.defaultBaseUnit,
          unitsPerInner: dFormConfig.defaultUnitsPerInner,
          innerUnitsPerPurchase: dFormConfig.defaultInnerUnitsPerPurchase,
          saleUnit: dFormConfig.defaultBaseUnit,
          canSellLoose: dFormConfig.isMeasurable,
          hasInnerLevel: dFormConfig.defaultInnerUnit.toLowerCase() !== dFormConfig.defaultBaseUnit.toLowerCase()
        })

        setHsnCode(initialFormValues.hsnCode || '')
        setDefaultGstPercent(initialFormValues.defaultGstPercent || '12')
        setRackNo(initialFormValues.rackNo || '')
        setReorderLevel(initialFormValues.reorderLevel || '10')
      } else {
        const dFormConfig = getDosageFormConfig('TABLET')
        setDosageForm(dFormConfig)

        setIdState({
          name: '',
          strength: '',
          genericName: '',
          manufacturer: '',
          pack: ''
        })

        setPkgState({
          purchaseUnit: dFormConfig.defaultPurchaseUnit,
          innerUnit: dFormConfig.defaultInnerUnit,
          baseUnit: dFormConfig.defaultBaseUnit,
          unitsPerInner: dFormConfig.defaultUnitsPerInner,
          innerUnitsPerPurchase: dFormConfig.defaultInnerUnitsPerPurchase,
          saleUnit: dFormConfig.defaultBaseUnit,
          canSellLoose: dFormConfig.isMeasurable,
          hasInnerLevel: true
        })

        setHsnCode('')
        setDefaultGstPercent('12')
        setRackNo('')
        setReorderLevel('10')
      }
    }
  }, [isOpen, editingMed, initialFormValues])

  if (!isOpen) return null

  // Normalization helper
  const normStr = (str?: string | null) => {
    if (!str) return ''
    const s = str.trim().replace(/\s+/g, ' ')
    if (s.toUpperCase() === 'NULL' || s.toUpperCase() === 'UNDEFINED') return ''
    return s.toUpperCase()
  }

  // 5-Tuple Duplicate Combination Check
  const cleanInputName = normStr(idState.name)
  const cleanInputStrength = normStr(idState.strength)
  const cleanInputType = normStr(dosageForm.value) || 'TABLET'
  const cleanInputPack = normStr(idState.pack)
  const cleanInputManufacturer = normStr(idState.manufacturer)

  const duplicateMedMatch = cleanInputName.length > 0
    ? existingMedicines.find(
        (m) =>
          m.id !== editingMed?.id &&
          normStr(m.name) === cleanInputName &&
          normStr(m.strength) === cleanInputStrength &&
          (normStr(m.type) || 'TABLET') === cleanInputType &&
          normStr(m.pack) === cleanInputPack &&
          normStr(m.manufacturer) === cleanInputManufacturer
      )
    : null

  // Validations
  const isNameValid = Boolean(idState.name.trim()) && !duplicateMedMatch
  const reorderNum = parseInt(reorderLevel)
  const isReorderValid = !isNaN(reorderNum) && reorderNum >= 0
  const gstNum = parseFloat(defaultGstPercent)
  const isGstValid = !isNaN(gstNum) && gstNum >= 0 && gstNum <= 100
  const isConversionValid = pkgState.innerUnitsPerPurchase > 0 && (!pkgState.hasInnerLevel || pkgState.unitsPerInner > 0)

  const isValid = isNameValid && isReorderValid && isGstValid && isConversionValid

  // Handle dosage form selection change
  const handleDosageFormChange = (newDForm: DosageFormOption) => {
    setDosageForm(newDForm)
    if (!editingMed) {
      setPkgState({
        purchaseUnit: newDForm.defaultPurchaseUnit,
        innerUnit: newDForm.defaultInnerUnit,
        baseUnit: newDForm.defaultBaseUnit,
        unitsPerInner: newDForm.defaultUnitsPerInner,
        innerUnitsPerPurchase: newDForm.defaultInnerUnitsPerPurchase,
        saleUnit: newDForm.defaultBaseUnit,
        canSellLoose: newDForm.isMeasurable,
        hasInnerLevel: newDForm.defaultInnerUnit.toLowerCase() !== newDForm.defaultBaseUnit.toLowerCase()
      })
    }
  }

  // Submit Handler
  const processSubmit = async (keepOpen = false) => {
    if (!isValid || submitting) return

    const finalUnitLabel = (pkgState.hasInnerLevel ? pkgState.innerUnit : pkgState.baseUnit) || 'pcs'

    const payload = {
      name: cleanInputName,
      strength: cleanInputStrength || null,
      genericName: idState.genericName ? idState.genericName.trim() : null,
      generic_name: idState.genericName ? idState.genericName.trim() : null,
      manufacturer: cleanInputManufacturer || null,
      pack: cleanInputPack || null,
      type: cleanInputType,
      unitLabel: finalUnitLabel.toLowerCase(),
      unit_label: finalUnitLabel.toLowerCase(),
      baseUnit: pkgState.baseUnit || 'Piece',
      base_unit: pkgState.baseUnit || 'Piece',
      innerUnit: pkgState.hasInnerLevel ? pkgState.innerUnit || null : null,
      inner_unit: pkgState.hasInnerLevel ? pkgState.innerUnit || null : null,
      unitsPerInner: pkgState.hasInnerLevel ? pkgState.unitsPerInner : 1.0,
      units_per_inner: pkgState.hasInnerLevel ? pkgState.unitsPerInner : 1.0,
      purchaseUnit: pkgState.purchaseUnit || null,
      purchase_unit: pkgState.purchaseUnit || null,
      innerUnitsPerPurchase: pkgState.innerUnitsPerPurchase || 1.0,
      inner_units_per_purchase: pkgState.innerUnitsPerPurchase || 1.0,
      hsnCode: hsnCode ? hsnCode.trim() : null,
      hsn_code: hsnCode ? hsnCode.trim() : null,
      rackNo: rackNo ? rackNo.trim().toUpperCase() : null,
      rack_no: rackNo ? rackNo.trim().toUpperCase() : null,
      reorderLevel: reorderNum,
      reorder_level: reorderNum,
      defaultGstPercent: gstNum,
      default_gst_percent: gstNum
    }

    // Check if editing an existing medicine with active stock batches whose packaging ratio is changing
    if (editingMed && editingMed.batches && editingMed.batches.length > 0) {
      const oldUnitsPerInner = editingMed.units_per_inner || 1
      const oldInnerPerPur = editingMed.inner_units_per_purchase || 1
      const ratioChanged =
        oldUnitsPerInner !== payload.units_per_inner ||
        oldInnerPerPur !== payload.inner_units_per_purchase ||
        (editingMed.base_unit || '').toLowerCase() !== payload.base_unit.toLowerCase()

      if (ratioChanged) {
        setPendingSubmitPayload({ payload, keepOpen })
        setShowStockWarningModal(true)
        return
      }
    }

    await executeSave(payload, keepOpen)
  }

  const executeSave = async (payload: any, keepOpen: boolean) => {
    setSubmitting(true)
    try {
      await onSubmit(payload, { keepOpen })
      if (keepOpen) {
        // Reset name & strength for adding another
        setIdState((prev) => ({ ...prev, name: '', strength: '' }))
        toast.success('Medicine saved! Ready for next medicine entry.')
      }
    } finally {
      setSubmitting(false)
      setShowStockWarningModal(false)
      setPendingSubmitPayload(null)
    }
  }

  // Keyboard shortcut handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      processSubmit(false)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div
        onKeyDown={handleKeyDown}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-[#0B132B] text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-md font-bold text-white">
                {editingMed ? 'Edit Medicine Master' : 'Add New Medicine Master'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {editingMed
                  ? `Updating record for ${editingMed.name}`
                  : 'Register a new medicine in allopathic pharmacy master'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Ctrl+Enter to Save</span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL FORM BODY */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 flex-1">
          {/* SECTION 1: MEDICINE IDENTIFICATION */}
          <MedicineIdentification
            state={idState}
            onChange={setIdState}
            existingMedicines={existingMedicines}
            editingMedId={editingMed?.id}
            duplicateMatch={duplicateMedMatch}
            disabled={submitting}
          />

          {/* SECTION 2: DOSAGE FORM SELECTOR */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <DosageFormSelector
              value={dosageForm.value}
              onChange={handleDosageFormChange}
              disabled={submitting}
            />
          </div>

          {/* SECTION 3: DYNAMIC PACKAGING BUILDER */}
          <div className="pt-2 border-t border-slate-100">
            <PackagingBuilder
              dosageForm={dosageForm}
              packagingState={pkgState}
              onChange={setPkgState}
              disabled={submitting}
            />
          </div>

          {/* SECTION 4: HSN & GST SELECTOR */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-700">
              <Package className="w-4 h-4 text-cyan-500" /> 4. GST Compliance & Storage
            </div>
            <GSTSelector
              hsnCode={hsnCode}
              defaultGstPercent={defaultGstPercent}
              existingMedicines={existingMedicines}
              onChangeHSN={setHsnCode}
              onChangeGST={setDefaultGstPercent}
              disabled={submitting}
            />

            <StorageLocationSelector
              rackNo={rackNo}
              reorderLevel={reorderLevel}
              onChangeRackNo={setRackNo}
              onChangeReorderLevel={setReorderLevel}
              disabled={submitting}
            />
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel (Esc)
          </button>

          <div className="flex items-center gap-2.5">
            {!editingMed && (
              <button
                type="button"
                disabled={!isValid || submitting}
                onClick={() => processSubmit(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                Save & Add Another
              </button>
            )}

            <div className="relative group">
              <button
                type="button"
                disabled={!isValid || submitting}
                onClick={() => processSubmit(false)}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-cyan-600/20 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? (
                  <span>Saving Medicine...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Medicine
                  </>
                )}
              </button>

              {/* Validation Tooltip */}
              {!isValid && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-56 p-2.5 bg-slate-900 text-slate-200 text-xs rounded-lg shadow-xl z-50">
                  <p className="font-semibold text-amber-400 mb-1">Cannot save yet:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {!isNameValid && <li>Medicine name required (and unique)</li>}
                    {!isReorderValid && <li>Reorder level must be ≥ 0</li>}
                    {!isGstValid && <li>Valid GST rate (0-100%) required</li>}
                    {!isConversionValid && <li>Positive conversion numbers required</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION WARNING MODAL WHEN EDITING MEDICINE WITH ACTIVE STOCK */}
      {showStockWarningModal && pendingSubmitPayload && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-60 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-amber-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h4 className="text-base font-bold text-slate-900">Confirm Packaging Change</h4>
                <p className="text-xs text-slate-500">Medicine has active inventory stock batches</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              You are updating the packaging conversion ratio for{' '}
              <strong className="text-slate-900">{editingMed?.name}</strong>. Existing active stock batches will maintain their recorded base quantities, but future stock transactions will use the new ratio.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowStockWarningModal(false)
                  setPendingSubmitPayload(null)
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeSave(pendingSubmitPayload.payload, pendingSubmitPayload.keepOpen)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm & Update Ratio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
