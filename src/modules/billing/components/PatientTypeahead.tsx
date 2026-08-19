import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, UserCheck } from 'lucide-react'
import { Patient } from '../../../types'

interface PatientTypeaheadProps {
  patients: Patient[]
  value: string
  onChange: (patient: Patient | null) => void
  disabled?: boolean
}

export const PatientTypeahead: React.FC<PatientTypeaheadProps> = ({
  patients,
  value,
  onChange,
  disabled
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedPatient = patients.find((p) => p.id === value)

  useEffect(() => {
    if (selectedPatient && !isOpen) {
      setQuery(`${selectedPatient.full_name} (${selectedPatient.patient_code})`)
    } else if (!value && !isOpen) {
      setQuery('')
    }
  }, [value, selectedPatient, isOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        if (selectedPatient) setQuery(`${selectedPatient.full_name} (${selectedPatient.patient_code})`)
        else setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedPatient])

  const filtered = patients.filter(
    (p) =>
      p.full_name.toLowerCase().includes(query.toLowerCase()) ||
      p.phone.includes(query) ||
      p.patient_code.toLowerCase().includes(query.toLowerCase())
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
      if (isOpen && filtered[highlightedIndex]) {
        e.preventDefault()
        const p = filtered[highlightedIndex]
        onChange(p)
        setQuery(`${p.full_name} (${p.patient_code})`)
        setIsOpen(false)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  if (disabled) {
    return (
      <div className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed">
        Walk-in Customer Mode Active (No patient linked)
      </div>
    )
  }

  if (selectedPatient) {
    return (
      <div className="flex items-center justify-between border border-cyan-300 bg-cyan-50/50 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-900 shadow-2xs">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-cyan-600 shrink-0" />
          <span>{selectedPatient.full_name}</span>
          <span className="text-xs font-mono text-slate-500 font-normal">({selectedPatient.patient_code})</span>
          <span className="text-xs font-mono text-slate-500 font-normal ml-2">Ph: {selectedPatient.phone}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-cyan-700 hover:text-cyan-900 font-bold underline cursor-pointer ml-2"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search patient by Name, Phone, Code or UHID..."
          aria-label="Patient search"
          aria-expanded={isOpen}
          className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-semibold bg-white"
        />
        <ChevronDown
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-3 h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
        />
      </div>

      {isOpen && (
        <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-2xl py-1 text-sm">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-slate-400 text-xs text-center">No matching patients found.</li>
          ) : (
            filtered.map((p, idx) => (
              <li
                key={p.id}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => {
                  onChange(p)
                  setQuery(`${p.full_name} (${p.patient_code})`)
                  setIsOpen(false)
                }}
                className={`px-4 py-2.5 cursor-pointer flex justify-between items-center transition-colors ${
                  idx === highlightedIndex ? 'bg-cyan-50 text-cyan-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-900">{p.full_name}</span>
                  <span className="ml-2 text-xs font-mono text-slate-500">[{p.patient_code}]</span>
                </div>
                <span className="text-xs font-mono text-slate-500">{p.phone}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default PatientTypeahead
