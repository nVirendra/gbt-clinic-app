import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  History, 
  ArrowRight,
  FilePlus
} from 'lucide-react'
import { useInventoryStore } from '../store'
import { useAuthStore } from '../../auth/store'
import { Medicine, Vendor, InventoryBatch } from '../../../types'

export default function Inventory() {
  const activeSubTab = useInventoryStore((state) => {
    // We can use a local tab state to preserve tab switching without keeping it global, 
    // or let store handle it. Local state is perfectly fine here.
    return '';
  });

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

  const [localTab, setLocalTab] = useState('batches') // 'batches', 'medicines', 'vendors', 'stock-in', 'purchases'
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [showMedModal, setShowMedModal] = useState(false)
  const [editingMed, setEditingMed] = useState<Medicine | null>(null)
  
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)

  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustReason, setAdjustReason] = useState('Count correction')

  // Form states
  const [medForm, setMedForm] = useState({
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

  const [vendorForm, setVendorForm] = useState({
    name: '',
    phone: '',
    address: '',
    gstin: '',
    drug_license_no: '',
    notes: ''
  })

  // Stock In Form State
  const [purchaseForm, setPurchaseForm] = useState({
    vendorId: '',
    purchaseInvoiceNo: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseType: 'CASH',
    dueDate: '',
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
    purchasePricePerUnit: '',
    amount: '',
    sellingPricePerUnit: ''
  })

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

  useEffect(() => {
    loadAllData()
  }, [])

  // MEDICINES CRUD
  const handleMedSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!medForm.name.trim()) return alert('Name is required')
    
    try {
      const data = {
        name: medForm.name,
        generic_name: medForm.genericName || null,
        genericName: medForm.genericName || null,
        manufacturer: medForm.manufacturer || null,
        pack: medForm.pack || null,
        type: medForm.type,
        unit_label: medForm.unitLabel,
        unitLabel: medForm.unitLabel,
        hsn_code: medForm.hsnCode || null,
        hsnCode: medForm.hsnCode || null,
        reorder_level: parseInt(medForm.reorderLevel) || 0,
        reorderLevel: parseInt(medForm.reorderLevel) || 0,
        default_gst_percent: parseFloat(medForm.defaultGstPercent) || 12.0,
        defaultGstPercent: parseFloat(medForm.defaultGstPercent) || 12.0
      }
      if (editingMed) {
        await updateMedicine({ id: editingMed.id, data, userId: currentUser?.id || '' })
        alert('Medicine updated')
      } else {
        await createMedicine({ data, userId: currentUser?.id || '' })
        alert('Medicine created')
      }
      setShowMedModal(false)
      setEditingMed(null)
      setMedForm({ name: '', genericName: '', manufacturer: '', pack: '', type: 'TABLET', unitLabel: 'strip', hsnCode: '', reorderLevel: '10', defaultGstPercent: '12' })
    } catch (err: any) {
      alert(err.message || 'Error saving medicine')
    }
  }

  const startEditMed = (m: Medicine) => {
    setEditingMed(m)
    setMedForm({
      name: m.name,
      genericName: m.generic_name || '',
      manufacturer: m.manufacturer || '',
      pack: m.pack || '',
      type: m.type,
      unitLabel: m.unit_label,
      hsnCode: m.hsn_code || '',
      reorderLevel: m.reorder_level.toString(),
      defaultGstPercent: m.default_gst_percent.toString()
    })
    setShowMedModal(true)
  }

  const handleDeleteMed = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return
    try {
      await deleteMedicine({ id, userId: currentUser?.id || '' })
    } catch (e: any) {
      alert(e.message || 'Failed to delete medicine')
    }
  }

  // VENDORS CRUD
  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorForm.name.trim()) return alert('Vendor Name is required')

    try {
      if (editingVendor) {
        await updateVendor({ id: editingVendor.id, data: vendorForm, userId: currentUser?.id || '' })
        alert('Vendor updated')
      } else {
        await createVendor({ data: vendorForm, userId: currentUser?.id || '' })
        alert('Vendor created')
      }
      setShowVendorModal(false)
      setEditingVendor(null)
      setVendorForm({ name: '', phone: '', address: '', gstin: '', drug_license_no: '', notes: '' })
    } catch (err: any) {
      alert(err.message || 'Error saving vendor')
    }
  }

  const startEditVendor = (v: Vendor) => {
    setEditingVendor(v)
    setVendorForm({
      name: v.name,
      phone: v.phone,
      address: v.address,
      gstin: v.gstin || '',
      drug_license_no: v.drug_license_no || '',
      notes: v.notes || ''
    })
    setShowVendorModal(true)
  }

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return
    try {
      await deleteVendor({ id, userId: currentUser?.id || '' })
    } catch (e: any) {
      alert(e.message || 'Failed to delete vendor')
    }
  }

  // STOCK ADJUSTMENT (Admin only)
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatch) return
    const qty = parseInt(adjustQty)
    if (isNaN(qty) || qty === 0) return alert('Please enter a non-zero adjustment amount')

    try {
      await adjustStock({
        id: selectedBatch.id,
        qtyChange: qty,
        reason: adjustReason,
        userId: currentUser?.id || ''
      })
      alert('Stock adjusted successfully!')
      setShowAdjustModal(false)
      setSelectedBatch(null)
      setAdjustQty('')
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock')
    }
  }

  // STOCK IN LOGIC
  const addStockInItem = () => {
    if (!stockInItem.medicineId) return alert('Select a medicine')
    if (!stockInItem.batchNo.trim()) return alert('Enter batch number')
    if (!stockInItem.expiryDate) return alert('Select expiry date')
    
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

    if (isNaN(qty) || qty <= 0) return alert('Purchased Quantity must be > 0')
    if (isNaN(pPrice) || pPrice < 0) return alert('Purchase price invalid')
    if (isNaN(sPrice) || sPrice < pPrice) return alert('Selling price should be >= purchase price')

    const newItems = [...purchaseForm.items, {
      medicineId: stockInItem.medicineId,
      batchNo: stockInItem.batchNo,
      expiryDate: stockInItem.expiryDate,
      qtyPurchased: qty,
      freeQty,
      mrp,
      discountPercent,
      purchasePricePerUnit: pPrice,
      sellingPricePerUnit: sPrice
    }]

    setPurchaseForm({
      ...purchaseForm,
      items: newItems
    })

    // Reset stock item inputs
    setStockInItem({
      medicineId: '',
      batchNo: '',
      expiryDate: '',
      qtyPurchased: '',
      freeQty: '',
      mrp: '',
      discountPercent: '',
      purchasePricePerUnit: '',
      amount: '',
      sellingPricePerUnit: ''
    })
  }

  const removeStockInItem = (idx: number) => {
    const items = [...purchaseForm.items]
    items.splice(idx, 1)
    setPurchaseForm({ ...purchaseForm, items })
  }

  const handlePurchaseSubmit = async () => {
    if (!purchaseForm.vendorId) return alert('Select a vendor')
    if (!purchaseForm.purchaseInvoiceNo.trim()) return alert('Enter purchase invoice number')
    if (purchaseForm.items.length === 0) return alert('Add at least one item')

    const totalAmount = purchaseForm.items.reduce((sum, item) => sum + (item.qtyPurchased * item.purchasePricePerUnit), 0)

    try {
      await createPurchase({
        data: {
          vendorId: purchaseForm.vendorId,
          purchaseInvoiceNo: purchaseForm.purchaseInvoiceNo,
          purchaseDate: purchaseForm.purchaseDate,
          purchaseType: purchaseForm.purchaseType,
          dueDate: purchaseForm.dueDate || null,
          paymentStatus: purchaseForm.paymentStatus,
          paymentMode: purchaseForm.paymentMode,
          totalAmount,
          notes: purchaseForm.notes,
          items: purchaseForm.items
        },
        userId: currentUser?.id || ''
      })

      alert('Stock purchase logged successfully!')
      setPurchaseForm({
        vendorId: '',
        purchaseInvoiceNo: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseType: 'CASH',
        dueDate: '',
        paymentStatus: 'PAID',
        paymentMode: 'CASH',
        notes: '',
        items: []
      })
      setLocalTab('batches')
    } catch (e: any) {
      alert(e.message || 'Error logging purchase')
    }
  }

  // Filter lists based on search
  const safeBatches = Array.isArray(batches) ? batches : []
  const safeMedicines = Array.isArray(medicines) ? medicines : []
  const safeVendors = Array.isArray(vendors) ? vendors : []

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'batches', label: 'Current Stock' },
          { id: 'medicines', label: 'Medicines List' },
          { id: 'stock-in', label: 'Stock Purchase In' },
          { id: 'purchases', label: 'Purchase History' },
          { id: 'vendors', label: 'Vendors List' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setLocalTab(tab.id)
              setSearchQuery('')
            }}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-all cursor-pointer ${
              localTab === tab.id 
                ? 'border-teal-500 text-teal-600 font-semibold' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Action / Search Bar (Except Stock In) */}
      {localTab !== 'stock-in' && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            {localTab === 'medicines' && (
              <button
                onClick={() => {
                  setEditingMed(null)
                  setMedForm({ name: '', genericName: '', manufacturer: '', pack: '', type: 'TABLET', unitLabel: 'strip', hsnCode: '', reorderLevel: '10', defaultGstPercent: '12' })
                  setShowMedModal(true)
                }}
                className="flex items-center justify-center px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 shadow-md shadow-teal-500/10 transition-all cursor-pointer w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Medicine
              </button>
            )}

            {localTab === 'vendors' && (
              <button
                onClick={() => {
                  setEditingVendor(null)
                  setVendorForm({ name: '', phone: '', address: '', gstin: '', drug_license_no: '', notes: '' })
                  setShowVendorModal(true)
                }}
                className="flex items-center justify-center px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 shadow-md shadow-teal-500/10 transition-all cursor-pointer w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Vendor
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- CURRENT STOCK BATCHES TAB --- */}
      {localTab === 'batches' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Medicine</th>
                  <th className="px-6 py-4">Batch No.</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4 text-right">Qty Available</th>
                  <th className="px-6 py-4 text-right">Purchase Price</th>
                  <th className="px-6 py-4 text-right">Selling Price</th>
                  <th className="px-6 py-4 text-right">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredBatches.map((batch) => {
                  const daysToExpiry = getDaysToExpiry(batch.expiry_date)
                  const isExpired = daysToExpiry <= 0
                  const isNearExpiry = daysToExpiry > 0 && daysToExpiry <= 30
                  
                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{batch.medicine?.name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{batch.batch_no}</td>
                      <td className="px-6 py-4">
                        {new Date(batch.expiry_date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">{batch.qty_available}</td>
                      <td className="px-6 py-4 text-right">₹{batch.purchase_price_per_unit.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">₹{batch.selling_price_per_unit.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        {isExpired ? (
                          <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-bold bg-red-100 text-red-700">Expired</span>
                        ) : isNearExpiry ? (
                          <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-bold bg-yellow-100 text-yellow-700">Expiring in {daysToExpiry} days</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-bold bg-green-100 text-green-700">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {currentUser?.role === 'ADMIN' && (
                          <button
                            onClick={() => {
                              setSelectedBatch(batch)
                              setAdjustQty('')
                              setAdjustReason('Count correction')
                              setShowAdjustModal(true)
                            }}
                            className="text-xs text-teal-600 hover:text-teal-850 font-semibold underline cursor-pointer"
                          >
                            Adjust Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filteredBatches.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400 text-sm">No batches found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MEDICINES LIST TAB --- */}
      {localTab === 'medicines' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Medicine Name</th>
                  <th className="px-6 py-4">Generic Name</th>
                  <th className="px-6 py-4">Manufacturer</th>
                  <th className="px-6 py-4">Pack</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Unit Label</th>
                  <th className="px-6 py-4">HSN Code</th>
                  <th className="px-6 py-4 text-right">Reorder Level</th>
                  <th className="px-6 py-4 text-right">GST %</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredMedicines.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{med.name}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-medium">{med.generic_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{med.manufacturer || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono text-xs">{med.pack || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono text-xs">{med.type}</td>
                    <td className="px-6 py-4 capitalize">{med.unit_label}</td>
                    <td className="px-6 py-4 font-mono text-xs">{med.hsn_code || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">{med.reorder_level}</td>
                    <td className="px-6 py-4 text-right">{med.default_gst_percent}%</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => startEditMed(med)}
                        className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-850 font-semibold cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3 mr-1" /> Edit
                      </button>
                      {currentUser?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteMed(med.id)}
                          className="inline-flex items-center text-xs text-red-600 hover:text-red-850 font-semibold cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredMedicines.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-sm">No medicines registered</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- STOCK PURCHASE IN TAB --- */}
      {localTab === 'stock-in' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchase details & Add Items Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-md font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center">
              <FilePlus className="h-5 w-5 mr-2 text-teal-500" /> Log Purchase Details
            </h3>

            <div className="space-y-4">
              {/* Vendor */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendor *</label>
                <select
                  value={purchaseForm.vendorId}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorId: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select Vendor</option>
                  {safeVendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Invoice Number *</label>
                <input
                  type="text"
                  placeholder="e.g. PUR-1001"
                  value={purchaseForm.purchaseInvoiceNo}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseInvoiceNo: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase Date *</label>
                <input
                  type="date"
                  value={purchaseForm.purchaseDate}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Purchase Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase Type *</label>
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
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    <option value="CASH">CASH</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date {purchaseForm.purchaseType === 'CREDIT' ? '*' : '(Optional)'}</label>
                  <input
                    type="date"
                    value={purchaseForm.dueDate}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, dueDate: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Payment Status & Payment Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Status</label>
                  <select
                    value={purchaseForm.paymentStatus}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentStatus: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Mode (Optional)</label>
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
              </div>

              {/* Remarks / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Remarks / Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Enter remarks..."
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* ADD ITEM FOR PURCHASE */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h4 className="text-sm font-semibold text-slate-800">Add Item Batch</h4>
              
              {/* Medicine Select */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Medicine *</label>
                <select
                  value={stockInItem.medicineId}
                  onChange={(e) => setStockInItem({ ...stockInItem, medicineId: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                >
                  <option value="">Select Medicine</option>
                  {safeMedicines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.pack ? `[${m.pack}]` : ''} ({m.type})
                    </option>
                  ))}
                </select>

                {/* Selected Medicine Info Badge */}
                {(() => {
                  const selMed = safeMedicines.find(m => m.id === stockInItem.medicineId)
                  if (!selMed) return null
                  return (
                    <div className="mt-2.5 p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-teal-900 font-bold">
                        <span>{selMed.name}</span>
                        <span className="bg-teal-600 text-white px-2 py-0.5 rounded-full text-[10px]">GST {selMed.default_gst_percent}%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-teal-200/50">
                        <div><span className="font-semibold text-slate-700">Generic:</span> {selMed.generic_name || 'N/A'}</div>
                        <div><span className="font-semibold text-slate-700">Pack:</span> {selMed.pack || 'N/A'}</div>
                        <div><span className="font-semibold text-slate-700">HSN:</span> <code className="font-mono text-slate-800">{selMed.hsn_code || 'N/A'}</code></div>
                        <div><span className="font-semibold text-slate-700">Unit:</span> {selMed.unit_label}</div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Batch No & Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Batch No. *</label>
                  <input
                    type="text"
                    placeholder="B-XYZ"
                    value={stockInItem.batchNo}
                    onChange={(e) => setStockInItem({ ...stockInItem, batchNo: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    value={stockInItem.expiryDate}
                    onChange={(e) => setStockInItem({ ...stockInItem, expiryDate: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Quantity Purchased & Free Qty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qty Purchased *</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={stockInItem.qtyPurchased}
                    onChange={(e) => handleQtyPurchasedChange(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Free Qty</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={stockInItem.freeQty}
                    onChange={(e) => setStockInItem({ ...stockInItem, freeQty: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* MRP & Discount % */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="₹ 150.00"
                    value={stockInItem.mrp}
                    onChange={(e) => setStockInItem({ ...stockInItem, mrp: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Discount %</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 10"
                    value={stockInItem.discountPercent}
                    onChange={(e) => setStockInItem({ ...stockInItem, discountPercent: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Purchase Price, Amount, Selling Price */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="₹ per unit"
                      value={stockInItem.purchasePricePerUnit}
                      onChange={(e) => handlePurchasePriceChange(e.target.value)}
                      className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount (Qty × Pur.Price)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="₹ Total Net Amount"
                      value={stockInItem.amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-full py-2 px-3 rounded-lg border border-teal-300 bg-teal-50/50 text-sm font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="₹ per unit"
                    value={stockInItem.sellingPricePerUnit}
                    onChange={(e) => setStockInItem({ ...stockInItem, sellingPricePerUnit: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addStockInItem}
                className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Add Batch Item to Invoice
              </button>
            </div>
          </div>

          {/* Grid summary and final submit */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-slate-900 border-b border-slate-100 pb-3">
                Batch items in this Purchase
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-2">Medicine</th>
                      <th className="px-4 py-2">HSN / GST</th>
                      <th className="px-4 py-2">Batch No</th>
                      <th className="px-4 py-2">Expiry</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2 text-right">Free</th>
                      <th className="px-4 py-2 text-right">MRP</th>
                      <th className="px-4 py-2 text-right">Disc %</th>
                      <th className="px-4 py-2 text-right">Pur. Price</th>
                      <th className="px-4 py-2 text-right">Sell Price</th>
                      <th className="px-4 py-2 text-right">Net Total</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseForm.items.map((item, index) => {
                      const med = safeMedicines.find(m => m.id === item.medicineId)
                      const itemTotal = item.qtyPurchased * item.purchasePricePerUnit
                      return (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2 font-medium">
                            <div>{med?.name || 'Medicine'}</div>
                            {med?.pack && <div className="text-[11px] text-slate-500 font-mono">Pack: {med.pack}</div>}
                          </td>
                          <td className="px-4 py-2 text-xs font-mono">
                            <div>{med?.hsn_code || 'N/A'}</div>
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-sans px-1.5 py-0.5 rounded font-bold">GST {med?.default_gst_percent || 12}%</span>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">{item.batchNo}</td>
                          <td className="px-4 py-2 text-xs">{new Date(item.expiryDate).toLocaleDateString('en-GB')}</td>
                          <td className="px-4 py-2 text-right font-medium">{item.qtyPurchased}</td>
                          <td className="px-4 py-2 text-right text-emerald-600 font-semibold">{item.freeQty > 0 ? `+${item.freeQty}` : '-'}</td>
                          <td className="px-4 py-2 text-right font-mono text-xs">{item.mrp > 0 ? `₹${item.mrp.toFixed(2)}` : '-'}</td>
                          <td className="px-4 py-2 text-right text-xs">{item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}</td>
                          <td className="px-4 py-2 text-right">₹{item.purchasePricePerUnit.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">₹{item.sellingPricePerUnit.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-900">₹{itemTotal.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeStockInItem(index)}
                              className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {purchaseForm.items.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-slate-400">No items added to this purchase yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 mt-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Estimated Total Amount</p>
                <p className="text-xl font-bold text-slate-900">
                  ₹{purchaseForm.items.reduce((sum, item) => sum + (item.qtyPurchased * item.purchasePricePerUnit), 0).toFixed(2)}
                </p>
              </div>

              <button
                type="button"
                onClick={handlePurchaseSubmit}
                disabled={purchaseForm.items.length === 0}
                className="px-6 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 shadow-md shadow-teal-500/10 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
              >
                Log Stock Purchase <ArrowRight className="inline-block h-4 w-4 ml-1.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PURCHASE HISTORY TAB --- */}
      {localTab === 'purchases' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Purchase Date</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Mode</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Items Stocked</th>
                  <th className="px-6 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {new Date(pur.purchase_date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{pur.vendor?.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{pur.purchase_invoice_no}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                        pur.purchase_type === 'CREDIT' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {pur.purchase_type || 'CASH'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      {pur.due_date ? new Date(pur.due_date).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                        pur.payment_status === 'PENDING' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {pur.payment_status || 'PAID'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold uppercase">{pur.payment_mode || 'CASH'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">₹{pur.total_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-xs">
                      {pur.batches?.map(b => `${b.medicine?.name} (${b.qty_purchased})`).join(', ')}
                    </td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{pur.notes || 'N/A'}</td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">No purchases recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- VENDORS LIST TAB --- */}
      {localTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Vendor Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">GSTIN</th>
                  <th className="px-6 py-4">Drug License No</th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{vendor.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{vendor.phone}</td>
                    <td className="px-6 py-4">{vendor.address}</td>
                    <td className="px-6 py-4 font-mono text-xs uppercase">{vendor.gstin || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono text-xs uppercase">{vendor.drug_license_no || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{vendor.notes || 'N/A'}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => startEditVendor(vendor)}
                        className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-805 font-semibold cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3 mr-1" /> Edit
                      </button>
                      {currentUser?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteVendor(vendor.id)}
                          className="inline-flex items-center text-xs text-red-600 hover:text-red-855 font-semibold cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredVendors.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">No vendors registered</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MEDICINE ADD/EDIT MODAL --- */}
      {showMedModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{editingMed ? 'Edit Medicine' : 'Add New Medicine'}</h3>
            <form onSubmit={handleMedSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Medicine Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 650mg"
                  value={medForm.name}
                  onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Generic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol"
                  value={medForm.genericName}
                  onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Cipla / Sun Pharma"
                    value={medForm.manufacturer}
                    onChange={(e) => setMedForm({ ...medForm, manufacturer: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pack Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 10x10 / 100ml"
                    value={medForm.pack}
                    onChange={(e) => setMedForm({ ...medForm, pack: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                  <select
                    value={medForm.type}
                    onChange={(e) => setMedForm({ ...medForm, type: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="TABLET">TABLET</option>
                    <option value="CAPSULE">CAPSULE</option>
                    <option value="INJECTION">INJECTION</option>
                    <option value="SYRUP">SYRUP</option>
                    <option value="OINTMENT">OINTMENT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit Label</label>
                  <select
                    value={medForm.unitLabel}
                    onChange={(e) => setMedForm({ ...medForm, unitLabel: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="strip">Strip</option>
                    <option value="vial">Vial</option>
                    <option value="bottle">Bottle</option>
                    <option value="pcs">Pcs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">HSN Code</label>
                <input
                  type="text"
                  placeholder="e.g. 300490"
                  value={medForm.hsnCode}
                  onChange={(e) => setMedForm({ ...medForm, hsnCode: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reorder Level *</label>
                  <input
                    type="number"
                    value={medForm.reorderLevel}
                    onChange={(e) => setMedForm({ ...medForm, reorderLevel: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default GST % *</label>
                  <input
                    type="number"
                    value={medForm.defaultGstPercent}
                    onChange={(e) => setMedForm({ ...medForm, defaultGstPercent: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMedModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-650 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VENDOR ADD/EDIT MODAL --- */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
            <form onSubmit={handleVendorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendor Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Pharmacy Wholesale"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={vendorForm.phone}
                  onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Vendor location..."
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    value={vendorForm.gstin}
                    onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Drug License No</label>
                  <input
                    type="text"
                    placeholder="e.g. DL-12345/2026"
                    value={vendorForm.drug_license_no}
                    onChange={(e) => setVendorForm({ ...vendorForm, drug_license_no: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Other details..."
                  value={vendorForm.notes}
                  onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-650 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
