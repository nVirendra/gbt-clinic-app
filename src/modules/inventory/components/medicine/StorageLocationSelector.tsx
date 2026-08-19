import React from 'react'

interface StorageLocationSelectorProps {
  rackNo: string
  reorderLevel: string
  onChangeRackNo: (rack: string) => void
  onChangeReorderLevel: (reorder: string) => void
  disabled?: boolean
}

export const StorageLocationSelector: React.FC<StorageLocationSelectorProps> = ({
  rackNo,
  reorderLevel,
  onChangeRackNo,
  onChangeReorderLevel,
  disabled
}) => {
  const reorderNum = parseInt(reorderLevel)
  const isReorderValid = !isNaN(reorderNum) && reorderNum >= 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Rack / Shelf / Storage Location */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
          Storage Location <span className="text-slate-400 font-normal lowercase">(Rack / Shelf / Bin)</span>
        </label>
        <input
          type="text"
          disabled={disabled}
          placeholder="e.g. Rack A -> Shelf 2 -> Bin 04"
          value={rackNo}
          onChange={(e) => onChangeRackNo(e.target.value.toUpperCase())}
          className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-sm font-mono font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Reorder Level Alert */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
          Reorder Alert Level <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          disabled={disabled}
          placeholder="10"
          value={reorderLevel}
          onChange={(e) => onChangeReorderLevel(e.target.value)}
          className={`w-full py-2.5 px-3.5 rounded-xl border text-sm font-mono font-bold focus:outline-none focus:ring-2 ${
            !isReorderValid
              ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
              : 'border-slate-200 focus:ring-cyan-500'
          }`}
        />
        {!isReorderValid && (
          <p className="text-[11px] text-red-500 mt-1 font-medium">Reorder level must be an integer ≥ 0.</p>
        )}
      </div>
    </div>
  )
}
