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
  AlertTriangle
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

export default function Billing({ onSuccess }: BillingProps) {
  const profile = useSettingsStore((state) => state.profile)
  const currentUser = useAuthStore((state) => state.user)
  const createBill = useBillingStore((state) => state.createBill)

  // Datasets
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [medicineBatches, setMedicineBatches] = useState<InventoryBatch[]>([])

  // Search/selection states
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isWalkin, setIsWalkin] = useState(false)
  const [walkinName, setWalkinName] = useState('')
  
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [showItemDropdown, setShowItemDropdown] = useState(false)

  // Invoiced line items state
  const [items, setItems] = useState<SelectedItem[]>([])

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

  // Input references for keyboard focus
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
    if (profile) {
      setItemForm(prev => ({ ...prev, gstPercent: profile.defaultTaxRate.toString() }))
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
            setItemForm(prev => ({
              ...prev,
              price: firstBatch.selling_price_per_unit.toString(),
              gstPercent: selectedMed.default_gst_percent.toString()
            }))
          } else {
            setSelectedBatch(null)
            setItemForm(prev => ({ ...prev, price: '0', gstPercent: selectedMed.default_gst_percent.toString() }))
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
      gstPercent: profile?.defaultTaxRate.toString() || '18'
    })
    setSelectedMed(null)
    setSelectedBatch(null)
    setSelectedService(null)
  }
  resetFormRef.current = resetForm

  // Keyboard Shortcuts Listener
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

  // Filter patients
  const filteredPatients = useMemo(() => {
    const query = patientSearch.toLowerCase()
    return patients.filter(p =>
      p.full_name.toLowerCase().includes(query) ||
      p.phone.includes(patientSearch) ||
      p.patient_code.toLowerCase().includes(query)
    )
  }, [patients, patientSearch])

  // Filter service/medicine autocomplete options
  const filteredServiceOptions = useMemo(() => {
    if (itemType !== 'SERVICE' || !itemForm.name) return []
    const query = itemForm.name.toLowerCase()
    return services.filter(s => s.name.toLowerCase().includes(query))
  }, [services, itemType, itemForm.name])

  const filteredMedicineOptions = useMemo(() => {
    if (itemType !== 'MEDICINE' || !itemForm.name) return []
    const query = itemForm.name.toLowerCase()
    return medicines.filter(m => m.name.toLowerCase().includes(query))
  }, [medicines, itemType, itemForm.name])

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setItemForm({
      name: service.name,
      price: service.default_price.toString(),
      quantity: '1',
      discount: '0',
      gstPercent: service.gst_percent.toString()
    })
    setShowItemDropdown(false)
  }

  // Handle medicine selection
  const handleMedicineSelect = (med: Medicine) => {
    setSelectedMed(med)
    setItemForm({
      name: med.name,
      price: '',
      quantity: '1',
      discount: '0',
      gstPercent: med.default_gst_percent.toString()
    })
    setShowItemDropdown(false)
  }

  // Add line item to list
  const addLineItem = () => {
    if (itemType === 'SERVICE' && !selectedService) {
      return alert('Please select a service from the list.')
    }
    if (itemType === 'MEDICINE' && (!selectedMed || !selectedBatch)) {
      return alert('Please select a medicine batch with available stock.')
    }
    if (itemType === 'MISC' && !itemForm.name.trim()) {
      return alert('Please specify custom item name.')
    }

    const name = itemType === 'SERVICE' 
      ? selectedService!.name 
      : itemType === 'MEDICINE' 
      ? `${selectedMed!.name} (${selectedBatch!.batch_no})` 
      : itemForm.name

    const price = parseFloat(itemForm.price) || 0
    const qty = parseInt(itemForm.quantity) || 1
    const disc = parseFloat(itemForm.discount) || 0
    const gstPct = parseFloat(itemForm.gstPercent) || 0

    // Validations
    if (qty <= 0) return alert('Qty must be greater than 0')
    if (price < 0) return alert('Price cannot be negative')
    if (disc < 0) return alert('Discount cannot be negative')

    if (itemType === 'MEDICINE' && selectedBatch) {
      if (new Date(selectedBatch.expiry_date).getTime() <= Date.now()) {
        return alert('Cannot dispense an expired batch. Dispensation blocked.')
      }
      if (qty > selectedBatch.qty_available) {
        return alert(`Cannot dispense more than available quantity (${selectedBatch.qty_available} units).`)
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

    setItems([...items, newItem])
    
    // Clear item selector form
    setItemForm({
      name: '',
      price: '',
      quantity: '1',
      discount: '0',
      gstPercent: profile?.defaultTaxRate.toString() || '18'
    })
    setSelectedMed(null)
    setSelectedBatch(null)
    setSelectedService(null)
  }

  // Remove line item
  const removeLineItem = (index: number) => {
    const updated = [...items]
    updated.splice(index, 1)
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

  // Submit invoice
  const handleSubmitBill = async (status: 'DRAFT' | 'FINALIZED') => {
    if (!isWalkin && !selectedPatient) {
      alert('Please select a patient or toggle Walk-in Patient.')
      return
    }
    if (isWalkin && !walkinName.trim()) {
      alert('Please enter Walk-in patient name.')
      return
    }
    if (items.length === 0) {
      alert('Please add at least one line item.')
      return
    }
    if (!billDate || isNaN(new Date(billDate).getTime())) {
      alert('Please select a valid invoice date.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        patientId: isWalkin ? undefined : selectedPatient!.id,
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
      
      alert(status === 'DRAFT' ? 'Draft invoice saved!' : 'Invoice finalized and created successfully!')
      
      if (status === 'FINALIZED') {
        // Trigger system print
        await window.api.printInvoice(generatedBill.id)
      }
      
      onSuccess() // redirect to invoices
    } catch (e: any) {
      console.error('Invoice creation failed:', e)
      alert(e.message || 'Error generating invoice')
    } finally {
      setSubmitting(false)
    }
  }
  handleSubmitBillRef.current = handleSubmitBill

  return (
    <div className="h-full flex gap-8 animate-fade-in">
      
      {/* LEFT COLUMN: Invoiced items & details */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <ClipboardList className="h-5 w-5 text-teal-600 mr-2" /> Invoice Specifications
          </h2>
          
          {/* Keyboard shortcuts hints */}
          <div className="flex items-center space-x-3 text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm text-slate-500 font-mono">F2</kbd> Reset</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm text-slate-500 font-mono">F4</kbd> Focus Item</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm text-slate-500 font-mono">Ctrl+P</kbd> Finalize</span>
          </div>
        </div>

        {/* Top details row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 flex-shrink-0 items-end">
          
          {/* Patient Selector */}
          <div className="relative md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-505 uppercase tracking-wider">
                Select Patient *
              </label>
              <label className="inline-flex items-center text-xs text-teal-655 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWalkin}
                  onChange={(e) => {
                    setIsWalkin(e.target.checked)
                    setSelectedPatient(null)
                  }}
                  className="mr-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
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
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold"
              />
            ) : selectedPatient ? (
              <div className="flex items-center justify-between border border-teal-200 bg-teal-50/20 px-3.5 py-2 rounded-xl text-sm">
                <div className="flex items-center">
                  <UserCheck className="h-4.5 w-4.5 text-teal-600 mr-2.5" />
                  <div>
                    <span className="font-semibold text-slate-900">{selectedPatient.full_name}</span>
                    <span className="text-[10px] text-slate-550 font-mono ml-2">({selectedPatient.patient_code})</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-slate-400 hover:text-slate-655 text-xs font-semibold cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value)
                      setShowPatientDropdown(true)
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    placeholder="Search by Patient Name, Phone, or Code..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                
                {/* Dropdown list */}
                {showPatientDropdown && patientSearch && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                    {filteredPatients.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">No patients match search.</div>
                    ) : (
                      filteredPatients.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPatient(p)
                            setPatientSearch('')
                            setShowPatientDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex justify-between items-center cursor-pointer"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{p.full_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{p.patient_code}</p>
                          </div>
                          <span className="text-xs text-slate-500 font-mono">{p.phone}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bill Date */}
          <div>
            <label className="block text-xs font-bold text-slate-505 uppercase tracking-wider mb-1.5">
              Invoice Date
            </label>
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-slate-50/50"
            />
          </div>
        </div>

        {/* Invoice items table */}
        <div className="flex-1 border border-slate-200/60 rounded-xl overflow-hidden flex flex-col mb-6">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-505 font-semibold">
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Item / Service Name</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Discount</th>
                  <th className="px-4 py-3 text-right">GST %</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-655">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                      No items added yet. Search and configure items below.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/20">
                      <td className="px-5 py-3.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-655">{item.itemType}</span></td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">{item.name}</td>
                      <td className="px-4 py-3.5 text-right font-mono">₹{item.price.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-center font-semibold">{item.quantity}</td>
                      <td className="px-4 py-3.5 text-right text-red-500 font-mono">-₹{item.discount.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-right font-mono">{item.gstPercent}%</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-800 font-mono">
                        ₹{item.lineTotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => removeLineItem(index)}
                          className="text-red-500 hover:text-red-750 p-1 rounded hover:bg-red-55 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add item controller */}
        <div className="bg-slate-50 border border-slate-200/80 p-4.5 rounded-2xl flex-shrink-0">
          <div className="flex border-b border-slate-200 mb-3 pb-1 justify-between items-center">
            <div className="flex space-x-4">
              {[
                { id: 'SERVICE', label: 'Service' },
                { id: 'MEDICINE', label: 'Medicine' },
                { id: 'MISC', label: 'Custom/Misc' }
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
                      gstPercent: profile?.defaultTaxRate.toString() || '18'
                    })
                  }}
                  className={`pb-1 text-xs font-bold uppercase transition-all cursor-pointer ${
                    itemType === t.id 
                      ? 'border-b-2 border-teal-500 text-teal-600' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            
            {/* Batch Info Alerts */}
            {itemType === 'MEDICINE' && selectedBatch && (
              <div className="flex items-center space-x-2 text-[10px]">
                {new Date(selectedBatch.expiry_date).getTime() - Date.now() <= 30 * 24 * 60 * 60 * 1000 ? (
                  <span className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded font-bold border border-yellow-200">
                    <AlertTriangle className="h-3 w-3 mr-0.5 text-yellow-505" /> Expiring Soon ({new Date(selectedBatch.expiry_date).toLocaleDateString('en-GB')})
                  </span>
                ) : (
                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold border border-green-200">
                    Active Stock ({selectedBatch.qty_available} units avail)
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-12 gap-3 items-end">
            {/* Item Autocomplete Search / Custom name input */}
            <div className="col-span-4 relative">
              <label className="block text-[10px] font-bold text-slate-550 mb-1">
                {itemType === 'SERVICE' ? 'Search Service *' : itemType === 'MEDICINE' ? 'Search Medicine *' : 'Item Name *'}
              </label>
              <input
                type="text"
                ref={itemNameInputRef}
                value={itemForm.name}
                onChange={(e) => {
                  setItemForm({ ...itemForm, name: e.target.value })
                  setShowItemDropdown(true)
                }}
                onFocus={() => setShowItemDropdown(true)}
                placeholder={itemType === 'SERVICE' ? 'e.g. Consultation' : itemType === 'MEDICINE' ? 'e.g. Paracetamol' : 'Enter charge description'}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              />
              
              {/* Autocomplete selection dropdown */}
              {showItemDropdown && itemForm.name && (itemType === 'SERVICE' || itemType === 'MEDICINE') && (
                <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto z-50 divide-y divide-slate-100">
                  {itemType === 'SERVICE' && filteredServiceOptions
                    .map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleServiceSelect(s)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex justify-between cursor-pointer"
                      >
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        <span className="text-slate-500 font-mono">₹{s.default_price.toFixed(2)}</span>
                      </button>
                    ))}
                  
                  {itemType === 'MEDICINE' && filteredMedicineOptions
                    .map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleMedicineSelect(m)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex justify-between cursor-pointer"
                      >
                        <span className="font-semibold text-slate-800">{m.name}</span>
                        <span className="text-slate-400 text-[10px] capitalize">{m.type}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Medicine Batch Selector */}
            {itemType === 'MEDICINE' && (
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-550 mb-1">Batch *</label>
                <select
                  value={selectedBatch ? selectedBatch.id : ''}
                  onChange={(e) => {
                    const b = medicineBatches.find(x => x.id === e.target.value)
                    if (b) {
                      setSelectedBatch(b)
                      setItemForm(prev => ({ ...prev, price: b.selling_price_per_unit.toString() }))
                    }
                  }}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                >
                  {medicineBatches.map(b => (
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
              <label className="block text-[10px] font-bold text-slate-550 mb-1">Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-right font-mono"
              />
            </div>

            {/* Qty */}
            <div className="col-span-1">
              <label className="block text-[10px] font-bold text-slate-550 mb-1">Qty *</label>
              <input
                type="number"
                value={itemForm.quantity}
                onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                placeholder="1"
                min="1"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-center"
              />
            </div>

            {/* Discount */}
            <div className="col-span-1">
              <label className="block text-[10px] font-bold text-slate-550 mb-1">Disc (₹)</label>
              <input
                type="number"
                step="0.01"
                value={itemForm.discount}
                onChange={(e) => setItemForm({ ...itemForm, discount: e.target.value })}
                placeholder="0"
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-right text-red-500 font-mono"
              />
            </div>

            {/* GST % */}
            <div className="col-span-1">
              <label className="block text-[10px] font-bold text-slate-550 mb-1">GST %</label>
              <input
                type="number"
                value={itemForm.gstPercent}
                onChange={(e) => setItemForm({ ...itemForm, gstPercent: e.target.value })}
                placeholder="18"
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-right font-mono"
              />
            </div>

            {/* Add Button */}
            <div className={itemType === 'MEDICINE' ? 'col-span-1' : 'col-span-2'}>
              <button
                type="button"
                onClick={addLineItem}
                className="w-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-medium py-1.8 rounded-lg text-xs transition cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-0.5" /> Add
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Calculations & Payments */}
      <div className="w-96 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between flex-shrink-0">
        
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <FileText className="h-5 w-5 text-teal-600 mr-2" /> Payment Summary
          </h2>

          {/* Subtotal & adjustments */}
          <div className="space-y-3.5 border-b border-slate-100 pb-5 text-sm">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Items Total</span>
              <span className="font-mono">₹{subtotal.toFixed(2)}</span>
            </div>
            
            {/* General Discount */}
            <div className="flex justify-between items-center text-slate-500">
              <span className="font-medium">General Discount</span>
              <div className="relative w-28">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">₹</span>
                <input
                  type="number"
                  value={generalDiscount}
                  onChange={(e) => setGeneralDiscount(e.target.value)}
                  className="w-full pl-6 pr-2.5 py-1 border border-slate-200 rounded-lg text-right text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium font-mono text-red-650"
                />
              </div>
            </div>

            {/* CGST / SGST split calculation */}
            <div className="flex justify-between text-slate-500 font-medium">
              <span>CGST Split (Half)</span>
              <span className="font-mono">₹{(taxTotal / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-medium">
              <span>SGST Split (Half)</span>
              <span className="font-mono">₹{(taxTotal / 2).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-500 font-medium border-t border-dashed border-slate-100 pt-2">
              <span>Total Tax (GST)</span>
              <span className="font-mono">₹{taxTotal.toFixed(2)}</span>
            </div>

            {/* Round off */}
            <div className="flex justify-between text-slate-400 text-xs font-semibold">
              <span>Round Off difference</span>
              <span className="font-mono">{roundOff >= 0 ? '+' : ''}₹{roundOff.toFixed(2)}</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 flex justify-between items-center">
            <span className="font-bold text-slate-600 text-sm">Grand Total</span>
            <span className="text-2xl font-black text-slate-900 flex items-center font-mono">
              <IndianRupee className="h-5 w-5 mt-0.5 text-teal-655 mr-0.5" />
              {grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Payment input section */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Amount Paid (₹) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <IndianRupee className="h-4 w-4" />
                </span>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="Enter amount paid"
                  className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-505 uppercase tracking-wider mb-1.5">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Ref ID (optional)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                />
              </div>
            </div>

            {/* Balance Due Display */}
            <div className="flex justify-between items-center text-sm font-semibold pt-1">
              <span className="text-slate-500">Balance Due:</span>
              <span className={`font-mono ${balanceDue > 0 ? 'text-red-600 font-bold text-base' : 'text-teal-600 font-bold text-base'}`}>
                ₹{balanceDue.toFixed(2)}
              </span>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Billing Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any invoice notes or comment..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Generate Invoice Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => handleSubmitBill('DRAFT')}
            disabled={submitting}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition text-sm cursor-pointer disabled:opacity-50"
          >
            Save Draft
          </button>
          
          <button
            onClick={() => handleSubmitBill('FINALIZED')}
            disabled={submitting}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-teal-600/10 text-sm cursor-pointer disabled:opacity-50"
          >
            Finalize & Print
          </button>
        </div>

      </div>
    </div>
  )
}
