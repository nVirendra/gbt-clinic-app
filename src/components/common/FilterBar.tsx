import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Search, 
  X, 
  Filter, 
  Calendar, 
  RotateCcw, 
  Loader2, 
  ChevronDown,
  Check
} from 'lucide-react'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterFieldDef {
  id: string
  label: string
  type: 'select' | 'boolean' | 'date-preset'
  options?: FilterOption[]
  placeholder?: string
}

export interface ActiveFilterChip {
  id: string
  label: string
  displayValue: string
  value: any
}

export interface FilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchPlaceholder?: string
  filterFields?: FilterFieldDef[]
  activeFilterValues?: Record<string, any>
  onFilterChange?: (filterId: string, value: any) => void
  onClearAllFilters?: () => void
  resultCount?: number
  totalCount?: number
  loading?: boolean
  datePreset?: string
  onDatePresetChange?: (preset: string, startDate?: string, endDate?: string) => void
  customToolbarActions?: React.ReactNode
  enableUrlSync?: boolean
}

// Fuzzy multi-token search matcher
export function fuzzyMatchTokens(text: string, query: string): boolean {
  if (!query || !query.trim()) return true
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const target = text.toLowerCase()
  return tokens.every((token) => target.includes(token))
}

// Date Range Helper for Indian FY and Presets
export function getDateRangeFromPreset(preset: string): { startDate: string; endDate: string } {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  if (preset === 'today') {
    return { startDate: todayStr, endDate: todayStr }
  }
  if (preset === '7d') {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return { startDate: d.toISOString().split('T')[0], endDate: todayStr }
  }
  if (preset === '30d') {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return { startDate: d.toISOString().split('T')[0], endDate: todayStr }
  }
  if (preset === 'this-fy') {
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed, April is 3
    const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1
    const startDate = `${fyStartYear}-04-01`
    const endDate = `${fyStartYear + 1}-03-31`
    return { startDate, endDate }
  }

  return { startDate: '', endDate: '' }
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search by keyword, phone, ID...',
  filterFields = [],
  activeFilterValues = {},
  onFilterChange,
  onClearAllFilters,
  resultCount,
  totalCount,
  loading = false,
  datePreset,
  onDatePresetChange,
  customToolbarActions,
  enableUrlSync = true
}: FilterBarProps) {
  // Local debounced search input state (250ms)
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isTyping, setIsTyping] = useState(false)

  // Sync internal input value when prop searchQuery changes externally
  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

  // Debounce search update
  useEffect(() => {
    setIsTyping(true)
    const handler = setTimeout(() => {
      onSearchChange(inputValue)
      setIsTyping(false)
    }, 250)

    return () => clearTimeout(handler)
  }, [inputValue, onSearchChange])

  // URL Sync Effect
  useEffect(() => {
    if (!enableUrlSync || typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)

    if (inputValue) params.set('q', inputValue)
    else params.delete('q')

    Object.entries(activeFilterValues).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== false) {
        params.set(k, String(v))
      } else {
        params.delete(k)
      }
    })

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    window.history.replaceState(null, '', newUrl)
  }, [inputValue, activeFilterValues, enableUrlSync])

  // Active filter chips list computation
  const activeChips = useMemo(() => {
    const chips: ActiveFilterChip[] = []

    Object.entries(activeFilterValues).forEach(([fieldId, value]) => {
      if (value === undefined || value === null || value === '' || value === false) return

      const fieldDef = filterFields.find((f) => f.id === fieldId)
      if (!fieldDef) {
        chips.push({
          id: fieldId,
          label: fieldId,
          displayValue: String(value),
          value
        })
        return
      }

      let displayVal = String(value)
      if (fieldDef.type === 'boolean') {
        displayVal = value ? 'Yes' : 'No'
      } else if (fieldDef.options) {
        const matched = fieldDef.options.find((o) => o.value === String(value))
        if (matched) displayVal = matched.label
      }

      chips.push({
        id: fieldId,
        label: fieldDef.label,
        displayValue: displayVal,
        value
      })
    })

    if (datePreset && datePreset !== 'all' && onDatePresetChange) {
      const presetLabels: Record<string, string> = {
        today: 'Today',
        '7d': 'Last 7 Days',
        '30d': 'Last 30 Days',
        'this-fy': 'This Financial Year'
      }
      chips.push({
        id: 'datePreset',
        label: 'Date Range',
        displayValue: presetLabels[datePreset] || datePreset,
        value: datePreset
      })
    }

    return chips
  }, [activeFilterValues, filterFields, datePreset, onDatePresetChange])

  const hasActiveFilters = activeChips.length > 0 || Boolean(searchQuery.trim())

  return (
    <div className="space-y-3 font-sans text-slate-800">
      
      {/* FILTER BAR MAIN CONTAINER */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left: Search Box & Dynamic Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          
            {/* SEARCH INPUT BOX WITH SPINNER & CLEAR BUTTON */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-[#0B132B]"
            />
            {isTyping ? (
              <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 text-cyan-500 animate-spin" />
            ) : inputValue ? (
              <button
                type="button"
                onClick={() => setInputValue('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* DATE RANGE PRESET SELECTOR */}
          {onDatePresetChange && (
            <div className="flex items-center gap-1 bg-[#F4F5F7] p-1 rounded-xl text-xs font-semibold border border-slate-200/80">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 shrink-0" />
              {[
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'this-fy', label: 'This FY' },
                { id: 'all', label: 'All' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const { startDate, endDate } = getDateRangeFromPreset(p.id)
                    onDatePresetChange(p.id, startDate, endDate)
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    (datePreset || 'all') === p.id
                      ? 'bg-[#0B132B] text-cyan-500 font-black border border-cyan-500/40 shadow-xs'
                      : 'text-slate-600 hover:text-[#0B132B] hover:bg-slate-200/60 font-semibold'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* DYNAMIC FIELD FILTER DROPDOWNS */}
          {filterFields.map((field) => {
            const currentValue = activeFilterValues[field.id] ?? ''

            if (field.type === 'select' && field.options) {
              return (
                <div key={field.id} className="relative">
                  <select
                    value={currentValue}
                    onChange={(e) => onFilterChange && onFilterChange(field.id, e.target.value)}
                    className={`px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white transition-all ${
                      currentValue ? 'border-cyan-500 text-[#0B132B] bg-cyan-50/40 font-bold' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value="">{field.placeholder || `All ${field.label}s`}</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )
            }

            if (field.type === 'boolean') {
              return (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => onFilterChange && onFilterChange(field.id, !currentValue)}
                  className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentValue
                      ? 'bg-[#0B132B] text-cyan-500 border-cyan-500/40 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {currentValue && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                  {field.label}
                </button>
              )
            }

            return null
          })}

        </div>

        {/* Right: Results Counter & Custom Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* RESULT COUNTER BADGE */}
          {resultCount !== undefined && (
            <span className="text-xs font-semibold text-slate-500 font-mono">
              Showing <strong className="text-[#0B132B]">{resultCount}</strong>
              {totalCount !== undefined && totalCount !== resultCount ? (
                <> of <span className="text-slate-400">{totalCount}</span></>
              ) : null} records
            </span>
          )}

          {customToolbarActions}
        </div>

      </div>

      {/* ACTIVE FILTER CHIPS STRIP */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-1 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#0B132B]" /> Active Filters:
          </span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0B132B] text-white border border-cyan-500/40 rounded-lg text-xs font-bold shadow-2xs">
              <span>Search: "{searchQuery}"</span>
              <button
                type="button"
                onClick={() => {
                  setInputValue('')
                  onSearchChange('')
                }}
                className="text-slate-400 hover:text-cyan-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {activeChips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 text-[#0B132B] border border-cyan-500/60 rounded-lg text-xs font-bold shadow-2xs"
            >
              <span className="text-[#0B132B] font-semibold">{chip.label}:</span>
              <span className="text-[#0B132B] font-extrabold">{chip.displayValue}</span>
              <button
                type="button"
                onClick={() => {
                  if (chip.id === 'datePreset' && onDatePresetChange) {
                    onDatePresetChange('all', '', '')
                  } else if (onFilterChange) {
                    onFilterChange(chip.id, '')
                  }
                }}
                className="text-slate-400 hover:text-[#0B132B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* CLEAR ALL BUTTON */}
          <button
            type="button"
            onClick={() => {
              setInputValue('')
              onSearchChange('')
              if (onDatePresetChange) onDatePresetChange('all', '', '')
              if (onClearAllFilters) onClearAllFilters()
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer ml-1 flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" /> Clear All
          </button>
        </div>
      )}

    </div>
  )
}
