import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

export interface FreeTextComboboxOption {
  value: string
  label?: string
  meta?: string
}

interface FreeTextComboboxProps {
  value: string
  onChange: (val: string) => void
  options: FreeTextComboboxOption[]
  placeholder?: string
  error?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  onSelectOption?: (val: string) => void
  disabled?: boolean
}

export const FreeTextCombobox: React.FC<FreeTextComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder,
  error,
  inputRef,
  onSelectOption,
  disabled
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

  const filtered = options.filter(
    (opt) =>
      opt.value.toLowerCase().includes((value || '').toLowerCase()) ||
      (opt.label && opt.label.toLowerCase().includes((value || '').toLowerCase()))
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      if (options.length > 0) setIsOpen(true)
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
        const selected = filtered[highlightedIndex].value
        onChange(selected)
        if (onSelectOption) onSelectOption(selected)
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
          disabled={disabled}
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full py-2.5 pl-3.5 pr-8 text-sm rounded-xl border font-semibold transition-all ${
            error
              ? 'border-red-300 bg-red-50/30 focus:ring-red-500'
              : 'border-slate-200 focus:ring-cyan-500'
          } focus:outline-none focus:ring-2 disabled:bg-slate-100`}
        />
        {options.length > 0 && (
          <ChevronDown
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="absolute right-3 top-3 h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
          />
        )}
      </div>

      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-xl bg-white border border-slate-200 shadow-xl py-1 text-xs animate-fade-in">
          {filtered.map((opt, idx) => (
            <div
              key={`${opt.value}-${idx}`}
              onClick={() => {
                onChange(opt.value)
                if (onSelectOption) onSelectOption(opt.value)
                setIsOpen(false)
              }}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                idx === highlightedIndex ? 'bg-cyan-50 text-cyan-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-semibold">{opt.label || opt.value}</span>
                {opt.label && opt.value !== opt.label && (
                  <span className="text-[10px] text-slate-400 font-mono">{opt.value}</span>
                )}
              </div>
              {opt.meta && (
                <span className="text-[10px] font-bold text-cyan-700 bg-cyan-100/70 px-1.5 py-0.5 rounded border border-cyan-200/80">
                  {opt.meta}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FreeTextCombobox
