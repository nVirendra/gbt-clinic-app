import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { Medicine } from '../../../types'

interface MedicineTypeaheadProps {
  medicines: Medicine[]
  value: string
  onChange: (medicine: Medicine | null) => void
  placeholder?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  error?: string
}

export const MedicineTypeahead: React.FC<MedicineTypeaheadProps> = ({
  medicines,
  value,
  onChange,
  placeholder = 'Type medicine name, pack, generic...',
  inputRef,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedMed = medicines.find((m) => m.id === value)

  const formatMedLabel = (m?: Medicine | null) => {
    if (!m) return ''
    const parts = [m.name]
    if (m.strength) parts.push(m.strength)
    if (m.pack) parts.push(`[${m.pack}]`)
    return parts.join(' ')
  }

  useEffect(() => {
    if (selectedMed && !isOpen) {
      setQuery(formatMedLabel(selectedMed))
    } else if (!value && !isOpen) {
      setQuery('')
    }
  }, [value, selectedMed, isOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        if (selectedMed) {
          setQuery(formatMedLabel(selectedMed))
        } else {
          setQuery('')
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedMed])

  const filtered = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      (m.strength || '').toLowerCase().includes(query.toLowerCase()) ||
      (m.generic_name || '').toLowerCase().includes(query.toLowerCase()) ||
      (m.manufacturer || '').toLowerCase().includes(query.toLowerCase()) ||
      (m.pack || '').toLowerCase().includes(query.toLowerCase()) ||
      (m.hsn_code || '').toLowerCase().includes(query.toLowerCase()) ||
      (m.rack_no || '').toLowerCase().includes(query.toLowerCase())
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      if (isOpen && filtered[highlightedIndex]) {
        e.preventDefault()
        const med = filtered[highlightedIndex]
        onChange(med)
        setQuery(formatMedLabel(med))
        setIsOpen(false)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(0)
            if (value && e.target.value !== selectedMed?.name) {
              onChange(null)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Medicine search"
          aria-expanded={isOpen}
          className={`w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border transition-all ${
            error
              ? 'border-red-300 bg-red-50/30 focus:ring-red-500'
              : value
              ? 'border-cyan-500 bg-cyan-50/20 font-bold text-slate-900 focus:ring-cyan-500'
              : 'border-slate-200 focus:ring-cyan-500 font-semibold'
          } focus:outline-none focus:ring-2`}
        />
        <ChevronDown
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-3 h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
        />
      </div>

      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}

      {isOpen && (
        <ul className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-2xl py-1 text-sm">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-slate-400 text-xs text-center">No medicines found matching "{query}"</li>
          ) : (
            filtered.map((m, idx) => (
              <li
                key={m.id}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => {
                  onChange(m)
                  setQuery(formatMedLabel(m))
                  setIsOpen(false)
                }}
                className={`px-4 py-2.5 cursor-pointer border-b border-slate-100 last:border-0 transition-colors ${
                  idx === highlightedIndex ? 'bg-cyan-50 text-cyan-950 font-medium' : 'text-slate-700 hover:bg-slate-50'
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
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default MedicineTypeahead
