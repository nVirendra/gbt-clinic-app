import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Medicine, Vendor, InventoryBatch, Purchase } from '../../../../types'
import { PurchaseInvoiceHeader, PurchaseHeaderFormState } from './PurchaseInvoiceHeader'
import { MedicineSearchPreview } from './MedicineSearchPreview'
import { BatchItemEntryPanel, StockInItemFormState } from './BatchItemEntryPanel'
import { InvoiceItemsTable } from './InvoiceItemsTable'
import { InvoiceFinancialSummary } from './InvoiceFinancialSummary'
import { formatExpiryToISO } from '../../../../lib/formatDate'

interface StockPurchaseInContainerProps {
  medicines: Medicine[]
  vendors: Vendor[]
  batches: InventoryBatch[]
  purchases: Purchase[]
  currentUser: any
  onSavePurchase: (purchasePayload: any) => Promise<void>
  onOpenQuickAddVendor: () => void
  onOpenQuickCreateMedicine: () => void
  onOpenScanInvoice: () => void
  loadAllData: () => Promise<void>
}

export const StockPurchaseInContainer: React.FC<StockPurchaseInContainerProps> = ({
  medicines,
  vendors,
  batches,
  purchases,
  currentUser,
  onSavePurchase,
  onOpenQuickAddVendor,
  onOpenQuickCreateMedicine,
  onOpenScanInvoice,
  loadAllData
}) => {
  // Toast feedback helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error') toast.error(message)
    else if (type === 'info') toast.info(message)
    else toast.success(message)
  }

  // Step 1 Header Form State
  const [headerForm, setHeaderForm] = useState<PurchaseHeaderFormState>({
    vendorId: '',
    purchaseInvoiceNo: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseType: 'CASH',
    taxType: 'INTRASTATE', // INTRASTATE (CGST+SGST) / INTERSTATE (IGST)
    paymentMode: 'CASH',
    dueDate: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paidAmount: '',
    notes: ''
  })

  // Items List in Current Purchase Invoice
  const [invoiceItems, setInvoiceItems] = useState<any[]>([])

  // Step 2 Item Entry Form State
  const [stockInItem, setStockInItem] = useState<StockInItemFormState>({
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

  // UX & Flow States
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [recentlyAddedIndex, setRecentlyAddedIndex] = useState<number | null>(null)
  const [lastUsedGstPercent, setLastUsedGstPercent] = useState('12')
  const [submittingPurchase, setSubmittingPurchase] = useState(false)

  const medicineInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus medicine input on load
  useEffect(() => {
    setTimeout(() => {
      medicineInputRef.current?.focus()
    }, 100)
  }, [])

  // Handle Medicine Selection with Auto-Filling Defaults from Medicine Master & Previous Batches
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

    const prevBatch = batches.find((b) => b.medicine_id === selectedMed.id)
    const defaultUnit =
      selectedMed.purchase_unit ||
      selectedMed.inner_unit ||
      selectedMed.base_unit ||
      selectedMed.unit_label ||
      'Piece'

    setStockInItem((prev) => ({
      ...prev,
      medicineId: selectedMed.id,
      unit: defaultUnit,
      freeUnit: defaultUnit,
      gstPercent:
        selectedMed.default_gst_percent !== null && selectedMed.default_gst_percent !== undefined
          ? selectedMed.default_gst_percent.toString()
          : lastUsedGstPercent,
      mrp: prevBatch?.mrp ? prevBatch.mrp.toString() : prev.mrp,
      purchasePricePerUnit: prevBatch?.purchase_price_per_unit
        ? prevBatch.purchase_price_per_unit.toString()
        : prev.purchasePricePerUnit,
      sellingPricePerUnit: prevBatch?.selling_price_per_unit
        ? prevBatch.selling_price_per_unit.toString()
        : prev.sellingPricePerUnit
    }))
  }

  // ADD / UPDATE BATCH ITEM HANDLER
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
    if (isNaN(sPrice) || sPrice < pPrice)
      return showToast('Selling price should be >= purchase price', 'error')

    const selMed = medicines.find((m) => m.id === stockInItem.medicineId)
    const parsedItemGst = parseFloat(stockInItem.gstPercent)
    const gstPercent = !isNaN(parsedItemGst)
      ? parsedItemGst
      : selMed?.default_gst_percent ?? 12.0

    // Tax calculation per item
    const baseGross = qty * pPrice
    const discountAmt = baseGross * (discountPercent / 100)
    const taxableAmount = Math.max(0, baseGross - discountAmt)
    const gstAmount = taxableAmount * (gstPercent / 100)

    let cgstAmount = 0
    let sgstAmount = 0
    let igstAmount = 0

    if (headerForm.taxType === 'INTERSTATE') {
      igstAmount = gstAmount
    } else {
      cgstAmount = gstAmount / 2
      sgstAmount = gstAmount / 2
    }

    const selectedUnit =
      stockInItem.unit ||
      selMed?.purchase_unit ||
      selMed?.inner_unit ||
      selMed?.base_unit ||
      selMed?.unit_label ||
      'Piece'

    const newItem = {
      medicineId: stockInItem.medicineId,
      batchNo: stockInItem.batchNo.trim() ? stockInItem.batchNo.trim().toUpperCase() : 'N/A',
      expiryDate: isoExpiryDate,
      qtyPurchased: qty,
      unit: selectedUnit,
      freeQty,
      freeUnit: stockInItem.freeUnit || selectedUnit,
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

    let targetIndex = 0
    if (editingIndex !== null) {
      setInvoiceItems((prev) => {
        const copy = [...prev]
        copy[editingIndex] = newItem
        return copy
      })
      targetIndex = editingIndex
      showToast('Batch item updated', 'info')
      setEditingIndex(null)
    } else {
      setInvoiceItems((prev) => [...prev, newItem])
      targetIndex = invoiceItems.length
      showToast('Batch item added to invoice', 'success')
    }

    setRecentlyAddedIndex(targetIndex)
    setTimeout(() => setRecentlyAddedIndex(null), 2500)
    setLastUsedGstPercent(gstPercent.toString())

    // Auto-collapse header once first item is added
    if (!isHeaderCollapsed) {
      setIsHeaderCollapsed(true)
    }

    // Reset item form for next entry & auto-focus medicine search input
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
      gstPercent: gstPercent.toString(),
      purchasePricePerUnit: '',
      amount: '',
      sellingPricePerUnit: ''
    })

    setTimeout(() => {
      medicineInputRef.current?.focus()
    }, 50)
  }

  // EDIT BATCH ITEM
  const handleEditStockInItem = (index: number) => {
    const item = invoiceItems[index]
    if (!item) return
    setStockInItem({
      medicineId: item.medicineId,
      batchNo: item.batchNo === 'N/A' ? '' : item.batchNo,
      expiryDate: item.expiryDate.slice(0, 7),
      qtyPurchased: item.qtyPurchased.toString(),
      unit: item.unit || '',
      freeQty: item.freeQty ? item.freeQty.toString() : '',
      freeUnit: item.freeUnit || '',
      mrp: item.mrp ? item.mrp.toString() : '',
      discountPercent: item.discountPercent ? item.discountPercent.toString() : '',
      gstPercent: item.gstPercent ? item.gstPercent.toString() : '12',
      purchasePricePerUnit: item.purchasePricePerUnit ? item.purchasePricePerUnit.toString() : '',
      amount: (item.qtyPurchased * item.purchasePricePerUnit).toFixed(2),
      sellingPricePerUnit: item.sellingPricePerUnit ? item.sellingPricePerUnit.toString() : ''
    })
    setEditingIndex(index)
  }

  // DELETE BATCH ITEM
  const handleDeleteStockInItem = (index: number) => {
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index))
    if (editingIndex === index) {
      setEditingIndex(null)
    }
    showToast('Batch item removed', 'info')
  }

  // CANCEL EDITING
  const handleCancelEdit = () => {
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
  }

  // FINAL PURCHASE SUBMIT HANDLER
  const handlePurchaseSubmit = async () => {
    if (!headerForm.vendorId) return showToast('Please select a vendor', 'error')
    if (!headerForm.purchaseInvoiceNo.trim()) return showToast('Please enter purchase invoice number', 'error')
    if (invoiceItems.length === 0) return showToast('Please add at least one medicine item to invoice', 'error')

    const totalTaxable = invoiceItems.reduce((sum, item) => sum + item.taxableAmount, 0)
    const totalCgst = invoiceItems.reduce((sum, item) => sum + item.cgstAmount, 0)
    const totalSgst = invoiceItems.reduce((sum, item) => sum + item.sgstAmount, 0)
    const totalIgst = invoiceItems.reduce((sum, item) => sum + item.igstAmount, 0)
    const totalGstAmount = totalCgst + totalSgst + totalIgst
    const totalInvoiceAmount = totalTaxable + totalGstAmount > 0
      ? (totalTaxable + totalGstAmount)
      : invoiceItems.reduce((sum, item) => sum + (item.qtyPurchased * item.purchasePricePerUnit), 0)

    const parsedPaid = parseFloat(headerForm.paidAmount)
    const paidAmount = headerForm.purchaseType === 'CREDIT'
      ? (isNaN(parsedPaid) ? 0 : parsedPaid)
      : totalInvoiceAmount
    const pendingAmount = Math.max(0, totalInvoiceAmount - paidAmount)

    let paymentStatus = 'PAID'
    if (headerForm.purchaseType === 'CREDIT') {
      if (paidAmount <= 0) paymentStatus = 'PENDING'
      else if (paidAmount < totalInvoiceAmount) paymentStatus = 'PARTIAL'
      else paymentStatus = 'PAID'
    }

    const payload = {
      vendorId: headerForm.vendorId,
      purchaseInvoiceNo: headerForm.purchaseInvoiceNo.trim().toUpperCase(),
      purchaseDate: headerForm.purchaseDate,
      purchaseType: headerForm.purchaseType,
      dueDate: headerForm.dueDate || null,
      paymentDate: headerForm.paymentDate || null,
      paymentStatus,
      paymentMode: headerForm.paymentMode,
      taxableAmount: totalTaxable,
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      igstAmount: totalIgst,
      gstAmount: totalGstAmount,
      totalAmount: totalInvoiceAmount,
      paidAmount,
      pendingAmount,
      notes: headerForm.notes ? headerForm.notes.trim() : null,
      items: invoiceItems.map((item) => ({
        medicineId: item.medicineId,
        batchNo: item.batchNo,
        expiryDate: item.expiryDate,
        qty: item.qtyPurchased,
        unit: item.unit,
        freeQty: item.freeQty,
        freeUnit: item.freeUnit,
        mrp: item.mrp,
        discountPercent: item.discountPercent,
        taxableAmount: item.taxableAmount,
        cgstAmount: item.cgstAmount,
        sgstAmount: item.sgstAmount,
        igstAmount: item.igstAmount,
        gstPercent: item.gstPercent,
        purchasePrice: item.purchasePricePerUnit,
        sellingPrice: item.sellingPricePerUnit
      }))
    }

    setSubmittingPurchase(true)
    try {
      await onSavePurchase(payload)
      showToast(`Purchase invoice #${payload.purchaseInvoiceNo} recorded & stock updated!`, 'success')

      // Reset invoice form after successful save
      setHeaderForm({
        vendorId: '',
        purchaseInvoiceNo: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseType: 'CASH',
        taxType: 'INTRASTATE',
        paymentMode: 'CASH',
        dueDate: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paidAmount: '',
        notes: ''
      })
      setInvoiceItems([])
      setIsHeaderCollapsed(false)
      await loadAllData()
    } catch (err: any) {
      showToast(err.message || 'Error recording purchase invoice', 'error')
    } finally {
      setSubmittingPurchase(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* STEP 1: PURCHASE INVOICE HEADER */}
      <PurchaseInvoiceHeader
        form={headerForm}
        onChange={setHeaderForm}
        vendors={vendors}
        purchases={purchases}
        onOpenQuickAddVendor={onOpenQuickAddVendor}
        onOpenScanInvoice={onOpenScanInvoice}
        isCollapsed={isHeaderCollapsed}
        onToggleCollapse={setIsHeaderCollapsed}
      />

      {/* STEP 2: MEDICINE SELECTION & BATCH ENTRY PANEL */}
      <div className="space-y-4">
        {/* Stage 1: Medicine Search & Rich Particulars Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <MedicineSearchPreview
            medicines={medicines}
            selectedMedicineId={stockInItem.medicineId}
            onSelectMedicine={handleMedicineSelect}
            inputRef={medicineInputRef}
            onOpenQuickCreateMedicine={onOpenQuickCreateMedicine}
            disabled={submittingPurchase}
          />
        </div>

        {/* Stage 2: Batch Details Entry Row */}
        <BatchItemEntryPanel
          itemState={stockInItem}
          onChange={setStockInItem}
          selectedMedicine={medicines.find((m) => m.id === stockInItem.medicineId) || null}
          existingBatches={batches}
          currentInvoiceItems={invoiceItems}
          editingIndex={editingIndex}
          onAddItem={addStockInItem}
          onCancelEdit={handleCancelEdit}
          onOpenQuickCreateMedicine={onOpenQuickCreateMedicine}
        />
      </div>

      {/* STEP 3: REVIEW INVOICE BATCH ITEMS TABLE */}
      <InvoiceItemsTable
        items={invoiceItems}
        medicines={medicines}
        editingIndex={editingIndex}
        recentlyAddedIndex={recentlyAddedIndex}
        onEditItem={handleEditStockInItem}
        onDeleteItem={handleDeleteStockInItem}
      />

      {/* STEP 4: FINANCIAL SUMMARY & STOCK UPDATE */}
      <InvoiceFinancialSummary
        headerForm={headerForm}
        items={invoiceItems}
        onSubmitPurchase={handlePurchaseSubmit}
        submitting={submittingPurchase}
      />
    </div>
  )
}
