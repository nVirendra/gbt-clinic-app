import React, { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  X,
  FileImage,
  ArrowLeft,
  ScanLine,
  Building2,
  Package,
  Receipt,
  Check
} from 'lucide-react'
import {
  Vendor,
  Purchase,
  ScanInvoiceResult,
  ScanCommitPayload,
  ScanItemMatch
} from '../../../types'

interface ScanPurchaseInvoiceProps {
  userId: string
  onClose: () => void
  onCommitted: (purchase: Purchase) => void
}

interface EditableItem {
  key: string
  originalStatus: ScanItemMatch['status']
  suggestions: ScanItemMatch['suggestions']
  mode: 'existing' | 'new'
  medicineId: string
  name: string
  unitLabel: string
  strength: string
  genericName: string
  manufacturer: string
  pack: string
  type: string
  hsnCode: string
  batchNo: string
  expiryMonth: string // YYYY-MM, from <input type="month">
  qty: string
  freeQty: string
  mrp: string
  discountPercent: string
  gstPercent: string
  purchasePrice: string
  sellingPrice: string
  lineAmount: string
}

const MEDICINE_TYPES = [
  'TABLET', 'CAPSULE', 'INJECTION', 'SYRUP', 'OINTMENT',
  'SUSPENSION', 'DROP', 'GEL', 'LOTION', 'POWDER', 'OIL', 'FACE_WASH', 'CREAM', 'BALM', 'OTHER'
]

