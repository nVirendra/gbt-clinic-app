import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'

export const STANDARD_UNITS = [
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
  'Pessary',
  'Suppository',
  'Respule',
  'Piece',
  'ml',
  'litre',
  'gm',
  'kg',
  'Dose',
  'Puff'
]

interface UnitSelectorComboboxProps {
  value: string
  onChange: (val: string) => void
  availableOptions?: string[]
  placeholder?: string
  disabled?: boolean
  error?: string
  className?: string
  inputClassName?: string
}

export const UnitSelectorCombobox: React.FC<UnitSelectorComboboxProps> = ({
  value,
  onChange,
  availableOptions,
  placeholder = 'Search unit (e.g. Strip, Box, ml)...',
  disabled = false,
  error,
  className = '',
  inputClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState(value || '')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const options = Array.from(
    new Set([...(availableOptions || []), ...STANDARD_UNITS])
  ).filter(Boolean)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setQuery(value || '')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value])

  const filtered = options.filter((u) =>
    u.toLowerCase().includes(query.trim().toLowerCase())
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
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
      e.preventDefault()
      if (isOpen && filtered[highlightedIndex]) {
        const selected = filtered[highlightedIndex]
        onChange(selected)
        setQuery(selected)
        setIsOpen(false)
      } else if (query.trim()) {
        onChange(query.trim())
        setIsOpen(false)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery(value || '')
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          value={query}
          onFocus={() => !disabled && setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search unit"
          aria-expanded={isOpen}
          className={`w-full py-2 pl-3 pr-7 text-xs font-bold rounded-xl border transition-all ${
            error
              ? 'border-red-300 bg-red-50/30 focus:ring-red-500'
              : 'border-slate-200 focus:ring-cyan-500 bg-white text-slate-800'
          } focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed ${inputClassName}`}
        />
        <ChevronDown
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
        />
      </div>

      {error && <p className="text-[10px] text-red-500 mt-0.5 font-medium">{error}</p>}

      {isOpen && !disabled && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-2xl py-1 text-xs animate-fade-in">
          {filtered.length === 0 ? (
            <li
              className="px-3 py-2 text-slate-600 font-semibold cursor-pointer bg-cyan-50/50 hover:bg-cyan-100 flex items-center justify-between"
              onClick={() => {
                if (query.trim()) {
                  onChange(query.trim())
                  setIsOpen(false)
                }
              }}
            >
              <span>Use custom unit: "{query}"</span>
              <Check className="w-3.5 h-3.5 text-cyan-600" />
            </li>
          ) : (
            filtered.map((u, idx) => {
              const isSelected = u.toLowerCase() === (value || '').toLowerCase()
              return (
                <li
                  key={`${u}-${idx}`}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => {
                    onChange(u)
                    setQuery(u)
                    setIsOpen(false)
                  }}
                  className={`px-3 py-1.5 cursor-pointer flex items-center justify-between transition-colors ${
                    idx === highlightedIndex
                      ? 'bg-cyan-50 text-cyan-900 font-bold'
                      : isSelected
                      ? 'bg-slate-100 font-bold text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-semibold">{u}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />}
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}

export default UnitSelectorCombobox
