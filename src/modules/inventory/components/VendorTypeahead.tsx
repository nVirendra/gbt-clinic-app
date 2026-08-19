import React, { useState, useEffect, useRef } from 'react'
import { Building2, ChevronDown, Check } from 'lucide-react'
import { Vendor } from '../../../types'

interface VendorTypeaheadProps {
  vendors: Vendor[]
  value: string
  onChange: (vendorId: string) => void
  placeholder?: string
  error?: string
}

export const VendorTypeahead: React.FC<VendorTypeaheadProps> = ({
  vendors,
  value,
  onChange,
  placeholder = 'Search vendor by name, phone, gstin...',
  error
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedVendor = vendors.find((v) => v.id === value)

  useEffect(() => {
    if (selectedVendor && !isOpen) {
      setQuery(selectedVendor.name)
    } else if (!value && !isOpen) {
      setQuery('')
    }
  }, [value, selectedVendor, isOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        if (selectedVendor) setQuery(selectedVendor.name)
        else setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedVendor])

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      (v.phone && v.phone.includes(query)) ||
      (v.gstin && v.gstin.toLowerCase().includes(query.toLowerCase()))
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        return
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlightedIndex]) {
        onChange(filtered[highlightedIndex].id)
        setQuery(filtered[highlightedIndex].name)
        setIsOpen(false)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(0)
            if (value && e.target.value !== selectedVendor?.name) {
              onChange('')
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Vendor search"
          aria-expanded={isOpen}
          className={`w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border font-semibold transition-all ${
            error
              ? 'border-red-300 bg-red-50/30 focus:ring-red-500'
              : value
              ? 'border-cyan-500 bg-cyan-50/20 font-bold text-slate-900 focus:ring-cyan-500'
              : 'border-slate-200 focus:ring-cyan-500'
          } focus:outline-none focus:ring-2`}
        />
        <ChevronDown
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-3 h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
        />
      </div>

      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}

      {isOpen && (
        <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl py-1 text-sm">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-slate-400 text-xs text-center">No vendors found matching "{query}"</li>
          ) : (
            filtered.map((v, idx) => (
              <li
                key={v.id}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => {
                  onChange(v.id)
                  setQuery(v.name)
                  setIsOpen(false)
                }}
                className={`px-4 py-2.5 cursor-pointer flex justify-between items-center transition-colors ${
                  idx === highlightedIndex ? 'bg-cyan-50 text-cyan-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-slate-900">{v.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono flex gap-2">
                    {v.phone && <span>Ph: {v.phone}</span>}
                    {v.gstin && <span>GSTIN: {v.gstin}</span>}
                  </div>
                </div>
                {v.id === value && <Check className="w-4 h-4 text-cyan-600 shrink-0" />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default VendorTypeahead
