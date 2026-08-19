import React, { useMemo } from 'react'
import { Layers, Sparkles, AlertCircle, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { DosageFormOption } from './DosageFormSelector'

export interface PackagingState {
  purchaseUnit: string // e.g. Box, Carton, Bottle
  innerUnit: string // e.g. Strip, Bottle, Tube, Vial, Sachet
  baseUnit: string // e.g. Tablet, Capsule, ml, gm, Piece
  unitsPerInner: number // multiplier Level 2 -> Level 3
  innerUnitsPerPurchase: number // multiplier Level 1 -> Level 2
  saleUnit: string // UOM used at POS billing
  canSellLoose: boolean // allow decimal / partial quantity sales (for ml, gm)
  hasInnerLevel: boolean // toggle between 1-level (e.g. 1 Bottle = 500 ml) and 2-level (1 Box = 10 Strips = 100 Tablets)
}

interface PackagingBuilderProps {
  dosageForm: DosageFormOption
  packagingState: PackagingState
  onChange: (updated: PackagingState) => void
  disabled?: boolean
}

export const COMMON_UNITS = [
  'Tablet',
  'Capsule',
  'Strip',
  'Box',
  'Carton',
  'Bottle',
  'Tube',
  'Vial',
  'Ampoule',
  'Sachet',
  'Pack',
  'Jar',
  'Canister',
  'Pessary',
  'Suppository',
  'Respule',
  'Piece',
  'ml',
  'litre',
  'gm',
  'kg',
  'Dose'
]

export const PackagingBuilder: React.FC<PackagingBuilderProps> = ({
  dosageForm,
  packagingState,
  onChange,
  disabled
}) => {
  const {
    purchaseUnit,
    innerUnit,
    baseUnit,
    unitsPerInner,
    innerUnitsPerPurchase,
    canSellLoose,
    hasInnerLevel
  } = packagingState

  // Compute live mathematical summary
  const summaryText = useMemo(() => {
    const pUnit = (purchaseUnit || 'Box').trim()
    const iUnit = (innerUnit || 'Strip').trim()
    const bUnit = (baseUnit || 'Piece').trim()

    if (!hasInnerLevel || iUnit.toLowerCase() === bUnit.toLowerCase()) {
      const totalBase = innerUnitsPerPurchase > 0 ? innerUnitsPerPurchase : 1
      return `1 ${pUnit} = ${totalBase} ${totalBase === 1 ? bUnit : bUnit + 's'}`
    }

    const totalInner = innerUnitsPerPurchase > 0 ? innerUnitsPerPurchase : 1
    const perInner = unitsPerInner > 0 ? unitsPerInner : 1
    const grandTotal = totalInner * perInner

    return `1 ${pUnit} = ${totalInner} ${totalInner === 1 ? iUnit : iUnit + 's'} = ${grandTotal} ${grandTotal === 1 ? bUnit : bUnit + 's'}`
  }, [purchaseUnit, innerUnit, baseUnit, unitsPerInner, innerUnitsPerPurchase, hasInnerLevel])

  // Inconsistent configuration checks
  const warnings = useMemo(() => {
    const list: string[] = []
    const isLiquid = dosageForm.isMeasurable

    if (innerUnitsPerPurchase <= 0) {
      list.push('Conversion quantity must be greater than 0.')
    }
    if (hasInnerLevel && unitsPerInner <= 0) {
      list.push('Inner conversion quantity must be greater than 0.')
    }

    if (isLiquid && baseUnit.toLowerCase() === 'tablet') {
      list.push(`Selected dosage form is ${dosageForm.label}, but base unit is set to 'Tablet'. Did you mean 'ml' or 'Bottle'?`)
    }

    if (hasInnerLevel && innerUnit.toLowerCase() === baseUnit.toLowerCase()) {
      list.push(`Inner Pack unit '${innerUnit}' is identical to Base Unit '${baseUnit}'. Consider removing the inner level for a cleaner setup.`)
    }

    return list
  }, [dosageForm, baseUnit, innerUnit, innerUnitsPerPurchase, unitsPerInner, hasInnerLevel])

  return (
    <div className="space-y-4">
      {/* Header Strip */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-700">
          <Layers className="w-4 h-4 text-cyan-500" /> Dynamic Packaging & Inventory Units
        </div>
        <div className="flex items-center gap-2">
          {!hasInnerLevel ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange({
                  ...packagingState,
                  hasInnerLevel: true,
                  innerUnit: dosageForm.defaultInnerUnit || 'Strip',
                  unitsPerInner: dosageForm.defaultUnitsPerInner || 10
                })
              }
              className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-lg border border-cyan-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Strip / Sub-Pack Level
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange({
                  ...packagingState,
                  hasInnerLevel: false,
                  innerUnit: baseUnit,
                  unitsPerInner: 1
                })
              }
              className="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Sub-Pack Level
            </button>
          )}
        </div>
      </div>

      {/* Main Packaging Builder Cards */}
      <div className="p-4 bg-slate-50/90 border border-slate-200/90 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Level 1: Purchase / Outer Package */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Purchased As <span className="text-slate-400 font-normal lowercase">(Outer Package)</span>
              </label>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded">
                Distributor Unit
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-2.5 py-2 rounded-lg whitespace-nowrap border border-slate-200">
                1
              </span>

              {/* Purchase Unit Input / Selector */}
              <input
                type="text"
                disabled={disabled}
                placeholder="e.g. Box, Carton, Bottle"
                value={purchaseUnit}
                onChange={(e) => onChange({ ...packagingState, purchaseUnit: e.target.value })}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Contains:</span>
              <input
                type="number"
                step="any"
                disabled={disabled}
                value={innerUnitsPerPurchase || ''}
                onChange={(e) =>
                  onChange({
                    ...packagingState,
                    innerUnitsPerPurchase: parseFloat(e.target.value) || 0
                  })
                }
                className="w-20 py-1 px-2.5 rounded-lg border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900"
              />
              <span className="font-bold text-slate-800">
                {hasInnerLevel ? innerUnit || 'Strips' : baseUnit || 'Units'}
              </span>
            </div>
          </div>

          {/* Level 2: Sub-pack / Base Unit */}
          {hasInnerLevel ? (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Sub-Pack Breakdown <span className="text-slate-400 font-normal lowercase">(e.g. Strip Size)</span>
                </label>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                  Inner Level
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-2.5 py-2 rounded-lg whitespace-nowrap border border-slate-200">
                  1 {innerUnit || 'Strip'} =
                </span>
                <input
                  type="number"
                  step="any"
                  disabled={disabled}
                  value={unitsPerInner || ''}
                  onChange={(e) =>
                    onChange({
                      ...packagingState,
                      unitsPerInner: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-24 py-2 px-3 rounded-lg border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900"
                />
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="Base unit e.g. Tablet"
                  value={baseUnit}
                  onChange={(e) => onChange({ ...packagingState, baseUnit: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                />
              </div>

              <div className="text-[11px] text-slate-500">
                Inner unit label:{' '}
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Strip"
                  value={innerUnit}
                  onChange={(e) => onChange({ ...packagingState, innerUnit: e.target.value })}
                  className="py-0.5 px-2 rounded border border-slate-300 font-bold text-slate-800 text-xs w-28 inline-block ml-1"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Base Stock & Sale Unit
                </label>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  Direct Packaging
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Stock Unit Name (e.g., Bottle, Tube, ml, gm, Piece):
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Bottle, ml, Tube"
                  value={baseUnit}
                  onChange={(e) =>
                    onChange({
                      ...packagingState,
                      baseUnit: e.target.value,
                      innerUnit: e.target.value
                    })
                  }
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Loose Sales / Decimal Precision Configuration */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={disabled}
                checked={canSellLoose}
                onChange={(e) => onChange({ ...packagingState, canSellLoose: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Allow Loose Quantity / Partial Unit Sales
              </span>
              <span className="text-[11px] text-slate-500">
                {canSellLoose
                  ? 'Pharmacist can sell partial quantities (e.g. 30 ml from a 500 ml bottle or 15 g from 100 g container).'
                  : 'Stock is strictly sold in whole numbers (e.g. 1 Strip, 1 Bottle, 1 Tablet).'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Sale Unit:</span>
            <select
              value={packagingState.saleUnit || baseUnit}
              disabled={disabled}
              onChange={(e) => onChange({ ...packagingState, saleUnit: e.target.value })}
              className="py-1 px-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {Array.from(
                new Set([
                  baseUnit,
                  purchaseUnit,
                  ...(hasInnerLevel ? [innerUnit] : []),
                  ...dosageForm.suggestedSaleUnits,
                  'Tablet',
                  'Capsule',
                  'Strip',
                  'Bottle',
                  'Tube',
                  'Vial',
                  'ml',
                  'gm',
                  'Piece'
                ])
              )
                .filter(Boolean)
                .map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Live Automatic Packaging Calculation Banner */}
        <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-xs border border-slate-800">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-cyan-300 block">
                Automatic Packaging Conversion Summary
              </span>
              <span className="font-mono font-black text-sm text-white">{summaryText}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Ready for Stock & Billing</span>
          </div>
        </div>

        {/* Validation Warnings */}
        {warnings.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            {warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-amber-900 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
