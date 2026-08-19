import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  History,
  ArrowRight,
  FilePlus,
  ChevronDown,
  ChevronUp,
  Check,
  Lock,
  Info,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  X,
  Building2,
  Receipt,
  Calendar,
  CreditCard,
  Percent,
  Tag,
  DollarSign,
  Package,
  Layers,
  HelpCircle,
  Clock,
  Pill,
  ShieldAlert,
  ShieldCheck,
  ScanLine
} from 'lucide-react'
import { useInventoryStore } from '../store'
import { useAuthStore } from '../../auth/store'
import { Medicine, Vendor, InventoryBatch, Purchase } from '../../../types'
import { DataTable, ColumnDef } from '../../../components/common/DataTable'
import { formatDateTime } from '../../../lib/formatDate'
import ScanPurchaseInvoice from './ScanPurchaseInvoice'
import { RedesignedMedicineModal } from './medicine/RedesignedMedicineModal'
import { StockPurchaseInContainer } from './stockin/StockPurchaseInContainer'
import {
  getAvailableUnitsForMedicine,
  getLiveConversionSummary,
  formatStockBreakdown,
  convertToBaseQuantity,
  ALL_UNIT_OPTIONS
} from '../../../lib/unitConversion'

// Toast Component
function Toast({
  message,
  type,
  onClose
}: {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColors = {
    success: 'bg-cyan-950 text-cyan-100 border-cyan-800/60',
    error: 'bg-red-950 text-red-100 border-red-800/60',
    info: 'bg-slate-900 text-white border-slate-700'
  }

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-cyan-400 shrink-0" />
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-fade-in transition-all text-sm font-medium ${bgColors[type]}`}>
      {icons[type]}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 text-slate-400 hover:text-white cursor-pointer">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Vendor Searchable Typeahead Combobox
function VendorTypeahead({
  vendors,
  value,
  onChange,
  placeholder = "Search vendor by name, phone, gstin...",
  error
}: {
  vendors: Vendor[]
  value: string
  onChange: (vendorId: string) => void
  placeholder?: string
  error?: string
}) {
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
        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
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
          className={`w-full pl-9 pr-8 py-2 text-sm rounded-lg border transition-all ${error
            ? 'border-red-300 bg-red-50/30 focus:ring-red-500'
            : value
              ? 'border-cyan-500 bg-cyan-50/20 font-semibold text-slate-900 focus:ring-cyan-500'
              : 'border-slate-200 focus:ring-cyan-500'
            } focus:outline-none focus:ring-2`}
        />
        <ChevronDown
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
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
                className={`px-4 py-2.5 cursor-pointer flex justify-between items-center transition-colors ${idx === highlightedIndex ? 'bg-cyan-50 text-cyan-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">{v.name}</div>
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

// Medicine Searchable Typeahead Combobox
function MedicineTypeahead({
  medicines,
  value,
  onChange,
  placeholder = "Type medicine name, pack, generic...",
  inputRef,
  error
}: {
  medicines: Medicine[]
  value: string
  onChange: (medicine: Medicine | null) => void
  placeholder?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  error?: string
}) {
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
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
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
          className={`w-full pl-9 pr-8 py-2 text-sm rounded-lg border transition-all ${error
            ? 'border-red-300 bg-red-50/30 focus:ring-red-500'
            : value
              ? 'border-cyan-500 bg-cyan-50/20 font-semibold text-slate-900 focus:ring-cyan-500'
              : 'border-slate-200 focus:ring-cyan-500'
            } focus:outline-none focus:ring-2`}
        />
        <ChevronDown
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
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
                className={`px-4 py-2.5 cursor-pointer border-b border-slate-100 last:border-0 transition-colors ${idx === highlightedIndex ? 'bg-cyan-50 text-cyan-950 font-medium' : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-slate-900">{m.name}</span>
                    {m.strength && <span className="ml-1.5 text-xs font-semibold text-cyan-700">({m.strength})</span>}
                    {m.pack && <span className="ml-2 text-xs font-mono text-slate-500">[{m.pack}]</span>}
                    <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase">{m.type}</span>
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

// Generic Free-Text Typeahead Combobox Component for Form Inputs
function FreeTextCombobox({
  value,
  onChange,
  options,
  placeholder,
  error,
  inputRef,
  onSelectOption
}: {
  value: string
  onChange: (val: string) => void
  options: Array<{ value: string; label?: string; meta?: string }>
  placeholder?: string
  error?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  onSelectOption?: (val: string) => void
}) {
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
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full py-2 pl-3 pr-8 text-sm rounded-xl border transition-all ${error
            ? 'border-red-300 bg-red-50/30 focus:ring-red-500'
            : 'border-slate-200 focus:ring-cyan-500'
            } focus:outline-none focus:ring-2`}
        />
        {options.length > 0 && (
          <ChevronDown
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
          />
        )}
      </div>

      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}

      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl py-1 text-sm">
          {filtered.map((opt, idx) => (
            <li
              key={idx}
              onMouseEnter={() => setHighlightedIndex(idx)}
              onClick={() => {
                onChange(opt.value)
                if (onSelectOption) onSelectOption(opt.value)
                setIsOpen(false)
              }}
              className={`px-3 py-2 cursor-pointer flex justify-between items-center transition-colors ${idx === highlightedIndex ? 'bg-cyan-50 text-cyan-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              <div>
                <span className="font-medium text-slate-900">{opt.value}</span>
                {opt.label && <span className="ml-2 text-xs text-slate-500">({opt.label})</span>}
              </div>
              {opt.meta && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{opt.meta}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Scrollable single-select dropdown (native <select> popups can't be styled/capped in height)
function ScrollableSelect({
  value,
  onChange,
  options
}: {
  value: string
  onChange: (val: string) => void
  options: Array<{ value: string; label: string }>
}) {
  const [isOpen, setIsOpen] = useState(false)
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

  const selected = options.find((opt) => opt.value === value)

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold text-slate-900 bg-white flex items-center justify-between cursor-pointer"
      >
        <span>{selected?.label || value}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl py-1 text-sm">
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
              className={`px-3 py-2 cursor-pointer transition-colors ${opt.value === value ? 'bg-cyan-50 text-cyan-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const DOSAGE_FORM_OPTIONS = [
  { value: 'TABLET', label: 'TABLET' },
  { value: 'CAPSULE', label: 'CAPSULE' },
  { value: 'INJECTION', label: 'INJECTION' },
  { value: 'SYRUP', label: 'SYRUP' },
  { value: 'OINTMENT', label: 'OINTMENT' },
  { value: 'SUSPENSION', label: 'SUSPENSION' },
  { value: 'DROP', label: 'DROP' },
  { value: 'GEL', label: 'GEL' },
  { value: 'LOTION', label: 'LOTION' },
  { value: 'POWDER', label: 'POWDER' },
  { value: 'OIL', label: 'OIL' },
  { value: 'FACE_WASH', label: 'FACE WASH' },
  { value: 'CREAM', label: 'CREAM' },
  { value: 'BALM', label: 'BALM' },
  { value: 'OTHER', label: 'OTHER' }
]

// Indian GST State Code Map for Auto-Detection
const INDIAN_GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '36': 'Telangana',
  '37': 'Andhra Pradesh'
}

// Redesigned Add / Edit Medicine Form Modal is imported from ./medicine/RedesignedMedicineModal



// Redesigned Add / Edit Vendor Form Modal Component
function RedesignedVendorModal({
  isOpen,
  onClose,
  onSubmit,
  editingVendor,
  existingVendors,
  initialFormValues
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: any) => Promise<void>
  editingVendor: Vendor | null
  existingVendors: Vendor[]
  initialFormValues?: Partial<{
    name: string
    phone: string
    address: string
    gstin: string
    drug_license_no: string
    notes: string
  }>
}) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    gstin: '',
    drug_license_no: '',
    notes: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (editingVendor) {
        setForm({
          name: editingVendor.name || '',
          phone: editingVendor.phone || '',
          address: editingVendor.address || '',
          gstin: editingVendor.gstin || '',
          drug_license_no: editingVendor.drug_license_no || '',
          notes: editingVendor.notes || ''
        })
      } else if (initialFormValues) {
        setForm({
          name: initialFormValues.name || '',
          phone: initialFormValues.phone || '',
          address: initialFormValues.address || '',
          gstin: initialFormValues.gstin || '',
          drug_license_no: initialFormValues.drug_license_no || '',
          notes: initialFormValues.notes || ''
        })
      } else {
        setForm({
          name: '',
          phone: '',
          address: '',
          gstin: '',
          drug_license_no: '',
          notes: ''
        })
      }

      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, editingVendor, initialFormValues])

  if (!isOpen) return null

  // Phone & GSTIN Clean Values
  const cleanPhone = form.phone.trim()
  const cleanGstin = form.gstin.trim().toUpperCase()

  // Duplicate Vendor Warning (Blocking)
  const cleanVendorInputName = form.name.trim().replace(/\s+/g, ' ').toUpperCase()
  const duplicateVendor = (cleanVendorInputName.length > 0 || cleanGstin.length === 15)
    ? existingVendors.find(
      (v) =>
        v.id !== editingVendor?.id &&
        ((cleanVendorInputName.length > 0 && v.name.trim().replace(/\s+/g, ' ').toUpperCase() === cleanVendorInputName) ||
          (cleanGstin.length === 15 && v.gstin && v.gstin.toUpperCase() === cleanGstin))
    )
    : null

  // Validations
  const isNameValid = Boolean(form.name.trim()) && !duplicateVendor

  // Phone Validation (Mobile or Telephone / Landline, optional when blank)
  const digitsOnlyPhone = cleanPhone.replace(/[\s\-\(\)\+]/g, '')
  const isPhoneValid = cleanPhone === '' || (digitsOnlyPhone.length >= 6 && digitsOnlyPhone.length <= 15 && /^[\+\d\s\-\(\)]+$/.test(cleanPhone))

  // GSTIN Validation (15-character format, optional when blank)
  const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  const isGstinValid = cleanGstin === '' || (cleanGstin.length === 15 && gstinPattern.test(cleanGstin))

  // State Detection from GSTIN (First 2 digits)
  const stateCode = cleanGstin.length >= 2 ? cleanGstin.substring(0, 2) : ''
  const detectedState = INDIAN_GST_STATE_CODES[stateCode] || null

  // Overall Form Validation State
  const isValid = isNameValid && isPhoneValid && isGstinValid

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (duplicateVendor) {
      toast.error(`Duplicate Vendor Name "${duplicateVendor.name}" is not allowed!`)
      return
    }
    if (!isValid || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({
        name: cleanVendorInputName,
        phone: cleanPhone,
        address: form.address,
        gstin: cleanGstin,
        drug_license_no: form.drug_license_no.trim().toUpperCase(),
        notes: form.notes
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div
        onKeyDown={handleFormKeyDown}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-md font-bold">
              {editingVendor ? 'Edit Vendor Master' : 'Add New Vendor Master'}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Ctrl+Enter to Save</span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL FORM BODY */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-slate-800">

          {/* SECTION 1: CONTACT & LOCATION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-cyan-700">
              <Building2 className="w-4 h-4 text-cyan-500" /> 1. Vendor Contact & Location
            </div>

            <div className="space-y-3">
              {/* Vendor Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="e.g. APEX PHARMACY WHOLESALE"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
                  className={`w-full py-2 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 font-semibold uppercase ${!isNameValid && form.name !== ''
                    ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                    : 'border-slate-200 focus:ring-cyan-500'
                    }`}
                />
                {!Boolean(form.name.trim()) && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">Vendor name is required.</p>
                )}

                {/* DUPLICATE VENDOR RESTRICTION ERROR */}
                {duplicateVendor && (
                  <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs flex items-start gap-2 text-red-900">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Duplicate Vendor Restricted!</span>
                      <div className="text-[11px] text-red-800 mt-0.5">
                        Vendor with name <strong className="text-red-950">"{duplicateVendor.name}"</strong> already exists. Duplicate entries are not allowed.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex justify-between">
                  <span>Phone / Telephone No.</span>
                  <span className="text-[11px] text-slate-400 font-normal font-sans">Mobile or Landline</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210 or 022-28491234"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={`w-full py-2 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 font-mono ${!isPhoneValid
                    ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                    : 'border-slate-200 focus:ring-cyan-500'
                    }`}
                />
                {!isPhoneValid && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">Must be a valid mobile or landline/telephone number.</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Address / Location</label>
                <input
                  type="text"
                  placeholder="Vendor business address or city..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Optional payment terms, contact person, or notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: COMPLIANCE & LICENSING */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-cyan-700">
              <ShieldCheck className="w-4 h-4 text-cyan-500" /> 2. Tax Compliance & Drug Licensing
            </div>

            <div className="space-y-3">
              {/* GSTIN */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex justify-between">
                  <span>GSTIN Number</span>
                  <span className="text-[11px] text-slate-400 font-normal font-sans">15-char format</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                  className={`w-full py-2 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 font-mono font-semibold uppercase ${!isGstinValid
                    ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                    : 'border-slate-200 focus:ring-cyan-500'
                    }`}
                />
                {!isGstinValid && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">
                    Invalid 15-character GSTIN format (e.g. 27AAAAA1111A1Z1).
                  </p>
                )}

                {/* STATE AUTO-DETECTION BADGE */}
                {detectedState && isGstinValid && (
                  <div className="mt-2 p-2 bg-cyan-50 border border-cyan-200/70 rounded-lg text-xs font-medium text-cyan-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>
                      Detected State: <strong className="text-cyan-950">{detectedState}</strong> (Code {stateCode}) • Enables In-State vs Inter-State Tax
                    </span>
                  </div>
                )}
              </div>

              {/* Drug License No */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex justify-between">
                  <span>Drug License Number</span>
                  <span className="text-[11px] text-slate-400 font-normal font-sans">Format hint: DL-XXXXX/YYYY</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. DL-12345/2026"
                  value={form.drug_license_no}
                  onChange={(e) => setForm({ ...form, drug_license_no: e.target.value.toUpperCase() })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel (Esc)
            </button>

            <div className="relative group">
              <button
                type="submit"
                disabled={!isValid || submitting}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-cyan-500/20 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Vendor
                  </>
                )}
              </button>

              {/* Disabled tooltip */}
              {!isValid && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-56 p-2 bg-slate-900 text-slate-200 text-xs rounded-lg shadow-xl z-50">
                  <p className="font-semibold text-amber-400 mb-1">Cannot save yet:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {!isNameValid && <li>Vendor name required</li>}
                    {!isPhoneValid && <li>Phone must be a valid mobile or landline number</li>}
                    {!isGstinValid && <li>GSTIN format invalid</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Inventory() {
  const medicines = useInventoryStore((state) => state.medicines)
  const vendors = useInventoryStore((state) => state.vendors)
  const batches = useInventoryStore((state) => state.batches)
  const purchases = useInventoryStore((state) => state.purchases)
  const loading = useInventoryStore((state) => state.loading)

  const loadAllData = useInventoryStore((state) => state.loadAllData)
  const createMedicine = useInventoryStore((state) => state.createMedicine)
  const updateMedicine = useInventoryStore((state) => state.updateMedicine)
  const deleteMedicine = useInventoryStore((state) => state.deleteMedicine)

  const createVendor = useInventoryStore((state) => state.createVendor)
  const updateVendor = useInventoryStore((state) => state.updateVendor)
  const deleteVendor = useInventoryStore((state) => state.deleteVendor)

  const createPurchase = useInventoryStore((state) => state.createPurchase)
  const adjustStock = useInventoryStore((state) => state.adjustStock)

  const currentUser = useAuthStore((state) => state.user)

  const [localTab, setLocalTab] = useState('stock-in') // default to stock-in for quick access
  const [searchQuery, setSearchQuery] = useState('')

  // Toast feedback helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error') toast.error(message)
    else if (type === 'info') toast.info(message)
    else toast.success(message)
  }

  // Modals state
  const [showMedModal, setShowMedModal] = useState(false)
  const [editingMed, setEditingMed] = useState<Medicine | null>(null)

  const [showVendorModal, setShowVendorModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)

  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustReason, setAdjustReason] = useState('Count correction')

  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null)

  // Stock In Form State
  const [purchaseForm, setPurchaseForm] = useState({
    vendorId: '',
    purchaseInvoiceNo: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseType: 'CASH',
    taxType: 'INTRASTATE', // INTRASTATE (CGST+SGST) / INTERSTATE (IGST)
    dueDate: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paidAmount: '',
    paymentStatus: 'PAID',
    paymentMode: 'CASH',
    notes: '',
    items: [] as Array<{
      medicineId: string
      batchNo: string
      expiryDate: string
      qtyPurchased: number
      freeQty: number
      mrp: number
      discountPercent: number
      taxableAmount: number
      cgstAmount: number
      sgstAmount: number
      igstAmount: number
      gstPercent: number
      purchasePricePerUnit: number
      sellingPricePerUnit: number
    }>
  })

  const [stockInItem, setStockInItem] = useState({
    medicineId: '',
    batchNo: '',
    expiryDate: '',
    qtyPurchased: '',
    unit: '',
    freeQty: '',
    freeUnit: '',
    mrp: '',
    discountPercent: '',
    gstPercent: '12',
    purchasePricePerUnit: '',
    amount: '',
    sellingPricePerUnit: ''
  })

  // UX & Flow state for Stock In
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [recentlyAddedIndex, setRecentlyAddedIndex] = useState<number | null>(null)
  const [lastUsedGstPercent, setLastUsedGstPercent] = useState('12')
  const [showScanInvoiceModal, setShowScanInvoiceModal] = useState(false)
  const medicineInputRef = useRef<HTMLInputElement>(null)

  const safeBatches = Array.isArray(batches) ? batches : []
  const searchableBatches = safeBatches.map((b: any) => ({
    ...b,
    medicine_name: b.medicine ? `${b.medicine.name}${b.medicine.strength ? ` (${b.medicine.strength})` : ''}` : ''
  }))
  const safePurchases = Array.isArray(purchases) ? purchases : []
  const searchablePurchases = safePurchases.map((p: any) => ({
    ...p,
    vendor_name: p.vendor?.name || '',
    batch_items_search: (p.batches || []).map((b: any) => b.medicine ? `${b.medicine.name}${b.medicine.strength ? ` (${b.medicine.strength})` : ''}` : '').join(' ')
  }))
  const safeMedicines = Array.isArray(medicines) ? medicines : []
  const safeVendors = Array.isArray(vendors) ? vendors : []

  useEffect(() => {
    loadAllData()
  }, [])

  // Auto focus medicine input when stock-in tab opens
  useEffect(() => {
    if (localTab === 'stock-in') {
      setTimeout(() => {
        medicineInputRef.current?.focus()
      }, 100)
    }
  }, [localTab])

  const handleQtyPurchasedChange = (val: string) => {
    const qty = parseFloat(val) || 0
    const pPrice = parseFloat(stockInItem.purchasePricePerUnit) || 0
    let newAmount = stockInItem.amount
    if (qty > 0 && pPrice > 0) {
      newAmount = (qty * pPrice).toFixed(2)
    }
    setStockInItem((prev) => ({
      ...prev,
      qtyPurchased: val,
      amount: newAmount
    }))
  }

  const handlePurchasePriceChange = (val: string) => {
    const pPrice = parseFloat(val) || 0
    const qty = parseFloat(stockInItem.qtyPurchased) || 0
    let newAmount = stockInItem.amount
    if (qty > 0 && pPrice > 0) {
      newAmount = (qty * pPrice).toFixed(2)
    }
    setStockInItem((prev) => ({
      ...prev,
      purchasePricePerUnit: val,
      amount: newAmount
    }))
  }

  const handleAmountChange = (val: string) => {
    const amt = parseFloat(val) || 0
    const qty = parseFloat(stockInItem.qtyPurchased) || 0
    let newPPrice = stockInItem.purchasePricePerUnit
    if (qty > 0 && amt >= 0) {
      newPPrice = (amt / qty).toFixed(2)
    }
    setStockInItem((prev) => ({
      ...prev,
      amount: val,
      purchasePricePerUnit: newPPrice
    }))
  }

  // Handle Medicine Selection with Auto-Filling Defaults
  const handleMedicineSelect = (selectedMed: Medicine | null) => {
    if (!selectedMed) {
      setStockInItem((prev) => ({
        ...prev,
        medicineId: '',
        unit: '',
        freeUnit: '',
        gstPercent: lastUsedGstPercent
      }))
      return
    }

    // Lookup previous batch pricing history for this medicine
    const prevBatch = safeBatches.find((b) => b.medicine_id === selectedMed.id)
    const defaultUnit = selectedMed.purchase_unit || selectedMed.inner_unit || selectedMed.base_unit || selectedMed.unit_label || 'Piece'

    setStockInItem((prev) => ({
      ...prev,
      medicineId: selectedMed.id,
      unit: defaultUnit,
      freeUnit: defaultUnit,
      gstPercent: selectedMed.default_gst_percent !== null && selectedMed.default_gst_percent !== undefined
        ? selectedMed.default_gst_percent.toString()
        : lastUsedGstPercent,
      mrp: prevBatch?.mrp ? prevBatch.mrp.toString() : prev.mrp,
      purchasePricePerUnit: prevBatch?.purchase_price_per_unit ? prevBatch.purchase_price_per_unit.toString() : prev.purchasePricePerUnit,
      sellingPricePerUnit: prevBatch?.selling_price_per_unit ? prevBatch.selling_price_per_unit.toString() : prev.sellingPricePerUnit
    }))
  }

  // MEDICINES CRUD SUBMISSION HANDLER
  const handleMedModalSave = async (formData: any) => {
    const norm = (str?: string | null) => {
      if (!str) return ''
      const s = str.trim().replace(/\s+/g, ' ')
      if (s.toUpperCase() === 'NULL' || s.toUpperCase() === 'UNDEFINED') return ''
      return s.toUpperCase()
    }
    const cleanName = norm(formData.name)
    const cleanStrength = norm(formData.strength)
    const cleanType = norm(formData.type) || 'TABLET'
    const cleanPack = norm(formData.pack)
    const cleanManufacturer = norm(formData.manufacturer)

    if (!cleanName) return showToast('Medicine Name is required', 'error')

    // 5-Tuple Duplicate check against existing medicines
    const isDuplicate = safeMedicines.some(
      (m) =>
        m.id !== editingMed?.id &&
        norm(m.name) === cleanName &&
        norm(m.strength) === cleanStrength &&
        (norm(m.type) || 'TABLET') === cleanType &&
        norm(m.pack) === cleanPack &&
        norm(m.manufacturer) === cleanManufacturer
    )
    if (isDuplicate) {
      showToast(`Medicine with this combination already exists! Duplicate entry is not allowed.`, 'error')
      return
    }

    try {
      const parsedGst = parseFloat(formData.defaultGstPercent)
      const gstPercent = isNaN(parsedGst) ? 12.0 : parsedGst
      const data = {
        name: cleanName,
        strength: cleanStrength || null,
        generic_name: formData.genericName ? formData.genericName.trim() : null,
        genericName: formData.genericName ? formData.genericName.trim() : null,
        manufacturer: cleanManufacturer || null,
        pack: cleanPack || null,
        type: cleanType || 'TABLET',
        unit_label: formData.unitLabel,
        unitLabel: formData.unitLabel,
        base_unit: formData.baseUnit || 'Piece',
        inner_unit: formData.innerUnit || null,
        units_per_inner: parseFloat(formData.unitsPerInner) || 1.0,
        purchase_unit: formData.purchaseUnit || null,
        inner_units_per_purchase: parseFloat(formData.innerUnitsPerPurchase) || 1.0,
        hsn_code: formData.hsnCode || null,
        hsnCode: formData.hsnCode || null,
        rack_no: formData.rackNo || null,
        rackNo: formData.rackNo || null,
        reorder_level: parseInt(formData.reorderLevel) || 0,
        reorderLevel: parseInt(formData.reorderLevel) || 0,
        default_gst_percent: gstPercent,
        defaultGstPercent: gstPercent
      }
      if (editingMed) {
        await updateMedicine({ id: editingMed.id, data, userId: currentUser?.id || '' })
        showToast('Medicine updated successfully', 'success')
      } else {
        await createMedicine({ data, userId: currentUser?.id || '' })
        showToast('Medicine created successfully', 'success')
      }
      setShowMedModal(false)
      setEditingMed(null)
    } catch (err: any) {
      showToast(err.message || 'Error saving medicine', 'error')
      throw err // Keeps modal open on error
    }
  }

  const startEditMed = (m: Medicine) => {
    setEditingMed(m)
    setShowMedModal(true)
  }

  const handleDeleteMed = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return
    try {
      await deleteMedicine({ id, userId: currentUser?.id || '' })
      showToast('Medicine deleted', 'info')
    } catch (e: any) {
      showToast(e.message || 'Failed to delete medicine', 'error')
    }
  }

  // VENDORS CRUD SUBMISSION HANDLER
  const handleVendorModalSave = async (formData: any) => {
    const cleanName = (formData.name || '').trim().replace(/\s+/g, ' ').toUpperCase()
    if (!cleanName) return showToast('Vendor Name is required', 'error')

    // Duplicate check against existing vendors
    const isDuplicate = safeVendors.some(
      (v) => v.id !== editingVendor?.id && v.name.trim().replace(/\s+/g, ' ').toUpperCase() === cleanName
    )
    if (isDuplicate) {
      showToast(`Vendor "${cleanName}" already exists! Duplicate entry is not allowed.`, 'error')
      throw new Error(`Duplicate vendor name "${cleanName}"`)
    }

    const payload = {
      ...formData,
      name: cleanName
    }

    try {
      if (editingVendor) {
        await updateVendor({ id: editingVendor.id, data: payload, userId: currentUser?.id || '' })
        showToast('Vendor updated successfully', 'success')
      } else {
        await createVendor({ data: payload, userId: currentUser?.id || '' })
        showToast('Vendor created successfully', 'success')
      }
      setShowVendorModal(false)
      setEditingVendor(null)
    } catch (err: any) {
      showToast(err.message || 'Error saving vendor', 'error')
      throw err // Keeps modal open on error
    }
  }

  const startEditVendor = (v: Vendor) => {
    setEditingVendor(v)
    setShowVendorModal(true)
  }

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return
    try {
      await deleteVendor({ id, userId: currentUser?.id || '' })
      showToast('Vendor deleted', 'info')
    } catch (e: any) {
      showToast(e.message || 'Failed to delete vendor', 'error')
    }
  }

  // STOCK ADJUSTMENT (Admin only)
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatch) return
    const qty = parseInt(adjustQty)
    if (isNaN(qty) || qty === 0) return showToast('Please enter a non-zero adjustment amount', 'error')

    try {
      await adjustStock({
        id: selectedBatch.id,
        qtyChange: qty,
        reason: adjustReason,
        userId: currentUser?.id || ''
      })
      showToast('Stock adjusted successfully!', 'success')
      setShowAdjustModal(false)
      setSelectedBatch(null)
      setAdjustQty('')
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust stock', 'error')
    }
  }

  // STOCK IN LOGIC
  const addStockInItem = () => {
    if (!stockInItem.medicineId) return showToast('Please select a medicine', 'error')
    if (!stockInItem.expiryDate) return showToast('Please select expiry date', 'error')

    const isoExpiryDate = formatExpiryToISO(stockInItem.expiryDate)
    if (!isoExpiryDate) return showToast('Invalid expiry date format', 'error')

    const expiryTimestamp = new Date(isoExpiryDate).getTime()
    const todayTimestamp = new Date().setHours(0, 0, 0, 0)
    if (expiryTimestamp <= todayTimestamp) {
      showToast('Warning: Expiry date should be a future date', 'info')
    }

    const qty = parseInt(stockInItem.qtyPurchased)
    const freeQty = parseInt(stockInItem.freeQty) || 0
    const mrp = parseFloat(stockInItem.mrp) || 0
    const discountPercent = parseFloat(stockInItem.discountPercent) || 0
    let pPrice = parseFloat(stockInItem.purchasePricePerUnit)
    const lineAmt = parseFloat(stockInItem.amount)
    const sPrice = parseFloat(stockInItem.sellingPricePerUnit)

    if (isNaN(pPrice) && !isNaN(lineAmt) && qty > 0) {
      pPrice = lineAmt / qty
    }

    if (isNaN(qty) || qty <= 0) return showToast('Purchased Quantity must be > 0', 'error')
    if (isNaN(pPrice) || pPrice < 0) return showToast('Purchase price invalid', 'error')
    if (isNaN(sPrice) || sPrice < pPrice) return showToast('Selling price should be >= purchase price', 'error')

    const selMed = safeMedicines.find(m => m.id === stockInItem.medicineId)
    const parsedItemGst = parseFloat(stockInItem.gstPercent)
    const gstPercent = !isNaN(parsedItemGst)
      ? parsedItemGst
      : (selMed?.default_gst_percent ?? 12.0)

    // Tax calculation per item
    const baseGross = qty * pPrice
    const discountAmt = baseGross * (discountPercent / 100)
    const taxableAmount = Math.max(0, baseGross - discountAmt)
    const gstAmount = taxableAmount * (gstPercent / 100)

    let cgstAmount = 0
    let sgstAmount = 0
    let igstAmount = 0

    if (purchaseForm.taxType === 'INTERSTATE') {
      igstAmount = gstAmount
    } else {
      cgstAmount = gstAmount / 2
      sgstAmount = gstAmount / 2
    }

    const selectedUnit = stockInItem.unit || selMed?.purchase_unit || selMed?.inner_unit || selMed?.base_unit || selMed?.unit_label || 'Piece'
    const selectedFreeUnit = stockInItem.freeUnit || selectedUnit

    const newItem = {
      medicineId: stockInItem.medicineId,
      batchNo: stockInItem.batchNo.trim() || 'N/A',
      expiryDate: isoExpiryDate,
      qty: qty,
      qtyPurchased: qty,
      unit: selectedUnit,
      freeQty,
      freeUnit: selectedFreeUnit,
      mrp,
      unitMrp: mrp,
      discountPercent,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      gstPercent,
      purchasePrice: pPrice,
      purchasePricePerUnit: pPrice,
      unitPurchasePrice: pPrice,
      sellingPrice: sPrice,
      sellingPricePerUnit: sPrice,
      unitSellingPrice: sPrice
    }

    let updatedItems = [...purchaseForm.items]
    if (editingIndex !== null) {
      updatedItems[editingIndex] = newItem
      setRecentlyAddedIndex(editingIndex)
      showToast('Item batch updated', 'success')
    } else {
      updatedItems.push(newItem)
      setRecentlyAddedIndex(updatedItems.length - 1)
      showToast('Item batch added to invoice', 'success')
    }

    setPurchaseForm({
      ...purchaseForm,
      items: updatedItems
    })

    // Save GST% as default for next items
    setLastUsedGstPercent(stockInItem.gstPercent)

    // Reset stock item inputs & keep focus on Medicine
    setStockInItem({
      medicineId: '',
      batchNo: '',
      expiryDate: '',
      qtyPurchased: '',
      unit: '',
      freeQty: '',
      freeUnit: '',
      mrp: '',
      discountPercent: '',
      gstPercent: stockInItem.gstPercent,
      purchasePricePerUnit: '',
      amount: '',
      sellingPricePerUnit: ''
    })

    setEditingIndex(null)

    // Highlight row briefly
    setTimeout(() => {
      setRecentlyAddedIndex(null)
    }, 2000)

    // Auto focus medicine input
    setTimeout(() => {
      medicineInputRef.current?.focus()
    }, 50)

    // Auto-collapse header if header is complete and user started adding items
    if (purchaseForm.vendorId && purchaseForm.purchaseInvoiceNo.trim()) {
      setIsHeaderCollapsed(true)
    }
  }

  const editStockInItem = (index: number) => {
    const item: any = purchaseForm.items[index]
    if (!item) return

    const lineAmount = (item.qtyPurchased * item.purchasePricePerUnit).toFixed(2)

    setStockInItem({
      medicineId: item.medicineId,
      batchNo: item.batchNo === 'N/A' ? '' : item.batchNo,
      expiryDate: item.expiryDate ? item.expiryDate.slice(0, 7) : '',
      qtyPurchased: (item.qtyPurchased || item.qty || '').toString(),
      unit: item.unit || '',
      freeQty: item.freeQty ? item.freeQty.toString() : '',
      freeUnit: item.freeUnit || '',
      mrp: (item.unitMrp ?? item.mrp ?? 0).toString(),
      discountPercent: item.discountPercent ? item.discountPercent.toString() : '',
      gstPercent: item.gstPercent ? item.gstPercent.toString() : '12',
      purchasePricePerUnit: (item.unitPurchasePrice ?? item.purchasePricePerUnit).toString(),
      amount: lineAmount,
      sellingPricePerUnit: (item.unitSellingPrice ?? item.sellingPricePerUnit).toString()
    })
    setEditingIndex(index)
    medicineInputRef.current?.focus()
  }

  const cancelEditStockInItem = () => {
    setEditingIndex(null)
    setStockInItem({
      medicineId: '',
      batchNo: '',
      expiryDate: '',
      qtyPurchased: '',
      unit: '',
      freeQty: '',
      freeUnit: '',
      mrp: '',
      discountPercent: '',
      gstPercent: lastUsedGstPercent,
      purchasePricePerUnit: '',
      amount: '',
      sellingPricePerUnit: ''
    })
    medicineInputRef.current?.focus()
  }

  const removeStockInItem = (idx: number) => {
    const items = [...purchaseForm.items]
    items.splice(idx, 1)
    setPurchaseForm({ ...purchaseForm, items })
    if (editingIndex === idx) {
      cancelEditStockInItem()
    }
    showToast('Item removed from invoice', 'info')
  }

  const handlePurchaseSubmit = async () => {
    if (!purchaseForm.vendorId) return showToast('Please select a vendor', 'error')
    if (!purchaseForm.purchaseInvoiceNo.trim()) return showToast('Please enter purchase invoice number', 'error')
    if (purchaseForm.items.length === 0) return showToast('Add at least one item batch to the invoice', 'error')

    const taxableAmount = purchaseForm.items.reduce((sum, item) => sum + (item.taxableAmount || 0), 0)
    const cgstAmount = purchaseForm.items.reduce((sum, item) => sum + (item.cgstAmount || 0), 0)
    const sgstAmount = purchaseForm.items.reduce((sum, item) => sum + (item.sgstAmount || 0), 0)
    const igstAmount = purchaseForm.items.reduce((sum, item) => sum + (item.igstAmount || 0), 0)
    const gstAmount = cgstAmount + sgstAmount + igstAmount
    const totalAmount = (taxableAmount + gstAmount) > 0
      ? (taxableAmount + gstAmount)
      : purchaseForm.items.reduce((sum, item) => sum + (item.qtyPurchased * item.purchasePricePerUnit), 0)

    const isCash = purchaseForm.purchaseType === 'CASH'
    const paidAmount = isCash ? totalAmount : (parseFloat(purchaseForm.paidAmount) || 0)
    const pendingAmount = Math.max(0, totalAmount - paidAmount)

    let status = 'PAID'
    if (!isCash) {
      if (paidAmount >= totalAmount) status = 'PAID'
      else if (paidAmount > 0) status = 'PARTIAL'
      else status = 'PENDING'
    }

    try {
      await createPurchase({
        data: {
          vendorId: purchaseForm.vendorId,
          purchaseInvoiceNo: purchaseForm.purchaseInvoiceNo,
          purchaseDate: purchaseForm.purchaseDate,
          purchaseType: purchaseForm.purchaseType,
          dueDate: purchaseForm.dueDate || null,
          paymentDate: purchaseForm.paymentDate || null,
          paymentStatus: status,
          paymentMode: purchaseForm.paymentMode,
          taxableAmount,
          cgstAmount,
          sgstAmount,
          igstAmount,
          gstAmount,
          gstPercent: purchaseForm.items.length > 0 ? (purchaseForm.items[0].gstPercent ?? 12) : 12,
          totalAmount,
          paidAmount,
          pendingAmount,
          notes: purchaseForm.notes,
          items: purchaseForm.items
        },
        userId: currentUser?.id || ''
      })

      showToast('Stock purchase logged successfully!', 'success')
      setPurchaseForm({
        vendorId: '',
        purchaseInvoiceNo: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseType: 'CASH',
        taxType: 'INTRASTATE',
        dueDate: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paidAmount: '',
        paymentStatus: 'PAID',
        paymentMode: 'CASH',
        notes: '',
        items: []
      })
      setIsHeaderCollapsed(false)
      setEditingIndex(null)
      setLocalTab('batches')
    } catch (e: any) {
      showToast(e.message || 'Error logging purchase', 'error')
    }
  }

  // Filter lists based on search
  const filteredBatches = safeBatches.filter(b =>
    (b.medicine?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.batch_no || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredMedicines = safeMedicines.filter(m =>
    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.generic_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.manufacturer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.pack || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.rack_no || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredVendors = safeVendors.filter(v =>
    (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.phone || '').includes(searchQuery) ||
    (v.gstin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.drug_license_no || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getDaysToExpiry = (expiryStr: string) => {
    const diff = new Date(expiryStr).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const formatExpiryToISO = (expiryInput: string): string => {
    if (!expiryInput || !expiryInput.trim()) return ''
    const str = expiryInput.trim()

    // Format: YYYY-MM (e.g. from <input type="month"> like "2028-08")
    if (/^\d{4}-\d{2}$/.test(str)) {
      const [y, m] = str.split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      const mm = String(m).padStart(2, '0')
      const dd = String(lastDay).padStart(2, '0')
      return `${y}-${mm}-${dd}`
    }

    // Format: YYYY-MM-DD (already full date)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str
    }

    // Format: MM/YY or MM/YYYY or MM-YY or MM-YYYY
    if (/^\d{1,2}[\/\-]\d{2,4}$/.test(str)) {
      const parts = str.split(/[\/\-]/)
      const m = parseInt(parts[0], 10)
      let yStr = parts[1]
      if (yStr.length === 2) yStr = '20' + yStr
      const y = parseInt(yStr, 10)
      if (m >= 1 && m <= 12 && y > 2000 && y < 2100) {
        const lastDay = new Date(y, m, 0).getDate()
        const mm = String(m).padStart(2, '0')
        const dd = String(lastDay).padStart(2, '0')
        return `${y}-${mm}-${dd}`
      }
    }

    // Format: 4 digits MMYY (e.g. 0828)
    if (/^\d{4}$/.test(str)) {
      const m = parseInt(str.substring(0, 2), 10)
      const y = parseInt('20' + str.substring(2, 4), 10)
      if (m >= 1 && m <= 12 && y > 2000 && y < 2100) {
        const lastDay = new Date(y, m, 0).getDate()
        const mm = String(m).padStart(2, '0')
        const dd = String(lastDay).padStart(2, '0')
        return `${y}-${mm}-${dd}`
      }
    }

    const parsed = new Date(str)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }

    return str
  }

  const formatExpiryDisplay = (dateStr: string): string => {
    if (!dateStr) return '---'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${month}/${year}`
  }

  const selectedVendorObject = safeVendors.find(v => v.id === purchaseForm.vendorId)
  const isHeaderValid = Boolean(purchaseForm.vendorId && purchaseForm.purchaseInvoiceNo.trim() && purchaseForm.purchaseDate)

  return (
    <div className="space-y-6 animate-fade-in pb-12">


      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'stock-in', label: 'Stock Purchase In', badge: purchaseForm.items.length ? `${purchaseForm.items.length} items` : null },
          { id: 'batches', label: 'Current Stock' },
          { id: 'medicines', label: 'Medicines List' },
          { id: 'purchases', label: 'Purchase History' },
          { id: 'vendors', label: 'Vendors List' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setLocalTab(tab.id)
              setSearchQuery('')
            }}
            className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${localTab === tab.id
              ? 'border-cyan-500 text-cyan-600 bg-cyan-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-600 text-white rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>



      {/* --- CURRENT STOCK BATCHES TAB --- */}
      {/* --- CURRENT STOCK BATCHES TAB (MARG ERP ENTERPRISE STANDARD) --- */}
      {localTab === 'batches' && (
        <DataTable
          columns={[
            {
              key: 'medicine',
              header: 'Medicine Particulars',
              sortable: true,
              sortValue: (b: any) => b.medicine?.name || '',
              render: (b: any) => (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-xs">{b.medicine?.name || 'N/A'}</span>
                  {b.medicine?.strength && (
                    <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      {b.medicine.strength} &middot; <span className="font-mono text-cyan-800 uppercase">{b.medicine.type}</span>
                    </span>
                  )}
                </div>
              )
            },
            {
              key: 'rack_no',
              header: 'Rack / Shelf No',
              sortable: true,
              sortValue: (b: any) => b.medicine?.rack_no || b.medicine?.rackNo || '',
              render: (b: any) => {
                const rNo = b.medicine?.rack_no || b.medicine?.rackNo
                return rNo ? (
                  <span className="font-mono text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80 px-1.5 py-0.5 rounded">
                    {rNo}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-mono">N/A</span>
                )
              }
            },
            { key: 'batch_no', header: 'Batch No.', sortable: true, render: (b: any) => <span className="font-mono text-xs font-bold text-slate-800">{b.batch_no}</span> },
            { key: 'expiry_date', header: 'Expiry Date', sortable: true, render: (b: any) => <span className="font-mono text-xs text-slate-700">{formatExpiryDisplay(b.expiry_date)}</span> },
            {
              key: 'qty_available',
              header: 'Available Stock (Marg Units)',
              sortable: true,
              sortValue: (b: any) => b.qty_available,
              render: (b: any) => {
                const breakdownInfo = b.medicine ? formatStockBreakdown(b.medicine, b.qty_available) : null
                return (
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 font-sans text-xs">
                      {breakdownInfo ? breakdownInfo.breakdown : `${b.qty_available} ${b.medicine?.unit_label || 'Pcs'}`}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Total: {b.qty_available} {b.medicine?.base_unit || b.medicine?.unit_label || 'Piece'}s
                    </span>
                  </div>
                )
              }
            },
            {
              key: 'mrp',
              header: 'MRP',
              sortable: true,
              align: 'right',
              render: (b: any) => <span className="font-mono text-xs font-semibold text-slate-800">₹{Number(b.mrp || 0).toFixed(2)}</span>
            },
            {
              key: 'purchase_price_per_unit',
              header: 'Pur. Rate',
              sortable: true,
              align: 'right',
              render: (b: any) => <span className="font-mono text-xs text-slate-600">₹{Number(b.purchase_price_per_unit || 0).toFixed(2)}</span>
            },
            {
              key: 'selling_price_per_unit',
              header: 'Sell Price',
              sortable: true,
              align: 'right',
              render: (b: any) => <span className="font-mono text-xs font-bold text-cyan-900">₹{Number(b.selling_price_per_unit || 0).toFixed(2)}</span>
            },
            {
              key: 'stock_value',
              header: 'Stock Value (₹)',
              sortable: true,
              align: 'right',
              sortValue: (b: any) => (b.qty_available || 0) * (b.purchase_price_per_unit || 0),
              render: (b: any) => {
                const val = (b.qty_available || 0) * (b.purchase_price_per_unit || 0)
                return <span className="font-mono text-xs font-black text-slate-900">₹{val.toFixed(2)}</span>
              }
            },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              align: 'center',
              render: (b: any) => {
                const daysToExpiry = getDaysToExpiry(b.expiry_date)
                const isExpired = daysToExpiry <= 0
                const isNearExpiry = daysToExpiry > 0 && daysToExpiry <= 30
                return isExpired ? (
                  <span className="inline-flex px-2 py-0.5 text-[11px] rounded-full font-bold bg-red-100 text-red-700 border border-red-200">Expired</span>
                ) : isNearExpiry ? (
                  <span className="inline-flex px-2 py-0.5 text-[11px] rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">Expiring in {daysToExpiry}d</span>
                ) : (
                  <span className="inline-flex px-2 py-0.5 text-[11px] rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>
                )
              }
            },
            {
              key: 'actions',
              header: 'Actions',
              align: 'center',
              render: (b: any) => currentUser?.role === 'ADMIN' ? (
                <button
                  onClick={() => {
                    setSelectedBatch(b)
                    setAdjustQty('')
                    setAdjustReason('Count correction')
                    setShowAdjustModal(true)
                  }}
                  className="text-xs text-cyan-600 hover:text-cyan-800 font-bold underline cursor-pointer"
                >
                  Adjust Stock
                </button>
              ) : null
            }
          ]}
          data={searchableBatches}
          loading={loading}
          rowKey={(b) => b.id}
          searchPlaceholder="Search by medicine, batch no, or rack..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchFilterKeys={['medicine_name', 'batch_no']}
          emptyMessage="No stock batches found"
          emptySubtext="Perform a Stock Purchase In to add medicine batches."
        />
      )}

      {/* --- MEDICINES LIST TAB (MARG ERP ENTERPRISE STANDARD) --- */}
      {localTab === 'medicines' && (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Medicine Name Particulars',
              sortable: true,
              render: (m: any) => (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-xs">{m.name}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {m.strength && (
                      <span className="font-semibold text-cyan-900 bg-cyan-50 border border-cyan-200/80 px-1.5 py-0.2 rounded text-[10px]">
                        {m.strength}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-slate-500 font-bold uppercase">{m.type}</span>
                  </div>
                </div>
              )
            },
            { key: 'generic_name', header: 'Generic Formula', sortable: true, render: (m: any) => <span className="text-xs text-slate-600 font-medium">{m.generic_name || 'N/A'}</span> },
            { key: 'manufacturer', header: 'Manufacturer / Brand', sortable: true, render: (m: any) => <span className="text-xs text-slate-700">{m.manufacturer || 'N/A'}</span> },
            { key: 'pack', header: 'Pack Size', sortable: true, render: (m: any) => <span className="font-mono text-xs font-semibold text-slate-800">{m.pack || 'N/A'}</span> },
            {
              key: 'packaging_setup',
              header: 'Packaging Ratio (Box=Strip=Units)',
              sortable: false,
              render: (m: any) => (
                <span className="font-mono text-[11px] font-bold text-cyan-900 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200/90 whitespace-nowrap">
                  {getLiveConversionSummary(m)}
                </span>
              )
            },
            {
              key: 'total_stock',
              header: 'Current Stock',
              sortable: true,
              sortValue: (m: any) => m.batches?.reduce((sum: number, b: any) => sum + (b.qty_available || 0), 0) || 0,
              render: (m: any) => {
                const totalBase = m.batches?.reduce((sum: number, b: any) => sum + (b.qty_available || 0), 0) || 0
                const breakdown = formatStockBreakdown(m, totalBase)
                const isLowStock = m.reorder_level && totalBase <= m.reorder_level

                return (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-xs ${totalBase === 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {breakdown.breakdown}
                      </span>
                      {isLowStock && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded border border-rose-200">
                          {totalBase === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      Total: {totalBase} {m.base_unit || m.unit_label || 'Piece'}s
                    </span>
                  </div>
                )
              }
            },
            { key: 'hsn_code', header: 'HSN Code', sortable: true, render: (m: any) => <span className="font-mono text-xs">{m.hsn_code || 'N/A'}</span> },
            {
              key: 'rack_no',
              header: 'Rack No',
              sortable: true,
              render: (m: any) => (
                m.rack_no
                  ? <span className="font-mono text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">{m.rack_no}</span>
                  : <span className="text-xs text-slate-400 font-mono">N/A</span>
              )
            },
            { key: 'reorder_level', header: 'Reorder Level', sortable: true, align: 'right', render: (m: any) => <span className="font-mono font-bold text-slate-800">{m.reorder_level}</span> },
            { key: 'default_gst_percent', header: 'GST %', sortable: true, align: 'right', render: (m: any) => <span className="font-mono font-bold">{m.default_gst_percent}%</span> },
            {
              key: 'actions',
              header: 'Actions',
              align: 'center',
              render: (m: any) => (
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => startEditMed(m)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer inline-flex items-center"
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </button>
                  {currentUser?.role === 'ADMIN' && (
                    <button
                      onClick={() => handleDeleteMed(m.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-bold cursor-pointer inline-flex items-center"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </button>
                  )}
                </div>
              )
            }
          ]}
          data={safeMedicines}
          loading={loading}
          rowKey={(m) => m.id}
          searchPlaceholder="Search medicines by name, generic, pack..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          emptyMessage="No medicines registered"
          emptySubtext="Add your first medicine to manage pharmacy inventory."
          emptyActionLabel="Add Medicine"
          onEmptyAction={() => {
            setEditingMed(null)
            setShowMedModal(true)
          }}
          toolbarActions={
            <button
              onClick={() => {
                setEditingMed(null)
                setShowMedModal(true)
              }}
              className="flex items-center justify-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Medicine
            </button>
          }
        />
      )}

      {/* --- STOCK PURCHASE IN TAB (GUIDED 4-STEP WORKFLOW) --- */}
      {localTab === 'stock-in' && (
        <StockPurchaseInContainer
          medicines={safeMedicines}
          vendors={safeVendors}
          batches={safeBatches}
          purchases={safePurchases}
          currentUser={currentUser}
          onSavePurchase={async (payload) => {
            await createPurchase({
              data: payload,
              userId: currentUser?.id || ''
            })
          }}
          onOpenQuickAddVendor={() => {
            setEditingVendor(null)
            setShowVendorModal(true)
          }}
          onOpenQuickCreateMedicine={() => {
            setEditingMed(null)
            setShowMedModal(true)
          }}
          onOpenScanInvoice={() => setShowScanInvoiceModal(true)}
          loadAllData={loadAllData}
        />
      )}

      {/* --- PURCHASE HISTORY TAB --- */}
      {localTab === 'purchases' && (
        <DataTable
          columns={[
            { key: 'purchase_date', header: 'Date', sortable: true, render: (p: any) => <span className="font-mono text-xs text-slate-600">{new Date(p.purchase_date).toLocaleDateString('en-GB')}</span> },
            {
              key: 'vendor',
              header: 'Vendor & Invoice',
              sortable: true,
              sortValue: (p: any) => p.vendor?.name || '',
              render: (p: any) => (
                <div>
                  <p className="font-bold text-slate-900">{p.vendor?.name}</p>
                  <p className="text-xs font-mono text-slate-400">Inv #{p.purchase_invoice_no}</p>
                </div>
              )
            },
            {
              key: 'purchase_type',
              header: 'Type',
              sortable: true,
              render: (p: any) => (
                <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${p.purchase_type === 'CREDIT' ? 'bg-amber-100 text-amber-800' : 'bg-cyan-100 text-cyan-800'
                  }`}>
                  {p.purchase_type || 'CASH'}
                </span>
              )
            },
            { key: 'total_amount', header: 'Total Amount', sortable: true, align: 'right', render: (p: any) => <span className="font-mono font-bold text-slate-900">₹{p.total_amount.toFixed(2)}</span> },
            {
              key: 'paid_amount',
              header: 'Paid Amount',
              sortable: true,
              align: 'right',
              render: (p: any) => {
                const paid = p.paid_amount !== undefined ? p.paid_amount : (p.purchase_type === 'CREDIT' ? 0 : p.total_amount)
                return <span className="font-mono font-semibold text-cyan-700">₹{paid.toFixed(2)}</span>
              }
            },
            {
              key: 'pending_amount',
              header: 'Pending Dues',
              sortable: true,
              align: 'right',
              render: (p: any) => {
                const pending = p.pending_amount !== undefined ? p.pending_amount : (p.purchase_type === 'CREDIT' ? p.total_amount : 0)
                return <span className={`font-mono font-semibold ${pending > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>₹{pending.toFixed(2)}</span>
              }
            },
            { key: 'due_date', header: 'Due Date', sortable: true, render: (p: any) => <span className="font-mono text-xs">{p.due_date ? new Date(p.due_date).toLocaleDateString('en-GB') : '-'}</span> },
            {
              key: 'payment_status',
              header: 'Status',
              sortable: true,
              align: 'center',
              render: (p: any) => (
                <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${p.payment_status === 'PENDING' ? 'bg-red-100 text-red-800' :
                  p.payment_status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-cyan-100 text-cyan-800'
                  }`}>
                  {p.payment_status || 'PAID'}
                </span>
              )
            },
            { key: 'payment_mode', header: 'Mode', sortable: true, render: (p: any) => <span className="font-mono text-xs uppercase">{p.payment_mode || 'CASH'}</span> },
            {
              key: 'items_summary',
              header: 'Batch Items',
              render: (p: any) => {
                const batchCount = p.batches?.length || 0
                if (!batchCount) return <span className="text-xs text-slate-400">N/A</span>
                const firstItem = p.batches[0]?.medicine?.name || 'Item'
                return (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="truncate max-w-[140px]">{firstItem}</span>
                    {batchCount > 1 && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-bold text-[10px]">
                        +{batchCount - 1} more
                      </span>
                    )}
                  </span>
                )
              }
            },
            { key: 'notes', header: 'Notes', render: (p: any) => <span className="text-xs text-slate-400 truncate max-w-xs block">{p.notes || 'N/A'}</span> },
            { key: 'created_at', header: 'Created At', optional: true, sortable: true, sortValue: (p: any) => p.created_at ? new Date(p.created_at).getTime() : 0, render: (p: any) => <span className="font-mono text-xs text-slate-600">{formatDateTime(p.created_at)}</span> },
            { key: 'updated_at', header: 'Updated At', optional: true, sortable: true, sortValue: (p: any) => p.updated_at ? new Date(p.updated_at).getTime() : 0, render: (p: any) => <span className="font-mono text-xs text-slate-600">{formatDateTime(p.updated_at)}</span> }
          ]}
          data={searchablePurchases}
          loading={loading}
          rowKey={(p) => p.id}
          onRowClick={(p) => setSelectedPurchase(p)}
          searchPlaceholder="Search purchase history by invoice, vendor, notes..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchFilterKeys={['purchase_invoice_no', 'vendor_name', 'notes', 'batch_items_search']}
          emptyMessage="No purchases recorded"
          emptySubtext="Log your first stock purchase in the Stock Purchase In tab."
        />
      )}

      {/* --- VENDORS LIST TAB --- */}
      {localTab === 'vendors' && (
        <DataTable
          columns={[
            { key: 'name', header: 'Vendor Name', sortable: true, render: (v: any) => <span className="font-bold text-slate-900">{v.name}</span> },
            { key: 'phone', header: 'Phone Number', sortable: true, render: (v: any) => <span className="font-mono text-xs">{v.phone}</span> },
            { key: 'address', header: 'Address', sortable: true, render: (v: any) => <span className="text-xs text-slate-600">{v.address}</span> },
            { key: 'gstin', header: 'GSTIN', sortable: true, render: (v: any) => <span className="font-mono text-xs uppercase">{v.gstin || 'N/A'}</span> },
            { key: 'drug_license_no', header: 'Drug License No', sortable: true, render: (v: any) => <span className="font-mono text-xs uppercase">{v.drug_license_no || 'N/A'}</span> },
            { key: 'notes', header: 'Notes', render: (v: any) => <span className="text-xs text-slate-400 truncate max-w-xs block">{v.notes || 'N/A'}</span> },
            { key: 'created_at', header: 'Created At', optional: true, sortable: true, sortValue: (v: any) => v.created_at ? new Date(v.created_at).getTime() : 0, render: (v: any) => <span className="font-mono text-xs text-slate-600">{formatDateTime(v.created_at)}</span> },
            { key: 'updated_at', header: 'Updated At', optional: true, sortable: true, sortValue: (v: any) => v.updated_at ? new Date(v.updated_at).getTime() : 0, render: (v: any) => <span className="font-mono text-xs text-slate-600">{formatDateTime(v.updated_at)}</span> },
            {
              key: 'actions',
              header: 'Actions',
              align: 'center',
              render: (v: any) => (
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => startEditVendor(v)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer inline-flex items-center"
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </button>
                  {currentUser?.role === 'ADMIN' && (
                    <button
                      onClick={() => handleDeleteVendor(v.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-bold cursor-pointer inline-flex items-center"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </button>
                  )}
                </div>
              )
            }
          ]}
          data={safeVendors}
          loading={loading}
          rowKey={(v) => v.id}
          searchPlaceholder="Search vendors by name, phone, gstin..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          emptyMessage="No vendors registered"
          emptySubtext="Add your first supplier vendor to begin logging purchases."
          emptyActionLabel="Add Vendor"
          onEmptyAction={() => {
            setEditingVendor(null)
            setShowVendorModal(true)
          }}
          toolbarActions={
            <button
              onClick={() => {
                setEditingVendor(null)
                setShowVendorModal(true)
              }}
              className="flex items-center justify-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Vendor
            </button>
          }
        />
      )}

      {/* --- REDESIGNED MEDICINE ADD/EDIT MODAL --- */}
      <RedesignedMedicineModal
        isOpen={showMedModal}
        onClose={() => {
          setShowMedModal(false)
          setEditingMed(null)
        }}
        onSubmit={handleMedModalSave}
        editingMed={editingMed}
        existingMedicines={safeMedicines}
      />

      {/* --- REDESIGNED VENDOR ADD/EDIT MODAL --- */}
      <RedesignedVendorModal
        isOpen={showVendorModal}
        onClose={() => {
          setShowVendorModal(false)
          setEditingVendor(null)
        }}
        onSubmit={handleVendorModalSave}
        editingVendor={editingVendor}
        existingVendors={safeVendors}
      />

      {/* --- STOCK ADJUSTMENT MODAL --- */}
      {showAdjustModal && selectedBatch && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Adjust Inventory Stock</h3>
            <p className="text-xs text-slate-500 mb-4">
              Medicine: <span className="font-semibold text-slate-800">{selectedBatch.medicine?.name}</span> (Batch: <span className="font-mono">{selectedBatch.batch_no}</span>)
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Stock Qty</label>
                <input
                  type="text"
                  disabled
                  value={selectedBatch.qty_available}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm bg-slate-50 text-slate-400 font-semibold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Adjustment Qty *</label>
                <input
                  type="number"
                  placeholder="e.g. -5 to decrease, 10 to increase"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason for Adjustment *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="Count correction">Count correction</option>
                  <option value="Damage">Damage</option>
                  <option value="Expiry write-off">Expiry write-off</option>
                  <option value="Theft or Loss">Theft or Loss</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustModal(false)
                    setSelectedBatch(null)
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-650 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-600 shadow-md shadow-cyan-500/10 cursor-pointer"
                >
                  Apply Stock Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PURCHASE INVOICE DETAILS MODAL (ENTERPRISE MARG ERP STANDARD) --- */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 bg-slate-900 text-white shadow-md">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-cyan-400" /> Purchase Invoice Details
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 font-mono">
                  Invoice #{selectedPurchase.purchase_invoice_no} &middot; Date: {selectedPurchase.purchase_date ? new Date(selectedPurchase.purchase_date).toLocaleDateString('en-GB') : '-'}
                </p>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vendor & Payment Summary Card */}
            <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/70 text-slate-800">
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-cyan-600" /> Distributor / Vendor
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedPurchase.vendor?.name || 'N/A'}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {selectedPurchase.vendor?.gstin && (
                    <span className="text-[10px] font-mono font-semibold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200/80">
                      GSTIN: {selectedPurchase.vendor.gstin}
                    </span>
                  )}
                  {selectedPurchase.vendor?.drug_license_no && (
                    <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      DL No: {selectedPurchase.vendor.drug_license_no}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-cyan-600" /> Invoice Type / Status
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${selectedPurchase.purchase_type === 'CREDIT' ? 'bg-amber-100 text-amber-800' : 'bg-cyan-100 text-cyan-800'}`}>
                    {selectedPurchase.purchase_type || 'CASH'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${selectedPurchase.payment_status === 'PENDING' ? 'bg-red-100 text-red-800' : selectedPurchase.payment_status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {selectedPurchase.payment_status || 'PAID'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-600" /> Due Date
                </p>
                <p className="text-xs font-bold text-slate-700 mt-1 font-mono">
                  {selectedPurchase.due_date ? new Date(selectedPurchase.due_date).toLocaleDateString('en-GB') : 'N/A (Immediate)'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Gross Total Amount</p>
                <p className="text-sm font-black text-slate-900 mt-0.5 font-mono">₹{Number(selectedPurchase.total_amount || 0).toFixed(2)}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Amount Paid</p>
                <p className="text-sm font-black text-emerald-600 mt-0.5 font-mono">
                  ₹{Number(selectedPurchase.paid_amount !== undefined ? selectedPurchase.paid_amount : (selectedPurchase.purchase_type === 'CREDIT' ? 0 : selectedPurchase.total_amount)).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Pending Balance</p>
                <p className={`text-sm font-black mt-0.5 font-mono ${(selectedPurchase.pending_amount ?? 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  ₹{Number(selectedPurchase.pending_amount !== undefined ? selectedPurchase.pending_amount : (selectedPurchase.purchase_type === 'CREDIT' ? selectedPurchase.total_amount : 0)).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Payment Mode</p>
                <p className="text-xs font-bold text-slate-700 mt-1 uppercase">{selectedPurchase.payment_mode || 'CASH'}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-auto px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-600" /> Invoice Line Items ({selectedPurchase.batches?.length || 0})
                </p>
                <span className="text-[11px] text-slate-500 font-medium">Quantities displayed in Marg dual units</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                    <tr className="bg-slate-900 text-cyan-400 font-black uppercase text-[10px] tracking-wider">
                      <th className="px-3 py-2.5">Medicine Particulars</th>
                      <th className="px-2.5 py-2.5">HSN</th>
                      <th className="px-2.5 py-2.5">Batch No</th>
                      <th className="px-2.5 py-2.5">Expiry</th>
                      <th className="px-3 py-2.5 text-right">Purchase Qty (Pack + Base)</th>
                      <th className="px-2.5 py-2.5 text-right">Free Qty</th>
                      <th className="px-2.5 py-2.5 text-right">MRP</th>
                      <th className="px-2.5 py-2.5 text-right">Pur. Rate</th>
                      <th className="px-2.5 py-2.5 text-right">Sell Rate</th>
                      <th className="px-2 py-2.5 text-right">GST%</th>
                      <th className="px-3 py-2.5 text-right">Taxable Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
                    {(selectedPurchase.batches || []).map((b: any) => {
                      const qtyBreakdown = b.medicine ? formatStockBreakdown(b.medicine, b.qty_purchased) : null
                      const freeBreakdown = b.medicine && (b.qty_free || 0) > 0 ? formatStockBreakdown(b.medicine, b.qty_free) : null
                      const hsn = b.medicine?.hsn_code || b.medicine?.hsnCode || '300490'

                      return (
                        <tr key={b.id} className="hover:bg-cyan-50/30 transition-colors">
                          <td className="px-3 py-2.5 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                              <span>{b.medicine?.name || 'N/A'}</span>
                            </div>
                            {b.medicine?.strength && (
                              <span className="text-[10px] text-slate-500 font-normal ml-5">
                                {b.medicine.strength} &middot; {b.medicine.type}
                              </span>
                            )}
                          </td>
                          <td className="px-2.5 py-2.5 font-mono text-[11px] text-slate-600">{hsn}</td>
                          <td className="px-2.5 py-2.5 font-mono text-xs font-bold text-slate-800">{b.batch_no || '-'}</td>
                          <td className="px-2.5 py-2.5 font-mono text-xs text-slate-600">
                            {b.expiry_date ? new Date(b.expiry_date).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' }) : '-'}
                          </td>

                          {/* Purchase Qty with Marg Dual Unit Breakdown */}
                          <td className="px-3 py-2.5 text-right">
                            {qtyBreakdown ? (
                              <div className="flex flex-col items-end">
                                <span className="font-bold text-slate-900 text-xs font-mono">
                                  {qtyBreakdown.breakdown}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  Total: {b.qty_purchased} {qtyBreakdown.baseUnit}s
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono font-bold">{b.qty_purchased}</span>
                            )}
                          </td>

                          {/* Free Qty with Breakdown */}
                          <td className="px-2.5 py-2.5 text-right font-mono">
                            {freeBreakdown ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 text-[11px]">
                                +{freeBreakdown.breakdown}
                              </span>
                            ) : (b.qty_free || 0) > 0 ? (
                              <span className="text-emerald-700 font-bold">+{b.qty_free}</span>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>

                          <td className="px-2.5 py-2.5 text-right font-mono text-xs font-semibold">
                            ₹{Number(b.mrp || 0).toFixed(2)}
                          </td>
                          <td className="px-2.5 py-2.5 text-right font-mono text-xs text-slate-700">
                            ₹{Number(b.purchase_price_per_unit || 0).toFixed(2)}
                          </td>
                          <td className="px-2.5 py-2.5 text-right font-mono text-xs text-slate-700">
                            ₹{Number(b.selling_price_per_unit || 0).toFixed(2)}
                          </td>
                          <td className="px-2 py-2.5 text-right font-mono font-bold text-cyan-800">
                            {b.gst_percent ?? 0}%
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-black text-slate-900">
                            ₹{Number(b.taxable_amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                    {(!selectedPurchase.batches || selectedPurchase.batches.length === 0) && (
                      <tr>
                        <td colSpan={11} className="px-3 py-6 text-center text-slate-400 text-xs">
                          No batch items recorded for this purchase.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MARG ENTERPRISE GST TAX BREAKDOWN CARD */}
              {selectedPurchase.batches && selectedPurchase.batches.length > 0 && (() => {
                const totalTaxable = selectedPurchase.batches.reduce((sum: number, b: any) => sum + (Number(b.taxable_amount) || 0), 0)
                const totalCgst = selectedPurchase.batches.reduce((sum: number, b: any) => sum + (Number(b.cgst_amount) || (Number(b.taxable_amount || 0) * (Number(b.gst_percent || 0) / 200))), 0)
                const totalSgst = selectedPurchase.batches.reduce((sum: number, b: any) => sum + (Number(b.sgst_amount) || (Number(b.taxable_amount || 0) * (Number(b.gst_percent || 0) / 200))), 0)
                const totalGst = totalCgst + totalSgst

                return (
                  <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-sm border border-slate-800">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Total Taxable Value</p>
                      <p className="text-sm font-black text-white font-mono mt-0.5">₹{totalTaxable.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-cyan-400 uppercase">CGST + SGST Breakdown</p>
                      <p className="text-xs font-bold text-slate-300 font-mono mt-0.5">
                        CGST: ₹{totalCgst.toFixed(2)} | SGST: ₹{totalSgst.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-cyan-400 uppercase">Total GST Amount</p>
                      <p className="text-sm font-black text-cyan-400 font-mono mt-0.5">₹{totalGst.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Grand Invoice Total</p>
                      <p className="text-base font-black text-white font-mono mt-0.5">₹{Number(selectedPurchase.total_amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                )
              })()}

              {selectedPurchase.notes && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Invoice Notes / Remarks</p>
                  <p className="text-xs text-slate-700">{selectedPurchase.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 font-bold rounded-xl text-xs transition cursor-pointer shadow-sm border border-slate-700"
              >
                Close Invoice View
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanInvoiceModal && (
        <ScanPurchaseInvoice
          userId={currentUser?.id || ''}
          onClose={() => setShowScanInvoiceModal(false)}
          onCommitted={(purchase: Purchase) => {
            setShowScanInvoiceModal(false)
            loadAllData()
            showToast(`Purchase invoice #${purchase.purchase_invoice_no} saved from scan`, 'success')
          }}
        />
      )}
    </div>
  )
}
