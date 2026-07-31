import React, { useState, useEffect, useMemo } from 'react'
import { 
  Search, 
  IndianRupee, 
  Printer, 
  Coins, 
  Eye, 
  Calendar,
  X,
  Building2,
  FileCheck2,
  AlertTriangle,
  Lock
} from 'lucide-react'
import { toast } from 'sonner'
import { useBillingStore } from '../store'
import { useAuthStore } from '../../auth/store'
import { useSettingsStore } from '../../settings/store'
import { Bill } from '../../../types'
import { DataTable, ColumnDef } from '../../../components/common/DataTable'

export default function Invoices() {
  const bills = useBillingStore((state) => state.bills)
  const loading = useBillingStore((state) => state.loading)
  const fetchBills = useBillingStore((state) => state.fetchBills)
  const finalizeBill = useBillingStore((state) => state.finalizeBill)
  const cancelBill = useBillingStore((state) => state.cancelBill)
  const recordPayment = useBillingStore((state) => state.recordPayment)
  const printInvoice = useBillingStore((state) => state.printInvoice)

  const profile = useSettingsStore((state) => state.profile)
  const currentUser = useAuthStore((state) => state.user)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Modals state
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  
  // Finalize Draft Modal
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [finalizePaidAmount, setFinalizePaidAmount] = useState('0')
  const [finalizePaymentMode, setFinalizePaymentMode] = useState('CASH')
  const [finalizeTransactionId, setFinalizeTransactionId] = useState('')
  const [submittingFinalize, setSubmittingFinalize] = useState(false)

  // Cancel Bill Modal
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [submittingCancel, setSubmittingCancel] = useState(false)

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [transactionId, setTransactionId] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  const loadBills = async () => {
    const filters = {
      status: statusFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }
    await fetchBills(filters as any)
  }

  useEffect(() => {
    loadBills()
  }, [statusFilter, startDate, endDate])

  // Open Details Modal
  const openDetails = async (id: string) => {
    try {
      const details = await window.api.getBillById(id)
      if (details) {
        setSelectedBill(details)
        setShowDetailsModal(true)
      }
    } catch (e) {
      console.error('Failed to load invoice details:', e)
    }
  }

  // Open Payment Modal
  const openPayment = (bill: Bill) => {
    setSelectedBill(bill)
    setPaymentAmount(bill.balance_due.toString())
    setShowPaymentModal(true)
  }

  // Handle Payment Submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBill) return

    const amount = parseFloat(paymentAmount) || 0
    if (amount <= 0 || amount > selectedBill.balance_due) {
      toast.error('Please enter a valid amount (greater than 0 and less than/equal to balance due).')
      return
    }

    setSubmittingPayment(true)
    try {
      await recordPayment({
        billId: selectedBill.id,
        amount,
        mode: paymentMode as any,
        referenceNo: transactionId || undefined,
        userId: currentUser?.id || ''
      })
      toast.success('Payment recorded successfully!')
      setShowPaymentModal(false)
      loadBills()
    } catch (err: any) {
      console.error('Failed to log payment:', err)
      toast.error(err.message || 'Error logging payment')
    } finally {
      setSubmittingPayment(false)
    }
  }

  // Handle Finalize Submit
  const handleFinalizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBill) return

    const paidAmt = parseFloat(finalizePaidAmount) || 0
    setSubmittingFinalize(true)
    try {
      await finalizeBill({
        billId: selectedBill.id,
        paidAmount: paidAmt,
        paymentMode: finalizePaymentMode as any,
        transactionId: finalizeTransactionId || undefined,
        userId: currentUser?.id || ''
      })
      toast.success('Invoice finalized successfully!')
      setShowFinalizeModal(false)
      setShowDetailsModal(false)
      loadBills()
    } catch (err: any) {
      toast.error(err.message || 'Failed to finalize bill')
    } finally {
      setSubmittingFinalize(false)
    }
  }

  // Handle Cancel Submit
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBill) return
    if (!cancelReason.trim()) return toast.error('Cancellation reason is required.')

    setSubmittingCancel(true)
    try {
      await cancelBill({
        billId: selectedBill.id,
        reason: cancelReason,
        adminUsername: currentUser?.role !== 'ADMIN' ? adminUsername : undefined,
        adminPassword: currentUser?.role !== 'ADMIN' ? adminPassword : undefined,
        userId: currentUser?.id || ''
      })
      toast.success('Invoice cancelled successfully!')
      setShowCancelModal(false)
      setShowDetailsModal(false)
      loadBills()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel bill')
    } finally {
      setSubmittingCancel(false)
    }
  }

  // Trigger Print to System PDF/Printer
  const handlePrint = async (billId: string) => {
    try {
      const res = await printInvoice(billId)
      if (res) {
        toast.success('Invoice print initiated')
      }
    } catch (e: any) {
      console.error('Failed to execute printing:', e)
      toast.error(e.message || 'Print operation failed')
    }
  }

  const columns: ColumnDef<Bill>[] = [
    {
      key: 'bill_no',
      header: 'Invoice Number',
      sortable: true,
      render: (b) => (
        <span className="font-bold font-mono">
          {b.bill_no ? (
            <span className="text-teal-900 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200/80">{b.bill_no}</span>
          ) : (
            <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-xs font-semibold">
              {b.status === 'DRAFT' ? 'DRAFT' : `#${b.id.substring(0, 8)}`}
            </span>
          )}
        </span>
      )
    },
    {
      key: 'patient',
      header: 'Patient',
      sortable: true,
      sortValue: (b) => b.patient?.full_name || b.walkin_name || '',
      render: (b) => (
        <div>
          <p className="font-semibold text-slate-800">{b.patient?.full_name || b.walkin_name || 'Walk-in Patient'}</p>
          {b.patient?.phone && <p className="text-xs text-slate-400 font-mono">{b.patient.phone}</p>}
        </div>
      )
    },
    {
      key: 'bill_date',
      header: 'Date',
      sortable: true,
      render: (b) => (
        <span className="font-mono text-xs text-slate-600 font-medium">
          {b.bill_date ? new Date(b.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
        </span>
      )
    },
    {
      key: 'grand_total',
      header: 'Grand Total',
      sortable: true,
      align: 'right',
      render: (b) => <span className="font-bold text-slate-900 font-mono">₹{b.grand_total.toFixed(2)}</span>
    },
    {
      key: 'paid_amount',
      header: 'Paid Amount',
      sortable: true,
      align: 'right',
      render: (b) => <span className="font-semibold text-emerald-700 font-mono">₹{b.amount_paid.toFixed(2)}</span>
    },
    {
      key: 'balance_due',
      header: 'Balance Due',
      sortable: true,
      align: 'right',
      render: (b) => (
        <span className={`font-bold font-mono ${b.balance_due > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
          ₹{b.balance_due.toFixed(2)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (b) => {
        const isPaid = b.status === 'FINALIZED' && b.balance_due === 0
        const isPartial = b.status === 'FINALIZED' && b.balance_due > 0
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
            b.status === 'CANCELLED'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : b.status === 'DRAFT'
              ? 'bg-slate-100 text-slate-700 border border-slate-200'
              : isPaid
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : b.status}
          </span>
        )
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (b) => (
        <div className="flex items-center justify-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openDetails(b.id)}
            title="View Details"
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <Eye className="h-4 w-4" />
          </button>
          {b.status === 'FINALIZED' && b.balance_due > 0 && (
            <button
              onClick={() => openPayment(b)}
              title="Record Payment"
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition cursor-pointer"
            >
              <Coins className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handlePrint(b.id)}
            title="Print Invoice"
            className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* DATA TABLE WITH INTEGRATED UNIFIED FILTER BAR */}
      <DataTable
        columns={columns}
        data={bills}
        loading={loading}
        rowKey={(b) => b.id}
        searchPlaceholder="Search INV no, Patient Name, Phone..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterFields={[
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'DRAFT', value: 'DRAFT' },
              { label: 'FINALIZED', value: 'FINALIZED' },
              { label: 'CANCELLED', value: 'CANCELLED' }
            ],
            placeholder: 'All Statuses'
          }
        ]}
        activeFilterValues={{ status: statusFilter }}
        onFilterChange={(fId, val) => {
          if (fId === 'status') setStatusFilter(val)
        }}
        onClearAllFilters={() => {
          setStatusFilter('')
          setStartDate('')
          setEndDate('')
        }}
        datePreset={startDate || endDate ? 'custom' : 'all'}
        onDatePresetChange={(preset, start, end) => {
          if (start && end) {
            setStartDate(start)
            setEndDate(end)
          } else {
            setStartDate('')
            setEndDate('')
          }
        }}
        emptyMessage="No billing records found"
        emptySubtext="Generate your first invoice from the New Invoice module."
        onRowClick={(b) => openDetails(b.id)}
      />

      {/* DETAILS INVOICE MODAL */}
      {showDetailsModal && selectedBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Header controls */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <h3 className="font-bold text-slate-800 text-lg flex items-center">
                <FileCheck2 className="h-5 w-5 text-teal-650 mr-2" /> Invoice View
              </h3>
              <div className="flex items-center space-x-3">
                {selectedBill.status === 'DRAFT' && (
                  <button
                    onClick={() => {
                      setFinalizePaidAmount(selectedBill.grand_total.toString())
                      setFinalizePaymentMode('CASH')
                      setFinalizeTransactionId('')
                      setShowFinalizeModal(true)
                    }}
                    className="flex items-center bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition shadow-sm cursor-pointer"
                  >
                    Finalize Draft Invoice
                  </button>
                )}
                {selectedBill.status === 'FINALIZED' && (
                  <button
                    onClick={() => {
                      setCancelReason('')
                      setAdminUsername('')
                      setAdminPassword('')
                      setShowCancelModal(true)
                    }}
                    className="flex items-center bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-4 py-2 rounded-xl text-sm transition shadow-sm cursor-pointer"
                  >
                    Cancel Invoice
                  </button>
                )}
                {selectedBill.status !== 'DRAFT' && (
                  <button
                    onClick={() => handlePrint(selectedBill.id)}
                    className="flex items-center bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 rounded-xl text-sm transition shadow-sm cursor-pointer"
                  >
                    <Printer className="h-4 w-4 mr-2" /> Print
                  </button>
                )}
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Invoiced Document Layout */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              
              {/* Clinic Letterhead */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <Building2 className="h-6 w-6 text-teal-600" />
                    <h2 className="text-xl font-bold text-slate-900">{profile?.name}</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">{profile?.address}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Phone: {profile?.phone} | Email: {profile?.email}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-bold text-slate-505 uppercase tracking-widest">Invoice</h4>
                  <p className="text-lg font-black text-slate-900 font-mono mt-1">{selectedBill.bill_no}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Date: {new Date(selectedBill.bill_date).toLocaleDateString('en-GB')}
                  </p>
                  {profile?.gstin && (
                    <p className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.8 rounded font-medium mt-2 inline-block">
                      GSTIN: {profile.gstin}
                    </p>
                  )}
                </div>
              </div>

              {/* Patient Box */}
              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-150 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Details</h4>
                  {selectedBill.patient ? (
                    <>
                      <p className="font-bold text-slate-900 mt-1">{selectedBill.patient.full_name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">Code: {selectedBill.patient.patient_code} | Phone: {selectedBill.patient.phone}</p>
                      <p className="text-slate-500 text-xs">{selectedBill.patient.gender}, {selectedBill.patient.age_years || 'N/A'} yrs</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-slate-900 mt-1">{selectedBill.walkin_name}</p>
                      <p className="text-slate-550 text-xs mt-0.5">Walk-in Client</p>
                    </>
                  )}
                </div>
                {selectedBill.patient?.address && (
                  <div className="text-right">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</h4>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed max-w-xs ml-auto">
                      {selectedBill.patient.address}
                    </p>
                  </div>
                )}
              </div>

              {/* Invoice Line items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="px-5 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-center">Quantity</th>
                      <th className="px-4 py-3 text-right">Discount</th>
                      <th className="px-4 py-3 text-right">GST %</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {selectedBill.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-5 py-3.5 font-medium text-slate-900">{item.description}</td>
                        <td className="px-4 py-3.5 text-right font-mono">₹{item.unit_price.toFixed(2)}</td>
                        <td className="px-4 py-3.5 text-center font-semibold">{item.qty}</td>
                        <td className="px-4 py-3.5 text-right text-red-500 font-mono">-₹{item.discount_amount.toFixed(2)}</td>
                        <td className="px-4 py-3.5 text-right font-mono">{item.gst_percent}%</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-800 font-mono">
                          ₹{item.line_total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial calculations */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{selectedBill.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedBill.discount_total > 0 && (
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>General Discount</span>
                      <span className="text-red-500 font-mono">-₹{selectedBill.discount_total.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>GST (CGST+SGST Split)</span>
                    <span className="font-mono">₹{selectedBill.tax_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-xs font-semibold">
                    <span>Round Off</span>
                    <span className="font-mono">{selectedBill.round_off >= 0 ? '+' : ''}₹{selectedBill.round_off.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2.5 text-slate-900 font-extrabold text-base">
                    <span>Grand Total</span>
                    <span className="font-mono">₹{selectedBill.grand_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-teal-650 font-bold">
                    <span>Total Paid</span>
                    <span className="font-mono">₹{selectedBill.amount_paid.toFixed(2)}</span>
                  </div>
                  {selectedBill.balance_due > 0 && selectedBill.status !== 'CANCELLED' && (
                    <div className="flex justify-between text-red-650 font-bold">
                      <span>Balance Due</span>
                      <span className="font-mono">₹{selectedBill.balance_due.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payments History */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Transaction Logs</h4>
                {selectedBill.payments && selectedBill.payments.length > 0 ? (
                  <div className="bg-slate-50/50 rounded-xl border border-slate-200/50 p-4 space-y-2.5 text-xs text-slate-600">
                    {selectedBill.payments.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div>
                          <span className={`font-semibold ${p.amount < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                            ₹{p.amount.toFixed(2)}
                          </span>
                          <span className="text-slate-400 mx-2">|</span>
                          <span>Mode: <strong className="uppercase">{p.mode}</strong></span>
                          {p.reference_no && (
                            <>
                              <span className="text-slate-400 mx-2">|</span>
                              <span>Ref: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">{p.reference_no}</code></span>
                            </>
                          )}
                          {p.is_refund && (
                            <span className="ml-2 bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold">REFUND</span>
                          )}
                        </div>
                        <span className="text-slate-400 font-medium">
                          {new Date(p.paid_at).toLocaleString('en-GB')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">No payment transaction records exist.</div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center">
                <Coins className="h-5 w-5 text-teal-600 mr-2" /> Record Due Payment
              </h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-2">
                <div className="flex justify-between text-slate-550 font-medium">
                  <span>Invoice No:</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedBill.bill_no}</span>
                </div>
                <div className="flex justify-between text-slate-550 font-medium">
                  <span>Patient Name:</span>
                  <span className="font-semibold text-slate-800">{selectedBill.patient?.full_name || selectedBill.walkin_name}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-slate-200/60 pt-2 text-red-650">
                  <span>Balance Due:</span>
                  <span className="text-red-600 font-extrabold font-mono">₹{selectedBill.balance_due.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Amount Received (₹) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <IndianRupee className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={selectedBill.balance_due}
                    min="1"
                    placeholder="Enter amount collected"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-bold bg-slate-50/50 font-mono"
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Reference / Transaction ID
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Reference No."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-655 hover:bg-slate-50 font-medium text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingPayment ? 'Logging...' : 'Log Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FINALIZE DRAFT INVOICE MODAL */}
      {showFinalizeModal && selectedBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">Finalize Draft Invoice</h3>
              <button onClick={() => setShowFinalizeModal(false)} className="text-slate-400 hover:text-slate-655 p-1 transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleFinalizeSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-2">
                <div className="flex justify-between text-slate-505">
                  <span>Draft ID:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedBill.bill_no}</span>
                </div>
                <div className="flex justify-between text-slate-505 font-bold border-t border-slate-200/60 pt-2 text-base">
                  <span>Grand Total:</span>
                  <span className="font-mono text-slate-900">₹{selectedBill.grand_total.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Amount Paid (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={finalizePaidAmount}
                  onChange={(e) => setFinalizePaidAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-bold font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Payment Mode</label>
                  <select
                    value={finalizePaymentMode}
                    onChange={(e) => setFinalizePaymentMode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Transaction Ref</label>
                  <input
                    type="text"
                    placeholder="UPI id / card ref"
                    value={finalizeTransactionId}
                    onChange={(e) => setFinalizeTransactionId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFinalizeModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-655 hover:bg-slate-50 font-medium text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFinalize}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingFinalize ? 'Finalizing...' : 'Finalize & Print'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL FINALIZED INVOICE MODAL */}
      {showCancelModal && selectedBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 bg-red-50/20">
              <h3 className="font-bold text-red-750 text-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-650" /> Cancel Finalized Invoice
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-655 p-1 transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCancelSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-2">
                <div className="flex justify-between text-slate-505 font-medium">
                  <span>Invoice No:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedBill.bill_no}</span>
                </div>
                <div className="flex justify-between text-slate-505 font-medium">
                  <span>Grand Total:</span>
                  <span className="font-mono text-slate-900 font-bold">₹{selectedBill.grand_total.toFixed(2)}</span>
                </div>
              </div>

              {/* Warnings */}
              <div className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-200 text-xs font-semibold leading-relaxed">
                WARNING: Cancelling this invoice will restore inventory stock for all medicines. This action is permanent and will be logged in the system audit logs.
              </div>

              {/* Cancellation Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Reason for Cancellation *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Mandatory reason..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              {/* Admin credentials override if currentUser is not admin */}
              {currentUser?.role !== 'ADMIN' && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-505 uppercase tracking-wider flex items-center">
                    <Lock className="h-3.5 w-3.5 mr-1 text-slate-400" /> Admin Authorization Override
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1">Admin Username</label>
                      <input
                        type="text"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1">Admin Password</label>
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-655 hover:bg-slate-50 font-medium text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
