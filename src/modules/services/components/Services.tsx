import React, { useState, useEffect, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Layers, 
  Search, 
  X, 
  IndianRupee, 
  Check, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ShieldAlert, 
  ChevronDown 
} from 'lucide-react'
import { useServicesStore } from '../store'
import { useAuthStore } from '../../auth/store'
import { Service } from '../../../types'

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

// Generic Free-Text Typeahead Combobox Component for Form Inputs
function FreeTextCombobox({
  value,
  onChange,
  options,
  placeholder,
  error,
  inputRef
}: {
  value: string
  onChange: (val: string) => void
  options: Array<{ value: string; label?: string; meta?: string }>
  placeholder?: string
  error?: string
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
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Redesigned Add / Edit Price List Item Modal Component
function RedesignedServiceModal({
  isOpen,
  onClose,
  onSubmit,
  editingService,
  existingServices
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: { name: string; price: string; category: string }) => Promise<void>
  editingService: Service | null
  existingServices: Service[]
}) {
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Initialize form when modal opens or editingService changes
  useEffect(() => {
    if (isOpen) {
      if (editingService) {
        const rawPrice = editingService.price ?? editingService.default_price ?? 0
        setForm({
          name: editingService.name || '',
          price: rawPrice > 0 ? rawPrice.toFixed(2) : '',
          category: editingService.category || ''
        })
      } else {
        setForm({
          name: '',
          price: '',
          category: ''
        })
      }

      // Auto-focus Service Name input on open
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, editingService])

  if (!isOpen) return null

  // Category Autocomplete Options from existing services
  const categoryOptions = Array.from(
    new Set(existingServices.map((s) => s.category).filter(Boolean) as string[])
  ).map((cat) => ({ value: cat }))

  // Price formatting on blur (formats 500 -> 500.00)
  const handlePriceBlur = () => {
    const parsed = parseFloat(form.price)
    if (!isNaN(parsed) && parsed >= 0) {
      setForm((prev) => ({ ...prev, price: parsed.toFixed(2) }))
    }
  }

  // Duplicate Service Name Check (Non-blocking warning)
  const trimmedName = form.name.trim().toLowerCase()
  const duplicateMatch = trimmedName.length >= 2
    ? existingServices.find(
        (s) =>
          s.id !== editingService?.id &&
          (s.name.toLowerCase() === trimmedName || s.name.toLowerCase().includes(trimmedName))
      )
    : null

  // Validations
  const isNameValid = Boolean(form.name.trim())
  const priceNum = parseFloat(form.price)
  const isPriceValid = !isNaN(priceNum) && priceNum >= 0

  const isValid = isNameValid && isPriceValid

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!isValid || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        price: form.price,
        category: form.category.trim()
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
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden flex flex-col"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-teal-400" />
            <h3 className="text-md font-bold">
              {editingService ? 'Edit Price List Item' : 'Add Price List Item'}
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

        {/* MODAL FORM BODY (SIMPLE 3-FIELD LAYOUT) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800">
          
          {/* Service / Procedure Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Service / Procedure Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="e.g. Dental Scaling, Consultation"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full py-2 px-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 font-semibold ${
                !isNameValid && form.name !== ''
                  ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                  : 'border-slate-200 focus:ring-teal-500'
              }`}
            />
            {!isNameValid && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">Service name is required.</p>
            )}

            {/* DUPLICATE SERVICE WARNING */}
            {duplicateMatch && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-start gap-2 text-amber-900 animate-fade-in">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Notice: Similar item already in price list!</span>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    <strong className="text-amber-950">{duplicateMatch.name}</strong> (Price: ₹{(duplicateMatch.price ?? duplicateMatch.default_price ?? 0).toFixed(2)})
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Price (₹) with embedded currency prefix */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Standard Price (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <IndianRupee className="h-4 w-4" />
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                onBlur={handlePriceBlur}
                className={`w-full pl-9 pr-3.5 py-2 rounded-xl border text-sm font-bold font-mono focus:outline-none focus:ring-2 ${
                  !isPriceValid && form.price !== ''
                    ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                    : 'border-slate-200 focus:ring-teal-500'
                }`}
              />
            </div>
            {!isPriceValid && form.price !== '' && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">Price must be a valid non-negative number.</p>
            )}
          </div>

          {/* Category (Optional Autocomplete Combobox) */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex justify-between">
              <span>Category</span>
              <span className="text-[11px] text-slate-400 font-normal">Optional</span>
            </label>
            <FreeTextCombobox
              value={form.category}
              onChange={(val) => setForm({ ...form, category: val })}
              options={categoryOptions}
              placeholder="e.g. Consultations, Laboratory, Dental"
            />
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel (Esc)
            </button>

            <div className="relative group">
              <button
                type="submit"
                disabled={!isValid || submitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-teal-600/20 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> {editingService ? 'Save Changes' : 'Add Service'}
                  </>
                )}
              </button>

              {/* Disabled tooltip */}
              {!isValid && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-52 p-2 bg-slate-900 text-slate-200 text-xs rounded-lg shadow-xl z-50">
                  <p className="font-semibold text-amber-400 mb-1">Cannot save yet:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {!isNameValid && <li>Service name required</li>}
                    {!isPriceValid && <li>Valid price required</li>}
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

export default function Services() {
  const services = useServicesStore((state) => state.services)
  const loading = useServicesStore((state) => state.loading)
  const fetchServices = useServicesStore((state) => state.fetchServices)
  const createService = useServicesStore((state) => state.createService)
  const updateService = useServicesStore((state) => state.updateService)
  const deleteService = useServicesStore((state) => state.deleteService)

  const currentUser = useAuthStore((state) => state.user)

  const [searchQuery, setSearchQuery] = useState('')

  // Toast feedback helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error') toast.error(message)
    else if (type === 'info') toast.info(message)
    else toast.success(message)
  }

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  // Handle Add Service Submit
  const handleAddSubmit = async (formData: { name: string; price: string; category: string }) => {
    try {
      await createService({
        data: {
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category || null
        },
        userId: currentUser?.id || ''
      })
      showToast('Price list item added successfully!', 'success')
      setShowAddModal(false)
      fetchServices()
    } catch (e: any) {
      console.error('Failed to create service:', e)
      showToast(e.message || 'Error creating service item', 'error')
      throw e
    }
  }

  // Open Edit Modal
  const openEdit = (service: Service) => {
    setEditingService(service)
    setShowEditModal(true)
  }

  // Handle Edit Service Submit
  const handleEditSubmit = async (formData: { name: string; price: string; category: string }) => {
    if (!editingService) return
    try {
      await updateService({
        id: editingService.id,
        data: {
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category || null
        },
        userId: currentUser?.id || ''
      })
      showToast('Price list item updated!', 'success')
      setShowEditModal(false)
      setEditingService(null)
      fetchServices()
    } catch (e: any) {
      console.error('Failed to update service:', e)
      showToast(e.message || 'Error updating service item', 'error')
      throw e
    }
  }

  // Soft Delete Service
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the price list?`)) {
      return
    }

    try {
      await deleteService({ id, userId: currentUser?.id || '' })
      showToast(`Removed "${name}" from price list`, 'info')
      fetchServices()
    } catch (e: any) {
      console.error('Failed to delete service:', e)
      showToast(e.message || 'Error deleting service', 'error')
    }
  }

  const filteredServices = useMemo(() => {
    const query = searchQuery.toLowerCase()
    if (!query) return services
    return services.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.category && s.category.toLowerCase().includes(query))
    )
  }, [services, searchQuery])

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      


      {/* TOP CONTROLLER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search price list by item name or category..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
          />
        </div>

        {/* Add button */}
        <button
          onClick={() => {
            setEditingService(null)
            setShowAddModal(true)
          }}
          className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service / Procedure
        </button>

      </div>

      {/* PRICE LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading && filteredServices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading price list...</div>
        ) : filteredServices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No services configured yet. Add items to configure your price list.</div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Service / Procedure Name</th>
                <th className="px-6 py-4 text-right">Standard Price</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-slate-50/40 transition">
                  <td className="px-6 py-4">
                    {service.category ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                        {service.category}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Uncategorized</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{service.name}</td>
                  <td className="px-6 py-4 text-right font-extrabold text-teal-900 font-mono">
                    ₹{(service?.price ?? service?.default_price ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-center space-x-1.5">
                    <button
                      onClick={() => openEdit(service)}
                      title="Edit Service"
                      className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition inline-flex items-center cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id, service.name)}
                      title="Delete Service"
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition inline-flex items-center cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- REDESIGNED ADD SERVICE MODAL --- */}
      <RedesignedServiceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        editingService={null}
        existingServices={services}
      />

      {/* --- REDESIGNED EDIT SERVICE MODAL --- */}
      <RedesignedServiceModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingService(null)
        }}
        onSubmit={handleEditSubmit}
        editingService={editingService}
        existingServices={services}
      />

    </div>
  )
}
