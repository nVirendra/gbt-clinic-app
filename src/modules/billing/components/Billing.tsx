import React, { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Search, 
  Plus, 
  Trash2, 
  IndianRupee, 
  UserCheck, 
  ClipboardList, 
  FileText,
  PlusCircle,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  X,
  Lock,
  Check,
  Building2,
  Calendar,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  Layers,
  Zap,
  Package
} from 'lucide-react'
import { useBillingStore } from '../store'
import { useAuthStore } from '../../auth/store'
import { useSettingsStore } from '../../settings/store'
import { Patient, Service, Medicine, InventoryBatch } from '../../../types'

interface BillingProps {
  onSuccess: () => void
}

interface SelectedItem {
  id: string // service id / batch id / temp id
  itemType: 'SERVICE' | 'MEDICINE' | 'MISC'
  serviceId?: string
  batchId?: string
  name: string
  price: number
  quantity: number
  discount: number
  gstPercent: number
  lineTotal: number
  availableQty?: number // for medicine validation
}

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

// Patient Typeahead Combobox Component
function PatientTypeahead({
  patients,
  value,
  onChange,
  disabled
}: {
  patients: Patient[]
  value: string
  onChange: (patient: Patient | null) => void
  disabled?: boolean
}) {
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
      <div className="w-full py-2 px-3.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed">
        Walk-in Mode Active (No patient linked)
      </div>
    )
  }

  if (selectedPatient) {
    return (
      <div className="flex items-center justify-between border border-teal-300 bg-teal-50/50 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-900 shadow-2xs">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{selectedPatient.full_name}</span>
          <span className="text-xs font-mono text-slate-500 font-normal">({selectedPatient.patient_code})</span>
          <span className="text-xs font-mono text-slate-500 font-normal ml-2">Ph: {selectedPatient.phone}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-slate-400 hover:text-slate-700 font-bold underline cursor-pointer ml-2"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
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
          placeholder="Search by Patient Name, Phone, or Code..."
          aria-label="Patient search"
          aria-expanded={isOpen}
          className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
        <ChevronDown
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
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
                  idx === highlightedIndex ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
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

// Item Search Autocomplete Combobox
function ItemTypeahead({
  itemType,
  services,
  medicines,
  value,
  onChange,
  onSelectService,
  onSelectMedicine,
  inputRef
}: {
  itemType: 'SERVICE' | 'MEDICINE' | 'MISC'
  services: Service[]
  medicines: Medicine[]
  value: string
  onChange: (val: string) => void
  onSelectService: (s: Service) => void
  onSelectMedicine: (m: Medicine) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
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
        (m.pack || '').toLowerCase().includes(query)
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
          onChange={(e) => {
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
              ? 'Search medicine by name or generic...'
              : 'Enter custom charge description'
          }
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium bg-white"
        />
        {itemType !== 'MISC' && (
          <ChevronDown
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
          />
        )}
      </div>

      {isOpen && itemType !== 'MISC' && currentList.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-2xl py-1 text-sm">
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
                  idx === highlightedIndex ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-900">{s.name}</span>
                  {s.category && <span className="ml-2 text-xs text-slate-500">({s.category})</span>}
                </div>
                <span className="font-mono text-xs font-bold text-teal-700">₹{s.default_price.toFixed(2)}</span>
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
                className={`px-4 py-2.5 cursor-pointer flex justify-between items-center transition-colors ${
                  idx === highlightedIndex ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-900">{m.name}</span>
                  {m.pack && <span className="ml-2 text-xs font-mono text-slate-500">[{m.pack}]</span>}
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase">{m.type}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

export default function Billing({ onSuccess }: BillingProps) {
  const profile = useSettingsStore((state) => state.profile)
  const currentUser = useAuthStore((state) => state.user)
  const createBill = useBillingStore((state) => state.createBill)

  // Datasets
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [medicineBatches, setMedicineBatches] = useState<InventoryBatch[]>([])

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }

  // Search/selection states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isWalkin, setIsWalkin] = useState(false)
  const [walkinName, setWalkinName] = useState('')

  // Invoiced line items state
  const [items, setItems] = useState<SelectedItem[]>([])
  const [recentlyAddedIndex, setRecentlyAddedIndex] = useState<number | null>(null)

  // Remember last-used GST % for fast entry
  const [lastUsedGstPercent, setLastUsedGstPercent] = useState('18')

  // Line item form state
  const [itemType, setItemType] = useState<'SERVICE' | 'MEDICINE' | 'MISC'>('SERVICE')
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  
  const [itemForm, setItemForm] = useState({
    name: '',
    price: '',
    quantity: '1',
    discount: '0',
    gstPercent: '18'
  })

  // Bill totals and payment state
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0])
  const [generalDiscount, setGeneralDiscount] = useState('0')
  const [paidAmount, setPaidAmount] = useState('0')
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [transactionId, setTransactionId] = useState('')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)

  // Input reference for keyboard focus
  const itemNameInputRef = useRef<HTMLInputElement>(null)

  // Latest-value refs so the keyboard listener doesn't trigger stale closures
  const resetFormRef = useRef<() => void>(() => {})
  const handleSubmitBillRef = useRef<(status: 'DRAFT' | 'FINALIZED') => void>(() => {})

  // Load initial search datasets
  const loadData = async () => {
    try {
      const [pData, sData, mData] = await Promise.all([
        window.api.getPatients(),
        window.api.getServices(),
        window.api.getMedicines()
      ])
      setPatients(pData)
      setServices(sData)
      setMedicines(mData)
    } catch (e) {
      console.error('Failed to load billing dependencies:', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Sync default tax rate
  useEffect(() => {
    if (profile && profile.defaultTaxRate != null) {
      const defaultGst = profile.defaultTaxRate.toString()
      setItemForm((prev) => ({ ...prev, gstPercent: defaultGst }))
      setLastUsedGstPercent(defaultGst)
    }
  }, [profile])

  // Load batches when medicine is selected
  useEffect(() => {
    if (itemType === 'MEDICINE' && selectedMed) {
      const fetchBatches = async () => {
        try {
          const activeBatches = await window.api.getMedicineBatches(selectedMed.id)
          setMedicineBatches(activeBatches)
          
          // Pre-select earliest expiry batch if available
          if (activeBatches.length > 0) {
            const firstBatch = activeBatches[0]
            setSelectedBatch(firstBatch)
            setItemForm((prev) => ({
              ...prev,
              price: firstBatch.selling_price_per_unit.toString(),
              gstPercent: selectedMed.default_gst_percent ? selectedMed.default_gst_percent.toString() : lastUsedGstPercent
            }))
          } else {
            setSelectedBatch(null)
            setItemForm((prev) => ({
              ...prev,
              price: '0',
              gstPercent: selectedMed.default_gst_percent ? selectedMed.default_gst_percent.toString() : lastUsedGstPercent
            }))
          }
        } catch (e) {
          console.error(e)
        }
      }
      fetchBatches()
    }
  }, [selectedMed, itemType])

  // Reset Billing Form
  const resetForm = () => {
    setSelectedPatient(null)
    setIsWalkin(false)
    setWalkinName('')
    setItems([])
    setGeneralDiscount('0')
    setPaidAmount('0')
    setPaymentMode('CASH')
    setTransactionId('')
    setNotes('')
    setItemForm({
      name: '',
      price: '',
      quantity: '1',
      discount: '0',
      gstPercent: lastUsedGstPercent
    })
    setSelectedMed(null)
    setSelectedBatch(null)
    setSelectedService(null)
    showToast('Invoice form reset', 'info')
  }
  resetFormRef.current = resetForm

  // Keyboard Shortcuts Listener (F2, F4, Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        resetFormRef.current()
      } else if (e.key === 'F4') {
        e.preventDefault()
        itemNameInputRef.current?.focus()
      } else if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        handleSubmitBillRef.current('FINALIZED')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setItemForm({
      name: service.name,
      price: service.default_price.toString(),
      quantity: '1',
      discount: '0',
      gstPercent: service.gst_percent ? service.gst_percent.toString() : lastUsedGstPercent
    })
  }

  // Handle medicine selection
  const handleMedicineSelect = (med: Medicine) => {
    setSelectedMed(med)
    setItemForm({
      name: med.name,
      price: '',
      quantity: '1',
      discount: '0',
      gstPercent: med.default_gst_percent ? med.default_gst_percent.toString() : lastUsedGstPercent
    })
  }

  // Add line item to list
  const addLineItem = () => {
    if (itemType === 'SERVICE' && !selectedService) {
      return showToast('Please select a service from the typeahead list.', 'error')
    }
    if (itemType === 'MEDICINE' && (!selectedMed || !selectedBatch)) {
      return showToast('Please select a medicine batch with available stock.', 'error')
    }
    if (itemType === 'MISC' && !itemForm.name.trim()) {
      return showToast('Please enter custom item description.', 'error')
    }

    const name = itemType === 'SERVICE' 
      ? selectedService!.name 
      : itemType === 'MEDICINE' 
      ? `${selectedMed!.name} (${selectedBatch!.batch_no})` 
      : itemForm.name.trim()

    const price = parseFloat(itemForm.price) || 0
    const qty = parseInt(itemForm.quantity) || 1
    const disc = parseFloat(itemForm.discount) || 0
    const gstPct = parseFloat(itemForm.gstPercent) || 0

    // Validations
    if (qty <= 0) return showToast('Quantity must be greater than 0', 'error')
    if (price < 0) return showToast('Price cannot be negative', 'error')
    if (disc < 0) return showToast('Discount cannot be negative', 'error')

    // Inventory Stock & Expiry Validation
    if (itemType === 'MEDICINE' && selectedBatch) {
      const expiryTime = new Date(selectedBatch.expiry_date).getTime()
      if (expiryTime <= Date.now()) {
        return showToast('Cannot dispense an expired batch! Dispensation blocked.', 'error')
      }
      if (qty > selectedBatch.qty_available) {
        return showToast(`Cannot dispense more than available stock (${selectedBatch.qty_available} units).`, 'error')
      }
    }

    const lineSubtotal = price * qty
    const lineTotal = Math.max(0, lineSubtotal - disc)

    const newItem: SelectedItem = {
      id: itemType === 'SERVICE' 
        ? selectedService!.id 
        : itemType === 'MEDICINE' 
        ? selectedBatch!.id 
        : `misc-${Date.now()}`,
      itemType,
      serviceId: itemType === 'SERVICE' ? selectedService!.id : undefined,
      batchId: itemType === 'MEDICINE' ? selectedBatch!.id : undefined,
      name,
      price,
      quantity: qty,
      discount: disc,
      gstPercent: gstPct,
      lineTotal,
      availableQty: itemType === 'MEDICINE' ? selectedBatch!.qty_available : undefined
    }

    const updatedItems = [...items, newItem]
    setItems(updatedItems)
    setRecentlyAddedIndex(updatedItems.length - 1)
    showToast(`Added '${name}' to invoice`, 'success')

    // Remember last used GST%
    setLastUsedGstPercent(itemForm.gstPercent)

    // Clear item selector form
    setItemForm({
      name: '',
      price: '',
      quantity: '1',
      discount: '0',
      gstPercent: itemForm.gstPercent // retain for fast entry
    })
    setSelectedMed(null)
    setSelectedBatch(null)
    setSelectedService(null)

    // Highlight row briefly
    setTimeout(() => {
      setRecentlyAddedIndex(null)
    }, 2000)

    // Re-focus search input for fast entry
    setTimeout(() => {
      itemNameInputRef.current?.focus()
    }, 50)
  }

  // Remove line item
  const removeLineItem = (index: number) => {
    const updated = [...items]
    const removedName = updated[index]?.name || 'Item'
    updated.splice(index, 1)
    setItems(updated)
    showToast(`Removed '${removedName}' from invoice`, 'info')
  }

  // Update line item inline
  const updateLineItemInline = (index: number, field: 'quantity' | 'discount' | 'gstPercent', val: string) => {
    const numVal = parseFloat(val) || 0
    const updated = [...items]
    const target = { ...updated[index] }

    if (field === 'quantity') {
      const newQty = parseInt(val) || 1
      if (target.itemType === 'MEDICINE' && target.availableQty && newQty > target.availableQty) {
        showToast(`Quantity cannot exceed available stock (${target.availableQty} units)`, 'error')
        return
      }
      target.quantity = Math.max(1, newQty)
    } else if (field === 'discount') {
      target.discount = Math.max(0, numVal)
    } else if (field === 'gstPercent') {
      target.gstPercent = Math.max(0, Math.min(100, numVal))
    }

    const lineSubtotal = target.price * target.quantity
    target.lineTotal = Math.max(0, lineSubtotal - target.discount)
    updated[index] = target
    setItems(updated)
  }

  // Calculations in precise cents/paise then float convert
  const itemsSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
  const itemsSubtotalPaise = Math.round(itemsSubtotal * 100)
  const gDiscountPaise = Math.round((parseFloat(generalDiscount) || 0) * 100)
  const taxableAmountPaise = Math.max(0, itemsSubtotalPaise - gDiscountPaise)

  // Compute GST Split
  let taxTotalPaise = 0
  items.forEach((item) => {
    const itemTotalPaise = Math.round(item.lineTotal * 100)
    const share = itemsSubtotalPaise > 0 ? (itemTotalPaise / itemsSubtotalPaise) : 0
    const allocatedGeneralDiscount = gDiscountPaise * share
    const itemTaxablePaise = Math.max(0, itemTotalPaise - allocatedGeneralDiscount)
    const itemTaxPaise = Math.round((itemTaxablePaise * item.gstPercent) / 100)
    taxTotalPaise += itemTaxPaise
  })

  const exactGrandTotalPaise = taxableAmountPaise + taxTotalPaise
  const roundedGrandTotalPaise = Math.round(exactGrandTotalPaise / 100) * 100
  const roundOffPaise = roundedGrandTotalPaise - exactGrandTotalPaise

  const grandTotal = roundedGrandTotalPaise / 100
  const subtotal = itemsSubtotalPaise / 100
  const discountTotal = gDiscountPaise / 100
  const taxTotal = taxTotalPaise / 100
  const roundOff = roundOffPaise / 100

  const pAmount = parseFloat(paidAmount) || 0
  const balanceDue = Math.max(0, grandTotal - pAmount)

  // Quick fill paid in full
  const handlePaidInFull = () => {
    setPaidAmount(grandTotal.toFixed(2))
    showToast(`Amount Paid set to Grand Total (₹${grandTotal.toFixed(2)})`, 'info')
  }

  // Validation Checks for Finalize
  const isPatientValid = isWalkin ? Boolean(walkinName.trim()) : Boolean(selectedPatient)
  const hasItems = items.length > 0
  const isPaymentModeNonCash = paymentMode !== 'CASH'
  const isTransactionIdValid = !isPaymentModeNonCash || Boolean(transactionId.trim())
  const canFinalize = isPatientValid && hasItems && isTransactionIdValid && !submitting

  // Submit invoice
  const handleSubmitBill = async (status: 'DRAFT' | 'FINALIZED') => {
    if (status === 'FINALIZED' && !canFinalize) {
      if (!isPatientValid) return showToast('Please select a patient or enter Walk-in name.', 'error')
      if (!hasItems) return showToast('Please add at least one line item to the invoice.', 'error')
      if (!isTransactionIdValid) return showToast('Transaction ID is required for non-cash payment modes.', 'error')
      return
    }

    if (!billDate || isNaN(new Date(billDate).getTime())) {
      return showToast('Please select a valid invoice date.', 'error')
    }

    setSubmitting(true)
    try {
      const payload = {
        patientId: isWalkin ? undefined : selectedPatient?.id,
        walkinName: isWalkin ? walkinName.trim() : undefined,
        date: new Date(billDate).toISOString(),
        status,
        discount: discountTotal,
        taxRate: 0,
        paidAmount: status === 'DRAFT' ? 0 : pAmount,
        paymentMode,
        transactionId,
        notes,
        items: items.map(item => ({
          itemType: item.itemType,
          serviceId: item.serviceId,
          batchId: item.batchId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          discount: item.discount,
          gstPercent: item.gstPercent
        }))
      }

      const generatedBill = await createBill({
        data: payload,
        userId: currentUser?.id || ''
      })
      
      showToast(status === 'DRAFT' ? 'Draft invoice saved successfully!' : 'Invoice finalized and created successfully!', 'success')
      
      if (status === 'FINALIZED') {
        // Trigger system print
        await window.api.printInvoice(generatedBill.id)
      }
      
      onSuccess() // redirect to invoices tab
    } catch (e: any) {
      console.error('Invoice creation failed:', e)
      showToast(e.message || 'Error generating invoice', 'error')
    } finally {
      setSubmitting(false)
    }
  }
  handleSubmitBillRef.current = handleSubmitBill

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-fade-in pb-8">
      
      {/* Toast Notification Popup */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* LEFT COLUMN: Invoiced items & details */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900 flex items-center">
            <ClipboardList className="h-5 w-5 text-teal-600 mr-2" /> Invoice Specifications
          </h2>
          
          {/* Keyboard shortcuts hints */}
          <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/70">
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-2xs font-mono font-bold text-slate-700">F2</kbd> Reset</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-2xs font-mono font-bold text-slate-700">F4</kbd> Search Item</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-2xs font-mono font-bold text-teal-700">Ctrl+P</kbd> Finalize</span>
          </div>
        </div>

        {/* TOP DETAILS ROW: Patient Selector & Invoice Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 flex-shrink-0 items-end">
          
          {/* Patient Selector */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Select Patient <span className="text-red-500">*</span>
              </label>
              <label className="inline-flex items-center text-xs text-teal-700 font-bold cursor-pointer hover:text-teal-900 transition-colors">
                <input
                  type="checkbox"
                  checked={isWalkin}
                  onChange={(e) => {
                    setIsWalkin(e.target.checked)
                    setSelectedPatient(null)
                  }}
                  className="mr-1.5 rounded text-teal-600 focus:ring-teal-500"
                />
                Walk-in Patient
              </label>
            </div>

            {isWalkin ? (
              <input
                type="text"
                placeholder="Enter Walk-in Patient Full Name..."
                value={walkinName}
                onChange={(e) => setWalkinName(e.target.value)}
                className="w-full px-3.5 py-2 border border-teal-300 bg-teal-50/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold text-slate-900"
              />
            ) : (
              <PatientTypeahead
                patients={patients}
                value={selectedPatient ? selectedPatient.id : ''}
                onChange={setSelectedPatient}
                disabled={isWalkin}
              />
            )}
          </div>

          {/* Bill Date */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
            />
          </div>
        </div>

        {/* ITEM SELECTION CONTROLLER PANEL */}
        <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl flex-shrink-0 mb-6 space-y-4">
          <div className="flex border-b border-slate-200 pb-2 justify-between items-center">
            <div className="flex space-x-6">
              {[
                { id: 'SERVICE', label: 'Service Item' },
                { id: 'MEDICINE', label: 'Medicine Batch' },
                { id: 'MISC', label: 'Custom / Misc Charge' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setItemType(t.id as any)
                    setSelectedMed(null)
                    setSelectedBatch(null)
                    setSelectedService(null)
                    setMedicineBatches([])
                    setItemForm({
                      name: '',
                      price: '',
                      quantity: '1',
                      discount: '0',
                      gstPercent: lastUsedGstPercent
                    })
                  }}
                  className={`pb-1.5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    itemType === t.id 
                      ? 'border-b-2 border-teal-600 text-teal-700' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Medicine Batch Stock & Expiry Alerts */}
            {itemType === 'MEDICINE' && selectedBatch && (
              <div className="flex items-center space-x-2 text-xs">
                {new Date(selectedBatch.expiry_date).getTime() <= Date.now() ? (
                  <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-0.5 rounded-lg font-bold border border-red-200">
                    <ShieldAlert className="h-3.5 w-3.5 text-red-600" /> Expired Batch! (Blocked)
                  </span>
                ) : new Date(selectedBatch.expiry_date).getTime() - Date.now() <= 30 * 24 * 60 * 60 * 1000 ? (
                  <span className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-lg font-bold border border-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Expiring Soon ({new Date(selectedBatch.expiry_date).toLocaleDateString('en-GB')})
                  </span>
                ) : selectedBatch.qty_available <= 10 ? (
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-lg font-bold border border-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Low Stock ({selectedBatch.qty_available} units avail)
                  </span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-lg font-bold border border-emerald-200">
                    Active Stock ({selectedBatch.qty_available} units avail)
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div 
            onKeyDown={(e) => {
              if (e.key === 'Enter' || (e.ctrlKey && e.key === 'Enter')) {
                e.preventDefault()
                addLineItem()
              }
            }}
            className="grid grid-cols-12 gap-3 items-end"
          >
            {/* Item Autocomplete Search / Custom name input */}
            <div className={itemType === 'MEDICINE' ? 'col-span-3' : 'col-span-5'}>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {itemType === 'SERVICE' ? 'Search Service *' : itemType === 'MEDICINE' ? 'Search Medicine *' : 'Charge Name *'}
              </label>
              <ItemTypeahead
                itemType={itemType}
                services={services}
                medicines={medicines}
                value={itemForm.name}
                onChange={(val) => setItemForm({ ...itemForm, name: val })}
                onSelectService={handleServiceSelect}
                onSelectMedicine={handleMedicineSelect}
                inputRef={itemNameInputRef}
              />
            </div>

            {/* Medicine Batch Selector */}
            {itemType === 'MEDICINE' && (
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Batch *</label>
                <select
                  value={selectedBatch ? selectedBatch.id : ''}
                  onChange={(e) => {
                    const b = medicineBatches.find((x) => x.id === e.target.value)
                    if (b) {
                      setSelectedBatch(b)
                      setItemForm((prev) => ({ ...prev, price: b.selling_price_per_unit.toString() }))
                    }
                  }}
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-mono font-semibold"
                >
                  {medicineBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_no} (Avail: {b.qty_available})
                    </option>
                  ))}
                  {medicineBatches.length === 0 && (
                    <option value="">No Stock</option>
                  )}
                </select>
              </div>
            )}

            {/* Price */}
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-right font-mono font-bold"
              />
            </div>

            {/* Qty */}
            <div className="col-span-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Qty *</label>
              <input
                type="number"
                value={itemForm.quantity}
                onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                placeholder="1"
                min="1"
                className="w-full px-2 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-center font-bold"
              />
            </div>

            {/* Discount */}
            <div className="col-span-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Disc (₹)</label>
              <input
                type="number"
                step="0.01"
                value={itemForm.discount}
                onChange={(e) => setItemForm({ ...itemForm, discount: e.target.value })}
                placeholder="0"
                className="w-full px-2 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-right text-red-600 font-mono font-medium"
              />
            </div>

            {/* GST % */}
            <div className="col-span-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">GST %</label>
              <input
                type="number"
                value={itemForm.gstPercent}
                onChange={(e) => setItemForm({ ...itemForm, gstPercent: e.target.value })}
                placeholder="18"
                className="w-full px-2 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-right font-mono font-semibold"
              />
            </div>

            {/* Add Button */}
            <div className={itemType === 'MEDICINE' ? 'col-span-2' : 'col-span-2'}>
              <button
                type="button"
                onClick={addLineItem}
                className="w-full flex items-center justify-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

          </div>
        </div>

        {/* INVOICE ITEMS TABLE */}
        <div className="flex-1 border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col min-h-[220px]">
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full min-w-[640px] text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-5 py-3">Item / Service Name</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Discount</th>
                  <th className="px-4 py-3 text-right">GST %</th>
                  <th className="px-5 py-3 text-right">Net Total</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center bg-slate-50/30">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Package className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-sm font-semibold text-slate-700">No items added to invoice yet.</p>
                        <p className="text-xs text-slate-400">Search and add items using the controller panel above.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const isRecentlyAdded = recentlyAddedIndex === index

                    return (
                      <tr 
                        key={index} 
                        className={`transition-colors duration-500 ${
                          isRecentlyAdded ? 'bg-teal-50/90 font-medium' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="px-4 py-3">
                          {item.itemType === 'MEDICINE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Package className="w-3 h-3" /> Stock Item
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
                              <Zap className="w-3 h-3 text-amber-500" /> Service
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 text-right font-mono">₹{item.price.toFixed(2)}</td>
                        
                        {/* INLINE EDITABLE QTY */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItemInline(index, 'quantity', e.target.value)}
                            className="w-16 py-1 px-2 border border-slate-200 rounded-lg text-center font-bold text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </td>

                        {/* INLINE EDITABLE DISCOUNT */}
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.discount}
                            onChange={(e) => updateLineItemInline(index, 'discount', e.target.value)}
                            className="w-20 py-1 px-2 border border-slate-200 rounded-lg text-right font-mono font-medium text-xs text-red-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </td>

                        {/* INLINE EDITABLE GST % */}
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            value={item.gstPercent}
                            onChange={(e) => updateLineItemInline(index, 'gstPercent', e.target.value)}
                            className="w-16 py-1 px-2 border border-slate-200 rounded-lg text-right font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </td>

                        <td className="px-5 py-3 text-right font-extrabold text-teal-900 font-mono">
                          ₹{item.lineTotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Calculations & Payments (Sticky Column) */}
      <div className="w-full md:w-96 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between shrink-0 sticky top-6 self-start max-h-[90vh] overflow-y-auto">
        
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center">
            <FileText className="h-5 w-5 text-teal-600 mr-2" /> Payment Summary
          </h2>

          {/* COMPUTED CALCULATIONS STRIP WITH LOCK BADGES */}
          <div className="space-y-3 border-b border-slate-100 pb-5 text-sm">
            {/* Items Subtotal */}
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span className="flex items-center gap-1">
                Items Total <Lock className="w-3 h-3 text-teal-600" />
              </span>
              <span className="font-mono font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
            </div>
            
            {/* Editable General Discount */}
            <div className="flex justify-between items-center text-slate-700 font-medium">
              <span>General Discount</span>
              <div className="relative w-32">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-mono">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={generalDiscount}
                  onChange={(e) => setGeneralDiscount(e.target.value)}
                  className="w-full pl-6 pr-2.5 py-1 border border-slate-200 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold font-mono text-red-600 bg-white"
                />
              </div>
            </div>

            {/* CGST / SGST split calculation */}
            <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
              <span className="flex items-center gap-1">
                CGST Split (Half) <Lock className="w-2.5 h-2.5 text-teal-500" />
              </span>
              <span className="font-mono">₹{(taxTotal / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
              <span className="flex items-center gap-1">
                SGST Split (Half) <Lock className="w-2.5 h-2.5 text-teal-500" />
              </span>
              <span className="font-mono">₹{(taxTotal / 2).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600 font-semibold border-t border-dashed border-slate-200 pt-2 text-xs">
              <span className="flex items-center gap-1">
                Total Tax (GST) <Lock className="w-3 h-3 text-teal-600" />
              </span>
              <span className="font-mono font-bold text-slate-900">₹{taxTotal.toFixed(2)}</span>
            </div>

            {/* Round off */}
            <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
              <span>Round Off Difference</span>
              <span className="font-mono">{roundOff >= 0 ? '+' : ''}₹{roundOff.toFixed(2)}</span>
            </div>
          </div>

          {/* GRAND TOTAL HIGHLIGHT CARD */}
          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md flex justify-between items-center border border-slate-800">
            <div>
              <span className="font-bold text-slate-400 text-xs uppercase tracking-wider block">Grand Total</span>
              <span className="text-[10px] text-teal-400 font-extrabold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> AUTO CALCULATED
              </span>
            </div>
            <span className="text-2xl font-black text-teal-400 flex items-center font-mono">
              <IndianRupee className="h-5 w-5 mt-0.5 text-teal-400 mr-0.5" />
              {grandTotal.toFixed(2)}
            </span>
          </div>

          {/* PAYMENT INPUT SECTION */}
          <div className="space-y-4 pt-1">
            {/* Amount Paid with Quick-Fill Paid in Full */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase">
                  Amount Paid (₹) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handlePaidInFull}
                  className="text-[11px] font-extrabold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer"
                >
                  ⚡ Paid in Full
                </button>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <IndianRupee className="h-4 w-4" />
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="Enter amount paid"
                  className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-bold font-mono text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Payment Mode & Transaction ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold bg-white"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">CARD</option>
                  <option value="BANK">BANK TRANSFER</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 flex justify-between">
                  <span>Txn ID</span>
                  {isPaymentModeNonCash && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder={isPaymentModeNonCash ? 'Required' : 'Optional'}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-mono ${
                    isPaymentModeNonCash
                      ? !transactionId.trim()
                        ? 'border border-red-300 bg-red-50/20 focus:ring-2 focus:ring-red-500'
                        : 'border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white'
                      : 'border border-slate-200 bg-slate-50/50 text-slate-500 focus:ring-2 focus:ring-teal-500'
                  }`}
                />
              </div>
            </div>

            {/* Balance Due Display Badge */}
            <div className="p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all">
              <span className="text-slate-600 uppercase">Balance Due</span>
              {balanceDue <= 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ₹0.00 (Fully Paid)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-mono text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> ₹{balanceDue.toFixed(2)}
                </span>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                Billing Remarks / Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any invoice remarks or payment comments..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* GENERATE INVOICE ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleSubmitBill('DRAFT')}
            disabled={submitting}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            Save Draft
          </button>
          
          <div className="relative group">
            <button
              type="button"
              onClick={() => handleSubmitBill('FINALIZED')}
              disabled={!canFinalize}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-teal-600/20 text-xs uppercase tracking-wider cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none flex items-center justify-center gap-1.5"
            >
              <span>Finalize & Print</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Disabled Tooltip */}
            {!canFinalize && (
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-56 p-2 bg-slate-900 text-slate-200 text-xs rounded-lg shadow-xl z-50">
                <p className="font-semibold text-amber-400 mb-1">Cannot finalize yet:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {!isPatientValid && <li>Select patient or enter Walk-in name</li>}
                  {!hasItems && <li>Add at least 1 line item</li>}
                  {!isTransactionIdValid && <li>Transaction ID required for non-cash</li>}
                </ul>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
