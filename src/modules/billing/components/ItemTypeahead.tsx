import React, { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Service, Medicine } from '../../../types'

interface ItemTypeaheadProps {
  itemType: 'SERVICE' | 'MEDICINE' | 'MISC'
  services: Service[]
  medicines: Medicine[]
  value: string
  onChange: (val: string) => void
  onSelectService: (s: Service) => void
  onSelectMedicine: (m: Medicine) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export const ItemTypeahead: React.FC<ItemTypeaheadProps> = ({
  itemType,
  services,
  medicines,
  value,
  onChange,
  onSelectService,
  onSelectMedicine,
  inputRef
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredServices = useMemo(() => {
    if (itemType !== 'SERVICE' || !value) return services
    const query = value.toLowerCase()
    return services.filter((s) => s.name.toLowerCase().includes(query))
  }, [services, itemType, value])

  const filteredMedicines = useMemo(() => {
    if (itemType !== 'MEDICINE' || !value) return medicines
    const query = value.toLowerCase()
    return medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        (m.generic_name || '').toLowerCase().includes(query) ||
        (m.pack || '').toLowerCase().includes(query) ||
        (m.hsn_code || '').toLowerCase().includes(query) ||
        (m.rack_no || '').toLowerCase().includes(query)
    )
  }, [medicines, itemType, value])

  const currentList = itemType === 'SERVICE' ? filteredServices : itemType === 'MEDICINE' ? filteredMedicines : []

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (itemType === 'MISC') return
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      if (currentList.length > 0) setIsOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < currentList.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      if (isOpen && currentList[highlightedIndex]) {
        e.preventDefault()
        if (itemType === 'SERVICE') {
          onSelectService(currentList[highlightedIndex] as Service)
        } else if (itemType === 'MEDICINE') {
          onSelectMedicine(currentList[highlightedIndex] as Medicine)
        }
        setIsOpen(false)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onFocus={() => {
            if (itemType !== 'MISC') setIsOpen(true)
          }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value)
            if (itemType !== 'MISC') {
              setIsOpen(true)
              setHighlightedIndex(0)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            itemType === 'SERVICE'
              ? 'Search service by name...'
              : itemType === 'MEDICINE'
              ? 'Search medicine name, generic, barcode...'
              : 'Enter custom charge description'
          }
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold bg-white"
        />
        {itemType !== 'MISC' && (
          <ChevronDown
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-3 h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
          />
        )}
      </div>

      {isOpen && itemType !== 'MISC' && currentList.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-2xl py-1 text-sm">
          {itemType === 'SERVICE' &&
            (currentList as Service[]).map((s, idx) => (
              <li
                key={s.id}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => {
                  onSelectService(s)
                  setIsOpen(false)
                }}
                className={`px-4 py-2.5 cursor-pointer flex justify-between items-center transition-colors ${
                  idx === highlightedIndex ? 'bg-cyan-50 text-cyan-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-900">{s.name}</span>
                  {s.category && <span className="ml-2 text-xs text-slate-500">({s.category})</span>}
                </div>
                <span className="font-mono text-xs font-bold text-cyan-700">₹{s.default_price.toFixed(2)}</span>
              </li>
            ))}

          {itemType === 'MEDICINE' &&
            (currentList as Medicine[]).map((m, idx) => (
              <li
                key={m.id}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => {
                  onSelectMedicine(m)
                  setIsOpen(false)
                }}
                className={`px-4 py-2.5 cursor-pointer border-b border-slate-100 last:border-0 transition-colors ${
                  idx === highlightedIndex ? 'bg-cyan-50 text-cyan-950 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-900">{m.name}</span>
                    {m.strength && <span className="ml-1.5 text-xs font-semibold text-cyan-700">({m.strength})</span>}
                    {m.pack && <span className="ml-2 text-xs font-mono text-slate-500">[{m.pack}]</span>}
                    <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
                      {m.type}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full shrink-0">
                    GST {m.default_gst_percent}%
                  </span>
                </div>
                <div className="flex gap-3 text-[11px] text-slate-500 mt-1 font-sans items-center">
                  {m.generic_name && <span><strong className="text-slate-600">Gen:</strong> {m.generic_name}</span>}
                  {m.hsn_code && <span><strong className="text-slate-600">HSN:</strong> <code className="font-mono">{m.hsn_code}</code></span>}
                  {m.rack_no && (
                    <span className="font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                      Rack {m.rack_no}
                    </span>
                  )}
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

export default ItemTypeahead
