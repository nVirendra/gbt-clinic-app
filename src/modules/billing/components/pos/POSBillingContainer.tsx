import React, { useState, useEffect, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import { ClipboardList, AlertTriangle } from 'lucide-react'
import { Patient, Service, Medicine, InventoryBatch } from '../../../../types'
import { CustomerHeaderPanel } from './CustomerHeaderPanel'
import { QuickAddPatientModal } from './QuickAddPatientModal'
import { MedicinePOSController } from './MedicinePOSController'
import { POSInvoiceTable, SelectedItem } from './POSInvoiceTable'
import { POSPaymentSummaryPanel } from './POSPaymentSummaryPanel'
import {
  getAvailableUnitsForMedicine,
  formatStockBreakdown,
  convertToBaseQuantity,
  getUnitConversionFactor
} from '../../../../lib/unitConversion'

interface POSBillingContainerProps {
  onSuccess: () => void
  currentUser: any
  profile: any
  createBill: (payload: any) => Promise<any>
}

export const POSBillingContainer: React.FC<POSBillingContainerProps> = ({
  onSuccess,
  currentUser,
  profile,
  createBill
}) => {
  // Datasets
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [medicineBatches, setMedicineBatches] = useState<InventoryBatch[]>([])

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error') toast.error(message)
    else if (type === 'info') toast.info(message)
    else toast.success(message)
  }

  // Customer / Patient State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isWalkin, setIsWalkin] = useState(false)
  const [walkinName, setWalkinName] = useState('')
  const [showQuickAddPatientModal, setShowQuickAddPatientModal] = useState(false)

  // Invoiced line items state
  const [items, setItems] = useState<SelectedItem[]>([])
  const [recentlyAddedIndex, setRecentlyAddedIndex] = useState<number | null>(null)
  const [lastUsedGstPercent, setLastUsedGstPercent] = useState('12')

  // Line item controller state
  const [itemType, setItemType] = useState<'SERVICE' | 'MEDICINE' | 'MISC'>('MEDICINE')
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const [itemForm, setItemForm] = useState({
    name: '',
    price: '',
    quantity: '1',
    unit: 'Strip',
    discount: '0',
    gstPercent: '12'
  })

  // Bill totals & payment state
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0])
  const [generalDiscount, setGeneralDiscount] = useState('0')
  const [paidAmount, setPaidAmount] = useState('0')
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [transactionId, setTransactionId] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)

  // Input reference for touchless focus
  const itemNameInputRef = useRef<HTMLInputElement>(null)
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
    setTimeout(() => {
      itemNameInputRef.current?.focus()
    }, 100)
  }, [])

  // Sync default tax rate
  useEffect(() => {
    if (profile && profile.defaultTaxRate != null) {
      const defaultGst = profile.defaultTaxRate.toString()
      setItemForm((prev) => ({ ...prev, gstPercent: defaultGst }))
      setLastUsedGstPercent(defaultGst)
    }
  }, [profile])

  // Load active batches when medicine is selected
  useEffect(() => {
    if (itemType === 'MEDICINE' && selectedMed) {
      const fetchBatches = async () => {
        try {
          const activeBatches = await window.api.getMedicineBatches(selectedMed.id)
          setMedicineBatches(activeBatches)

          const defaultUnit =
            selectedMed.purchase_unit ||
            selectedMed.inner_unit ||
            selectedMed.base_unit ||
            selectedMed.unit_label ||
            'Strip'
          const factor = getUnitConversionFactor(selectedMed, defaultUnit)

          // Auto-select FEFO recommended batch (first non-expired with stock)
          if (activeBatches.length > 0) {
            const today = Date.now()
            const fefo =
              activeBatches.find((b: any) => new Date(b.expiry_date).getTime() > today && b.qty_available > 0) ||
              activeBatches[0]

            setSelectedBatch(fefo)
            setItemForm((prev) => ({
              ...prev,
              unit: prev.unit || defaultUnit,
              price: (fefo.selling_price_per_unit * factor).toFixed(2),
              gstPercent:
                selectedMed.default_gst_percent !== null && selectedMed.default_gst_percent !== undefined
                  ? selectedMed.default_gst_percent.toString()
                  : lastUsedGstPercent
            }))
          } else {
            setSelectedBatch(null)
            setItemForm((prev) => ({
              ...prev,
              unit: defaultUnit,
              price: '0',
              gstPercent:
                selectedMed.default_gst_percent !== null && selectedMed.default_gst_percent !== undefined
                  ? selectedMed.default_gst_percent.toString()
                  : lastUsedGstPercent
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
      unit: 'Strip',
      discount: '0',
      gstPercent: lastUsedGstPercent
    })
    setSelectedMed(null)
    setSelectedBatch(null)
    setSelectedService(null)
    showToast('Invoice form reset', 'info')
  }
  resetFormRef.current = resetForm

  const handleResetClick = () => {
    if (items.length > 0) {
      setShowResetConfirmModal(true)
    } else {
      resetForm()
    }
  }

  // Keyboard Shortcuts Listener (F2, F4, Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        handleResetClick()
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
  }, [items])

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setItemForm({
      name: service.name,
      price: service.default_price.toString(),
      quantity: '1',
      unit: 'Unit',
      discount: '0',
      gstPercent: service.gst_percent ? service.gst_percent.toString() : lastUsedGstPercent
    })
  }

  // Handle medicine selection
  const handleMedicineSelect = (med: Medicine) => {
    setSelectedMed(med)
    const defaultUnit = med.purchase_unit || med.inner_unit || med.base_unit || med.unit_label || 'Strip'
    const factor = getUnitConversionFactor(med, defaultUnit)
    setItemForm({
      name: med.name,
      price: selectedBatch ? (selectedBatch.selling_price_per_unit * factor).toFixed(2) : '',
      quantity: '1',
      unit: defaultUnit,
      discount: '0',
      gstPercent: med.default_gst_percent !== null && med.default_gst_percent !== undefined ? med.default_gst_percent.toString() : lastUsedGstPercent
    })
  }

  // Add line item to invoice list
  const addLineItem = () => {
    if (itemType === 'SERVICE' && !selectedService) {
      return showToast('Please select a service from the list.', 'error')
    }
    if (itemType === 'MEDICINE' && (!selectedMed || !selectedBatch)) {
      return showToast('Please select a medicine batch with available stock.', 'error')
    }
    if (itemType === 'MISC' && !itemForm.name.trim()) {
      return showToast('Please enter custom item description.', 'error')
    }

    const price = parseFloat(itemForm.price) || 0
    const qty = parseInt(itemForm.quantity) || 1
    const disc = parseFloat(itemForm.discount) || 0
    const gstPct = parseFloat(itemForm.gstPercent) || 0

    if (qty <= 0) return showToast('Quantity must be greater than 0', 'error')
    if (price < 0) return showToast('Price cannot be negative', 'error')
    if (disc < 0) return showToast('Discount cannot be negative', 'error')

    let baseQty = qty
    let itemNameStr =
      itemType === 'SERVICE'
        ? selectedService!.name
        : itemType === 'MEDICINE'
        ? `${selectedMed!.name} (${selectedBatch!.batch_no})`
        : itemForm.name.trim()

    // Inventory Stock & Expiry Validation
    if (itemType === 'MEDICINE' && selectedBatch && selectedMed) {
      const expiryTime = new Date(selectedBatch.expiry_date).getTime()
      if (expiryTime <= Date.now()) {
        return showToast('Cannot sell an expired batch! Dispensation blocked.', 'error')
      }

      const selectedUnit = itemForm.unit || selectedMed.base_unit || 'Piece'
      baseQty = convertToBaseQuantity(selectedMed, qty, selectedUnit)
      const stockBreakdown = formatStockBreakdown(selectedMed, selectedBatch.qty_available)

      if (baseQty > selectedBatch.qty_available) {
        return showToast(
          `Cannot dispense more than available stock (${stockBreakdown.breakdown}). Requested: ${qty} ${selectedUnit} (${baseQty} ${selectedMed.base_unit || 'Pcs'}).`,
          'error'
        )
      }

      itemNameStr = `${selectedMed.name} (${selectedBatch.batch_no}) - ${qty} ${selectedUnit}`
    }

    const lineSubtotal = price * qty
    const lineTotal = Math.max(0, lineSubtotal - disc)

    const targetId =
      itemType === 'SERVICE'
        ? selectedService!.id
        : itemType === 'MEDICINE'
        ? selectedBatch!.id
        : `misc-${Date.now()}`

    // Duplicate item check
    const existingIndex = items.findIndex((i) => i.id === targetId)
    if (existingIndex >= 0) {
      const copy = [...items]
      const current = copy[existingIndex]
      const updatedQty = current.quantity + baseQty
      const updatedSubtotal = current.price * updatedQty
      copy[existingIndex] = {
        ...current,
        quantity: updatedQty,
        lineTotal: Math.max(0, updatedSubtotal - current.discount)
      }
      setItems(copy)
      setRecentlyAddedIndex(existingIndex)
      showToast(`Updated quantity for '${itemNameStr}'`, 'info')
    } else {
      const newItem: SelectedItem = {
        id: targetId,
        itemType,
        serviceId: itemType === 'SERVICE' ? selectedService!.id : undefined,
        batchId: itemType === 'MEDICINE' ? selectedBatch!.id : undefined,
        name: itemNameStr,
        price: itemType === 'MEDICINE' ? (baseQty > 0 ? lineSubtotal / baseQty : price) : price,
        quantity: baseQty,
        discount: disc,
        gstPercent: gstPct,
        lineTotal,
        availableQty: itemType === 'MEDICINE' ? selectedBatch!.qty_available : undefined
      }

      const updatedItems = [...items, newItem]
      setItems(updatedItems)
      setRecentlyAddedIndex(updatedItems.length - 1)
      showToast(`Added '${itemNameStr}' to invoice`, 'success')
    }

    setLastUsedGstPercent(itemForm.gstPercent)

    // Reset item form
    setItemForm({
      name: '',
      price: '',
      quantity: '1',
      unit: 'Strip',
      discount: '0',
      gstPercent: itemForm.gstPercent
    })
    setSelectedMed(null)
    setSelectedBatch(null)
    setSelectedService(null)

    setTimeout(() => {
      setRecentlyAddedIndex(null)
    }, 2000)

    // Re-focus medicine search input for touchless billing
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

  // Financial Calculations
  const itemsSubtotal = useMemo(() => items.reduce((sum, item) => sum + item.lineTotal, 0), [items])
  const itemsSubtotalPaise = Math.round(itemsSubtotal * 100)
  const gDiscountPaise = Math.round((parseFloat(generalDiscount) || 0) * 100)
  const taxableAmountPaise = Math.max(0, itemsSubtotalPaise - gDiscountPaise)

  const taxTotalPaise = useMemo(() => {
    let tax = 0
    items.forEach((item) => {
      const itemTotalPaise = Math.round(item.lineTotal * 100)
      const share = itemsSubtotalPaise > 0 ? itemTotalPaise / itemsSubtotalPaise : 0
      const allocatedGeneralDiscount = gDiscountPaise * share
      const itemTaxablePaise = Math.max(0, itemTotalPaise - allocatedGeneralDiscount)
      const itemTaxPaise = Math.round((itemTaxablePaise * item.gstPercent) / 100)
      tax += itemTaxPaise
    })
    return tax
  }, [items, itemsSubtotalPaise, gDiscountPaise])

  const exactGrandTotalPaise = taxableAmountPaise + taxTotalPaise
  const roundedGrandTotalPaise = Math.round(exactGrandTotalPaise / 100) * 100
  const roundOffPaise = roundedGrandTotalPaise - exactGrandTotalPaise

  const grandTotal = roundedGrandTotalPaise / 100
  const subtotal = itemsSubtotalPaise / 100
  const discountTotal = gDiscountPaise / 100
  const taxTotal = taxTotalPaise / 100
  const roundOff = roundOffPaise / 100

  const pAmount = parseFloat(paidAmount) || 0

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

  // Submit invoice handler
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
        items: items.map((item) => ({
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

      showToast(
        status === 'DRAFT' ? 'Draft invoice saved successfully!' : 'Invoice finalized & created successfully!',
        'success'
      )

      if (status === 'FINALIZED') {
        await window.api.printInvoice(generatedBill.id)
      }

      onSuccess()
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
      {/* LEFT COLUMN: Patient, Medicine Controller, and Items Table */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col overflow-visible space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-cyan-600" />
            <h2 className="text-base font-bold text-slate-900">New Invoice / Pharmacy POS</h2>
          </div>

          {/* Keyboard shortcuts hints */}
          <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/70">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-2xs font-mono font-bold text-slate-700">
                F2
              </kbd>{' '}
              Reset
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-2xs font-mono font-bold text-slate-700">
                F4
              </kbd>{' '}
              Search Medicine
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-2xs font-mono font-bold text-cyan-700">
                Ctrl+P
              </kbd>{' '}
              Finalize & Print
            </span>
          </div>
        </div>

        {/* STEP 1: CUSTOMER HEADER PANEL */}
        <CustomerHeaderPanel
          selectedPatient={selectedPatient}
          onSelectPatient={setSelectedPatient}
          isWalkin={isWalkin}
          onToggleWalkin={setIsWalkin}
          walkinName={walkinName}
          onChangeWalkinName={setWalkinName}
          billDate={billDate}
          onChangeBillDate={setBillDate}
          patients={patients}
          onOpenQuickAddPatient={() => setShowQuickAddPatientModal(true)}
        />

        {/* STEP 2: MEDICINE POS CONTROLLER PANEL */}
        <MedicinePOSController
          itemType={itemType}
          onChangeItemType={setItemType}
          services={services}
          medicines={medicines}
          medicineBatches={medicineBatches}
          selectedMed={selectedMed}
          onSelectMedicine={handleMedicineSelect}
          selectedBatch={selectedBatch}
          onSelectBatch={setSelectedBatch}
          selectedService={selectedService}
          onSelectService={handleServiceSelect}
          itemForm={itemForm}
          onChangeItemForm={setItemForm}
          onAddLineItem={addLineItem}
          itemNameInputRef={itemNameInputRef}
        />

        {/* STEP 3: POS INVOICE ITEMS REVIEW TABLE */}
        <POSInvoiceTable
          items={items}
          recentlyAddedIndex={recentlyAddedIndex}
          onUpdateLineItem={updateLineItemInline}
          onRemoveLineItem={removeLineItem}
        />
      </div>

      {/* RIGHT COLUMN: STEP 4 & 5 PAYMENT SUMMARY PANEL */}
      <POSPaymentSummaryPanel
        subtotal={subtotal}
        generalDiscount={generalDiscount}
        onChangeGeneralDiscount={setGeneralDiscount}
        taxTotal={taxTotal}
        roundOff={roundOff}
        grandTotal={grandTotal}
        paidAmount={paidAmount}
        onChangePaidAmount={setPaidAmount}
        onPaidInFull={handlePaidInFull}
        paymentMode={paymentMode}
        onChangePaymentMode={setPaymentMode}
        transactionId={transactionId}
        onChangeTransactionId={setTransactionId}
        notes={notes}
        onChangeNotes={setNotes}
        submitting={submitting}
        canFinalize={canFinalize}
        isPatientValid={isPatientValid}
        hasItems={hasItems}
        isTransactionIdValid={isTransactionIdValid}
        onSubmitBill={handleSubmitBill}
      />

      {/* QUICK ADD PATIENT MODAL */}
      <QuickAddPatientModal
        isOpen={showQuickAddPatientModal}
        onClose={() => setShowQuickAddPatientModal(false)}
        userId={currentUser?.id || ''}
        onPatientCreated={(p) => {
          setPatients((prev) => [p, ...prev])
          setSelectedPatient(p)
          setIsWalkin(false)
          showToast(`Registered & selected patient ${p.full_name}`, 'success')
        }}
      />

      {/* RESET CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900">Clear Current POS Invoice?</h4>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to reset this invoice? All {items.length} entered items and payment details will be cleared.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirmModal(false)
                  resetForm()
                }}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Clear Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
