import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { 
  Search, 
  UserPlus, 
  Edit2, 
  Trash2,
  Phone, 
  MapPin, 
  User, 
  History, 
  AlertOctagon, 
  Stethoscope, 
  FileText,
  X,
  Check,
  CheckCircle2,
  XCircle,
  Info,
  Calendar,
  ShieldAlert,
  ChevronDown,
  Tag
} from 'lucide-react'
import { usePatientsStore } from '../store'
import { useAuthStore } from '../../auth/store'
import { Patient } from '../../../types'

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

// Helpers for DOB <-> Age Sync
function calculateAgeFromDob(dobStr: string): string {
  if (!dobStr) return ''
  const birthDate = new Date(dobStr)
  if (isNaN(birthDate.getTime())) return ''
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age >= 0 ? age.toString() : ''
}

function calculateDobFromAge(ageStr: string, currentDob?: string): string {
  const age = parseInt(ageStr, 10)
  if (isNaN(age) || age < 0 || age > 120) return ''
  const currentYear = new Date().getFullYear()
  const birthYear = currentYear - age
  if (currentDob) {
    const parts = currentDob.split('-')
    if (parts.length === 3) {
      return `${birthYear}-${parts[1]}-${parts[2]}`
    }
  }
  return `${birthYear}-01-01`
}

