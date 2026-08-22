import React, { useMemo } from 'react'
import {
  FileText,
  Lock,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  DollarSign,
  Coins
} from 'lucide-react'

interface POSPaymentSummaryPanelProps {
  subtotal: number
  generalDiscount: string
  onChangeGeneralDiscount: (val: string) => void
  taxTotal: number
  roundOff: number
  grandTotal: number
  paidAmount: string
  onChangePaidAmount: (val: string) => void
  onPaidInFull: () => void
  paymentMode: string
  onChangePaymentMode: (mode: string) => void
  transactionId: string
  onChangeTransactionId: (txnId: string) => void
  notes: string
  onChangeNotes: (notes: string) => void
  submitting: boolean
  canFinalize: boolean
  isPatientValid: boolean
  hasItems: boolean
  isTransactionIdValid: boolean
  onSubmitBill: (status: 'DRAFT' | 'FINALIZED') => void
}

export const POSPaymentSummaryPanel: React.FC<POSPaymentSummaryPanelProps> = ({
  subtotal,
  generalDiscount,
  onChangeGeneralDiscount,
  taxTotal,
  roundOff,
  grandTotal,
  paidAmount,
  onChangePaidAmount,
  onPaidInFull,
  paymentMode,
  onChangePaymentMode,
  transactionId,
  onChangeTransactionId,
  notes,
  onChangeNotes,
  submitting,
  canFinalize,
  isPatientValid,
  hasItems,
  isTransactionIdValid,
  onSubmitBill
}) => {
  const pAmount = parseFloat(paidAmount) || 0
  const balanceDue = useMemo(() => Math.max(0, grandTotal - pAmount), [grandTotal, pAmount])
  const changeToReturn = useMemo(() => Math.max(0, pAmount - grandTotal), [grandTotal, pAmount])
  const isPaymentModeNonCash = paymentMode !== 'CASH'

  return (
    <div className="w-full md:w-96 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between shrink-0 sticky top-6 self-start max-h-[90vh] overflow-y-auto space-y-6">
      <div className="space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center">
          <FileText className="h-5 w-5 text-cyan-600 mr-2" /> Step 4 — Payment & Billing Totals
        </h2>

        {/* COMPUTED CALCULATIONS STRIP WITH LOCK BADGES */}
        <div className="space-y-3 border-b border-slate-100 pb-4 text-xs">
          {/* Items Subtotal */}
          <div className="flex justify-between items-center text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              Items Total <Lock className="w-3 h-3 text-cyan-600" />
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm">₹{subtotal.toFixed(2)}</span>
          </div>

          {/* Editable General Discount */}
          <div className="flex justify-between items-center text-slate-700 font-medium">
            <span>General Discount</span>
            <div className="relative w-32">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-mono">₹</span>
              <input
                type="number"
                step="0.01"
                disabled={submitting}
                value={generalDiscount}
                onChange={(e) => onChangeGeneralDiscount(e.target.value)}
                className="w-full pl-6 pr-2.5 py-1 border border-slate-200 rounded-lg text-right text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold font-mono text-red-600 bg-white"
              />
            </div>
          </div>

          {/* CGST / SGST split calculation */}
          <div className="flex justify-between items-center text-slate-500 text-[11px] font-medium">
            <span className="flex items-center gap-1">
              CGST Split (Half) <Lock className="w-2.5 h-2.5 text-cyan-500" />
            </span>
            <span className="font-mono">₹{(taxTotal / 2).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500 text-[11px] font-medium">
            <span className="flex items-center gap-1">
              SGST Split (Half) <Lock className="w-2.5 h-2.5 text-cyan-500" />
            </span>
            <span className="font-mono">₹{(taxTotal / 2).toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-700 font-semibold border-t border-dashed border-slate-200 pt-2 text-xs">
            <span className="flex items-center gap-1">
              Total Tax (GST) <Lock className="w-3 h-3 text-cyan-600" />
            </span>
            <span className="font-mono font-bold text-slate-900">₹{taxTotal.toFixed(2)}</span>
          </div>

          {/* Round off */}
          <div className="flex justify-between items-center text-slate-400 text-[11px] font-medium">
            <span>Round Off Difference</span>
            <span className="font-mono">{roundOff >= 0 ? '+' : ''}₹{roundOff.toFixed(2)}</span>
          </div>
        </div>

        {/* GRAND TOTAL HIGHLIGHT CARD */}
        <div className="bg-[#0B132B] text-white p-4.5 rounded-2xl shadow-lg flex justify-between items-center border border-[#162244] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <span className="font-extrabold text-cyan-400/80 text-[10px] uppercase tracking-widest block">Grand Total</span>
            <span className="text-[10px] text-slate-400 font-extrabold flex items-center gap-1 mt-0.5">
              <Lock className="w-2.5 h-2.5 text-cyan-400" /> AUTO CALCULATED
            </span>
          </div>
          <span className="text-2xl font-black text-cyan-400 flex items-center font-mono tracking-tight">
            <IndianRupee className="h-5 w-5 text-cyan-400 mr-0.5" />
            {grandTotal.toFixed(2)}
          </span>
        </div>

        {/* PAYMENT INPUT SECTION */}
        <div className="space-y-3.5 pt-1">
          {/* Amount Paid with Quick-Fill Paid in Full */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Amount Paid (₹) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={onPaidInFull}
                className="text-[11px] font-extrabold text-cyan-800 bg-cyan-50 border border-cyan-200/80 px-2.5 py-1 rounded-lg hover:bg-cyan-100 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                ⚡ Paid in Full
              </button>
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <IndianRupee className="h-4 w-4 text-slate-500" />
              </span>
              <input
                type="number"
                step="0.01"
                disabled={submitting}
                value={paidAmount}
                onChange={(e) => onChangePaidAmount(e.target.value)}
                placeholder="Enter amount paid"
                className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-bold font-mono text-slate-900 bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* BALANCE DUE & CHANGE TO RETURN DISPLAY BADGE */}
          {pAmount > grandTotal ? (
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-950 flex items-center justify-between text-xs font-bold animate-fade-in shadow-2xs">
              <span className="uppercase flex items-center gap-1 text-emerald-800">
                <Coins className="w-4 h-4 text-emerald-600" /> Change to Return
              </span>
              <span className="font-mono text-sm font-black text-emerald-700">
                ₹{changeToReturn.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs font-bold transition-all shadow-2xs">
              <span className="text-slate-600 uppercase tracking-wider text-[11px]">Balance Due</span>
              {balanceDue <= 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ₹0.00 (Fully Paid)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 font-mono text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> ₹{balanceDue.toFixed(2)}
                </span>
              )}
            </div>
          )}

          {/* Payment Mode & Transaction ID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                disabled={submitting}
                onChange={(e) => onChangePaymentMode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-bold bg-white shadow-2xs"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="BANK">BANK TRANSFER</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>Txn ID</span>
                {isPaymentModeNonCash && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                disabled={submitting}
                value={transactionId}
                onChange={(e) => onChangeTransactionId(e.target.value)}
                placeholder={isPaymentModeNonCash ? 'Required' : 'Optional'}
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono shadow-2xs ${
                  isPaymentModeNonCash
                    ? !transactionId.trim()
                      ? 'border border-red-300 bg-red-50/20 focus:ring-2 focus:ring-red-500 font-semibold'
                      : 'border border-slate-200 focus:ring-2 focus:ring-cyan-500 bg-white font-semibold'
                    : 'border border-slate-200 bg-slate-50/50 text-slate-500 focus:ring-2 focus:ring-cyan-500'
                }`}
              />
            </div>
          </div>

          {/* Billing Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Billing Remarks / Notes
            </label>
            <input
              type="text"
              disabled={submitting}
              value={notes}
              onChange={(e) => onChangeNotes(e.target.value)}
              placeholder="Optional invoice remarks..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-medium bg-white shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* GENERATE INVOICE ACTION BUTTONS */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onSubmitBill('DRAFT')}
          disabled={submitting}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
        >
          Save Draft
        </button>

        <div className="relative group">
          <button
            type="button"
            onClick={() => onSubmitBill('FINALIZED')}
            disabled={!canFinalize}
            className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-extrabold py-3 rounded-xl transition shadow-lg shadow-cyan-600/20 text-xs uppercase tracking-wider cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none flex items-center justify-center gap-1.5 border border-cyan-500/40"
          >
            <span>{submitting ? 'Processing...' : 'Finalize & Print'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Disabled Tooltip Checklist */}
          {!canFinalize && (
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-56 p-2.5 bg-slate-950 text-slate-200 text-xs rounded-xl border border-slate-800 shadow-2xl z-50">
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
  )
}
