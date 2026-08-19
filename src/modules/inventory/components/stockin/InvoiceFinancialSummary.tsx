import React, { useState, useMemo } from 'react'
import {
  Lock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileCheck2,
  DollarSign
} from 'lucide-react'
import { PurchaseHeaderFormState } from './PurchaseInvoiceHeader'

interface InvoiceFinancialSummaryProps {
  headerForm: PurchaseHeaderFormState
  items: any[]
  onSubmitPurchase: () => Promise<void>
  submitting: boolean
}

export const InvoiceFinancialSummary: React.FC<InvoiceFinancialSummaryProps> = ({
  headerForm,
  items,
  onSubmitPurchase,
  submitting
}) => {
  const [supplierPrintedTotal, setSupplierPrintedTotal] = useState('')

  // Computed Tax & Financial Breakdown
  const taxable = useMemo(() => items.reduce((s, i) => s + (i.taxableAmount || 0), 0), [items])
  const cgst = useMemo(() => items.reduce((s, i) => s + (i.cgstAmount || 0), 0), [items])
  const sgst = useMemo(() => items.reduce((s, i) => s + (i.sgstAmount || 0), 0), [items])
  const igst = useMemo(() => items.reduce((s, i) => s + (i.igstAmount || 0), 0), [items])
  const totalGst = cgst + sgst + igst

  const grandTotal = useMemo(() => {
    if (taxable + totalGst > 0) return taxable + totalGst
    return items.reduce((sum, item) => sum + item.qtyPurchased * item.purchasePricePerUnit, 0)
  }, [items, taxable, totalGst])

  // Supplier Invoice Total Mismatch Check
  const invoiceTotalMismatch = useMemo(() => {
    if (!supplierPrintedTotal || items.length === 0) return null
    const printedNum = parseFloat(supplierPrintedTotal)
    if (isNaN(printedNum) || printedNum <= 0) return null

    const diff = printedNum - grandTotal
    if (Math.abs(diff) > 0.5) {
      return {
        printedNum,
        grandTotal,
        diff
      }
    }
    return null
  }, [supplierPrintedTotal, grandTotal, items])

  // Pre-submit validation checklist
  const isVendorValid = Boolean(headerForm.vendorId)
  const isInvoiceNoValid = Boolean(headerForm.purchaseInvoiceNo.trim())
  const hasItems = items.length > 0
  const canSubmit = isVendorValid && isInvoiceNoValid && hasItems && !submitting

  return (
    <div className="space-y-4">
      {/* SUPPLIER PRINTED INVOICE VERIFICATION CARD */}
      <div className="p-4 bg-slate-800 text-white rounded-2xl border border-slate-700 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <FileCheck2 className="w-4 h-4 text-cyan-400" /> Verify Printed Supplier Invoice Total
          </div>
          <span className="text-[11px] text-slate-400">Type total amount from physical invoice to check accuracy</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Printed Supplier Invoice Total (₹)
            </label>
            <input
              type="number"
              step="0.01"
              disabled={submitting}
              placeholder="e.g. 4850.00"
              value={supplierPrintedTotal}
              onChange={(e) => setSupplierPrintedTotal(e.target.value)}
              className="w-full py-2 px-3.5 rounded-xl border border-slate-600 bg-slate-900 text-sm font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>System Computed Grand Total:</span>
              <strong className="font-mono text-cyan-300 font-bold text-sm">₹{grandTotal.toFixed(2)}</strong>
            </div>
            {invoiceTotalMismatch ? (
              <div className="text-amber-400 font-semibold flex items-center gap-1.5 pt-1 text-[11px]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Differs by <strong>₹{Math.abs(invoiceTotalMismatch.diff).toFixed(2)}</strong> (
                  {invoiceTotalMismatch.diff > 0 ? 'Printed higher' : 'System higher'})
                </span>
              </div>
            ) : supplierPrintedTotal && !isNaN(parseFloat(supplierPrintedTotal)) ? (
              <div className="text-emerald-400 font-bold flex items-center gap-1 text-[11px] pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Invoice totals match perfectly!</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* INVOICE MISMATCH WARNING BANNER */}
        {invoiceTotalMismatch && (
          <div className="p-3 bg-amber-950/80 border border-amber-800 rounded-xl text-xs text-amber-200 flex items-start gap-2.5 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-amber-300">Supplier Invoice Total Mismatch Warning!</strong>
              <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                The printed invoice total (₹{invoiceTotalMismatch.printedNum.toFixed(2)}) differs from system computed total (₹{invoiceTotalMismatch.grandTotal.toFixed(2)}) by ₹{Math.abs(invoiceTotalMismatch.diff).toFixed(2)}. Please verify medicine quantities, purchase rates, discounts or tax slabs.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* PINNED RUNNING TOTALS & FINAL SUBMIT BAR */}
      <div className="sticky bottom-4 z-30 bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* COMPUTED TAX BREAKDOWN STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
          <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
              Taxable Amount <Lock className="w-2.5 h-2.5 text-cyan-400" />
            </span>
            <span className="font-bold text-white font-mono text-base">₹{taxable.toFixed(2)}</span>
          </div>

          {headerForm.taxType === 'INTERSTATE' ? (
            <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
              <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
                IGST Total <Lock className="w-2.5 h-2.5 text-cyan-400" />
              </span>
              <span className="font-bold text-white font-mono text-base">₹{igst.toFixed(2)}</span>
            </div>
          ) : (
            <>
              <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
                  CGST Total <Lock className="w-2.5 h-2.5 text-cyan-400" />
                </span>
                <span className="font-bold text-white font-mono text-base">₹{cgst.toFixed(2)}</span>
              </div>
              <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
                  SGST Total <Lock className="w-2.5 h-2.5 text-cyan-400" />
                </span>
                <span className="font-bold text-white font-mono text-base">₹{sgst.toFixed(2)}</span>
              </div>
            </>
          )}

          <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-cyan-400 font-semibold block flex items-center gap-1">
              Total GST <Lock className="w-2.5 h-2.5 text-cyan-400" />
            </span>
            <span className="font-bold text-cyan-300 font-mono text-base">₹{totalGst.toFixed(2)}</span>
          </div>
        </div>

        {/* GRAND TOTAL & SUBMIT BUTTON */}
        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Grand Invoice Total</p>
            <p className="text-2xl font-black text-cyan-400 font-mono">₹{grandTotal.toFixed(2)}</p>
          </div>

          <div className="relative group">
            <button
              type="button"
              onClick={onSubmitPurchase}
              disabled={!canSubmit}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl text-sm shadow-lg shadow-cyan-500/20 transition-all disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none cursor-pointer flex items-center gap-2 uppercase tracking-wider"
            >
              {submitting ? (
                <span>Posting Stock...</span>
              ) : (
                <>
                  <span>Save Purchase & Add Stock</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* PRE-SUBMIT VALIDATION CHECKLIST TOOLTIP */}
            {!canSubmit && (
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-3 bg-slate-950 text-slate-200 text-xs rounded-xl border border-slate-800 shadow-2xl z-50">
                <p className="font-semibold text-amber-400 mb-1.5 border-b border-slate-800 pb-1">
                  Pre-Submit Verification Checklist:
                </p>
                <ul className="space-y-1 text-[11px]">
                  <li className="flex items-center justify-between">
                    <span>1. Supplier Vendor Selected</span>
                    {isVendorValid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                  </li>
                  <li className="flex items-center justify-between">
                    <span>2. Supplier Invoice No.</span>
                    {isInvoiceNoValid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                  </li>
                  <li className="flex items-center justify-between">
                    <span>3. Batch Items Added</span>
                    {hasItems ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
