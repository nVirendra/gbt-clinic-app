import React, { useState, useEffect } from 'react'
import { Bill, ClinicProfile } from '../types'
import { realApi } from '../lib/realApi'

interface PrintInvoiceProps {
  billId: string
}

function numberToIndianWords(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const numToWords = (n: number): string => {
    if (n < 20) return a[n]
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '')
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + numToWords(n % 100) : '')
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '')
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '')
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '')
  }

  const rounded = Math.floor(num)
  const paise = Math.round((num - rounded) * 100)

  if (rounded === 0 && paise === 0) return 'Zero Rupees Only'
  
  let result = ''
  if (rounded > 0) {
    result += numToWords(rounded) + ' Rupees'
  }
  if (paise > 0) {
    if (rounded > 0) result += ' and '
    result += numToWords(paise) + ' Paise'
  }
  return result + ' Only'
}

export default function PrintInvoice({ billId }: PrintInvoiceProps) {
  const [bill, setBill] = useState<Bill | null>(null)
  const [profile, setProfile] = useState<ClinicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [layout, setLayout] = useState<'A4' | 'THERMAL'>('A4') // 'A4' or 'THERMAL' 80mm

  const loadInvoiceData = async () => {
    try {
      const activeApi = typeof window !== 'undefined' && window.api ? window.api : realApi
      const [bData, pData] = await Promise.all([
        activeApi.getBillById(billId),
        activeApi.getClinicProfile()
      ])
      setBill(bData)
      setProfile(pData)
    } catch (e) {
      console.error('Failed to load invoice print data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (billId) {
      loadInvoiceData()
    }
  }, [billId])

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white text-slate-500 text-sm">
        Loading printable receipt...
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white text-red-500 font-bold text-sm">
        Invoice not found.
      </div>
    )
  }

  // Calculate GST groups for tax breakup
  const getGstTaxGroups = () => {
    if (!bill.items) return []
    const groups: Record<number, { taxableValue: number; cgst: number; sgst: number; totalTax: number }> = {}

    const billSubtotalPaise = Math.round(bill.subtotal * 100)
    const billDiscountPaise = Math.round(bill.discount_total * 100)

    bill.items.forEach(item => {
      const itemTotalPaise = Math.round(item.line_total * 100)
      const share = billSubtotalPaise > 0 ? (itemTotalPaise / billSubtotalPaise) : 0
      const allocatedGeneralDiscount = billDiscountPaise * share
      const itemTaxablePaise = Math.max(0, itemTotalPaise - allocatedGeneralDiscount)
      
      const rate = item.gst_percent
      const totalTaxPaise = Math.round((itemTaxablePaise * rate) / 100)
      const cgstPaise = totalTaxPaise / 2
      const sgstPaise = totalTaxPaise / 2

      if (!groups[rate]) {
        groups[rate] = { taxableValue: 0, cgst: 0, sgst: 0, totalTax: 0 }
      }

      groups[rate].taxableValue += itemTaxablePaise / 100
      groups[rate].cgst += cgstPaise / 100
      groups[rate].sgst += sgstPaise / 100
      groups[rate].totalTax += totalTaxPaise / 100
    })

    return Object.entries(groups).map(([rate, vals]) => ({
      rate: parseFloat(rate),
      ...vals
    }))
  }

  const gstTaxGroups = getGstTaxGroups()

  // RENDER A4 / A5 STANDARD LAYOUT
  const renderA4Layout = () => {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Letterhead Header */}
        <div className="flex justify-between items-start border-b border-black pb-4">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight">{profile?.name}</h1>
            <p className="text-[10px] mt-1 max-w-sm whitespace-pre-line">{profile?.address}</p>
            <p className="text-[10px] mt-0.5">Phone: {profile?.phone} | Email: {profile?.email}</p>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold uppercase tracking-widest border border-black px-2 py-0.5 inline-block">
              Tax Invoice
            </h2>
            <p className="text-sm font-bold mt-2 font-mono">{bill.bill_no}</p>
            <p className="text-[10px] mt-1">
              Date: {new Date(bill.bill_date).toLocaleDateString('en-GB')}
            </p>
            {profile?.gstin && (
              <p className="text-[9px] font-bold mt-1.5 font-mono">GSTIN: {profile.gstin}</p>
            )}
          </div>
        </div>

        {/* Patient Details Section */}
        <div className="grid grid-cols-2 gap-4 border border-black p-3 text-[10px]">
          <div>
            <h3 className="font-bold uppercase tracking-wider text-[9px] border-b border-black/30 pb-0.8 mb-1">
              Patient Details
            </h3>
            {bill.patient ? (
              <>
                <p className="font-bold text-xs">{bill.patient.full_name}</p>
                <p className="mt-0.5 font-mono">Patient Code: {bill.patient.patient_code}</p>
                <p>Gender / Age: {bill.patient.gender} / {bill.patient.age_years || 'N/A'} Yrs</p>
                <p className="font-mono">Phone: {bill.patient.phone}</p>
              </>
            ) : (
              <>
                <p className="font-bold text-xs">{bill.walkin_name}</p>
                <p className="mt-0.5 text-slate-500 font-bold uppercase">Walk-in Client</p>
              </>
            )}
          </div>
          <div>
            <h3 className="font-bold uppercase tracking-wider text-[9px] border-b border-black/30 pb-0.8 mb-1">
              Invoice Summary
            </h3>
            <p>Payment Mode: <strong className="uppercase">{bill.payments?.[0]?.mode || 'CASH'}</strong></p>
            {bill.payments?.[0]?.reference_no && <p className="font-mono">Txn ID: {bill.payments[0].reference_no}</p>}
            {bill.notes && <p className="italic">Note: {bill.notes}</p>}
            {bill.patient?.referring_doctor && (
              <p className="mt-1">Referred By: {bill.patient.referring_doctor}</p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-left border border-black border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-black font-bold bg-slate-100">
              <th className="px-3 py-1.5 border-r border-black text-center w-8">S.No.</th>
              <th className="px-3 py-1.5 border-r border-black">Description / Service</th>
              <th className="px-3 py-1.5 text-right border-r border-black">Rate (₹)</th>
              <th className="px-3 py-1.5 text-center border-r border-black">Qty</th>
              <th className="px-3 py-1.5 text-right border-r border-black">Discount (₹)</th>
              <th className="px-3 py-1.5 text-right border-r border-black">GST %</th>
              <th className="px-3 py-1.5 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {bill.items?.map((item, index) => (
              <tr key={item.id} className="border-b border-black/50">
                <td className="px-3 py-1.5 border-r border-black/50 text-center">{index + 1}</td>
                <td className="px-3 py-1.5 border-r border-black/50 font-bold">{item.description}</td>
                <td className="px-3 py-1.5 text-right border-r border-black/50 font-mono">
                  {item.unit_price.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-center border-r border-black/50 font-semibold">{item.qty}</td>
                <td className="px-3 py-1.5 text-right border-r border-black/50 text-red-700 font-mono">
                  {item.discount_amount > 0 ? `-${item.discount_amount.toFixed(2)}` : '0.00'}
                </td>
                <td className="px-3 py-1.5 text-right border-r border-black/50 font-mono">
                  {item.gst_percent}%
                </td>
                <td className="px-3 py-1.5 text-right font-bold font-mono">
                  {item.line_total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* GST Tax Breakup splits table */}
        {gstTaxGroups.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-500">GST Breakdown (CGST + SGST Split)</h4>
            <table className="w-full text-left border border-black/30 border-collapse text-[9px] font-mono">
              <thead>
                <tr className="bg-slate-50 border-b border-black/35 font-bold">
                  <th className="px-3 py-1 border-r border-black/30">Tax Rate %</th>
                  <th className="px-3 py-1 text-right border-r border-black/30">Taxable Value (₹)</th>
                  <th className="px-3 py-1 text-right border-r border-black/30">CGST Amount (₹)</th>
                  <th className="px-3 py-1 text-right border-r border-black/30">SGST Amount (₹)</th>
                  <th className="px-3 py-1 text-right">Total GST Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {gstTaxGroups.map((g, idx) => (
                  <tr key={idx} className="border-b border-black/20">
                    <td className="px-3 py-1 border-r border-black/20 font-sans font-semibold">{g.rate}%</td>
                    <td className="px-3 py-1 text-right border-r border-black/20">{g.taxableValue.toFixed(2)}</td>
                    <td className="px-3 py-1 text-right border-r border-black/20">{g.cgst.toFixed(2)}</td>
                    <td className="px-3 py-1 text-right border-r border-black/20">{g.sgst.toFixed(2)}</td>
                    <td className="px-3 py-1 text-right font-bold">{g.totalTax.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Subtotals & Signatures */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/20">
          <div className="text-[9px] text-slate-600 flex flex-col justify-between">
            <div className="space-y-1.5">
              <p className="font-bold text-[10px] text-slate-800">Amount in Words:</p>
              <p className="italic font-bold text-slate-900 leading-relaxed bg-slate-50 p-2 border border-slate-100 rounded">
                {numberToIndianWords(bill.grand_total)}
              </p>
              <p className="text-[8px] text-slate-500 pt-2 leading-relaxed">
                • This is a computer-generated invoice and requires no physical signature.<br />
                • Please carry this receipt for any follow-up visits or reviews.
              </p>
            </div>
            
            {/* Signature Area */}
            <div className="pt-8 text-center w-48 border-t border-black/30 border-dashed mt-8">
              <p className="font-bold">Authorized Signature</p>
            </div>
          </div>

          {/* Calculations Table */}
          <div className="w-64 ml-auto border border-black p-2.5 text-[10px] space-y-2">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Items Subtotal:</span>
              <span className="font-mono">₹{bill.subtotal.toFixed(2)}</span>
            </div>
            {bill.discount_total > 0 && (
              <div className="flex justify-between text-red-700 font-bold">
                <span>General Discount:</span>
                <span className="font-mono">-₹{bill.discount_total.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 font-medium">
              <span>GST Total:</span>
              <span className="font-mono">₹{bill.tax_total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[9px]">
              <span>Round Off:</span>
              <span className="font-mono">{bill.round_off >= 0 ? '+' : ''}₹{bill.round_off.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-black pt-1.5 font-bold text-xs text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono">₹{bill.grand_total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-teal-800 border-t border-dashed border-black/30 pt-1">
              <span>Total Paid:</span>
              <span className="font-mono">₹{bill.amount_paid.toFixed(2)}</span>
            </div>
            {bill.balance_due > 0 && (
              <div className="flex justify-between font-bold text-red-750 border-t border-black/30 pt-1">
                <span>Balance Due:</span>
                <span className="font-mono">₹{bill.balance_due.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black/30 pt-4 text-center text-[9px] text-slate-500">
          <p>Thank you for visiting {profile?.name}!</p>
          <p className="mt-0.5">Software Generated Offline Invoice.</p>
        </div>
      </div>
    )
  }

  // RENDER 80MM THERMAL RECEIPT LAYOUT
  const renderThermalLayout = () => {
    return (
      <div className="max-w-[80mm] mx-auto p-2 bg-white text-black font-mono text-[10px] space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold uppercase">{profile?.name}</h2>
          <p className="text-[9px] leading-snug">{profile?.address}</p>
          <p className="text-[9px]">Ph: {profile?.phone}</p>
          {profile?.gstin && <p className="text-[9px]">GSTIN: {profile.gstin}</p>}
          <p className="border-b border-black border-dashed pb-2"></p>
        </div>

        {/* Bill Metadata */}
        <div className="space-y-0.5 text-[9px]">
          <p><strong>Invoice No:</strong> {bill.bill_no}</p>
          <p><strong>Date:</strong> {new Date(bill.bill_date).toLocaleDateString('en-GB')}</p>
          {bill.patient ? (
            <>
              <p><strong>Patient:</strong> {bill.patient.full_name}</p>
              <p><strong>Code / Ph:</strong> {bill.patient.patient_code} | {bill.patient.phone}</p>
            </>
          ) : (
            <p><strong>Walk-in Patient:</strong> {bill.walkin_name}</p>
          )}
          <p className="border-b border-black border-dashed pb-2"></p>
        </div>

        {/* Items */}
        <table className="w-full text-left text-[9px]">
          <thead>
            <tr className="border-b border-black border-dashed font-bold">
              <th className="py-1">Item Description</th>
              <th className="py-1 text-center">Qty</th>
              <th className="py-1 text-right">Amt(₹)</th>
            </tr>
          </thead>
          <tbody>
            {bill.items?.map((item, idx) => (
              <tr key={idx} className="align-top border-b border-slate-100">
                <td className="py-1 pr-1 font-bold">{item.description}</td>
                <td className="py-1 text-center">{item.qty}</td>
                <td className="py-1 text-right font-bold">{(item.line_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <p className="border-b border-black border-dashed"></p>

        {/* Calculations */}
        <div className="space-y-1 text-[9px] pl-10">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{bill.subtotal.toFixed(2)}</span>
          </div>
          {bill.discount_total > 0 && (
            <div className="flex justify-between font-bold">
              <span>Discount:</span>
              <span>-₹{bill.discount_total.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>GST Amount:</span>
            <span>₹{bill.tax_total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Round Off:</span>
            <span>{bill.round_off >= 0 ? '+' : ''}₹{bill.round_off.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-extrabold text-sm border-t border-black border-dashed pt-1">
            <span>Grand Total:</span>
            <span>₹{bill.grand_total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-slate-200 pt-0.5">
            <span>Paid:</span>
            <span>₹{bill.amount_paid.toFixed(2)}</span>
          </div>
          {bill.balance_due > 0 && (
            <div className="flex justify-between font-bold text-red-700">
              <span>Balance Due:</span>
              <span>₹{bill.balance_due.toFixed(2)}</span>
            </div>
          )}
        </div>

        <p className="border-b border-black border-dashed"></p>

        {/* Amount in words */}
        <div className="text-[9px] italic space-y-1 leading-snug">
          <p className="font-bold">In Words:</p>
          <p>{numberToIndianWords(bill.grand_total)}</p>
        </div>

        {/* Footer */}
        <div className="text-center text-[9px] pt-4 space-y-1 border-t border-black border-dashed">
          <p>Thank you for visiting!</p>
          <p>Please keep this invoice receipt.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 py-6 font-sans text-xs text-black leading-normal print:bg-white print:p-0 print:py-0">
      
      {/* Layout selector buttons - HIDDEN DURING PRINTING */}
      <div className="max-w-2xl mx-auto mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center print:hidden">
        <span className="font-semibold text-slate-500">Receipt Print Formats:</span>
        <div className="flex space-x-2">
          <button
            onClick={() => setLayout('A4')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
              layout === 'A4' ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            A4 / A5 Layout
          </button>
          <button
            onClick={() => setLayout('THERMAL')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
              layout === 'THERMAL' ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            80mm Thermal Layout
          </button>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
        >
          Print Receipt
        </button>
      </div>

      {layout === 'A4' ? renderA4Layout() : renderThermalLayout()}

    </div>
  )
}