// Redesigned Add / Edit Patient Modal Component
function RedesignedPatientModal({
  isOpen,
  onClose,
  onSubmit,
  editingPatient,
  existingPatients
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: any) => Promise<void>
  editingPatient: Patient | null
  existingPatients: Patient[]
}) {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    dob: '',
    ageYears: '',
    gender: 'MALE',
    address: '',
    referringDoctor: '',
    notes: ''
  })

  // Allergy Chips State
  const [allergiesList, setAllergiesList] = useState<string[]>([])
  const [allergyInput, setAllergyInput] = useState('')
  const [noAllergies, setNoAllergies] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const fullNameInputRef = useRef<HTMLInputElement>(null)

  // Initialize form when modal opens or editingPatient changes
  useEffect(() => {
    if (isOpen) {
      if (editingPatient) {
        const rawDob = editingPatient.dob ? new Date(editingPatient.dob).toISOString().split('T')[0] : ''
        const rawAge = editingPatient.age_years ? editingPatient.age_years.toString() : calculateAgeFromDob(rawDob)
        const rawAllergies = editingPatient.allergies_notes || ''

        let isNkda = false
        let parsedTags: string[] = []

        if (rawAllergies) {
          if (rawAllergies.toLowerCase().includes('no known') || rawAllergies.toUpperCase().includes('NKDA')) {
            isNkda = true
          } else {
            parsedTags = rawAllergies.split(',').map((s) => s.trim()).filter(Boolean)
          }
        }

        setForm({
          fullName: editingPatient.full_name || '',
          phone: editingPatient.phone || '',
          dob: rawDob,
          ageYears: rawAge,
          gender: editingPatient.gender || 'MALE',
          address: editingPatient.address || '',
          referringDoctor: editingPatient.referring_doctor || '',
          notes: editingPatient.notes || ''
        })
        setNoAllergies(isNkda)
        setAllergiesList(parsedTags)
        setAllergyInput('')
      } else {
        setForm({
          fullName: '',
          phone: '',
          dob: '',
          ageYears: '',
          gender: 'MALE',
          address: '',
          referringDoctor: '',
          notes: ''
        })
        setNoAllergies(false)
        setAllergiesList([])
        setAllergyInput('')
      }

      // Auto-focus Full Name input on open
      setTimeout(() => {
        fullNameInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, editingPatient])

  if (!isOpen) return null

  // Bi-directional DOB <-> Age Sync Handlers
  const handleDobChange = (newDob: string) => {
    const calcAge = calculateAgeFromDob(newDob)
    setForm((prev) => ({
      ...prev,
      dob: newDob,
      ageYears: calcAge || prev.ageYears
    }))
  }

  const handleAgeChange = (newAge: string) => {
    const calcDob = calculateDobFromAge(newAge, form.dob)
    setForm((prev) => ({
      ...prev,
      ageYears: newAge,
      dob: calcDob || prev.dob
    }))
  }

  // Allergy Chips Handlers
  const addAllergyTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed) return
    if (!allergiesList.includes(trimmed)) {
      setAllergiesList([...allergiesList, trimmed])
    }
    setNoAllergies(false)
    setAllergyInput('')
  }

  const removeAllergyTag = (index: number) => {
    setAllergiesList(allergiesList.filter((_, i) => i !== index))
  }

  const commonAllergies = ['Penicillin', 'Sulfa Drugs', 'Aspirin', 'NSAIDS', 'Latex', 'Peanuts']

  // Doctor Autocomplete Options
  const doctorOptions = Array.from(
    new Set(existingPatients.map((p) => p.referring_doctor).filter(Boolean) as string[])
  ).map((doc) => ({ value: doc }))

  // Validations
  const isNameValid = Boolean(form.fullName.trim())
  const cleanPhone = form.phone.replace(/\s+/g, '')
  const isPhoneValid = cleanPhone.length === 10 && (/^\d{10}$/.test(cleanPhone) || /^[6-9]\d{9}$/.test(cleanPhone))
  const isGenderValid = Boolean(form.gender)

  const isValid = isNameValid && isPhoneValid && isGenderValid

  // Duplicate Patient Check (Matching Name AND Phone)
  const trimmedName = form.fullName.trim().toLowerCase()
  const duplicateMatch = (trimmedName.length >= 3 && cleanPhone.length === 10)
    ? existingPatients.find(
        (p) =>
          p.id !== editingPatient?.id &&
          p.full_name.toLowerCase() === trimmedName &&
          p.phone.replace(/\s+/g, '') === cleanPhone
      )
    : null

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!isValid || submitting) return

    let serializedAllergies = ''
    if (noAllergies) {
      serializedAllergies = 'No known allergies (NKDA)'
    } else if (allergiesList.length > 0) {
      serializedAllergies = allergiesList.join(', ')
    }

    setSubmitting(true)
    try {
      await onSubmit({
        fullName: form.fullName.trim(),
        phone: cleanPhone,
        dob: form.dob || null,
        ageYears: form.ageYears ? parseInt(form.ageYears, 10) : null,
        gender: form.gender,
        address: form.address,
        referringDoctor: form.referringDoctor,
        allergiesNotes: serializedAllergies,
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
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-teal-400" />
            <h3 className="text-md font-bold">
              {editingPatient ? 'Edit Patient Profile' : 'Register New Patient'}
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-slate-800 flex-1">
          
          {/* SECTION 1: IDENTITY & DEMOGRAPHICS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <User className="w-4 h-4 text-teal-500" /> 1. Patient Identity & Demographics
            </div>

            <div className="space-y-3">
              {/* Full Name & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fullNameInputRef}
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className={`w-full py-2 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 font-semibold ${
                      !isNameValid && form.fullName !== ''
                        ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                        : 'border-slate-200 focus:ring-teal-500'
                    }`}
                  />
                  {!isNameValid && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">Full name is required.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex justify-between">
                    <span>Phone Number <span className="text-red-500">*</span></span>
                    <span className="text-[11px] text-slate-400 font-normal">10-digit mobile</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\s+/g, '') })}
                    className={`w-full py-2 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 font-mono font-semibold ${
                      !isPhoneValid && form.phone !== ''
                        ? 'border-red-300 bg-red-50/20 focus:ring-red-500'
                        : 'border-slate-200 focus:ring-teal-500'
                    }`}
                  />
                  {!isPhoneValid && form.phone !== '' && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">Must be a valid 10-digit phone number.</p>
                  )}
                </div>
              </div>

              {/* DUPLICATE PATIENT WARNING */}
              {duplicateMatch && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-start gap-2 text-amber-900 animate-fade-in">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Notice: Matching Patient Already Exists!</span>
                    <div className="text-[11px] text-amber-800 mt-0.5">
                      <strong className="text-amber-950">{duplicateMatch.full_name}</strong> (Ph: {duplicateMatch.phone}, Code: <code className="font-mono">{duplicateMatch.patient_code}</code>)
                    </div>
                  </div>
                </div>
              )}

              {/* DOB ↔ AGE SYNC & GENDER */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => handleDobChange(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                {/* Age (Years) */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex justify-between">
                    <span>Age (Years)</span>
                    <span className="text-[10px] text-teal-600 font-bold">LIVE SYNC</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 35"
                    value={form.ageYears}
                    onChange={(e) => handleAgeChange(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold text-slate-900"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold bg-white"
                  >
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CONTACT & REFERRAL */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <MapPin className="w-4 h-4 text-teal-500" /> 2. Contact Location & Referral Info
            </div>

            <div className="space-y-3">
              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Postal Address</label>
                <textarea
                  rows={2}
                  placeholder="Patient residence or city address..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Referring Doctor (Typeahead) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Referring Doctor (if any)</label>
                <FreeTextCombobox
                  value={form.referringDoctor}
                  onChange={(val) => setForm({ ...form, referringDoctor: val })}
                  options={doctorOptions}
                  placeholder="e.g. Dr. A. K. Sharma"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: CLINICAL ALERTS & NOTES (SAFETY FORWARD TINTED CARD) */}
          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/70 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                <AlertOctagon className="w-4 h-4 text-amber-600" /> 3. Medical Allergies & Clinical Alerts
              </div>

              {/* NKDA Checkbox Toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-amber-950 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-xs hover:bg-amber-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={noAllergies}
                  onChange={(e) => {
                    setNoAllergies(e.target.checked)
                    if (e.target.checked) {
                      setAllergiesList([])
                      setAllergyInput('')
                    }
                  }}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>No known allergies (NKDA)</span>
              </label>
            </div>

            {/* ALLERGY CHIPS INPUT PANEL */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-amber-900 uppercase">
                Known Drug / Substance Allergies
              </label>

              {noAllergies ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Confirmed: Patient has <strong>No Known Drug Allergies (NKDA)</strong>.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Active Chips List */}
                  <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] p-2 bg-white border border-amber-300 rounded-xl">
                    {allergiesList.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-900 border border-red-200 rounded-lg text-xs font-bold shadow-2xs"
                      >
                        <span>{allergy}</span>
                        <button
                          type="button"
                          onClick={() => removeAllergyTag(idx)}
                          className="text-red-500 hover:text-red-800 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}

                    <input
                      type="text"
                      placeholder={allergiesList.length === 0 ? "Type allergy & press Enter..." : "Add another allergy..."}
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault()
                          addAllergyTag(allergyInput)
                        }
                      }}
                      className="flex-1 min-w-[140px] border-none text-xs text-slate-800 placeholder-amber-700/50 focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Common Quick-Add Allergy Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-amber-800 font-medium">Quick add:</span>
                    {commonAllergies.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => addAllergyTag(item)}
                        className="px-2 py-0.5 bg-amber-100/80 hover:bg-amber-200 text-amber-950 border border-amber-300/80 rounded-md text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* General Notes */}
            <div>
              <label className="block text-xs font-bold text-amber-900 uppercase mb-1">General Clinical Notes</label>
              <textarea
                rows={2}
                placeholder="Clinical history, chronic conditions, or comments..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full py-2 px-3 rounded-xl border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 shrink-0">
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
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-teal-600/20 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Register Patient
                  </>
                )}
              </button>

              {/* Disabled tooltip */}
              {!isValid && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-56 p-2 bg-slate-900 text-slate-200 text-xs rounded-lg shadow-xl z-50">
                  <p className="font-semibold text-amber-400 mb-1">Cannot save yet:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {!isNameValid && <li>Full name required</li>}
                    {!isPhoneValid && <li>Phone number must be 10 digits</li>}
                    {!isGenderValid && <li>Gender selection required</li>}
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

export default function Patients() {
  const patients = usePatientsStore((state) => state.patients)
  const selectedPatient = usePatientsStore((state) => state.selectedPatient)
  const loading = usePatientsStore((state) => state.loading)
  const detailLoading = usePatientsStore((state) => state.detailLoading)
  const fetchPatients = usePatientsStore((state) => state.fetchPatients)
  const selectPatient = usePatientsStore((state) => state.selectPatient)
  const createPatient = usePatientsStore((state) => state.createPatient)
  const updatePatient = usePatientsStore((state) => state.updatePatient)
  const deletePatient = usePatientsStore((state) => state.deletePatient)

  const currentUser = useAuthStore((state) => state.user)

  const [searchQuery, setSearchQuery] = useState('')

  // Toast feedback helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error') toast.error(message)
    else if (type === 'info') toast.info(message)
    else toast.success(message)
  }

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Load patients list on start
  useEffect(() => {
    fetchPatients()
  }, [])

  // Handle Search Input with debounce
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchPatients(searchQuery)
    }, 300)
    return () => clearTimeout(delaySearch)
  }, [searchQuery])

  // Handle Create Patient Submit
  const handleAddSubmit = async (formData: any) => {
    try {
      await createPatient({
        full_name: formData.fullName,
        dob: formData.dob || null,
        age_years: formData.ageYears || null,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address || null,
        referring_doctor: formData.referringDoctor || null,
        allergies_notes: formData.allergiesNotes || null,
        notes: formData.notes || null
      }, currentUser?.id || '')

      showToast('Patient registered successfully!', 'success')
      setShowAddModal(false)
    } catch (e: any) {
      showToast(e.message || 'Error registering patient', 'error')
      throw e
    }
  }

  // Handle Update Patient Submit
  const handleEditSubmit = async (formData: any) => {
    if (!selectedPatient) return
    try {
      await updatePatient(selectedPatient.id, {
        full_name: formData.fullName,
        dob: formData.dob || null,
        age_years: formData.ageYears || null,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address || null,
        referring_doctor: formData.referringDoctor || null,
        allergies_notes: formData.allergiesNotes || null,
        notes: formData.notes || null
      }, currentUser?.id || '')

      showToast('Patient profile updated!', 'success')
      setShowEditModal(false)
    } catch (e: any) {
      showToast(e.message || 'Error updating patient details', 'error')
      throw e
    }
  }

  // Soft Delete Patient
  const handleDeletePatient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patient record? This will soft-delete their profile.')) return
    try {
      await deletePatient(id, currentUser?.id || '')
      showToast('Patient record soft-deleted', 'info')
    } catch (e: any) {
      showToast(e.message || 'Failed to delete patient', 'error')
    }
  }

  // Calculate stats for patient details
  const getPatientStats = () => {
    if (!selectedPatient?.bills) return { totalBilled: 0, outstanding: 0 }
    let totalBilled = 0
    let outstanding = 0
    selectedPatient.bills.forEach(b => {
      totalBilled += b.grand_total
      outstanding += b.balance_due
    })
    return { totalBilled, outstanding }
  }

  const { totalBilled, outstanding } = getPatientStats()

  return (
    <div className="h-full flex gap-8 animate-fade-in">
      


      {/* LEFT COLUMN: List & Search */}
      <div className="w-1/3 min-w-[320px] bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50 flex-shrink-0">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Code, Phone..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 rounded-xl text-sm transition shadow-sm cursor-pointer"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Register Patient
          </button>
        </div>

        {/* Patients Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading && patients.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading patients...</div>
          ) : patients.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No patients found.</div>
          ) : (
            patients.map((pat) => (
              <button
                key={pat.id}
                onClick={() => selectPatient(pat.id)}
                className={`w-full text-left p-4.5 transition flex items-center justify-between border-l-4 ${
                  selectedPatient?.id === pat.id
                    ? 'bg-teal-50/40 border-teal-500'
                    : 'border-transparent hover:bg-slate-50/50'
                }`}
              >
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-900 truncate">{pat.full_name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{pat.patient_code}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{pat.gender}, {pat.age_years || (pat.dob ? (new Date().getFullYear() - new Date(pat.dob).getFullYear()) : 'N/A')} yrs</p>
                  <p className="mt-0.5 font-mono">{pat.phone}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Details Pane */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
        {detailLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : selectedPatient ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Detail Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between flex-shrink-0 bg-slate-50/20">
              <div className="flex space-x-4">
                <div className="h-16 w-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xl uppercase">
                  {selectedPatient.full_name.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h2 className="text-xl font-bold text-slate-900">{selectedPatient.full_name}</h2>
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {selectedPatient.patient_code}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-slate-500 mt-1">
                    <span>{selectedPatient.gender}, {selectedPatient.age_years || (selectedPatient.dob ? (new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()) : 'N/A')} years</span>
                    <span>•</span>
                    <span className="flex items-center font-mono">
                      <Phone className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      {selectedPatient.phone}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition cursor-pointer"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDeletePatient(selectedPatient.id)}
                    className="flex items-center bg-red-50 hover:bg-red-100 text-red-600 font-medium px-4 py-2 rounded-xl text-sm transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Record
                  </button>
                )}
              </div>
            </div>

            {/* Detail Panels (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 uppercase">Total Invoiced Amount</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">₹{totalBilled.toFixed(2)}</p>
                </div>
                <div className={`border p-4 rounded-xl ${outstanding > 0 ? 'bg-red-50/50 border-red-200' : 'bg-green-50/50 border-green-200'}`}>
                  <p className="text-xs font-bold text-slate-500 uppercase">Outstanding Dues</p>
                  <p className={`text-xl font-bold mt-1 ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{outstanding.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Profile Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Info Block */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <User className="h-4 w-4 mr-1.5" /> Clinical & General Info
                  </h3>
                  
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3 text-sm">
                    {selectedPatient.address && (
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-slate-400 mr-2.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400">Address</p>
                          <p className="text-slate-700 mt-0.5">{selectedPatient.address}</p>
                        </div>
                      </div>
                    )}
                    {selectedPatient.referring_doctor && (
                      <div className="flex items-start">
                        <Stethoscope className="h-4 w-4 text-slate-400 mr-2.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400">Referring Doctor</p>
                          <p className="text-slate-700 mt-0.5">{selectedPatient.referring_doctor}</p>
                        </div>
                      </div>
                    )}
                    {selectedPatient.notes && (
                      <div className="flex items-start">
                        <FileText className="h-4 w-4 text-slate-400 mr-2.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400">General Notes</p>
                          <p className="text-slate-700 mt-0.5">{selectedPatient.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Allergies & Alerts Block */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <AlertOctagon className="h-4 w-4 mr-1.5" /> Medical Allergies & Alerts
                  </h3>
                  
                  <div className={`p-4 rounded-xl border min-h-[110px] flex flex-col justify-center ${
                    selectedPatient.allergies_notes 
                      ? 'bg-red-50/30 border-red-200 text-red-800' 
                      : 'bg-slate-50/50 border-slate-100 text-slate-500'
                  }`}>
                    {selectedPatient.allergies_notes ? (
                      <div className="flex items-start">
                        <AlertOctagon className="h-5 w-5 text-red-500 mr-2.5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold uppercase text-red-500 tracking-wider">Allergies Warning</p>
                          <p className="text-sm font-semibold text-red-900 mt-0.5">{selectedPatient.allergies_notes}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-sm py-4">No known allergies logged.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Patient Visit & Bill History */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <History className="h-4 w-4 mr-1.5" /> Visit & Invoice History
                </h3>

                <div className="border border-slate-200/60 rounded-xl overflow-hidden">
                  {!selectedPatient.bills || selectedPatient.bills.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm bg-slate-50/30">
                      No invoices recorded for this patient yet.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Invoice Number</th>
                          <th className="px-6 py-3 text-right">Grand Total</th>
                          <th className="px-6 py-3 text-right">Balance Due</th>
                          <th className="px-6 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {selectedPatient.bills.map((bill) => (
                          <tr key={bill.id} className="hover:bg-slate-50/40 transition">
                            <td className="px-6 py-4">
                              {new Date(bill.bill_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="px-6 py-4 font-mono font-medium text-slate-900">{bill.bill_no}</td>
                            <td className="px-6 py-4 text-right font-semibold">₹{bill.grand_total.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-semibold">
                              {bill.balance_due > 0 ? (
                                <span className="text-red-500">₹{bill.balance_due.toFixed(2)}</span>
                              ) : (
                                <span className="text-green-500">₹0.00</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                                bill.status === 'CANCELLED'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : bill.status === 'DRAFT'
                                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                  : bill.balance_due === 0
                                  ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {bill.status === 'FINALIZED' && bill.balance_due > 0 && bill.amount_paid > 0 ? 'PARTIAL' : bill.status === 'FINALIZED' && bill.balance_due === 0 ? 'PAID' : bill.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm">
            Select a patient or click "Register Patient" to add a new record.
          </div>
        )}
      </div>

      {/* --- REDESIGNED ADD PATIENT MODAL --- */}
      <RedesignedPatientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        editingPatient={null}
        existingPatients={patients}
      />

      {/* --- REDESIGNED EDIT PATIENT MODAL --- */}
      <RedesignedPatientModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        editingPatient={selectedPatient}
        existingPatients={patients}
      />

    </div>
  )
}
