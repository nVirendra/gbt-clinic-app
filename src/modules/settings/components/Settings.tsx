import React, { useState, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { 
  Building2, 
  Users, 
  Database, 
  UserPlus, 
  ShieldAlert, 
  Upload, 
  Percent,
  Download,
  Key,
  X,
  Check,
  CheckCircle2,
  XCircle,
  Info,
  Lock,
  Receipt,
  ShieldCheck,
  FileText,
  Clock,
  HardDrive,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Search,
  AlertTriangle,
  UserCheck,
  Layers,
  IndianRupee,
  ChevronDown,
  Edit2,
  Trash2
} from 'lucide-react'
import { useSettingsStore } from '../store'
import { useAuthStore } from '../../auth/store'
import { useServicesStore } from '../../services/store'
import { Service, UserSummary } from '../../../types'

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

// Password Strength Meter Helper
function getPasswordStrength(password: string): { label: string; score: number; color: string } {
  if (!password) return { label: '', score: 0, color: 'bg-slate-200' }
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[0-9]/.test(password)) score++
  if (/[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { label: 'Weak (min 6 chars)', score: 1, color: 'bg-red-500' }
  if (score === 2) return { label: 'Fair', score: 2, color: 'bg-amber-500' }
  if (score === 3) return { label: 'Good', score: 3, color: 'bg-cyan-500' }
  return { label: 'Strong', score: 4, color: 'bg-cyan-600' }
}

// Random Password Generator Helper
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789#@!'
  let pass = ''
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
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
              : 'border-slate-200 focus:ring-cyan-500'
          } focus:outline-none focus:ring-2 bg-white`}
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
                idx === highlightedIndex ? 'bg-cyan-50 text-cyan-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
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

// Redesigned Add / Edit Price List Item Modal Component (Shared across Services view & Settings tab)
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
            <Layers className="w-5 h-5 text-cyan-400" />
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

        {/* MODAL FORM BODY */}
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
                  : 'border-slate-200 focus:ring-cyan-500 bg-white'
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
                    : 'border-slate-200 focus:ring-cyan-500 bg-white'
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
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-cyan-600/20 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer flex items-center gap-1.5"
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

export default function Settings() {
  const profile = useSettingsStore((state) => state.profile)
  const fetchProfile = useSettingsStore((state) => state.fetchProfile)
  const updateProfile = useSettingsStore((state) => state.updateProfile)
  const backupDatabase = useSettingsStore((state) => state.backupDatabase)
  const restoreDatabase = useSettingsStore((state) => state.restoreDatabase)
  
  const currentUser = useAuthStore((state) => state.user)
  const users = useAuthStore((state) => state.usersList)
  const fetchUsers = useAuthStore((state) => state.fetchUsers)
  const createUser = useAuthStore((state) => state.createUser)
  const toggleUserActive = useAuthStore((state) => state.toggleUserActive)
  const resetPassword = useAuthStore((state) => state.resetPassword)

  const services = useServicesStore((state) => state.services)
  const fetchServices = useServicesStore((state) => state.fetchServices)
  const createService = useServicesStore((state) => state.createService)
  const updateService = useServicesStore((state) => state.updateService)
  const deleteService = useServicesStore((state) => state.deleteService)

  // Tabs: 'profile', 'services', 'users', 'database'
  const [activeSubTab, setActiveSubTab] = useState('profile')

  // Toast feedback helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error') toast.error(message)
    else if (type === 'info') toast.info(message)
    else toast.success(message)
  }

  // Clinic profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    defaultTaxRate: '18',
    invoicePrefix: 'INV',
    fyReset: true,
    backupDir: '',
    autoLockMinutes: '15'
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // Unsaved Changes Guard States
  const [initialProfileForm, setInitialProfileForm] = useState({ ...profileForm })
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingTab, setPendingTab] = useState<string | null>(null)

  // Users management states
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'RECEPTIONIST' })
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [userError, setUserError] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [recentlyCreatedUserId, setRecentlyCreatedUserId] = useState<string | null>(null)
  const usernameInputRef = useRef<HTMLInputElement>(null)
  
  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedUserToReset, setSelectedUserToReset] = useState<UserSummary | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showResetPasswordMask, setShowResetPasswordMask] = useState(true)
  const [resetCopied, setResetCopied] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  // User Deactivate/Activate Confirmation Modal State
  const [showToggleModal, setShowToggleModal] = useState(false)
  const [selectedUserToToggle, setSelectedUserToToggle] = useState<UserSummary | null>(null)
  const [togglingUser, setTogglingUser] = useState(false)

  // Services price list management states
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [serviceSearchQuery, setServiceSearchQuery] = useState('')

  // Load profile values on mount/profile change
  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      const loadedData = {
        name: profile.name || '',
        address: profile.address || '',
        phone: profile.phone || '',
        email: profile.email || '',
        gstin: profile.gstin || '',
        defaultTaxRate: (profile.defaultTaxRate ?? 18).toString(),
        invoicePrefix: profile.invoicePrefix || 'INV',
        fyReset: profile.fyReset ?? true,
        backupDir: profile.backupDir || '',
        autoLockMinutes: (profile.autoLockMinutes ?? 15).toString()
      }
      setProfileForm(loadedData)
      setInitialProfileForm(loadedData)
    }
  }, [profile])

  useEffect(() => {
    if (activeSubTab === 'users' && currentUser?.role === 'ADMIN') {
      fetchUsers()
      setTimeout(() => {
        usernameInputRef.current?.focus()
      }, 100)
    } else if (activeSubTab === 'services') {
      fetchServices()
    }
  }, [activeSubTab])

  // Track Dirty State
  const isDirty = useMemo(() => {
    return JSON.stringify(profileForm) !== JSON.stringify(initialProfileForm)
  }, [profileForm, initialProfileForm])

  // Handle Tab Switch with Unsaved Guard
  const handleTabSwitch = (targetTab: string) => {
    if (activeSubTab === targetTab) return
    if (activeSubTab === 'profile' && isDirty) {
      setPendingTab(targetTab)
      setShowUnsavedModal(true)
    } else {
      setActiveSubTab(targetTab)
    }
  }

  // Validations for Profile Form
  const isNameValid = Boolean(profileForm.name.trim())
  const isAddressValid = Boolean(profileForm.address.trim())
  const cleanPhone = profileForm.phone.replace(/\s+/g, '')
  const isPhoneValid = cleanPhone.length === 10 && (/^\d{10}$/.test(cleanPhone) || /^[6-9]\d{9}$/.test(cleanPhone))
  
  const cleanGstin = profileForm.gstin.trim().toUpperCase()
  const isGstinValid = cleanGstin === '' || (cleanGstin.length === 15 && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGstin))
  const isEmailValid = !profileForm.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())
  
  const autoLockNum = parseInt(profileForm.autoLockMinutes, 10)
  const isAutoLockValid = !isNaN(autoLockNum) && autoLockNum >= 1 && autoLockNum <= 120

  const isProfileValid = isNameValid && isAddressValid && isPhoneValid && isGstinValid && isEmailValid && isAutoLockValid
  const canSaveProfile = isDirty && isProfileValid && !savingProfile

  // GSTIN State Detection
  const gstinStateCode = cleanGstin.length >= 2 ? cleanGstin.substring(0, 2) : ''
  const detectedState = INDIAN_GST_STATE_CODES[gstinStateCode] || null

  // Invoice Format Live Preview
  const previewPrefix = profileForm.invoicePrefix.trim().toUpperCase() || 'INV'
  const previewYear = new Date().getFullYear()
  const previewInvoiceNo = profileForm.fyReset ? `${previewPrefix}-${previewYear}-0001` : `${previewPrefix}-0001`

  // Save Profile Updates Handler
  const handleProfileSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!canSaveProfile) return

    setSavingProfile(true)
    try {
      await updateProfile({
        name: profileForm.name.trim(),
        address: profileForm.address.trim(),
        phone: cleanPhone,
        email: profileForm.email.trim(),
        gstin: cleanGstin,
        defaultTaxRate: parseFloat(profileForm.defaultTaxRate) || 18.0,
        invoicePrefix: previewPrefix,
        fyReset: profileForm.fyReset,
        backupDir: profileForm.backupDir.trim(),
        autoLockMinutes: autoLockNum || 15
      }, currentUser?.id || '')

      const updatedState = {
        name: profileForm.name.trim(),
        address: profileForm.address.trim(),
        phone: cleanPhone,
        email: profileForm.email.trim(),
        gstin: cleanGstin,
        defaultTaxRate: profileForm.defaultTaxRate,
        invoicePrefix: previewPrefix,
        fyReset: profileForm.fyReset,
        backupDir: profileForm.backupDir.trim(),
        autoLockMinutes: (autoLockNum || 15).toString()
      }
      setProfileForm(updatedState)
      setInitialProfileForm(updatedState)

      showToast('Clinic settings & invoicing rules updated!', 'success')
      fetchProfile()
    } catch (e: any) {
      console.error('Profile update failed:', e)
      showToast(e.message || 'Error updating clinic settings', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  // STAFF MANAGEMENT VALIDATIONS & CALCULATIONS
  const cleanUsername = userForm.username.trim()
  const isUsernameFormatValid = cleanUsername.length >= 3 && /^[a-zA-Z0-9_]+$/.test(cleanUsername)
  const isUsernameTaken = users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())
  const registerPassStrength = getPasswordStrength(userForm.password)
  const isRegisterPassValid = userForm.password.length >= 6
  const canRegisterUser = isUsernameFormatValid && !isUsernameTaken && isRegisterPassValid && !creatingUser

  // Count active Admins for safeguard check
  const activeAdminCount = useMemo(() => {
    return users.filter((u) => u.role === 'ADMIN' && u.is_active).length
  }, [users])

  // Filter Users List
  const filteredUsers = useMemo(() => {
    const query = userSearchQuery.toLowerCase().trim()
    if (!query) return users
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
    )
  }, [users, userSearchQuery])

  // Filter Services Price List
  const filteredServices = useMemo(() => {
    const query = serviceSearchQuery.toLowerCase().trim()
    if (!query) return services
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        (s.category && s.category.toLowerCase().includes(query))
    )
  }, [services, serviceSearchQuery])

  // Handle Add User Submit
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserError('')
    if (!canRegisterUser) return

    setCreatingUser(true)
    try {
      const res = await createUser(
        cleanUsername,
        userForm.password,
        userForm.role,
        currentUser?.id || ''
      )

      if (res.success) {
        showToast(`Staff user '${cleanUsername}' registered!`, 'success')
        setUserForm({ username: '', password: '', role: 'RECEPTIONIST' })
        setShowRegisterPassword(false)
        fetchUsers()
      } else {
        setUserError(res.message || 'Username already exists.')
      }
    } catch (err: any) {
      console.error(err)
      setUserError(err.message || 'Failed to create staff account.')
    } finally {
      setCreatingUser(false)
    }
  }

  // Open Deactivate / Activate Modal
  const openToggleActiveModal = (u: UserSummary) => {
    if (u.id === currentUser?.id) {
      return showToast('You cannot deactivate your own logged-in account.', 'error')
    }
    if (u.role === 'ADMIN' && u.is_active && activeAdminCount <= 1) {
      return showToast('Cannot deactivate the last remaining active Admin account.', 'error')
    }
    setSelectedUserToToggle(u)
    setShowToggleModal(true)
  }

  // Handle Deactivate / Activate Submit
  const handleConfirmToggleActive = async () => {
    if (!selectedUserToToggle) return
    const targetStatus = !selectedUserToToggle.is_active
    setTogglingUser(true)
    try {
      await toggleUserActive(selectedUserToToggle.id, targetStatus, currentUser?.id || '')
      showToast(
        `Staff account '${selectedUserToToggle.username}' ${targetStatus ? 'activated' : 'deactivated'}`,
        targetStatus ? 'success' : 'info'
      )
      setShowToggleModal(false)
      setSelectedUserToToggle(null)
      fetchUsers()
    } catch (e: any) {
      showToast(e.message || 'Failed to update user status', 'error')
    } finally {
      setTogglingUser(false)
    }
  }

  // Open Reset Password Modal
  const openResetPasswordModal = (u: UserSummary) => {
    setSelectedUserToReset(u)
    const gen = generateRandomPassword()
    setNewPassword(gen)
    setShowResetPasswordMask(false)
    setResetCopied(false)
    setShowResetModal(true)
  }

  // Copy Reset Credentials
  const handleCopyResetCredentials = () => {
    if (!selectedUserToReset) return
    const textToCopy = `Clinic Account Credentials:\nUsername: ${selectedUserToReset.username}\nPassword: ${newPassword}`
    navigator.clipboard.writeText(textToCopy)
    setResetCopied(true)
    showToast('Credentials copied to clipboard!', 'info')
    setTimeout(() => setResetCopied(false), 3000)
  }

  // Reset User Password Handler
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserToReset || !newPassword.trim()) return
    if (newPassword.length < 6) return showToast('Password must be at least 6 characters.', 'error')

    setResettingPassword(true)
    try {
      await resetPassword(selectedUserToReset.id, newPassword, currentUser?.id || '')
      showToast(`Password successfully reset for '${selectedUserToReset.username}'!`, 'success')
      setShowResetModal(false)
      setSelectedUserToReset(null)
      setNewPassword('')
    } catch (e: any) {
      showToast(e.message || 'Failed to reset password', 'error')
    } finally {
      setResettingPassword(false)
    }
  }

  // Backup Trigger
  const handleBackup = async () => {
    try {
      const res = await backupDatabase(profileForm.backupDir ? `${profileForm.backupDir}\\clinic-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db` : undefined)
      if (res.success) {
        showToast(res.message, 'success')
      } else {
        showToast('Backup Failed: ' + res.message, 'error')
      }
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Error triggering database backup', 'error')
    }
  }

  // Restore Trigger
  const handleRestore = async () => {
    if (currentUser?.role !== 'ADMIN') {
      return showToast('Admin privileges are required to restore database.', 'error')
    }
    const confirmRestore = confirm('CRITICAL WARNING: Restoring the database will replace all current invoices, patients, and inventory records. A safety backup of your current database will be created. Do you want to proceed?')
    if (!confirmRestore) return

    try {
      const res = await restoreDatabase(currentUser.id)
      if (res.success) {
        showToast(res.message, 'success')
        window.location.reload()
      } else {
        showToast('Restore failed: ' + res.message, 'error')
      }
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Error restoring database', 'error')
    }
  }

  // SERVICES CRUD IN SETTINGS TAB (Unified Redesigned Form)
  const handleAddServiceSubmit = async (formData: { name: string; price: string; category: string }) => {
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
      setShowServiceModal(false)
      fetchServices()
    } catch (e: any) {
      console.error('Failed to create service:', e)
      showToast(e.message || 'Error creating service item', 'error')
      throw e
    }
  }

  const handleEditServiceSubmit = async (formData: { name: string; price: string; category: string }) => {
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
      setShowServiceModal(false)
      setEditingService(null)
      fetchServices()
    } catch (e: any) {
      console.error('Failed to update service:', e)
      showToast(e.message || 'Error updating service item', 'error')
      throw e
    }
  }

  const startEditService = (s: Service) => {
    setEditingService(s)
    setShowServiceModal(true)
  }

  const handleDeactivateService = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the price list?`)) return
    try {
      await deleteService({ id, userId: currentUser?.id || '' })
      showToast(`Removed "${name}" from price list`, 'info')
      fetchServices()
    } catch (e: any) {
      showToast(e.message || 'Failed to delete service', 'error')
    }
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-fade-in pb-12">
      


      {/* SUB-TABS SIDEBAR NAVIGATION */}
      <div className="w-full md:w-56 bg-white border border-slate-200 p-4 rounded-2xl flex flex-row md:flex-col gap-1.5 flex-shrink-0 self-start shadow-sm sticky top-6 z-10 overflow-x-auto">
        <button
          onClick={() => handleTabSwitch('profile')}
          className={`w-full text-left px-3.5 py-2.5 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-between ${
            activeSubTab === 'profile' 
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Clinic Settings
          </span>
          {activeSubTab === 'profile' && isDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => handleTabSwitch('services')}
          className={`w-full text-left px-3.5 py-2.5 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'services' 
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Percent className="w-4 h-4" /> Price List (Services)
        </button>

        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => handleTabSwitch('users')}
            className={`w-full text-left px-3.5 py-2.5 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeSubTab === 'users' 
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" /> Staff Management
          </button>
        )}

        <button
          onClick={() => handleTabSwitch('database')}
          className={`w-full text-left px-3.5 py-2.5 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'database' 
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" /> Backup & Restore
        </button>
      </div>

      {/* MAIN SETTINGS PANEL */}
      <div className="flex-1 bg-white border border-slate-200/80 shadow-sm p-6 rounded-2xl overflow-y-auto">
        
        {/* --- CLINIC PROFILE / GENERAL SETTINGS --- */}
        {activeSubTab === 'profile' && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-cyan-600" /> Clinic Settings & Invoicing Rules
              </h3>

              {isDirty && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> Unsaved changes
                </span>
              )}
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              
              {/* SECTION 1: CLINIC IDENTITY */}
              <div className="p-5 bg-slate-50/50 border border-slate-200/80 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-xs font-bold uppercase tracking-wider text-cyan-700">
                  <Building2 className="w-4 h-4 text-cyan-500" /> 1. Clinic Identity & Location
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Clinic Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Clinic / Pharmacy Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Shree Balaji Healthcare Clinic"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className={`w-full px-3.5 py-2 border text-sm rounded-xl focus:outline-none focus:ring-2 font-semibold ${
                          !isNameValid
                            ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                            : 'border-slate-200 focus:ring-cyan-500 bg-white'
                        }`}
                      />
                      <p className="text-[11px] text-slate-400 mt-1 font-sans">Printed at top of all receipts & invoice PDFs.</p>
                    </div>

                    {/* GSTIN / Tax Code */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex justify-between">
                        <span>GSTIN / Tax Registration</span>
                        <span className="text-[11px] text-slate-400 font-normal">15-char format</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 27AAAAA1111A1Z1"
                        value={profileForm.gstin}
                        onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value.toUpperCase() })}
                        className={`w-full px-3.5 py-2 border text-sm rounded-xl focus:outline-none focus:ring-2 font-mono font-semibold uppercase ${
                          !isGstinValid
                            ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                            : 'border-slate-200 focus:ring-cyan-500 bg-white'
                        }`}
                      />
                      {!isGstinValid && (
                        <p className="text-[11px] text-red-500 mt-1 font-medium">Invalid 15-character GSTIN format.</p>
                      )}
                      {detectedState && isGstinValid && (
                        <div className="mt-1.5 p-1.5 bg-cyan-50 border border-cyan-200/80 rounded-lg text-xs font-medium text-cyan-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Detected State: <strong>{detectedState}</strong> (Code {gstinStateCode})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Full Clinic Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Clinic street address, city, state & pincode..."
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className={`w-full px-3.5 py-2 border text-sm rounded-xl focus:outline-none focus:ring-2 ${
                        !isAddressValid
                          ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                          : 'border-slate-200 focus:ring-cyan-500 bg-white'
                      }`}
                    />
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex justify-between">
                        <span>Clinic Phone Number <span className="text-red-500">*</span></span>
                        <span className="text-[11px] text-slate-400 font-normal font-sans">10-digit mobile</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/\s+/g, '') })}
                        className={`w-full px-3.5 py-2 border text-sm rounded-xl focus:outline-none focus:ring-2 font-mono ${
                          !isPhoneValid && profileForm.phone !== ''
                            ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                            : 'border-slate-200 focus:ring-cyan-500 bg-white'
                        }`}
                      />
                      {!isPhoneValid && profileForm.phone !== '' && (
                        <p className="text-[11px] text-red-500 mt-1 font-medium">Must be a valid 10-digit phone number.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Clinic Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. contact@balajiclinic.com"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className={`w-full px-3.5 py-2 border text-sm rounded-xl focus:outline-none focus:ring-2 ${
                          !isEmailValid
                            ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                            : 'border-slate-200 focus:ring-cyan-500 bg-white'
                        }`}
                      />
                      {!isEmailValid && (
                        <p className="text-[11px] text-red-500 mt-1 font-medium">Please enter a valid email address.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: INVOICING RULES */}
              <div className="p-5 bg-slate-50/50 border border-slate-200/80 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-xs font-bold uppercase tracking-wider text-cyan-700">
                  <Receipt className="w-4 h-4 text-cyan-500" /> 2. Invoicing Rules & Tax Defaults
                </div>

                <div className="space-y-4">
                  {/* Default GST Rate with Slab Chips */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex justify-between items-center">
                      <span>Default Invoice GST Rate (%)</span>
                      <span className="text-[11px] text-slate-400 font-normal font-sans">Inherited across new billing lines</span>
                    </label>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {['0', '5', '12', '18', '28'].map((slab) => (
                        <button
                          key={slab}
                          type="button"
                          onClick={() => setProfileForm({ ...profileForm, defaultTaxRate: slab })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            profileForm.defaultTaxRate === slab
                              ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {slab}% GST
                        </button>
                      ))}
                    </div>

                    <input
                      type="number"
                      step="0.01"
                      placeholder="18"
                      value={profileForm.defaultTaxRate}
                      onChange={(e) => setProfileForm({ ...profileForm, defaultTaxRate: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-mono font-bold"
                    />
                    <p className="text-[11px] text-slate-400 mt-1 font-sans">
                      Helper: This GST rate will be pre-filled automatically when adding new items on the billing screen.
                    </p>
                  </div>

                  {/* Invoice Prefix & FY Reset */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Invoice Number Prefix</label>
                      <input
                        type="text"
                        placeholder="e.g. INV"
                        value={profileForm.invoicePrefix}
                        onChange={(e) => setProfileForm({ ...profileForm, invoicePrefix: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-mono font-bold uppercase"
                      />
                      
                      <label className="flex items-center mt-3 text-xs font-medium text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileForm.fyReset}
                          onChange={(e) => setProfileForm({ ...profileForm, fyReset: e.target.checked })}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 mr-2 h-4 w-4"
                        />
                        <span>Reset sequence at Financial Year (April 1)</span>
                      </label>
                    </div>

                    {/* Live Invoice Prefix Preview Card */}
                    <div className="p-3.5 bg-white border border-cyan-200/80 rounded-xl space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5 text-cyan-600" /> Invoice Number Live Preview
                      </span>
                      <div className="font-mono text-base font-extrabold text-cyan-950 bg-cyan-50/60 px-3 py-1.5 rounded-lg border border-cyan-100">
                        #{previewInvoiceNo}
                      </div>
                      <p className="text-[10px] text-slate-500 font-sans">
                        Next generated bill will follow this numbering pattern.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: SYSTEM & SECURITY */}
              <div className="p-5 bg-slate-50/50 border border-slate-200/80 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-xs font-bold uppercase tracking-wider text-cyan-700">
                  <ShieldCheck className="w-4 h-4 text-cyan-500" /> 3. System Administration & Backup Path
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Auto-Lock Idle */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Auto-Lock Idle Timeout (Minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="15"
                      value={profileForm.autoLockMinutes}
                      onChange={(e) => setProfileForm({ ...profileForm, autoLockMinutes: e.target.value })}
                      className={`w-full px-3.5 py-2 border rounded-xl text-sm font-mono font-bold bg-white focus:outline-none focus:ring-2 ${
                        !isAutoLockValid
                          ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                          : 'border-slate-200 focus:ring-cyan-500'
                      }`}
                    />
                    {!isAutoLockValid && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">Must be an integer between 1 and 120 minutes.</p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1 font-sans">
                      Automatically locks screen after specified inactivity period.
                    </p>
                  </div>

                  {/* Auto-Backup Directory */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Auto-Backup Directory Path
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. C:\ClinicBackups"
                      value={profileForm.backupDir}
                      onChange={(e) => setProfileForm({ ...profileForm, backupDir: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1 font-sans">
                      Folder location for saving local SQLite database backups.
                    </p>
                  </div>
                </div>
              </div>

              {/* PINNED / STICKY BOTTOM SAVE ACTION BAR */}
              <div className="sticky bottom-2 z-20 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-slate-800">
                <div className="text-xs">
                  {isDirty ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> You have unsaved setting changes
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">Settings are up to date</span>
                  )}
                </div>

                <div className="relative group">
                  <button
                    type="submit"
                    disabled={!canSaveProfile}
                    className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-cyan-500/20 transition-all disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none cursor-pointer flex items-center gap-1.5"
                  >
                    {savingProfile ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Save Settings
                      </>
                    )}
                  </button>

                  {/* Disabled Tooltip */}
                  {!canSaveProfile && (
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-56 p-2 bg-slate-950 text-slate-200 text-xs rounded-lg border border-slate-800 shadow-xl z-50">
                      <p className="font-semibold text-amber-400 mb-1">Cannot save yet:</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                        {!isDirty && <li>No changes made yet</li>}
                        {!isNameValid && <li>Clinic name required</li>}
                        {!isAddressValid && <li>Address required</li>}
                        {!isPhoneValid && <li>Phone must be 10 digits</li>}
                        {!isGstinValid && <li>GSTIN format invalid</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

            </form>
          </div>
        )}

        {/* --- SERVICES PRICE LIST TAB (Redesigned & Shared with Services Module) --- */}
        {activeSubTab === 'services' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <Percent className="h-5 w-5 text-cyan-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Price List (Clinic Services & Procedures)
                </h3>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                    placeholder="Search by name or category..."
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingService(null)
                    setShowServiceModal(true)
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Layers className="w-4 h-4" /> Add Item
                </button>
              </div>
            </div>

            <div className="border border-slate-200/80 rounded-2xl overflow-hidden text-sm bg-white shadow-2xs">
              <table className="w-full text-left border-collapse">
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
                      <td className="px-6 py-4 text-right font-extrabold text-cyan-900 font-mono">
                        ₹{(service?.price ?? service?.default_price ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center space-x-1.5">
                        <button
                          onClick={() => startEditService(service)}
                          title="Edit Service"
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition inline-flex items-center cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeactivateService(service.id, service.name)}
                          title="Delete Service"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition inline-flex items-center cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredServices.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                        No price list items found. Click "Add Item" to configure.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- STAFF MANAGEMENT TAB (Admin only - Redesigned) --- */}
        {activeSubTab === 'users' && currentUser?.role === 'ADMIN' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-600" /> Staff Accounts & Credential Privileges
              </span>
              <span className="text-xs font-normal text-slate-500 font-mono">
                {users.length} staff registered ({activeAdminCount} Admins)
              </span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: Register Staff Form */}
              <div className="lg:col-span-5 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="text-xs font-bold text-cyan-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <UserPlus className="h-4 w-4 text-cyan-500" /> Register Staff Account
                </h4>

                {userError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-3.5 py-2.5 rounded-xl text-xs font-medium">
                    <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-500" />
                    <span>{userError}</span>
                  </div>
                )}

                <form onSubmit={handleUserSubmit} className="space-y-4 text-slate-800">
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex justify-between">
                      <span>Username <span className="text-red-500">*</span></span>
                      <span className="text-[11px] text-slate-400 font-normal">No spaces</span>
                    </label>
                    <input
                      ref={usernameInputRef}
                      type="text"
                      placeholder="e.g. receptionist_joy"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value.replace(/\s+/g, '') })}
                      className={`w-full px-3.5 py-2 border text-sm rounded-xl focus:outline-none focus:ring-2 font-semibold ${
                        isUsernameTaken
                          ? 'border-amber-300 bg-amber-50/30 focus:ring-amber-500'
                          : !isUsernameFormatValid && userForm.username !== ''
                          ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                          : 'border-slate-200 focus:ring-cyan-500 bg-white'
                      }`}
                    />

                    {/* Inline Validation Warnings */}
                    {isUsernameTaken && (
                      <p className="text-[11px] text-amber-700 mt-1 font-bold">
                        ⚠️ Notice: Username '{cleanUsername}' is already registered.
                      </p>
                    )}
                    {!isUsernameFormatValid && userForm.username !== '' && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">
                        Must be at least 3 chars (letters, numbers, underscores).
                      </p>
                    )}
                  </div>

                  {/* Password with Masking Toggle & Strength Meter */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex justify-between">
                      <span>Password <span className="text-red-500">*</span></span>
                      <span className="text-[11px] text-slate-400 font-normal">Min 6 characters</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        placeholder="Enter secure password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        className={`w-full pl-3.5 pr-10 py-2 border text-sm rounded-xl focus:outline-none focus:ring-2 font-mono ${
                          !isRegisterPassValid && userForm.password !== ''
                            ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                            : 'border-slate-200 focus:ring-cyan-500 bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* LIVE PASSWORD STRENGTH METER */}
                    {userForm.password && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Strength:</span>
                          <span className="font-bold text-slate-800">{registerPassStrength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                          <div className={`h-full transition-all duration-300 ${registerPassStrength.score >= 1 ? registerPassStrength.color : 'bg-transparent'}`} style={{ width: '25%' }}></div>
                          <div className={`h-full transition-all duration-300 ${registerPassStrength.score >= 2 ? registerPassStrength.color : 'bg-transparent'}`} style={{ width: '25%' }}></div>
                          <div className={`h-full transition-all duration-300 ${registerPassStrength.score >= 3 ? registerPassStrength.color : 'bg-transparent'}`} style={{ width: '25%' }}></div>
                          <div className={`h-full transition-all duration-300 ${registerPassStrength.score >= 4 ? registerPassStrength.color : 'bg-transparent'}`} style={{ width: '25%' }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Role / Privilege with Contextual Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Role / Privilege Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-semibold bg-white"
                    >
                      <option value="RECEPTIONIST">RECEPTIONIST</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>

                    {/* ROLE PRIVILEGE DESCRIPTION BADGE */}
                    <div className="mt-2 p-2.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-600 space-y-0.5">
                      {userForm.role === 'ADMIN' ? (
                        <>
                          <div className="font-bold text-indigo-900 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Admin Privilege Access
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Full system access including Clinic Settings, Staff Accounts, and Database Backups.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-cyan-600" /> Receptionist Privilege Access
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Access to Patient Profiles, Billing Invoices, and Inventory Stock.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="relative group pt-2">
                    <button
                      type="submit"
                      disabled={!canRegisterUser}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {creatingUser ? (
                        <span>Registering...</span>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" /> Register Staff Account
                        </>
                      )}
                    </button>

                    {/* Disabled Tooltip */}
                    {!canRegisterUser && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 hidden group-hover:block p-2 bg-slate-900 text-slate-200 text-xs rounded-lg shadow-xl z-50">
                        <p className="font-semibold text-amber-400 mb-1">Cannot register yet:</p>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                          {!isUsernameFormatValid && <li>Username required (min 3 chars)</li>}
                          {isUsernameTaken && <li>Username '{cleanUsername}' is taken</li>}
                          {!isRegisterPassValid && <li>Password min 6 chars required</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* RIGHT COLUMN: Registered Users Table & Search */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Registered Staff Users
                  </h4>

                  {/* Search Filter */}
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search user or role..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="px-4 py-3">Username</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredUsers.map((u) => {
                        const isSelf = u.id === currentUser?.id
                        const isLastAdmin = u.role === 'ADMIN' && u.is_active && activeAdminCount <= 1
                        const isRecentlyCreated = recentlyCreatedUserId === u.id

                        return (
                          <tr 
                            key={u.id} 
                            className={`transition-colors duration-500 ${
                              isRecentlyCreated 
                                ? 'bg-cyan-50/90 font-medium' 
                                : 'hover:bg-slate-50/50'
                            }`}
                          >
                            <td className="px-4 py-3.5 font-bold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <span>{u.username}</span>
                                {isSelf && (
                                  <span className="text-[10px] bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded font-extrabold">
                                    YOU
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[10px] ${
                                u.role === 'ADMIN' 
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {u.role}
                              </span>
                            </td>

                            <td className="px-4 py-3.5">
                              {u.is_active ? (
                                <span className="inline-flex items-center gap-1 text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 text-[11px]">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-600" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                                  Inactive
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-3">
                                {/* Reset Password Button */}
                                <button
                                  type="button"
                                  onClick={() => openResetPasswordModal(u)}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Key className="w-3.5 h-3.5" /> Reset Pass
                                </button>

                                {/* Deactivate / Activate Button */}
                                {isSelf ? (
                                  <span className="text-xs text-slate-300 font-medium cursor-not-allowed" title="You cannot deactivate your own logged-in account">
                                    Deactivate
                                  </span>
                                ) : isLastAdmin ? (
                                  <span className="text-xs text-slate-300 font-medium cursor-not-allowed" title="Cannot deactivate the last remaining active Admin account">
                                    Deactivate
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openToggleActiveModal(u)}
                                    className={`text-xs font-bold transition-colors cursor-pointer ${
                                      u.is_active 
                                        ? 'text-red-500 hover:text-red-700' 
                                        : 'text-cyan-600 hover:text-cyan-800'
                                    }`}
                                  >
                                    {u.is_active ? 'Deactivate' : 'Activate'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}

                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                            No staff users found matching search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- DATABASE BACKUP & RESTORE TAB --- */}
        {activeSubTab === 'database' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center">
              <Database className="h-5 w-5 text-cyan-600 mr-2" /> Database Backups & Administration
            </h3>

            <div className="max-w-md space-y-6">
              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/60 text-slate-600 text-sm space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center">
                  <ShieldAlert className="h-4.5 w-4.5 text-amber-500 mr-2" /> Why Backup?
                </h4>
                <p className="leading-relaxed text-xs">
                  Because this application runs **100% offline**, all patient records and invoices are saved exclusively on this computer. 
                  In case of system failure, having backups saved to an external USB or shared drive is the only way to safeguard your data.
                </p>
                <p className="leading-relaxed text-xs font-semibold text-cyan-700">
                  Recommended: Perform a backup export at the end of every working day.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Backup Button */}
                <button
                  onClick={handleBackup}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-cyan-500 rounded-2xl hover:bg-cyan-50/10 transition group cursor-pointer"
                >
                  <Download className="h-8 w-8 text-slate-400 group-hover:text-cyan-600 transition" />
                  <span className="text-sm font-bold text-slate-800 mt-2.5">Backup Database</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 text-center px-2">Export a database copy (.db)</span>
                </button>

                {/* Restore Button */}
                {currentUser?.role === 'ADMIN' ? (
                  <button
                    onClick={handleRestore}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-red-400 rounded-2xl hover:bg-red-50/10 transition group cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-slate-400 group-hover:text-red-500 transition" />
                    <span className="text-sm font-bold mt-2.5 text-red-700">Restore Database</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 text-center px-2">Import an existing backup copy</span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50 text-slate-300 opacity-60">
                    <Upload className="h-8 w-8 text-slate-300" />
                    <span className="text-sm font-bold mt-2.5">Restore Database</span>
                    <span className="text-[9px] text-center px-2">Admin privilege required</span>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>

      {/* UNSAVED CHANGES CONFIRMATION MODAL */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 text-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600 font-bold text-md">
              <ShieldAlert className="w-5 h-5" />
              <h3>Unsaved Changes Notice</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have unsaved changes in Clinic Settings. Do you want to save or discard your changes before navigating away?
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await handleProfileSubmit()
                  setShowUnsavedModal(false)
                  if (pendingTab) setActiveSubTab(pendingTab)
                }}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                Save Changes & Switch Tab
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileForm({ ...initialProfileForm })
                  setShowUnsavedModal(false)
                  if (pendingTab) setActiveSubTab(pendingTab)
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                className="w-full py-2 text-slate-500 hover:text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER DEACTIVATE / ACTIVATE CONFIRMATION MODAL */}
      {showToggleModal && selectedUserToToggle && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 text-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-md">
              <ShieldAlert className={`w-5 h-5 ${selectedUserToToggle.is_active ? 'text-red-500' : 'text-cyan-600'}`} />
              <h3>{selectedUserToToggle.is_active ? 'Deactivate Staff Account' : 'Activate Staff Account'}</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to {selectedUserToToggle.is_active ? 'deactivate' : 'activate'} staff account{' '}
              <strong className="text-slate-900 font-bold">'{selectedUserToToggle.username}'</strong> ({selectedUserToToggle.role})?
              {selectedUserToToggle.is_active && (
                <span className="block mt-1 text-red-600 font-medium">
                  This user will no longer be able to log in or access billing and patient records.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowToggleModal(false)
                  setSelectedUserToToggle(null)
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={togglingUser}
                onClick={handleConfirmToggleActive}
                className={`px-5 py-2 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer ${
                  selectedUserToToggle.is_active
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                    : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/20'
                }`}
              >
                {togglingUser ? 'Updating...' : selectedUserToToggle.is_active ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENHANCED PASSWORD RESET MODAL */}
      {showResetModal && selectedUserToReset && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 text-slate-800 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                <Key className="h-4.5 w-4.5 text-indigo-600" /> Reset Password
              </h3>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">User: {selectedUserToReset.username}</p>
                <p className="text-[11px] text-slate-500">
                  Generate or type a new password. The staff member will need these credentials to log in.
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type={showResetPasswordMask ? 'password' : 'text'}
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono font-bold bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordMask(!showResetPasswordMask)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showResetPasswordMask ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* ACTION TOOLS: RANDOM GENERATOR & COPY */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setNewPassword(generateRandomPassword())
                    setShowResetPasswordMask(false)
                  }}
                  className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600" /> Random Pass
                </button>
                
                <button
                  type="button"
                  onClick={handleCopyResetCredentials}
                  className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-indigo-200"
                >
                  {resetCopied ? <Check className="w-3.5 h-3.5 text-cyan-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{resetCopied ? 'Copied!' : 'Copy Info'}</span>
                </button>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword || newPassword.length < 6}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {resettingPassword ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REDESIGNED SERVICE / PRICE LIST MODAL (UNIFIED) */}
      <RedesignedServiceModal
        isOpen={showServiceModal}
        onClose={() => {
          setShowServiceModal(false)
          setEditingService(null)
        }}
        onSubmit={editingService ? handleEditServiceSubmit : handleAddServiceSubmit}
        editingService={editingService}
        existingServices={services}
      />

    </div>
  )
}