function toMonthInput(value: string | null): string {
  if (!value) return ''
  const m = value.match(/^(\d{4})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}` : ''
}

function lastDayOfMonthISO(yyyyMM: string): string {
  if (!/^\d{4}-\d{2}$/.test(yyyyMM)) return ''
  const [y, m] = yyyyMM.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

// Mirrors the manual Stock-In tax math (Inventory.tsx addStockInItem): purchasePrice is the
// gross, pre-discount rate — discount is applied on top of it to get the taxable base, then GST
// is applied on the taxable base. Keep this in sync so scanned and manual purchases agree.
function computeItemTax(qty: number, purchasePrice: number, discountPercent: number, gstPercent: number) {
  const baseGross = qty * purchasePrice
  const discountAmt = baseGross * (discountPercent / 100)
  const taxableAmount = Math.max(0, baseGross - discountAmt)
  const gstAmount = taxableAmount * (gstPercent / 100)
  return { taxableAmount, gstAmount, discountAmt, lineAmount: taxableAmount + gstAmount }
}

// ₹1 rounding slack for both mismatch checks below — absorbs paise-level OCR/rounding noise
// without masking a real data-entry error.
const MISMATCH_TOLERANCE = 1

// Standard field styling — matches the Vendor Master / Medicine Master modals
const fieldClass =
  'w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-400'
const fieldLabelClass = 'block text-xs font-bold text-slate-500 uppercase mb-1'

// Compact field styling — for the dense per-item batch/pricing grid
const compactFieldClass =
  'w-full py-1.5 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500'
const compactLabelClass = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1'

const STATUS_ACCENT: Record<string, string> = {
  matched: 'border-l-emerald-400',
  ambiguous: 'border-l-amber-400',
  new: 'border-l-cyan-400',
}

function SectionHeader({ icon: Icon, title, badge }: { icon: any; title: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-700">
        <Icon className="w-4 h-4 text-cyan-500" />
        {title}
      </div>
      {badge}
    </div>
  )
}

function StatusBadge({ status }: { status: ScanItemMatch['status'] | 'existing-vendor' | 'new-vendor' }) {
  const map: Record<string, { label: string; classes: string; Icon: any }> = {
    matched: { label: 'Matched', classes: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle2 },
    ambiguous: { label: 'Review', classes: 'bg-amber-100 text-amber-800', Icon: HelpCircle },
    new: { label: 'New', classes: 'bg-cyan-100 text-cyan-800', Icon: Sparkles },
  }
  const cfg = map[status] || map.new
  const { Icon } = cfg
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${cfg.classes}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

export default function ScanPurchaseInvoice({ userId, onClose, onCommitted }: ScanPurchaseInvoiceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanInvoiceResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmMismatch, setConfirmMismatch] = useState(false)

  const [vendorMode, setVendorMode] = useState<'existing' | 'new'>('existing')
  const [vendorId, setVendorId] = useState('')
  const [matchedVendor, setMatchedVendor] = useState<Vendor | null>(null)
  const [vendorForm, setVendorForm] = useState({ name: '', phone: '', address: '', gstin: '', drug_license_no: '', notes: '' })

  const [items, setItems] = useState<EditableItem[]>([])
  const [taxType, setTaxType] = useState<'INTRASTATE' | 'INTERSTATE'>('INTRASTATE')

  const [purchaseForm, setPurchaseForm] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    purchaseDate: '',
    purchaseType: 'CASH' as 'CASH' | 'CREDIT',
    paymentMode: 'CASH',
    notes: '',
    subtotal: '0',
    totalDiscount: '0',
    cgst: '0',
    sgst: '0',
    igst: '0',
    grandTotal: '0',
  })

  const handleFileSelect = (f: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(f ? URL.createObjectURL(f) : null)
  }

  const handleScan = async () => {
    if (!file) {
      toast.error('Please select an invoice photo first')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too large — please use a file under 10MB')
      return
    }
    setScanning(true)
    try {
      const res = await window.api.scanPurchaseInvoice(file)
      setResult(res)

      if (res.vendor.status === 'matched' && res.vendor.vendorId) {
        setVendorMode('existing')
        setVendorId(res.vendor.vendorId)
        setMatchedVendor(res.vendor.matchedVendor)
      } else {
        setVendorMode('new')
        setVendorForm({
          name: res.vendor.extracted.name || '',
          phone: res.vendor.extracted.phone || '',
          address: res.vendor.extracted.address || '',
          gstin: res.vendor.extracted.gstin || '',
          drug_license_no: res.vendor.extracted.drugLicenseNo || '',
          notes: '',
        })
      }

      // Build items and their tax breakdown together — the breakdown also feeds the header
      // totals below, so both are derived from the one set of per-line numbers we trust
      // (rate/qty/discount/GST%), not from separately-OCR'd aggregate fields. Invoice layouts
      // disagree on what their printed "line amount" and "subtotal" mean (pre- or post-GST,
      // pre- or post-discount) — deriving bottom-up sidesteps that ambiguity entirely.
      const mapped = res.items.map((im, idx) => {
        const e = im.extracted
        const gstPct = e.gstPct || 12
        const discountPct = e.discountPct || 0
        // purchaseRate, as extracted, is the gross per-unit rate BEFORE discount — keep it that
        // way (matching the manual Stock-In form) so discount/GST aren't baked in twice later.
        const grossRate = e.purchaseRate || 0
        const qty = e.quantity || 0
        const netPurchase = grossRate * (1 - discountPct / 100)
        const matched = im.status === 'matched' ? im.matchedMedicine : null
        const tax = computeItemTax(qty, grossRate, discountPct, gstPct)
        return {
          tax,
          item: {
            key: `item-${idx}`,
            originalStatus: im.status,
            suggestions: im.suggestions,
            mode: im.status === 'matched' ? 'existing' : 'new',
            medicineId: im.status === 'matched' ? (im.medicineId || '') : '',
            name: e.rawName || '',
            unitLabel: matched?.unit_label || 'strip',
            strength: matched?.strength || '',
            genericName: matched?.generic_name || '',
            manufacturer: matched?.manufacturer || '',
            pack: e.pack || matched?.pack || '',
            type: matched?.type || 'TABLET',
            hsnCode: e.hsnCode || matched?.hsn_code || '',
            batchNo: e.batchNumber || '',
            expiryMonth: toMonthInput(e.expiryDate),
            qty: e.quantity !== undefined && e.quantity !== null ? String(e.quantity) : '',
            freeQty: String(e.freeQuantity ?? 0),
            mrp: String(e.mrp ?? 0),
            discountPercent: String(discountPct),
            gstPercent: String(gstPct),
            purchasePrice: grossRate ? grossRate.toFixed(2) : '0',
            sellingPrice: e.mrp ? String(e.mrp) : (netPurchase ? netPurchase.toFixed(2) : '0'),
            lineAmount: tax.lineAmount.toFixed(2),
          } as EditableItem,
        }
      })
      setItems(mapped.map((m) => m.item))

      const p = res.purchase
      // Default the CGST+SGST vs IGST split from what the invoice actually printed.
      const taxTypeDefault: 'INTRASTATE' | 'INTERSTATE' =
        (p.igst ?? 0) > 0 && (p.cgst ?? 0) === 0 && (p.sgst ?? 0) === 0 ? 'INTERSTATE' : 'INTRASTATE'
      setTaxType(taxTypeDefault)

      const derivedTaxable = Number(mapped.reduce((sum, m) => sum + m.tax.taxableAmount, 0).toFixed(2))
      const derivedDiscount = Number(mapped.reduce((sum, m) => sum + m.tax.discountAmt, 0).toFixed(2))
      const derivedGst = Number(mapped.reduce((sum, m) => sum + m.tax.gstAmount, 0).toFixed(2))
      const derivedCgst = taxTypeDefault === 'INTERSTATE' ? 0 : Number((derivedGst / 2).toFixed(2))
      const derivedSgst = taxTypeDefault === 'INTERSTATE' ? 0 : Number((derivedGst / 2).toFixed(2))
      const derivedIgst = taxTypeDefault === 'INTERSTATE' ? derivedGst : 0

      setPurchaseForm({
        invoiceNumber: p.invoiceNumber || '',
        invoiceDate: p.invoiceDate || '',
        purchaseDate: p.invoiceDate || '',
        purchaseType: 'CASH',
        paymentMode: 'CASH',
        notes: '',
        subtotal: String(derivedTaxable),
        totalDiscount: String(derivedDiscount),
        cgst: String(derivedCgst),
        sgst: String(derivedSgst),
        igst: String(derivedIgst),
        // grandTotal is the one figure kept from the raw OCR read — it's a single, prominent
        // printed number invoices rarely get ambiguous, and it's what the mismatch check anchors to.
        grandTotal: String(p.grandTotal ?? 0),
      })

      toast.success('Invoice scanned — please review before saving')
    } catch (err: any) {
      toast.error(err.message || 'Failed to scan invoice')
    } finally {
      setScanning(false)
    }
  }

  const updateItem = (key: string, patch: Partial<EditableItem>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  }

  // Same as updateItem, but for the fields that drive the line total (qty, purchase rate,
  // discount %, GST %) — keeps "Line Amount" honest after the reviewer edits any of them,
  // instead of silently saving against a stale OCR-read total.
  const updateItemAndRecalc = (key: string, patch: Partial<EditableItem>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it
        const merged = { ...it, ...patch }
        const { lineAmount } = computeItemTax(
          parseFloat(merged.qty) || 0,
          parseFloat(merged.purchasePrice) || 0,
          parseFloat(merged.discountPercent) || 0,
          parseFloat(merged.gstPercent) || 0
        )
        return { ...merged, lineAmount: lineAmount.toFixed(2) }
      })
    )
  }

  // Primary, blocking check: Σ(line total, GST-inclusive) vs the invoice grand total. Mirrors
  // the backend's own re-validation in purchase-scan.service.ts#commit, which compares the same
  // two figures — keep this check's convention in sync with that or saves can 400 unexpectedly.
  const sumLineAmounts = items.reduce((sum, it) => sum + (parseFloat(it.lineAmount) || 0), 0)
  const grandTotalNum = parseFloat(purchaseForm.grandTotal) || 0
  const difference = Number((grandTotalNum - sumLineAmounts).toFixed(2))
  const mismatch = Math.abs(difference) > MISMATCH_TOLERANCE

  // Secondary, informational check: Σ(item taxable value) vs the invoice's printed taxable
  // subtotal — both pre-GST, post-discount, so no totalDiscount term belongs here (subtotal is
  // already net of discount per the extraction schema). A gap here usually means a qty/rate/
  // discount typo on one line, distinct from a GST/rounding artifact — doesn't block saving.
  const sumTaxableAmounts = Number(
    items
      .reduce((sum, it) => {
        const { taxableAmount } = computeItemTax(
          parseFloat(it.qty) || 0,
          parseFloat(it.purchasePrice) || 0,
          parseFloat(it.discountPercent) || 0,
          parseFloat(it.gstPercent) || 0
        )
        return sum + Number(taxableAmount.toFixed(2))
      }, 0)
      .toFixed(2)
  )
  const subtotalNum = Number((parseFloat(purchaseForm.subtotal) || 0).toFixed(2))
  const taxableDifference = Number((sumTaxableAmounts - subtotalNum).toFixed(2))
  const taxableMismatch = Math.abs(taxableDifference) > MISMATCH_TOLERANCE

  const vendorReady =
    vendorMode === 'existing'
      ? Boolean(vendorId)
      : Boolean(vendorForm.name.trim() && vendorForm.phone.trim() && vendorForm.address.trim())

  const itemsReady =
    items.length > 0 &&
    items.every(
      (it) =>
        (it.mode === 'existing' ? Boolean(it.medicineId) : Boolean(it.name.trim() && it.unitLabel.trim())) &&
        it.expiryMonth &&
        it.qty &&
        Number(it.qty) > 0 &&
        it.purchasePrice &&
        it.sellingPrice
    )

  const invoiceNumberReady = purchaseForm.invoiceNumber.trim() !== ''
  const purchaseDateReady = purchaseForm.purchaseDate !== ''
  const grandTotalReady = grandTotalNum > 0
  const mismatchConfirmed = !mismatch || confirmMismatch

  const canSubmit =
    vendorReady && itemsReady && invoiceNumberReady && purchaseDateReady && grandTotalReady && mismatchConfirmed

  const blockingReasons = [
    !vendorReady && 'Vendor details are incomplete',
    !itemsReady && 'One or more items are missing required fields',
    !invoiceNumberReady && 'Invoice number is required',
    !purchaseDateReady && 'Purchase date is required',
    !grandTotalReady && 'Grand total must be greater than 0',
    mismatch && !confirmMismatch && 'Confirm the total mismatch to proceed',
  ].filter(Boolean) as string[]

  const handleCommit = async () => {
    if (!canSubmit) {
      toast.error('Please complete all required fields before saving')
      return
    }
    setSubmitting(true)
    try {
      // Header GST figures are user-editable (OCR-extracted, reviewer can correct) — trust them as
      // the source of truth for the Purchase record, same as the manual Stock-In form's totals.
      const taxable = parseFloat(purchaseForm.subtotal) || 0
      const cgst = parseFloat(purchaseForm.cgst) || 0
      const sgst = parseFloat(purchaseForm.sgst) || 0
      const igst = parseFloat(purchaseForm.igst) || 0

      const payload: ScanCommitPayload = {
        vendor:
          vendorMode === 'existing'
            ? { mode: 'existing', vendorId }
            : {
                mode: 'new',
                data: {
                  name: vendorForm.name.trim(),
                  phone: vendorForm.phone.trim(),
                  address: vendorForm.address.trim(),
                  gstin: vendorForm.gstin.trim() || null,
                  drug_license_no: vendorForm.drug_license_no.trim() || null,
                  notes: vendorForm.notes.trim() || null,
                },
              },
        items: items.map((it) => {
          const qty = parseInt(it.qty, 10) || 0
          const discountPercent = parseFloat(it.discountPercent) || 0
          const gstPercent = parseFloat(it.gstPercent) || 0
          const purchasePrice = parseFloat(it.purchasePrice) || 0
          const { taxableAmount, gstAmount } = computeItemTax(qty, purchasePrice, discountPercent, gstPercent)

          const base = {
            batchNo: it.batchNo.trim() || undefined,
            expiryDate: lastDayOfMonthISO(it.expiryMonth),
            qty,
            unit: it.unitLabel || 'strip',
            freeQty: parseInt(it.freeQty, 10) || 0,
            freeUnit: it.unitLabel || 'strip',
            mrp: parseFloat(it.mrp) || 0,
            unitMrp: parseFloat(it.mrp) || 0,
            discountPercent,
            gstPercent,
            purchasePrice,
            unitPurchasePrice: purchasePrice,
            sellingPrice: parseFloat(it.sellingPrice) || 0,
            unitSellingPrice: parseFloat(it.sellingPrice) || 0,
            lineAmount: parseFloat(it.lineAmount) || 0,
            taxableAmount,
            cgstAmount: taxType === 'INTERSTATE' ? 0 : gstAmount / 2,
            sgstAmount: taxType === 'INTERSTATE' ? 0 : gstAmount / 2,
            igstAmount: taxType === 'INTERSTATE' ? gstAmount : 0,
          }
          if (it.mode === 'existing') {
            return { ...base, mode: 'existing' as const, medicineId: it.medicineId }
          }
          return {
            ...base,
            mode: 'new' as const,
            data: {
              name: it.name.trim(),
              unit_label: it.unitLabel.trim() || 'strip',
              base_unit: it.unitLabel.trim() || 'Piece',
              inner_unit: 'Strip',
              units_per_inner: 10,
              purchase_unit: 'Box',
              inner_units_per_purchase: 10,
              strength: it.strength.trim() || null,
              generic_name: it.genericName.trim() || null,
              manufacturer: it.manufacturer.trim() || null,
              pack: it.pack.trim() || null,
              type: it.type,
              hsn_code: it.hsnCode.trim() || null,
              default_gst_percent: parseFloat(it.gstPercent) || 12,
            },
          }
        }),
        purchase: {
          invoiceNumber: purchaseForm.invoiceNumber.trim(),
          invoiceDate: purchaseForm.invoiceDate || purchaseForm.purchaseDate,
          purchaseDate: purchaseForm.purchaseDate,
          purchaseType: purchaseForm.purchaseType,
          paymentMode: purchaseForm.paymentMode,
          notes: purchaseForm.notes.trim() || null,
          grandTotal: grandTotalNum,
          taxableAmount: taxable,
          cgstAmount: cgst,
          sgstAmount: sgst,
          igstAmount: igst,
          gstAmount: cgst + sgst + igst,
          gstPercent: items.length > 0 ? parseFloat(items[0].gstPercent) || 0 : 0,
        },
        confirmMismatch,
      }

      const created = await window.api.commitScannedPurchase({ data: payload, userId })
      toast.success('Purchase saved from scanned invoice!')
      onCommitted(created)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save purchase')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="w-full max-w-6xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow-md">
          <div className="flex items-center gap-2.5">
            <ScanLine className="w-5 h-5 text-cyan-400" />
            <h2 className="text-md font-bold">Scan Purchase Invoice</h2>
            {result && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Review before saving
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white text-slate-800">
          {!result ? (
            // ==========================================
            // STEP 1: UPLOAD
            // ==========================================
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-full max-w-md flex flex-col items-center gap-4 p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/60">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Invoice preview" className="max-h-56 rounded-xl border border-slate-200 object-contain" />
                ) : (
                  <FileImage className="w-12 h-12 text-slate-300" />
                )}
                <div className="text-center">
                  <p className="text-sm text-slate-800 font-semibold">{file ? file.name : 'Upload a photo or scan of the supplier invoice'}</p>
                  <p className="text-xs text-slate-500 mt-1">JPEG, PNG, WEBP, or GIF — up to 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  {file ? 'Choose a different file' : 'Choose file'}
                </button>
              </div>

              <button
                onClick={handleScan}
                disabled={!file || scanning}
                className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-cyan-500/20 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                {scanning ? 'Scanning invoice…' : 'Scan Invoice'}
              </button>
            </div>
          ) : (
            // ==========================================
            // STEP 2: REVIEW
            // ==========================================
            <div className="flex flex-col gap-6">
              <button
                onClick={() => {
                  setResult(null)
                  handleFileSelect(null)
                }}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-cyan-700 w-fit cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Scan a different invoice
              </button>

              {/* Vendor */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <SectionHeader
                  icon={Building2}
                  title="1. Vendor Details"
                  badge={<StatusBadge status={vendorMode === 'existing' ? 'matched' : 'new'} />}
                />

                {vendorMode === 'existing' ? (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{matchedVendor?.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {matchedVendor?.phone} {matchedVendor?.gstin ? `• GSTIN: ${matchedVendor.gstin}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => setVendorMode('new')}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-800 underline underline-offset-2 cursor-pointer whitespace-nowrap"
                    >
                      Not this vendor? Create new
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {vendorId && (
                      <button
                        onClick={() => setVendorMode('existing')}
                        className="text-xs font-semibold text-cyan-600 hover:text-cyan-800 underline underline-offset-2 w-fit cursor-pointer"
                      >
                        Use matched vendor instead
                      </button>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className={fieldLabelClass}>Name <span className="text-red-500">*</span></label>
                        <input className={fieldClass} value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} />
                      </div>
                      <div>
                        <label className={fieldLabelClass}>Phone <span className="text-red-500">*</span></label>
                        <input className={fieldClass} value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} />
                      </div>
                      <div>
                        <label className={fieldLabelClass}>GSTIN</label>
                        <input className={fieldClass} value={vendorForm.gstin} onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <label className={fieldLabelClass}>Address <span className="text-red-500">*</span></label>
                        <input className={fieldClass} value={vendorForm.address} onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} />
                      </div>
                      <div>
                        <label className={fieldLabelClass}>Drug License No.</label>
                        <input className={fieldClass} value={vendorForm.drug_license_no} onChange={(e) => setVendorForm({ ...vendorForm, drug_license_no: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Items */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <SectionHeader
                  icon={Package}
                  title={`2. Item Details (${items.length})`}
                />
                <div className="flex flex-col gap-3">
                  {items.map((it) => (
                    <div
                      key={it.key}
                      className={`border border-slate-200 border-l-4 ${STATUS_ACCENT[it.originalStatus] || 'border-l-cyan-400'} rounded-xl p-3 bg-slate-50/60`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <StatusBadge status={it.originalStatus} />
                        {it.mode === 'existing' && it.originalStatus !== 'new' ? (
                          <button
                            onClick={() => updateItem(it.key, { mode: 'new', medicineId: '' })}
                            className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 underline underline-offset-2 cursor-pointer"
                          >
                            Not this medicine? Add new
                          </button>
                        ) : (
                          it.suggestions.length > 0 && (
                            <button
                              onClick={() => updateItem(it.key, { mode: 'existing', medicineId: it.suggestions[0].id })}
                              className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-800 underline underline-offset-2 cursor-pointer"
                            >
                              Use a suggested match instead
                            </button>
                          )
                        )}
                      </div>

                      {/* Medicine resolution row */}
                      {it.mode === 'existing' && it.originalStatus === 'ambiguous' ? (
                        <div className="mb-2">
                          <label className={compactLabelClass}>Select matching medicine ("{it.name}" as printed)</label>
                          <select
                            className={compactFieldClass}
                            value={it.medicineId}
                            onChange={(e) => updateItem(it.key, { medicineId: e.target.value })}
                          >
                            <option value="">— Choose a match —</option>
                            {it.suggestions.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} {s.strength ? `(${s.strength})` : ''} {s.manufacturer ? `— ${s.manufacturer}` : ''} · {Math.round(s.score * 100)}% match
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : it.mode === 'existing' ? (
                        <p className="text-sm font-bold text-slate-900 mb-2">{it.name}</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                          <div className="col-span-2">
                            <label className={compactLabelClass}>Medicine Name <span className="text-red-500">*</span></label>
                            <input className={compactFieldClass} value={it.name} onChange={(e) => updateItem(it.key, { name: e.target.value })} />
                          </div>
                          <div>
                            <label className={compactLabelClass}>Strength</label>
                            <input className={compactFieldClass} value={it.strength} onChange={(e) => updateItem(it.key, { strength: e.target.value })} />
                          </div>
                          <div>
                            <label className={compactLabelClass}>Type</label>
                            <select className={compactFieldClass} value={it.type} onChange={(e) => updateItem(it.key, { type: e.target.value })}>
                              {MEDICINE_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={compactLabelClass}>Manufacturer</label>
                            <input className={compactFieldClass} value={it.manufacturer} onChange={(e) => updateItem(it.key, { manufacturer: e.target.value })} />
                          </div>
                          <div>
                            <label className={compactLabelClass}>Pack</label>
                            <input className={compactFieldClass} value={it.pack} onChange={(e) => updateItem(it.key, { pack: e.target.value })} />
                          </div>
                          <div>
                            <label className={compactLabelClass}>Unit Label <span className="text-red-500">*</span></label>
                            <input className={compactFieldClass} value={it.unitLabel} onChange={(e) => updateItem(it.key, { unitLabel: e.target.value })} placeholder="strip / vial / bottle" />
                          </div>
                          <div>
                            <label className={compactLabelClass}>HSN Code</label>
                            <input className={compactFieldClass} value={it.hsnCode} onChange={(e) => updateItem(it.key, { hsnCode: e.target.value })} />
                          </div>
                        </div>
                      )}

                      {/* Batch / pricing row */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                        <div>
                          <label className={compactLabelClass}>Batch No.</label>
                          <input className={compactFieldClass} value={it.batchNo} onChange={(e) => updateItem(it.key, { batchNo: e.target.value })} />
                        </div>
                        <div>
                          <label className={compactLabelClass}>Expiry <span className="text-red-500">*</span></label>
                          <input type="month" className={compactFieldClass} value={it.expiryMonth} onChange={(e) => updateItem(it.key, { expiryMonth: e.target.value })} />
                        </div>
                        <div>
                          <label className={compactLabelClass}>Qty <span className="text-red-500">*</span></label>
                          <input type="number" className={compactFieldClass} value={it.qty} onChange={(e) => updateItemAndRecalc(it.key, { qty: e.target.value })} />
                        </div>
                        <div>
                          <label className={compactLabelClass}>Free Qty</label>
                          <input type="number" className={compactFieldClass} value={it.freeQty} onChange={(e) => updateItem(it.key, { freeQty: e.target.value })} />
                        </div>
                        <div>
                          <label className={compactLabelClass}>MRP</label>
                          <input type="number" step="0.01" className={compactFieldClass} value={it.mrp} onChange={(e) => updateItem(it.key, { mrp: e.target.value })} />
                        </div>
                        <div>
                          <label className={compactLabelClass}>Purchase Rate <span className="text-red-500">*</span></label>
                          <input type="number" step="0.01" className={compactFieldClass} value={it.purchasePrice} onChange={(e) => updateItemAndRecalc(it.key, { purchasePrice: e.target.value })} />
                        </div>
                        <div>
                          <label className={compactLabelClass}>Selling Rate <span className="text-red-500">*</span></label>
                          <input type="number" step="0.01" className={compactFieldClass} value={it.sellingPrice} onChange={(e) => updateItem(it.key, { sellingPrice: e.target.value })} />
                        </div>
                        <div>
                          <label className={compactLabelClass}>Discount %</label>
                          <input type="number" step="0.01" className={compactFieldClass} value={it.discountPercent} onChange={(e) => updateItemAndRecalc(it.key, { discountPercent: e.target.value })} />
                        </div>
                        <div>
                          <label className={compactLabelClass}>GST %</label>
                          <input type="number" step="0.01" className={compactFieldClass} value={it.gstPercent} onChange={(e) => updateItemAndRecalc(it.key, { gstPercent: e.target.value })} />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className={compactLabelClass}>Line Amount <span className="text-red-500">*</span></label>
                          <input type="number" step="0.01" className={compactFieldClass} value={it.lineAmount} onChange={(e) => updateItem(it.key, { lineAmount: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Purchase totals */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <SectionHeader icon={Receipt} title="3. Invoice Totals" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className={fieldLabelClass}>Invoice No. <span className="text-red-500">*</span></label>
                    <input className={fieldClass} value={purchaseForm.invoiceNumber} onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Purchase Date <span className="text-red-500">*</span></label>
                    <input type="date" className={fieldClass} value={purchaseForm.purchaseDate} onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Purchase Type</label>
                    <select
                      className={fieldClass}
                      value={purchaseForm.purchaseType}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseType: e.target.value as 'CASH' | 'CREDIT' })}
                    >
                      <option value="CASH">CASH</option>
                      <option value="CREDIT">CREDIT</option>
                    </select>
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Payment Mode</label>
                    <select className={fieldClass} value={purchaseForm.paymentMode} onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentMode: e.target.value })}>
                      <option value="CASH">CASH</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK">BANK</option>
                      <option value="CARD">CARD</option>
                    </select>
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Tax Type</label>
                    <select className={fieldClass} value={taxType} onChange={(e) => setTaxType(e.target.value as 'INTRASTATE' | 'INTERSTATE')}>
                      <option value="INTRASTATE">CGST + SGST (In-State)</option>
                      <option value="INTERSTATE">IGST (Out of State)</option>
                    </select>
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Subtotal (Taxable)</label>
                    <input type="number" step="0.01" className={fieldClass} value={purchaseForm.subtotal} onChange={(e) => setPurchaseForm({ ...purchaseForm, subtotal: e.target.value })} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Total Discount</label>
                    <input type="number" step="0.01" className={fieldClass} value={purchaseForm.totalDiscount} onChange={(e) => setPurchaseForm({ ...purchaseForm, totalDiscount: e.target.value })} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>CGST</label>
                    <input type="number" step="0.01" className={fieldClass} value={purchaseForm.cgst} onChange={(e) => setPurchaseForm({ ...purchaseForm, cgst: e.target.value })} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>SGST</label>
                    <input type="number" step="0.01" className={fieldClass} value={purchaseForm.sgst} onChange={(e) => setPurchaseForm({ ...purchaseForm, sgst: e.target.value })} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>IGST</label>
                    <input type="number" step="0.01" className={fieldClass} value={purchaseForm.igst} onChange={(e) => setPurchaseForm({ ...purchaseForm, igst: e.target.value })} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Grand Total <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      className={`${fieldClass} font-extrabold text-cyan-700 border-cyan-200 bg-cyan-50/70`}
                      value={purchaseForm.grandTotal}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, grandTotal: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <span>Sum of line amounts: <strong className="text-slate-900">₹{sumLineAmounts.toFixed(2)}</strong></span>
                  <span>Invoice grand total: <strong className="text-slate-900">₹{grandTotalNum.toFixed(2)}</strong></span>
                </div>

                {mismatch && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-amber-900 font-bold">
                        Line amounts differ from the invoice grand total by ₹{Math.abs(difference).toFixed(2)}.
                      </p>
                      <p className="text-xs text-amber-800/80 mt-0.5">Double-check the totals above, or confirm to save anyway.</p>
                      <label className="flex items-center gap-2 mt-2 text-xs font-semibold text-amber-900 cursor-pointer">
                        <input type="checkbox" checked={confirmMismatch} onChange={(e) => setConfirmMismatch(e.target.checked)} />
                        Save anyway despite the mismatch
                      </label>
                    </div>
                  </div>
                )}

                {taxableMismatch && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-sky-50 border border-sky-200">
                    <HelpCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-sky-900 font-bold">
                        Item taxable values (₹{sumTaxableAmounts.toFixed(2)}) differ from the invoice's taxable subtotal (₹{subtotalNum.toFixed(2)}) by ₹{Math.abs(taxableDifference).toFixed(2)}.
                      </p>
                      <p className="text-xs text-sky-800/80 mt-0.5">
                        This usually points to a misread quantity, rate, or discount on one of the item lines above — worth a check, but it won't block saving.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        {result && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
            <p className="text-xs text-slate-500">Nothing is saved until you confirm.</p>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <div className="relative group">
                <button
                  onClick={handleCommit}
                  disabled={!canSubmit || submitting}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-cyan-500/20 cursor-pointer disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {submitting ? 'Saving…' : 'Confirm & Save Purchase'}
                </button>

                {!canSubmit && !submitting && blockingReasons.length > 0 && (
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-2 bg-slate-900 text-slate-200 text-xs rounded-lg shadow-xl z-50">
                    <p className="font-semibold text-amber-400 mb-1">Cannot save yet:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {blockingReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
