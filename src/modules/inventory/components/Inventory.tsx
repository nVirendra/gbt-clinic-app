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
  ShieldCheck
} from 'lucide-react'
import { useInventoryStore } from '../store'
import { useAuthStore } from '../../auth/store'
import { Medicine, Vendor, InventoryBatch } from '../../../types'
import { DataTable, ColumnDef } from '../../../components/common/DataTable'

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
    success: 'bg-emerald-950 text-emerald-100 border-emerald-800/60',
    error: 'bg-red-950 text-red-100 border-red-800/60',
    info: 'bg-slate-900 text-white border-slate-700'
  }

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-teal-400 shrink-0" />
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
          className={`w-full pl-9 pr-8 py-2 text-sm rounded-lg border transition-all ${
            error
              ? 'border-red-300 bg-red-50/30 focus:ring-red-500'
              : value
              ? 'border-teal-500 bg-teal-50/20 font-semibold text-slate-900 focus:ring-teal-500'
              : 'border-slate-200 focus:ring-teal-500'
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
                className={`px-4 py-2.5 cursor-pointer flex justify-between items-center transition-colors ${
                  idx === highlightedIndex ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">{v.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono flex gap-2">
                    {v.phone && <span>Ph: {v.phone}</span>}
                    {v.gstin && <span>GSTIN: {v.gstin}</span>}
                  </div>
                </div>
                {v.id === value && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
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

  useEffect(() => {
    if (selectedMed && !isOpen) {
      setQuery(`${selectedMed.name} ${selectedMed.pack ? `[${selectedMed.pack}]` : ''}`)
    } else if (!value && !isOpen) {
      setQuery('')
    }
  }, [value, selectedMed, isOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        if (selectedMed) {
          setQuery(`${selectedMed.name} ${selectedMed.pack ? `[${selectedMed.pack}]` : ''}`)
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
      (m.generic_name || '').toLowerCase().includes(query.toLowerCase()) ||
      (m.manufacturer || '').toLowerCase().includes(query.toLowerCase()) ||
      (m.pack || '').toLowerCase().includes(query.toLowerCase()) ||
      (m.hsn_code || '').toLowerCase().includes(query.toLowerCase())
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
        setQuery(`${med.name} ${med.pack ? `[${med.pack}]` : ''}`)
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
          className={`w-full pl-9 pr-8 py-2 text-sm rounded-lg border transition-all ${
            error
              ? 'border-red-300 bg-red-50/30 focus:ring-red-500'
              : value
              ? 'border-teal-500 bg-teal-50/20 font-semibold text-slate-900 focus:ring-teal-500'
              : 'border-slate-200 focus:ring-teal-500'
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
                  setQuery(`${m.name} ${m.pack ? `[${m.pack}]` : ''}`)
                  setIsOpen(false)
                }}
                className={`px-4 py-2.5 cursor-pointer border-b border-slate-100 last:border-0 transition-colors ${
                  idx === highlightedIndex ? 'bg-teal-50 text-teal-950 font-medium' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-slate-900">{m.name}</span>
                    {m.pack && <span className="ml-2 text-xs font-mono text-slate-500">[{m.pack}]</span>}
                    <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase">{m.type}</span>
                  </div>
                  <span className="text-[11px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full shrink-0">
                    GST {m.default_gst_percent}%
                  </span>
                </div>
                <div className="flex gap-3 text-[11px] text-slate-500 mt-1 font-sans">
                  {m.generic_name && <span><strong className="text-slate-600">Gen:</strong> {m.generic_name}</span>}
                  {m.hsn_code && <span><strong className="text-slate-600">HSN:</strong> <code className="font-mono">{m.hsn_code}</code></span>}
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
          className={`w-full py-2 pl-3 pr-8 text-sm rounded-xl border transition-all ${
            error
              ? 'border-red-300 bg-red-50/30 focus:ring-red-500'
              : 'border-slate-200 focus:ring-teal-500'
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
              className={`px-3 py-2 cursor-pointer flex justify-between items-center transition-colors ${
                idx === highlightedIndex ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
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
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh'
}

// Redesigned Add / Edit Medicine Form Modal Component
function RedesignedMedicineModal({
  isOpen,
  onClose,
  onSubmit,
  editingMed,
  existingMedicines,
  initialFormValues
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: any) => Promise<void>
  editingMed: Medicine | null
  existingMedicines: Medicine[]
  initialFormValues?: Partial<{
    name: string
    genericName: string
    manufacturer: string
    pack: string
    type: string
    unitLabel: string
    hsnCode: string
    reorderLevel: string
    defaultGstPercent: string
  }>
}) {
  const [form, setForm] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    pack: '',
    type: 'TABLET',
    unitLabel: 'strip',
    hsnCode: '',
    reorderLevel: '10',
    defaultGstPercent: '12'
  })

  const [submitting, setSubmitting] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Initialize form when modal opens or editingMed/initialFormValues change
  useEffect(() => {
    if (isOpen) {
      if (editingMed) {
        setForm({
          name: editingMed.name || '',
          genericName: editingMed.generic_name || '',
          manufacturer: editingMed.manufacturer || '',
          pack: editingMed.pack || '',
          type: editingMed.type || 'TABLET',
          unitLabel: editingMed.unit_label || 'strip',
          hsnCode: editingMed.hsn_code || '',
          reorderLevel: (editingMed.reorder_level ?? 10).toString(),
          defaultGstPercent: (editingMed.default_gst_percent ?? 12).toString()
        })
      } else if (initialFormValues) {
        setForm({
          name: initialFormValues.name || '',
          genericName: initialFormValues.genericName || '',
          manufacturer: initialFormValues.manufacturer || '',
          pack: initialFormValues.pack || '',
          type: initialFormValues.type || 'TABLET',
          unitLabel: initialFormValues.unitLabel || 'strip',
          hsnCode: initialFormValues.hsnCode || '',
          reorderLevel: initialFormValues.reorderLevel || '10',
          defaultGstPercent: initialFormValues.defaultGstPercent || '12'
        })
      } else {
        setForm({
          name: '',
          genericName: '',
          manufacturer: '',
          pack: '',
          type: 'TABLET',
          unitLabel: 'strip',
          hsnCode: '',
          reorderLevel: '10',
          defaultGstPercent: '12'
        })
      }

      // Auto-focus Medicine Name input on open
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, editingMed, initialFormValues])

  if (!isOpen) return null

  // Collect unique Generic Names from existing medicines for Combobox
  const genericOptions = Array.from(
    new Set(existingMedicines.map((m) => m.generic_name).filter(Boolean) as string[])
  ).map((g) => ({ value: g }))

  // Collect unique Manufacturers from existing medicines for Combobox
  const manufacturerOptions = Array.from(
    new Set(existingMedicines.map((m) => m.manufacturer).filter(Boolean) as string[])
  ).map((m) => ({ value: m }))

  // Collect unique HSN codes + standard pharma HSNs with GST slab hints
  const standardPharmaHsns = [
    { value: '3004', label: 'Medicaments (Tablets/Capsules/Syrups)', meta: '12% GST' },
    { value: '300490', label: 'Other Medicaments', meta: '12% GST' },
    { value: '3005', label: 'Wadding, Gauze, Bandages', meta: '12% GST' },
    { value: '3006', label: 'Pharmaceutical Preparations', meta: '12% GST' },
    { value: '3002', label: 'Vaccines, Sera, Toxins', meta: '5% GST' },
    { value: '3003', label: 'Bulk Medicaments', meta: '12% GST' }
  ]
  const usedHsns = Array.from(
    new Set(existingMedicines.map((m) => m.hsn_code).filter(Boolean) as string[])
  ).map((hsn) => ({ value: hsn, label: 'Used in Inventory' }))
  
  const hsnOptions = [...standardPharmaHsns, ...usedHsns.filter(u => !standardPharmaHsns.some(s => s.value === u.value))]

  // HSN Auto-GST Mapper Callback
  const handleSelectHsn = (selectedHsn: string) => {
    let suggestedGst = ''
    if (selectedHsn.startsWith('3002') || selectedHsn.startsWith('3001')) {
      suggestedGst = '5'
    } else if (selectedHsn.startsWith('3004') || selectedHsn.startsWith('3005') || selectedHsn.startsWith('3006') || selectedHsn.startsWith('3003')) {
      suggestedGst = '12'
    }
    if (suggestedGst) {
      setForm((prev) => ({ ...prev, hsnCode: selectedHsn, defaultGstPercent: suggestedGst }))
    } else {
      setForm((prev) => ({ ...prev, hsnCode: selectedHsn }))
    }
  }

  // Contextually adapt Unit Label options based on selected Type
  const adaptiveUnitLabels: Record<string, string[]> = {
    TABLET: ['strip', 'pcs', 'box', 'tablet'],
    CAPSULE: ['strip', 'pcs', 'box', 'capsule'],
    INJECTION: ['vial', 'ampoule', 'pcs', 'box'],
    SYRUP: ['bottle', 'ml', 'pcs'],
    OINTMENT: ['tube', 'gm', 'pcs'],
    OTHER: ['pcs', 'bottle', 'box', 'pack']
  }
  const currentUnitOptions = adaptiveUnitLabels[form.type] || ['strip', 'vial', 'bottle', 'pcs']

  // Duplicate Name Warning (Non-blocking)
  const trimmedName = form.name.trim().toLowerCase()
  const duplicateMedMatch = trimmedName.length >= 3
    ? existingMedicines.find(
        (m) =>
          m.id !== editingMed?.id &&
          (m.name.toLowerCase() === trimmedName ||
           m.name.toLowerCase().includes(trimmedName) ||
           trimmedName.includes(m.name.toLowerCase()))
      )
    : null

  // Validations
  const isNameValid = Boolean(form.name.trim())
  const reorderNum = parseInt(form.reorderLevel)
  const isReorderValid = !isNaN(reorderNum) && reorderNum >= 0
  const gstNum = parseFloat(form.defaultGstPercent)
  const isGstValid = !isNaN(gstNum) && gstNum >= 0 && gstNum <= 100

  const isValid = isNameValid && isReorderValid && isGstValid

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!isValid || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  // Keyboard Navigation: Ctrl+Enter to save, Esc to cancel
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
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Pill className="w-5 h-5 text-teal-400" />
            <h3 className="text-md font-bold">
              {editingMed ? 'Edit Medicine Master' : 'Add New Medicine Master'}
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

        {/* MODAL FORM BODY (SCROLLABLE) */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-slate-800">
          
          {/* SECTION 1: MEDICINE IDENTITY */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <Tag className="w-4 h-4 text-teal-500" /> 1. Medicine Identification
            </div>

            <div className="space-y-3">
              {/* Medicine Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="e.g. Paracetamol 650mg"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full py-2 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 font-semibold ${
                    !isNameValid && form.name !== ''
                      ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                      : 'border-slate-200 focus:ring-teal-500'
                  }`}
                />
                {!isNameValid && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">Medicine name is required.</p>
                )}

                {/* NON-BLOCKING DUPLICATE WARNING */}
                {duplicateMedMatch && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-start gap-2 text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Notice: Similar medicine already registered!</span>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        <strong className="text-amber-950">{duplicateMedMatch.name}</strong> ({duplicateMedMatch.type}, Pack: {duplicateMedMatch.pack || 'N/A'})
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Generic Name & Manufacturer Comboboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Generic Name</label>
                  <FreeTextCombobox
                    value={form.genericName}
                    onChange={(val) => setForm({ ...form, genericName: val })}
                    options={genericOptions}
                    placeholder="e.g. Paracetamol"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Manufacturer</label>
                  <FreeTextCombobox
                    value={form.manufacturer}
                    onChange={(val) => setForm({ ...form, manufacturer: val })}
                    options={manufacturerOptions}
                    placeholder="e.g. Cipla / Sun Pharma"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PACKAGING & TYPE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <Package className="w-4 h-4 text-teal-500" /> 2. Classification & Packaging
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Type Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Dosage Form Type</label>
                <select
                  value={form.type}
                  onChange={(e) => {
                    const newType = e.target.value
                    const newAdaptiveUnits = adaptiveUnitLabels[newType] || ['strip', 'vial', 'bottle', 'pcs']
                    setForm({
                      ...form,
                      type: newType,
                      unitLabel: newAdaptiveUnits.includes(form.unitLabel) ? form.unitLabel : newAdaptiveUnits[0]
                    })
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-900 bg-white"
                >
                  <option value="TABLET">TABLET</option>
                  <option value="CAPSULE">CAPSULE</option>
                  <option value="INJECTION">INJECTION</option>
                  <option value="SYRUP">SYRUP</option>
                  <option value="OINTMENT">OINTMENT</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              {/* Unit Label (Adaptive Dropdown) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Unit Label</label>
                <select
                  value={form.unitLabel}
                  onChange={(e) => setForm({ ...form, unitLabel: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 capitalize bg-white"
                >
                  {currentUnitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pack Size */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Pack Size</label>
                <input
                  type="text"
                  placeholder="e.g. 10x10 / 100ml"
                  value={form.pack}
                  onChange={(e) => setForm({ ...form, pack: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: TAX & INVENTORY SETTINGS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <Percent className="w-4 h-4 text-teal-500" /> 3. Tax & Inventory Control
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* HSN Code Combobox */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  HSN Code <span className="text-slate-400 font-normal">(Auto-fills GST%)</span>
                </label>
                <FreeTextCombobox
                  value={form.hsnCode}
                  onChange={(val) => setForm({ ...form, hsnCode: val })}
                  onSelectOption={handleSelectHsn}
                  options={hsnOptions}
                  placeholder="e.g. 300490"
                />
              </div>

              {/* Reorder Level */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Reorder Alert Level <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="10"
                  value={form.reorderLevel}
                  onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                  className={`w-full py-2 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 font-mono ${
                    !isReorderValid
                      ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                      : 'border-slate-200 focus:ring-teal-500'
                  }`}
                />
                {!isReorderValid && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">Must be an integer ≥ 0.</p>
                )}
              </div>
            </div>

            {/* Default GST% with Quick-Pick Slab Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex justify-between items-center">
                <span>Default GST Rate (%) <span className="text-red-500">*</span></span>
                <span className="text-[11px] text-slate-400 font-normal font-sans">Click chip or type percentage</span>
              </label>
              
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {['0', '5', '12', '18', '28'].map((slab) => (
                  <button
                    key={slab}
                    type="button"
                    onClick={() => setForm({ ...form, defaultGstPercent: slab })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      form.defaultGstPercent === slab
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {slab}% GST
                  </button>
                ))}
              </div>

              <input
                type="number"
                step="0.01"
                placeholder="12"
                value={form.defaultGstPercent}
                onChange={(e) => setForm({ ...form, defaultGstPercent: e.target.value })}
                className={`w-full py-2 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 font-mono font-bold ${
                  !isGstValid
                    ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                    : 'border-slate-200 focus:ring-teal-500'
                }`}
              />
              {!isGstValid && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">Valid GST rate between 0% and 100% required.</p>
              )}
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
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-teal-500/20 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Medicine
                  </>
                )}
              </button>

              {/* Disabled tooltip */}
              {!isValid && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-52 p-2 bg-slate-900 text-slate-200 text-xs rounded-lg shadow-xl z-50">
                  <p className="font-semibold text-amber-400 mb-1">Cannot save yet:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {!isNameValid && <li>Medicine name required</li>}
                    {!isReorderValid && <li>Reorder level must be ≥ 0</li>}
                    {!isGstValid && <li>Default GST % required</li>}
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

  // Validations
  const isNameValid = Boolean(form.name.trim())

  // Phone Validation (10-digit Indian Mobile, optional when blank)
  const cleanPhone = form.phone.replace(/\s+/g, '')
  const isPhoneValid = cleanPhone === '' || /^\d{10}$/.test(cleanPhone) || /^[6-9]\d{9}$/.test(cleanPhone)

  // GSTIN Validation (15-character format, optional when blank)
  const cleanGstin = form.gstin.trim().toUpperCase()
  const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  const isGstinValid = cleanGstin === '' || (cleanGstin.length === 15 && gstinPattern.test(cleanGstin))

  // State Detection from GSTIN (First 2 digits)
  const stateCode = cleanGstin.length >= 2 ? cleanGstin.substring(0, 2) : ''
  const detectedState = INDIAN_GST_STATE_CODES[stateCode] || null

  // Overall Form Validation State
  const isValid = isNameValid && isPhoneValid && isGstinValid

  // Duplicate Vendor Warning (Non-blocking)
  const trimmedName = form.name.trim().toLowerCase()
  const duplicateVendor = (trimmedName.length >= 3 || cleanGstin.length === 15)
    ? existingVendors.find(
        (v) =>
          v.id !== editingVendor?.id &&
          ((trimmedName.length >= 3 && v.name.toLowerCase() === trimmedName) ||
           (trimmedName.length >= 3 && v.name.toLowerCase().includes(trimmedName)) ||
           (cleanGstin.length === 15 && v.gstin && v.gstin.toUpperCase() === cleanGstin))
      )
    : null

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!isValid || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({
        name: form.name.trim(),
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
            <Building2 className="w-5 h-5 text-teal-400" />
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
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <Building2 className="w-4 h-4 text-teal-500" /> 1. Vendor Contact & Location
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
                  placeholder="e.g. Apex Pharmacy Wholesale"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full py-2 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 font-semibold ${
                    !isNameValid && form.name !== ''
                      ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                      : 'border-slate-200 focus:ring-teal-500'
                  }`}
                />
                {!isNameValid && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">Vendor name is required.</p>
                )}

                {/* DUPLICATE VENDOR WARNING */}
                {duplicateVendor && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-start gap-2 text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Notice: Similar vendor already registered!</span>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        <strong className="text-amber-950">{duplicateVendor.name}</strong> {duplicateVendor.gstin ? `(GSTIN: ${duplicateVendor.gstin})` : ''} {duplicateVendor.phone ? `• Ph: ${duplicateVendor.phone}` : ''}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex justify-between">
                  <span>Phone Number</span>
                  <span className="text-[11px] text-slate-400 font-normal font-sans">10-digit mobile</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\s+/g, '') })}
                  className={`w-full py-2 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 font-mono ${
                    !isPhoneValid
                      ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                      : 'border-slate-200 focus:ring-teal-500'
                  }`}
                />
                {!isPhoneValid && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">Must be a valid 10-digit Indian phone number.</p>
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
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: COMPLIANCE & LICENSING */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <ShieldCheck className="w-4 h-4 text-teal-500" /> 2. Tax Compliance & Drug Licensing
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
                  className={`w-full py-2 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 font-mono font-semibold uppercase ${
                    !isGstinValid
                      ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                      : 'border-slate-200 focus:ring-teal-500'
                  }`}
                />
                {!isGstinValid && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">
                    Invalid 15-character GSTIN format (e.g. 27AAAAA1111A1Z1).
                  </p>
                )}

                {/* STATE AUTO-DETECTION BADGE */}
                {detectedState && isGstinValid && (
                  <div className="mt-2 p-2 bg-teal-50 border border-teal-200/70 rounded-lg text-xs font-medium text-teal-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>
                      Detected State: <strong className="text-teal-950">{detectedState}</strong> (Code {stateCode}) • Enables In-State vs Inter-State Tax
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
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase"
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
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-teal-500/20 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer flex items-center gap-1.5"
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
                    {!isPhoneValid && <li>Phone must be 10 digits</li>}
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
    freeQty: '',
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
  const medicineInputRef = useRef<HTMLInputElement>(null)

  const safeBatches = Array.isArray(batches) ? batches : []
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
        gstPercent: lastUsedGstPercent
      }))
      return
    }

    // Lookup previous batch pricing history for this medicine
    const prevBatch = safeBatches.find((b) => b.medicine_id === selectedMed.id)

    setStockInItem((prev) => ({
      ...prev,
      medicineId: selectedMed.id,
      gstPercent: selectedMed.default_gst_percent ? selectedMed.default_gst_percent.toString() : lastUsedGstPercent,
      mrp: prevBatch?.mrp ? prevBatch.mrp.toString() : prev.mrp,
      purchasePricePerUnit: prevBatch?.purchase_price_per_unit ? prevBatch.purchase_price_per_unit.toString() : prev.purchasePricePerUnit,
      sellingPricePerUnit: prevBatch?.selling_price_per_unit ? prevBatch.selling_price_per_unit.toString() : prev.sellingPricePerUnit
    }))
  }

  // MEDICINES CRUD SUBMISSION HANDLER
  const handleMedModalSave = async (formData: any) => {
    if (!formData.name.trim()) return showToast('Name is required', 'error')
    
    try {
      const data = {
        name: formData.name,
        generic_name: formData.genericName || null,
        genericName: formData.genericName || null,
        manufacturer: formData.manufacturer || null,
        pack: formData.pack || null,
        type: formData.type,
        unit_label: formData.unitLabel,
        unitLabel: formData.unitLabel,
        hsn_code: formData.hsnCode || null,
        hsnCode: formData.hsnCode || null,
        reorder_level: parseInt(formData.reorderLevel) || 0,
        reorderLevel: parseInt(formData.reorderLevel) || 0,
        default_gst_percent: parseFloat(formData.defaultGstPercent) || 12.0,
        defaultGstPercent: parseFloat(formData.defaultGstPercent) || 12.0
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
    if (!formData.name.trim()) return showToast('Vendor Name is required', 'error')

    try {
      if (editingVendor) {
        await updateVendor({ id: editingVendor.id, data: formData, userId: currentUser?.id || '' })
        showToast('Vendor updated successfully', 'success')
      } else {
        await createVendor({ data: formData, userId: currentUser?.id || '' })
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
    if (!stockInItem.batchNo.trim()) return showToast('Please enter batch number', 'error')
    if (!stockInItem.expiryDate) return showToast('Please select expiry date', 'error')
    
    const expiryTimestamp = new Date(stockInItem.expiryDate).getTime()
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
    const gstPercent = parseFloat(stockInItem.gstPercent) || selMed?.default_gst_percent || 12.0

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

    const newItem = {
      medicineId: stockInItem.medicineId,
      batchNo: stockInItem.batchNo,
      expiryDate: stockInItem.expiryDate,
      qtyPurchased: qty,
      freeQty,
      mrp,
      discountPercent,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      gstPercent,
      purchasePricePerUnit: pPrice,
      sellingPricePerUnit: sPrice
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
      freeQty: '',
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
    const item = purchaseForm.items[index]
    if (!item) return

    const lineAmount = (item.qtyPurchased * item.purchasePricePerUnit).toFixed(2)

    setStockInItem({
      medicineId: item.medicineId,
      batchNo: item.batchNo,
      expiryDate: item.expiryDate,
      qtyPurchased: item.qtyPurchased.toString(),
      freeQty: item.freeQty ? item.freeQty.toString() : '',
      mrp: item.mrp ? item.mrp.toString() : '',
      discountPercent: item.discountPercent ? item.discountPercent.toString() : '',
      gstPercent: item.gstPercent ? item.gstPercent.toString() : '12',
      purchasePricePerUnit: item.purchasePricePerUnit.toString(),
      amount: lineAmount,
      sellingPricePerUnit: item.sellingPricePerUnit.toString()
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
      freeQty: '',
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
          gstPercent: purchaseForm.items.length > 0 ? (purchaseForm.items[0].gstPercent || 12) : 12,
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
    (m.type || '').toLowerCase().includes(searchQuery.toLowerCase())
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
            className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              localTab === tab.id 
                ? 'border-teal-500 text-teal-600 bg-teal-50/40' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-600 text-white rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>



      {/* --- CURRENT STOCK BATCHES TAB --- */}
      {localTab === 'batches' && (
        <DataTable
          columns={[
            { key: 'medicine', header: 'Medicine', sortable: true, sortValue: (b: any) => b.medicine?.name || '', render: (b: any) => <span className="font-bold text-slate-900">{b.medicine?.name}</span> },
            { key: 'batch_no', header: 'Batch No.', sortable: true, render: (b: any) => <span className="font-mono text-xs text-slate-600">{b.batch_no}</span> },
            { key: 'expiry_date', header: 'Expiry Date', sortable: true, render: (b: any) => <span className="font-mono text-xs">{new Date(b.expiry_date).toLocaleDateString('en-GB')}</span> },
            { key: 'qty_available', header: 'Qty Available', sortable: true, align: 'right', render: (b: any) => <span className="font-bold font-mono">{b.qty_available}</span> },
            { key: 'purchase_price_per_unit', header: 'Purchase Price', sortable: true, align: 'right', render: (b: any) => <span className="font-mono">₹{b.purchase_price_per_unit.toFixed(2)}</span> },
            { key: 'selling_price_per_unit', header: 'Selling Price', sortable: true, align: 'right', render: (b: any) => <span className="font-mono font-bold text-slate-900">₹{b.selling_price_per_unit.toFixed(2)}</span> },
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
                  <span className="inline-flex px-2.5 py-0.5 text-xs rounded-full font-bold bg-red-100 text-red-700">Expired</span>
                ) : isNearExpiry ? (
                  <span className="inline-flex px-2.5 py-0.5 text-xs rounded-full font-bold bg-amber-100 text-amber-800">Expiring in {daysToExpiry}d</span>
                ) : (
                  <span className="inline-flex px-2.5 py-0.5 text-xs rounded-full font-bold bg-emerald-100 text-emerald-800">Active</span>
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
                  className="text-xs text-teal-600 hover:text-teal-700 font-bold underline cursor-pointer"
                >
                  Adjust Stock
                </button>
              ) : null
            }
          ]}
          data={safeBatches}
          loading={loading}
          rowKey={(b) => b.id}
          searchPlaceholder="Search by medicine or batch no..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          emptyMessage="No stock batches found"
          emptySubtext="Perform a Stock Purchase In to add medicine batches."
        />
      )}

      {/* --- MEDICINES LIST TAB --- */}
      {localTab === 'medicines' && (
        <DataTable
          columns={[
            { key: 'name', header: 'Medicine Name', sortable: true, render: (m: any) => <span className="font-bold text-slate-900">{m.name}</span> },
            { key: 'generic_name', header: 'Generic Name', sortable: true, render: (m: any) => <span className="text-xs text-slate-600 font-medium">{m.generic_name || 'N/A'}</span> },
            { key: 'manufacturer', header: 'Manufacturer', sortable: true, render: (m: any) => <span className="text-xs text-slate-600">{m.manufacturer || 'N/A'}</span> },
            { key: 'pack', header: 'Pack', sortable: true, render: (m: any) => <span className="font-mono text-xs">{m.pack || 'N/A'}</span> },
            { key: 'type', header: 'Type', sortable: true, render: (m: any) => <span className="font-mono text-xs">{m.type}</span> },
            { key: 'unit_label', header: 'Unit Label', sortable: true, render: (m: any) => <span className="capitalize">{m.unit_label}</span> },
            { key: 'hsn_code', header: 'HSN Code', sortable: true, render: (m: any) => <span className="font-mono text-xs">{m.hsn_code || 'N/A'}</span> },
            { key: 'reorder_level', header: 'Reorder Level', sortable: true, align: 'right', render: (m: any) => <span className="font-mono font-bold text-slate-800">{m.reorder_level}</span> },
            { key: 'default_gst_percent', header: 'GST %', sortable: true, align: 'right', render: (m: any) => <span className="font-mono">{m.default_gst_percent}%</span> },
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
              className="flex items-center justify-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Medicine
            </button>
          }
        />
      )}

      {/* --- STOCK PURCHASE IN TAB (REDESIGNED V2) --- */}
      {localTab === 'stock-in' && (
        <div className="space-y-6">

          {/* ZONE 1: INVOICE HEADER CARD (COLLAPSIBLE / PINNED STRIP) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-200">
            {isHeaderCollapsed ? (
              /* COLLAPSED SINGLE-LINE SUMMARY STRIP */
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md border border-slate-800">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="text-slate-400">Vendor:</span>
                    <strong className="text-white text-sm">{selectedVendorObject?.name || 'Not Selected'}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="text-slate-400">Invoice:</span>
                    <strong className="font-mono text-teal-300 text-sm">#{purchaseForm.purchaseInvoiceNo || '---'}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="text-slate-400">Date:</span>
                    <span className="font-mono">{new Date(purchaseForm.purchaseDate).toLocaleDateString('en-GB')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      purchaseForm.purchaseType === 'CREDIT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {purchaseForm.purchaseType}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {purchaseForm.taxType === 'INTERSTATE' ? 'IGST (Interstate)' : 'CGST+SGST (In-State)'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsHeaderCollapsed(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Header
                </button>
              </div>
            ) : (
              /* EXPANDED FULL HEADER CARD */
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                    <FilePlus className="h-5 w-5 text-teal-500" /> Purchase Invoice Header
                  </h3>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVendor(null)
                        setShowVendorModal(true)
                      }}
                      className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 cursor-pointer bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/60"
                    >
                      <Plus className="w-3.5 h-3.5" /> Quick Add Vendor
                    </button>

                    {isHeaderValid && (
                      <button
                        type="button"
                        onClick={() => setIsHeaderCollapsed(true)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1 cursor-pointer bg-slate-100 px-3 py-1 rounded-lg border border-slate-200"
                      >
                        <ChevronUp className="w-4 h-4" /> Collapse
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Vendor Combobox */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Vendor <span className="text-red-500">*</span>
                    </label>
                    <VendorTypeahead
                      vendors={safeVendors}
                      value={purchaseForm.vendorId}
                      onChange={(vendorId) => setPurchaseForm({ ...purchaseForm, vendorId })}
                      error={!purchaseForm.vendorId ? 'Vendor is required' : undefined}
                    />
                  </div>

                  {/* Invoice Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Invoice Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PUR-1001"
                      value={purchaseForm.purchaseInvoiceNo}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseInvoiceNo: e.target.value })}
                      className={`w-full py-2 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 font-mono ${
                        !purchaseForm.purchaseInvoiceNo.trim()
                          ? 'border-slate-200 focus:ring-teal-500'
                          : 'border-teal-500 bg-teal-50/10 font-bold focus:ring-teal-500'
                      }`}
                    />
                  </div>

                  {/* Purchase Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Purchase Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={purchaseForm.purchaseDate}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                      className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>

                  {/* Purchase Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase Type</label>
                    <select
                      value={purchaseForm.purchaseType}
                      onChange={(e) => {
                        const pType = e.target.value
                        setPurchaseForm({
                          ...purchaseForm,
                          purchaseType: pType,
                          paymentStatus: pType === 'CREDIT' ? 'PENDING' : 'PAID'
                        })
                      }}
                      className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-800 bg-slate-50/50"
                    >
                      <option value="CASH">CASH</option>
                      <option value="CREDIT">CREDIT</option>
                    </select>
                  </div>

                  {/* Tax Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tax Type</label>
                    <select
                      value={purchaseForm.taxType}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, taxType: e.target.value })}
                      className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
                    >
                      <option value="INTRASTATE">CGST + SGST (In-State)</option>
                      <option value="INTERSTATE">IGST (Out of State)</option>
                    </select>
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Mode</label>
                    <select
                      value={purchaseForm.paymentMode}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentMode: e.target.value })}
                      className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="CASH">CASH</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK">BANK TRANSFER</option>
                      <option value="CARD">CARD</option>
                    </select>
                  </div>

                  {/* Remarks / Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Remarks / Notes</label>
                    <input
                      type="text"
                      placeholder="Optional notes or reference..."
                      value={purchaseForm.notes}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                      className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* CREDIT BREAKDOWN PANEL */}
                {purchaseForm.purchaseType === 'CREDIT' && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3 mt-3 animate-fade-in">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                      <CreditCard className="w-4 h-4 text-amber-600" /> Credit Invoice Payment Details
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Paid Amount (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="₹ 0.00"
                          value={purchaseForm.paidAmount}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, paidAmount: e.target.value })}
                          className="w-full py-2 px-3 rounded-lg border border-amber-300 bg-white text-sm font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                      </div>
                      
                      {/* Computed Pending Amount Field with AUTO badge */}
                      <div>
                        <label className="block text-xs font-bold text-amber-800 uppercase mb-1 flex items-center justify-between">
                          <span>Pending Amount</span>
                          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Lock className="w-3 h-3" /> AUTO
                          </span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={`₹ ${(() => {
                            const tot = purchaseForm.items.reduce((sum, item) => sum + (item.qtyPurchased * item.purchasePricePerUnit), 0)
                            const pd = parseFloat(purchaseForm.paidAmount) || 0
                            return Math.max(0, tot - pd).toFixed(2)
                          })()}`}
                          className="w-full py-2 px-3 rounded-lg border border-amber-200/80 bg-amber-100/50 text-sm font-bold text-red-700 font-mono cursor-default focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Due Date</label>
                        <input
                          type="date"
                          value={purchaseForm.dueDate}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, dueDate: e.target.value })}
                          className="w-full py-2 px-3 rounded-lg border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Payment Date</label>
                        <input
                          type="date"
                          value={purchaseForm.paymentDate}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentDate: e.target.value })}
                          className="w-full py-2 px-3 rounded-lg border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ZONE 2: STICKY COMPACT "ADD ITEM BATCH" ENTRY PANEL */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 sticky top-2 z-20 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  {editingIndex !== null ? (
                    <span className="text-indigo-600 flex items-center gap-1.5">
                      <Edit2 className="w-4 h-4" /> Edit Batch Item #{editingIndex + 1}
                    </span>
                  ) : (
                    'Add Medicine Batch Item'
                  )}
                </h4>
              </div>

              <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMed(null)
                    setShowMedModal(true)
                  }}
                  className="text-xs font-bold text-teal-600 hover:text-teal-800 underline cursor-pointer mr-2 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Quick Create Medicine
                </button>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">Press Enter to Add</span>
                {editingIndex !== null && (
                  <button
                    onClick={cancelEditStockInItem}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
            </div>

            {/* FAST DATA ENTRY ROW / GRID */}
            <div 
              onKeyDown={(e) => {
                if (e.key === 'Enter' || (e.ctrlKey && e.key === 'Enter')) {
                  e.preventDefault()
                  addStockInItem()
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3 items-end"
            >
              {/* Medicine Typeahead */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Medicine <span className="text-red-500">*</span>
                </label>
                <MedicineTypeahead
                  medicines={safeMedicines}
                  value={stockInItem.medicineId}
                  onChange={handleMedicineSelect}
                  inputRef={medicineInputRef}
                />
              </div>

              {/* Batch No */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Batch No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. B-9021"
                  value={stockInItem.batchNo}
                  onChange={(e) => setStockInItem({ ...stockInItem, batchNo: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-semibold"
                />
              </div>

              {/* Expiry Date */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={stockInItem.expiryDate}
                  onChange={(e) => setStockInItem({ ...stockInItem, expiryDate: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              {/* Qty Purchased */}
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Qty <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="100"
                  value={stockInItem.qtyPurchased}
                  onChange={(e) => handleQtyPurchasedChange(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold text-slate-900"
                />
              </div>

              {/* Free Qty */}
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Free</label>
                <input
                  type="number"
                  placeholder="0"
                  value={stockInItem.freeQty}
                  onChange={(e) => setStockInItem({ ...stockInItem, freeQty: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-emerald-700"
                />
              </div>

              {/* MRP */}
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">MRP (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="150"
                  value={stockInItem.mrp}
                  onChange={(e) => setStockInItem({ ...stockInItem, mrp: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              {/* Disc % */}
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Disc %</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={stockInItem.discountPercent}
                  onChange={(e) => setStockInItem({ ...stockInItem, discountPercent: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              {/* Purchase Price */}
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Pur.Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="₹/unit"
                  value={stockInItem.purchasePricePerUnit}
                  onChange={(e) => handlePurchasePriceChange(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-medium"
                />
              </div>

              {/* COMPUTED READ-ONLY AMOUNT FIELD */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
                  <span>Net Amount</span>
                  <span className="text-[10px] font-extrabold text-teal-700 bg-teal-100/90 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> AUTO
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Qty × Price"
                    value={stockInItem.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg border border-teal-200 bg-teal-50/70 text-sm font-extrabold text-teal-950 font-mono focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* GST % */}
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GST %</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="12"
                  value={stockInItem.gstPercent}
                  onChange={(e) => setStockInItem({ ...stockInItem, gstPercent: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-semibold"
                />
              </div>

              {/* Selling Price */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Sell Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="₹/unit"
                  value={stockInItem.sellingPricePerUnit}
                  onChange={(e) => setStockInItem({ ...stockInItem, sellingPricePerUnit: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-semibold text-slate-900"
                />
              </div>

              {/* ADD / UPDATE BUTTON */}
              <div className="lg:col-span-2">
                <button
                  type="button"
                  onClick={addStockInItem}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                    editingIndex !== null
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20'
                  }`}
                >
                  {editingIndex !== null ? (
                    <>
                      <Check className="w-4 h-4" /> Update Batch
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Add Batch Item
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ZONE 3: RESPONSIVE BATCH ITEMS TABLE (WITH STICKY MEDICINE COLUMN) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-teal-500" /> Batch Items in Invoice
                <span className="ml-2 text-xs font-mono font-normal bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  {purchaseForm.items.length} items
                </span>
              </h3>
            </div>

            <div className="overflow-x-auto relative rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {/* Sticky Medicine Header Column */}
                    <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[200px]">
                      Medicine Name
                    </th>
                    <th className="px-4 py-3">HSN / GST</th>
                    <th className="px-4 py-3">Batch No</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Free</th>
                    <th className="px-4 py-3 text-right">MRP</th>
                    <th className="px-4 py-3 text-right">Disc %</th>
                    <th className="px-4 py-3 text-right">Pur. Price</th>
                    <th className="px-4 py-3 text-right">Sell Price</th>
                    {/* Read-Only Net Total Column */}
                    <th className="px-4 py-3 text-right min-w-[110px]">Net Total</th>
                    <th className="px-4 py-3 text-right min-w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseForm.items.map((item, index) => {
                    const med = safeMedicines.find((m) => m.id === item.medicineId)
                    const itemTotal = item.qtyPurchased * item.purchasePricePerUnit
                    const isRecentlyAdded = recentlyAddedIndex === index
                    const isBeingEdited = editingIndex === index

                    return (
                      <tr 
                        key={index} 
                        className={`transition-colors duration-500 ${
                          isRecentlyAdded
                            ? 'bg-teal-50/90 font-medium'
                            : isBeingEdited
                            ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Sticky Medicine Body Column */}
                        <td className="px-4 py-3 font-semibold text-slate-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <div>{med?.name || 'Medicine'}</div>
                          {med?.pack && <div className="text-[11px] text-slate-500 font-mono font-normal">Pack: {med.pack}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono">
                          <div>{med?.hsn_code || '---'}</div>
                          <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200/60 font-sans px-1.5 py-0.5 rounded font-bold">
                            GST {item.gstPercent || med?.default_gst_percent || 12}%
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{item.batchNo}</td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {new Date(item.expiryDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{item.qtyPurchased}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                          {item.freeQty > 0 ? `+${item.freeQty}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                          {item.mrp > 0 ? `₹${item.mrp.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                          {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">₹{item.purchasePricePerUnit.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">₹{item.sellingPricePerUnit.toFixed(2)}</td>
                        
                        {/* COMPUTED READ-ONLY NET TOTAL */}
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-teal-900 bg-teal-50/40">
                          ₹{itemTotal.toFixed(2)}
                        </td>

                        {/* INLINE ROW ACTIONS */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => editStockInItem(index)}
                              className="px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStockInItem(index)}
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}

                  {/* FRIENDLY EMPTY STATE */}
                  {purchaseForm.items.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-6 py-12 text-center bg-slate-50/40">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
                            <Package className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-semibold text-slate-800">No items added to this purchase invoice yet.</p>
                          <p className="text-xs text-slate-500">
                            Select a medicine in the entry bar above or press <kbd className="px-1.5 py-0.5 bg-white border rounded text-[11px] font-mono shadow-xs">Enter</kbd> after filling details to add your first batch item.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ZONE 4: PINNED RUNNING TOTALS & FINAL SUBMIT BAR */}
          {(() => {
            const taxable = purchaseForm.items.reduce((s, i) => s + (i.taxableAmount || 0), 0)
            const cgst = purchaseForm.items.reduce((s, i) => s + (i.cgstAmount || 0), 0)
            const sgst = purchaseForm.items.reduce((s, i) => s + (i.sgstAmount || 0), 0)
            const igst = purchaseForm.items.reduce((s, i) => s + (i.igstAmount || 0), 0)
            const totalGst = cgst + sgst + igst
            const grandTotal = taxable + totalGst > 0 
              ? (taxable + totalGst) 
              : purchaseForm.items.reduce((sum, item) => sum + (item.qtyPurchased * item.purchasePricePerUnit), 0)

            const canSubmit = isHeaderValid && purchaseForm.items.length > 0

            return (
              <div className="sticky bottom-4 z-30 bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* COMPUTED TAX BREAKDOWN STRIP */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                  <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
                      Taxable Amount <Lock className="w-2.5 h-2.5 text-teal-400" />
                    </span>
                    <span className="font-bold text-white font-mono text-base">₹{taxable.toFixed(2)}</span>
                  </div>

                  {purchaseForm.taxType === 'INTERSTATE' ? (
                    <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                      <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
                        IGST Total <Lock className="w-2.5 h-2.5 text-teal-400" />
                      </span>
                      <span className="font-bold text-white font-mono text-base">₹{igst.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                        <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
                          CGST Total <Lock className="w-2.5 h-2.5 text-teal-400" />
                        </span>
                        <span className="font-bold text-white font-mono text-base">₹{cgst.toFixed(2)}</span>
                      </div>
                      <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                        <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
                          SGST Total <Lock className="w-2.5 h-2.5 text-teal-400" />
                        </span>
                        <span className="font-bold text-white font-mono text-base">₹{sgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                    <span className="text-[11px] text-teal-400 font-semibold block flex items-center gap-1">
                      Total GST <Lock className="w-2.5 h-2.5 text-teal-400" />
                    </span>
                    <span className="font-bold text-teal-300 font-mono text-base">₹{totalGst.toFixed(2)}</span>
                  </div>
                </div>

                {/* GRAND TOTAL & SUBMIT BUTTON */}
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Grand Total Amount</p>
                    <p className="text-2xl font-black text-teal-400 font-mono">₹{grandTotal.toFixed(2)}</p>
                  </div>

                  <div className="relative group">
                    <button
                      type="button"
                      onClick={handlePurchaseSubmit}
                      disabled={!canSubmit}
                      className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-teal-500/20 transition-all disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none cursor-pointer flex items-center gap-2"
                    >
                      <span>Log Stock Purchase</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    {/* TOOLTIP ON HOVER WHEN DISABLED */}
                    {!canSubmit && (
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-950 text-slate-300 text-xs rounded-lg border border-slate-800 shadow-xl z-50">
                        <p className="font-semibold text-amber-400 mb-1">Cannot submit yet:</p>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                          {!purchaseForm.vendorId && <li>Select a vendor</li>}
                          {!purchaseForm.purchaseInvoiceNo.trim() && <li>Enter invoice number</li>}
                          {purchaseForm.items.length === 0 && <li>Add at least 1 item batch</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
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
                <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${
                  p.purchase_type === 'CREDIT' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
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
                return <span className="font-mono font-semibold text-emerald-700">₹{paid.toFixed(2)}</span>
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
                <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${
                  p.payment_status === 'PENDING' ? 'bg-red-100 text-red-800' :
                  p.payment_status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {p.payment_status || 'PAID'}
                </span>
              )
            },
            { key: 'payment_mode', header: 'Mode', sortable: true, render: (p: any) => <span className="font-mono text-xs uppercase">{p.payment_mode || 'CASH'}</span> },
            {
              key: 'items_summary',
              header: 'Batch Items',
              render: (p: any) => (
                <span className="text-xs text-slate-600 truncate max-w-xs block">
                  {p.batches?.map((b: any) => `${b.medicine?.name} (${b.qty_purchased})`).join(', ') || 'N/A'}
                </span>
              )
            },
            { key: 'notes', header: 'Notes', render: (p: any) => <span className="text-xs text-slate-400 truncate max-w-xs block">{p.notes || 'N/A'}</span> }
          ]}
          data={purchases}
          loading={loading}
          rowKey={(p) => p.id}
          searchPlaceholder="Search purchase history by invoice, vendor, notes..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
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
              className="flex items-center justify-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason for Adjustment *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  Apply Stock Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
