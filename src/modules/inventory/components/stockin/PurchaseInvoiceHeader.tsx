import React, { useState, useMemo } from 'react'
import {
  Building2,
  Receipt,
  Calendar,
  CreditCard,
  FilePlus,
  Plus,
  ChevronUp,
  Edit2,
  AlertTriangle,
  Lock,
  ScanLine,
  CheckCircle2,
  UserCheck
} from 'lucide-react'
import { Vendor, Purchase } from '../../../../types'
import VendorTypeahead from '../VendorTypeahead'

export interface PurchaseHeaderFormState {
  vendorId: string
  purchaseInvoiceNo: string
  purchaseDate: string
  purchaseType: string // CASH / CREDIT
  taxType: string // INTRASTATE (CGST+SGST) / INTERSTATE (IGST)
  paymentMode: string // CASH / UPI / BANK / CARD
  dueDate: string
  paymentDate: string
  paidAmount: string
  notes: string
}

interface PurchaseInvoiceHeaderProps {
  form: PurchaseHeaderFormState
  onChange: (updated: PurchaseHeaderFormState) => void
  vendors: Vendor[]
  purchases: Purchase[]
  onOpenQuickAddVendor: () => void
  onOpenScanInvoice?: () => void
  isCollapsed: boolean
  onToggleCollapse: (collapsed: boolean) => void
}

