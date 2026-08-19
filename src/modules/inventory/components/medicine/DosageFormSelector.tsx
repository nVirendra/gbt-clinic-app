import React, { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'

export interface DosageFormOption {
  value: string
  label: string
  category: 'Oral Solids' | 'Oral Liquids' | 'Topicals & Externals' | 'Injectables' | 'Inhalants & Nasal' | 'Other / Devices'
  defaultPurchaseUnit: string
  defaultInnerUnit: string
  defaultBaseUnit: string
  defaultUnitsPerInner: number
  defaultInnerUnitsPerPurchase: number
  isMeasurable: boolean // True for Liquids, Creams, Powders in ml/g
  suggestedSaleUnits: string[]
}

export const DOSAGE_FORM_CATALOG: DosageFormOption[] = [
  // Oral Solids
  {
    value: 'TABLET',
    label: 'Tablet',
    category: 'Oral Solids',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Strip',
    defaultBaseUnit: 'Tablet',
    defaultUnitsPerInner: 10,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: false,
    suggestedSaleUnits: ['Tablet', 'Strip', 'Box']
  },
  {
    value: 'CAPSULE',
    label: 'Capsule',
    category: 'Oral Solids',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Strip',
    defaultBaseUnit: 'Capsule',
    defaultUnitsPerInner: 10,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: false,
    suggestedSaleUnits: ['Capsule', 'Strip', 'Box']
  },
  {
    value: 'POWDER',
    label: 'Powder / Granules',
    category: 'Oral Solids',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Sachet',
    defaultBaseUnit: 'Sachet',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: true,
    suggestedSaleUnits: ['Sachet', 'gm', 'Container', 'Box']
  },
  {
    value: 'SACHET',
    label: 'Sachet',
    category: 'Oral Solids',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Sachet',
    defaultBaseUnit: 'Sachet',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: false,
    suggestedSaleUnits: ['Sachet', 'Box']
  },

  // Oral Liquids
  {
    value: 'SYRUP',
    label: 'Syrup',
    category: 'Oral Liquids',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Bottle',
    defaultBaseUnit: 'Bottle',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: true,
    suggestedSaleUnits: ['Bottle', 'ml']
  },
  {
    value: 'SUSPENSION',
    label: 'Suspension',
    category: 'Oral Liquids',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Bottle',
    defaultBaseUnit: 'Bottle',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: true,
    suggestedSaleUnits: ['Bottle', 'ml']
  },
  {
    value: 'SOLUTION',
    label: 'Oral Solution / Liquid',
    category: 'Oral Liquids',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Bottle',
    defaultBaseUnit: 'Bottle',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: true,
    suggestedSaleUnits: ['Bottle', 'ml']
  },
  {
    value: 'MOUTHWASH',
    label: 'Mouthwash / Gargle',
    category: 'Oral Liquids',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Bottle',
    defaultBaseUnit: 'Bottle',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: true,
    suggestedSaleUnits: ['Bottle', 'ml']
  },
  {
    value: 'DROP',
    label: 'Oral Drops',
    category: 'Oral Liquids',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Bottle',
    defaultBaseUnit: 'Bottle',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: true,
    suggestedSaleUnits: ['Bottle', 'ml']
  },

  // Topicals & Externals
  {
    value: 'CREAM',
    label: 'Cream',
    category: 'Topicals & Externals',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Tube',
    defaultBaseUnit: 'Tube',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: true,
    suggestedSaleUnits: ['Tube', 'gm']
  },
  {
    value: 'GEL',
    label: 'Gel',
    category: 'Topicals & Externals',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Tube',
    defaultBaseUnit: 'Tube',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: true,
    suggestedSaleUnits: ['Tube', 'gm']
  },
  {
    value: 'OINTMENT',
    label: 'Ointment',
    category: 'Topicals & Externals',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Tube',
    defaultBaseUnit: 'Tube',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: true,
    suggestedSaleUnits: ['Tube', 'gm']
  },
  {
    value: 'LOTION',
    label: 'Lotion',
    category: 'Topicals & Externals',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Bottle',
    defaultBaseUnit: 'Bottle',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: true,
    suggestedSaleUnits: ['Bottle', 'ml']
  },
  {
    value: 'BALM',
    label: 'Balm / Liniment',
    category: 'Topicals & Externals',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Jar',
    defaultBaseUnit: 'Jar',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: true,
    suggestedSaleUnits: ['Jar', 'Tube', 'gm']
  },
  {
    value: 'EYE_EAR_NASAL_DROPS',
    label: 'Eye / Ear / Nasal Drops',
    category: 'Topicals & Externals',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Vial',
    defaultBaseUnit: 'Vial',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: true,
    suggestedSaleUnits: ['Vial', 'Bottle', 'ml']
  },

  // Injectables
  {
    value: 'INJECTION',
    label: 'Injection (Vial / Ampoule)',
    category: 'Injectables',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Vial',
    defaultBaseUnit: 'Vial',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: false,
    suggestedSaleUnits: ['Vial', 'Ampoule', 'Box']
  },

  // Inhalants & Nasal
  {
    value: 'SPRAY',
    label: 'Nasal / Oral Spray',
    category: 'Inhalants & Nasal',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Canister',
    defaultBaseUnit: 'Canister',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 5,
    isMeasurable: true,
    suggestedSaleUnits: ['Canister', 'Bottle', 'ml', 'Dose']
  },
  {
    value: 'INHALER',
    label: 'Inhaler / Respule',
    category: 'Inhalants & Nasal',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Inhaler',
    defaultBaseUnit: 'Inhaler',
    defaultUnitsPerInner: 1,
    defaultInnerUnitsPerPurchase: 5,
    isMeasurable: false,
    suggestedSaleUnits: ['Inhaler', 'Respule', 'Dose']
  },

  // Suppositories & Devices
  {
    value: 'PESSARY',
    label: 'Pessary / Vaginal Tablet',
    category: 'Other / Devices',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Strip',
    defaultBaseUnit: 'Pessary',
    defaultUnitsPerInner: 6,
    defaultInnerUnitsPerPurchase: 5,
    isMeasurable: false,
    suggestedSaleUnits: ['Pessary', 'Strip']
  },
  {
    value: 'SUPPOSITORY',
    label: 'Suppository',
    category: 'Other / Devices',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Strip',
    defaultBaseUnit: 'Suppository',
    defaultUnitsPerInner: 5,
    defaultInnerUnitsPerPurchase: 5,
    isMeasurable: false,
    suggestedSaleUnits: ['Suppository', 'Strip']
  },
  {
    value: 'OTHER',
    label: 'Other / General Item',
    category: 'Other / Devices',
    defaultPurchaseUnit: 'Box',
    defaultInnerUnit: 'Pack',
    defaultBaseUnit: 'Piece',
    defaultUnitsPerInner: 10,
    defaultInnerUnitsPerPurchase: 10,
    isMeasurable: false,
    suggestedSaleUnits: ['Piece', 'Pack', 'Box']
  }
]

export function getDosageFormConfig(value: string): DosageFormOption {
  const norm = (value || '').trim().toUpperCase()
  return (
    DOSAGE_FORM_CATALOG.find((item) => item.value === norm) || {
      value: norm || 'TABLET',
      label: norm || 'Tablet',
      category: 'Other / Devices',
      defaultPurchaseUnit: 'Box',
      defaultInnerUnit: 'Strip',
      defaultBaseUnit: 'Tablet',
      defaultUnitsPerInner: 10,
      defaultInnerUnitsPerPurchase: 10,
      isMeasurable: false,
      suggestedSaleUnits: ['Piece', 'Box']
    }
  )
}

interface DosageFormSelectorProps {
  value: string
  onChange: (dosageForm: DosageFormOption) => void
  disabled?: boolean
}

export const DosageFormSelector: React.FC<DosageFormSelectorProps> = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentOption = useMemo(() => getDosageFormConfig(value), [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearchQuery('')
    }
  }, [isOpen])

  // Filter catalog based on search query
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return DOSAGE_FORM_CATALOG
    const query = searchQuery.trim().toLowerCase()
    return DOSAGE_FORM_CATALOG.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.value.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Group filtered catalog by category
  const categories = useMemo(() => {
    return Array.from(new Set(filteredCatalog.map((item) => item.category)))
  }, [filteredCatalog])

  const handleSelect = (item: DosageFormOption) => {
    onChange(item)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="space-y-1.5 relative w-full">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
        Dosage Form <span className="text-red-500">*</span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-2xs transition-all flex items-center justify-between cursor-pointer disabled:bg-slate-100"
      >
        <div className="flex items-center gap-2">
          <span className="text-cyan-900 font-extrabold">{currentOption.label}</span>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
            {currentOption.category}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-cyan-600' : ''}`} />
      </button>

      {/* Searchable Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-hidden rounded-xl bg-white border border-slate-200 shadow-2xl flex flex-col animate-fade-in text-xs">
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search dosage form e.g. Syrup, Injection, Cream..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-1.5 pl-8 pr-3 text-xs rounded-lg border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
              />
            </div>
          </div>

          {/* Catalog Options List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-2">
            {categories.map((cat) => {
              const catItems = filteredCatalog.filter((item) => item.category === cat)
              if (catItems.length === 0) return null

              return (
                <div key={cat} className="space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-cyan-700 bg-cyan-50/70 rounded border border-cyan-100/80">
                    {cat}
                  </div>
                  {catItems.map((item) => {
                    const isSelected = item.value === currentOption.value
                    return (
                      <div
                        key={item.value}
                        onClick={() => handleSelect(item)}
                        className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-cyan-600 text-white font-bold'
                            : 'text-slate-800 hover:bg-cyan-50/80 hover:text-cyan-950 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{item.label}</span>
                          <span
                            className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                              isSelected
                                ? 'bg-cyan-700 text-cyan-100'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {item.defaultPurchaseUnit} → {item.defaultBaseUnit}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {filteredCatalog.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-xs font-medium">
                No dosage forms found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