export const PurchaseInvoiceHeader: React.FC<PurchaseInvoiceHeaderProps> = ({
  form,
  onChange,
  vendors,
  purchases,
  onOpenQuickAddVendor,
  onOpenScanInvoice,
  isCollapsed,
  onToggleCollapse
}) => {
  const selectedVendor = useMemo(() => vendors.find((v) => v.id === form.vendorId), [vendors, form.vendorId])

  // Check if supplier invoice number already exists for selected vendor
  const duplicateInvoiceMatch = useMemo(() => {
    if (!form.vendorId || !form.purchaseInvoiceNo.trim()) return null
    const invNo = form.purchaseInvoiceNo.trim().toLowerCase()
    return purchases.find(
      (p) => p.vendor_id === form.vendorId && (p.purchase_invoice_no || '').trim().toLowerCase() === invNo
    )
  }, [purchases, form.vendorId, form.purchaseInvoiceNo])

  // Auto-detect Tax Type hint from Vendor GSTIN state code
  const gstStateHint = useMemo(() => {
    if (!selectedVendor?.gstin || selectedVendor.gstin.length < 2) return null
    const stateCode = selectedVendor.gstin.slice(0, 2)
    // Assume pharmacy state code is 27 (Maharashtra) or check standard
    // Return hint text
    return stateCode
  }, [selectedVendor])

  const isHeaderValid = Boolean(form.vendorId && form.purchaseInvoiceNo.trim() && form.purchaseDate)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 overflow-hidden">
      {isCollapsed ? (
        /* COLLAPSED PINNED SUMMARY STRIP */
        <div className="p-4 bg-[#0B132B] text-white flex flex-wrap items-center justify-between gap-4 shadow-md border border-[#162244]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-slate-400">Supplier:</span>
              <strong className="text-white text-sm">{selectedVendor?.name || 'Not Selected'}</strong>
            </div>

            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-slate-400">Invoice:</span>
              <strong className="font-mono text-cyan-300 text-sm">#{form.purchaseInvoiceNo || '---'}</strong>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-slate-400">Date:</span>
              <span className="font-mono">{form.purchaseDate ? new Date(form.purchaseDate).toLocaleDateString('en-GB') : '-'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  form.purchaseType === 'CREDIT'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {form.purchaseType}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {form.taxType === 'INTERSTATE' ? 'IGST (Out-of-State)' : 'CGST+SGST (In-State)'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleCollapse(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Header
          </button>
        </div>
      ) : (
        /* EXPANDED FULL HEADER CARD */
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FilePlus className="h-5 w-5 text-cyan-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 1 — Supplier & Invoice Header</h3>
                <p className="text-xs text-slate-500">Who did you purchase from & invoice details</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onOpenScanInvoice && (
                <button
                  type="button"
                  onClick={onOpenScanInvoice}
                  className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 cursor-pointer bg-violet-50 px-3 py-1.5 rounded-xl border border-violet-200/80 transition-colors"
                >
                  <ScanLine className="w-4 h-4" /> Scan Invoice
                </button>
              )}

              <button
                type="button"
                onClick={onOpenQuickAddVendor}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 cursor-pointer bg-cyan-50 px-3 py-1.5 rounded-xl border border-cyan-200 transition-colors"
              >
                <Plus className="w-4 h-4" /> Quick Add Vendor
              </button>

              {isHeaderValid && (
                <button
                  type="button"
                  onClick={() => onToggleCollapse(true)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200"
                >
                  <ChevronUp className="w-4 h-4" /> Collapse
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Vendor Combobox */}
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Supplier Vendor <span className="text-red-500">*</span>
              </label>
              <VendorTypeahead
                vendors={vendors}
                value={form.vendorId}
                onChange={(vendorId: string) => {
                  const sel = vendors.find((v) => v.id === vendorId)
                  let autoTax = form.taxType
                  if (sel?.gstin && sel.gstin.length >= 2) {
                    const stCode = sel.gstin.slice(0, 2)
                    autoTax = stCode === '27' ? 'INTRASTATE' : 'INTERSTATE'
                  }
                  onChange({ ...form, vendorId, taxType: autoTax })
                }}
                error={!form.vendorId ? 'Vendor is required' : undefined}
              />
            </div>

            {/* Supplier Invoice Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Supplier Invoice No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-00125"
                value={form.purchaseInvoiceNo}
                onChange={(e) => onChange({ ...form, purchaseInvoiceNo: e.target.value })}
                className={`w-full py-2.5 px-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 font-mono ${
                  duplicateInvoiceMatch
                    ? 'border-amber-300 bg-amber-50/40 focus:ring-amber-500 font-bold'
                    : !form.purchaseInvoiceNo.trim()
                    ? 'border-slate-200 focus:ring-cyan-500'
                    : 'border-cyan-500 bg-cyan-50/10 font-bold focus:ring-cyan-500'
                }`}
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Purchase Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => onChange({ ...form, purchaseDate: e.target.value })}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
              />
            </div>

            {/* Purchase Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Purchase Type</label>
              <select
                value={form.purchaseType}
                onChange={(e) => {
                  const pType = e.target.value
                  onChange({
                    ...form,
                    purchaseType: pType
                  })
                }}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-800 bg-slate-50/50"
              >
                <option value="CASH">CASH PURCHASE</option>
                <option value="CREDIT">CREDIT PURCHASE</option>
              </select>
            </div>

            {/* Tax Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tax Type</label>
              <select
                value={form.taxType}
                onChange={(e) => onChange({ ...form, taxType: e.target.value })}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold text-slate-800"
              >
                <option value="INTRASTATE">In-State (CGST + SGST)</option>
                <option value="INTERSTATE">Out-of-State (IGST)</option>
              </select>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Mode</label>
              <select
                value={form.paymentMode}
                onChange={(e) => onChange({ ...form, paymentMode: e.target.value })}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="BANK">BANK TRANSFER</option>
                <option value="CARD">CARD</option>
              </select>
            </div>

            {/* Remarks / Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Remarks / Invoice Notes</label>
              <input
                type="text"
                placeholder="Optional supplier reference or notes..."
                value={form.notes}
                onChange={(e) => onChange({ ...form, notes: e.target.value })}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* SELECTED VENDOR SUMMARY CARD */}
          {selectedVendor && (
            <div className="p-3 bg-cyan-50/80 border border-cyan-200/80 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 text-cyan-950 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-600 text-white rounded-lg">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-sm font-bold text-cyan-950 block">{selectedVendor.name}</strong>
                  <div className="flex items-center gap-3 text-[11px] text-cyan-800 mt-0.5">
                    <span>Phone: <strong>{selectedVendor.phone}</strong></span>
                    {selectedVendor.gstin && <span>GSTIN: <strong className="font-mono">{selectedVendor.gstin}</strong></span>}
                    {selectedVendor.drug_license_no && <span>DL: <strong className="font-mono">{selectedVendor.drug_license_no}</strong></span>}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold bg-white text-cyan-800 px-2.5 py-1 rounded-lg border border-cyan-200">
                Supplier Selected
              </span>
            </div>
          )}

          {/* DUPLICATE INVOICE WARNING CHECK */}
          {duplicateInvoiceMatch && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center gap-2.5 text-amber-900 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="font-bold">Duplicate Invoice Number Warning!</strong>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  An invoice with number <strong>"{duplicateInvoiceMatch.purchase_invoice_no}"</strong> recorded on{' '}
                  {new Date(duplicateInvoiceMatch.purchase_date).toLocaleDateString('en-GB')} already exists for this vendor. Please verify the invoice number before saving.
                </p>
              </div>
            </div>
          )}

          {/* CREDIT BREAKDOWN PANEL */}
          {form.purchaseType === 'CREDIT' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3 mt-3 animate-fade-in">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                <CreditCard className="w-4 h-4 text-amber-600" /> Credit Invoice Payment Details
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Paid Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="₹ 0.00"
                    value={form.paidAmount}
                    onChange={(e) => onChange({ ...form, paidAmount: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-amber-300 bg-white text-sm font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => onChange({ ...form, dueDate: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => onChange({ ...form, paymentDate: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
