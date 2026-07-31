import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Download, 
  AlertTriangle,
  Coins,
  Package,
  Layers,
  Building2,
  CalendarDays,
  FileText
} from 'lucide-react'
import { useReportsStore } from '../store'
import { DataTable, ColumnDef } from '../../../components/common/DataTable'

export default function Reports() {
  const [activeReportTab, setActiveReportTab] = useState('financials') // 'financials', 'gst', 'inventory', 'ledger', 'vendors'

  const startDate = useReportsStore((state) => state.startDate)
  const endDate = useReportsStore((state) => state.endDate)
  const stats = useReportsStore((state) => state.stats)
  const dues = useReportsStore((state) => state.dues)
  const gstSummary = useReportsStore((state) => state.gstSummary)
  const inventoryValuation = useReportsStore((state) => state.inventoryValuation)
  const batches = useReportsStore((state) => state.batches)
  const medicines = useReportsStore((state) => state.medicines)
  const selectedBatchId = useReportsStore((state) => state.selectedBatchId)
  const ledgerLogs = useReportsStore((state) => state.ledgerLogs)
  const vendorPurchases = useReportsStore((state) => state.vendorPurchases)

  const statsLoading = useReportsStore((state) => state.statsLoading)
  const duesLoading = useReportsStore((state) => state.duesLoading)
  const gstLoading = useReportsStore((state) => state.gstLoading)
  const inventoryLoading = useReportsStore((state) => state.inventoryLoading)
  const ledgerLoading = useReportsStore((state) => state.ledgerLoading)
  const vendorsLoading = useReportsStore((state) => state.vendorsLoading)

  const setDates = useReportsStore((state) => state.setDates)
  const setSelectedBatchId = useReportsStore((state) => state.setSelectedBatchId)
  const loadFinancials = useReportsStore((state) => state.loadFinancials)
  const loadGst = useReportsStore((state) => state.loadGst)
  const loadInventory = useReportsStore((state) => state.loadInventory)
  const loadLedger = useReportsStore((state) => state.loadLedger)
  const loadVendors = useReportsStore((state) => state.loadVendors)

  const getToday = () => new Date().toISOString().split('T')[0]

  // Load appropriate data based on active tab
  useEffect(() => {
    if (activeReportTab === 'financials') {
      loadFinancials()
    } else if (activeReportTab === 'gst') {
      loadGst()
    } else if (activeReportTab === 'inventory') {
      loadInventory()
    } else if (activeReportTab === 'ledger') {
      loadInventory() // to populate the batch select dropdown
    } else if (activeReportTab === 'vendors') {
      loadVendors()
    }
  }, [activeReportTab, startDate, endDate])

  useEffect(() => {
    if (selectedBatchId) {
      loadLedger()
    }
  }, [selectedBatchId])

  // Helper function for local CSV generation
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Exports
  const exportCollectionStats = () => {
    if (!stats) return
    const headers = ['Metric', 'Amount / Count']
    const rows = [
      ['Start Date', startDate],
      ['End Date', endDate],
      ['Total Invoices Billed (Grand Total)', `₹${stats.totalBilled.toFixed(2)}`],
      ['Total Collections Received', `₹${stats.totalCollected.toFixed(2)}`],
      ['Cash Collections', `₹${stats.cashCollected.toFixed(2)}`],
      ['UPI Collections', `₹${stats.upiCollected.toFixed(2)}`],
      ['Card Collections', `₹${stats.cardCollected.toFixed(2)}`],
      ['Bank Transfer Collections', `₹${stats.bankCollected.toFixed(2)}`],
      ['Outstanding Dues in Date Range', `₹${stats.totalDues.toFixed(2)}`],
      ['Number of Invoices Created', stats.billCount.toString()],
      ['Number of Transactions Recorded', stats.paymentCount.toString()]
    ]
    downloadCSV(`collection-summary-${startDate}-to-${endDate}.csv`, headers, rows)
  }

  const exportOutstandingDues = () => {
    if (dues.length === 0) return
    const headers = ['Patient Code', 'Patient Name', 'Phone', 'Bill Date', 'Invoice No', 'Grand Total', 'Paid Amount', 'Balance Due', 'Status']
    const rows = dues.map(bill => [
      bill.patient?.patient_code || 'Walkin',
      bill.patient?.full_name || bill.walkin_name || '',
      bill.patient?.phone || '',
      new Date(bill.bill_date).toLocaleDateString('en-GB'),
      bill.bill_no,
      bill.grand_total.toString(),
      bill.amount_paid.toString(),
      bill.balance_due.toString(),
      bill.status
    ])
    downloadCSV(`outstanding-dues-${getToday()}.csv`, headers, rows)
  }

  const exportGstPeriod = () => {
    if (gstSummary.length === 0) return
    const headers = ['GST Rate %', 'Taxable Value', 'CGST (half)', 'SGST (half)', 'Total Tax Amount']
    const rows = gstSummary.map(row => [
      `${row.rate}%`,
      row.taxableValue.toFixed(2),
      row.cgst.toFixed(2),
      row.sgst.toFixed(2),
      row.totalTax.toFixed(2)
    ])
    downloadCSV(`gst-period-summary-${startDate}-to-${endDate}.csv`, headers, rows)
  }

  const getDaysToExpiry = (expiryStr: string) => {
    const diff = new Date(expiryStr).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const expiredList = batches.filter(b => getDaysToExpiry(b.expiry_date) <= 0 && b.qty_available > 0)
  const expiringSoonList = batches.filter(b => {
    const days = getDaysToExpiry(b.expiry_date)
    return days > 0 && days <= 30 && b.qty_available > 0
  })
  
  const lowStockList = medicines.filter(m => {
    const totalAvail = m.batches?.reduce((sum, b) => sum + b.qty_available, 0) || 0
    return totalAvail < m.reorder_level
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Report selector tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'financials', label: 'Financial Collections', icon: TrendingUp },
          { id: 'gst', label: 'GST Summary', icon: FileText },
          { id: 'inventory', label: 'Inventory Valuation & Alerts', icon: Package },
          { id: 'ledger', label: 'Stock Ledger', icon: Layers },
          { id: 'vendors', label: 'Vendor Purchases', icon: Building2 }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id)}
              className={`flex items-center px-5 py-3 font-medium text-sm border-b-2 transition-all cursor-pointer ${
                activeReportTab === tab.id
                  ? 'border-cyan-500 text-cyan-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Date Range selectors (only show for financials and gst) */}
      {(activeReportTab === 'financials' || activeReportTab === 'gst') && (
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Period Filter:</span>
            <div className="flex items-center space-x-1.5 text-xs font-semibold">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setDates(e.target.value, endDate)}
                className="px-2.5 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs font-semibold bg-slate-50/50"
              />
            </div>
            <span className="text-slate-400 text-sm">to</span>
            <div className="flex items-center space-x-1.5 text-xs font-semibold">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setDates(startDate, e.target.value)}
                className="px-2.5 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs font-semibold bg-slate-50/50"
              />
            </div>
          </div>

          <button
            onClick={activeReportTab === 'financials' ? exportCollectionStats : exportGstPeriod}
            className="flex items-center bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export Period CSV
          </button>
        </div>
      )}

      {/* --- FINANCIAL COLLECTIONS TAB --- */}
      {activeReportTab === 'financials' && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="h-28 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
          ) : stats ? (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-slate-900 p-6 rounded-2xl text-slate-100 shadow-sm border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Total Collections</p>
                    <h3 className="text-3xl font-black text-white mt-1 flex items-center font-mono">
                      ₹{(stats?.totalCollected ?? 0).toFixed(2)}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">Logged over {stats?.paymentCount ?? 0} payments</p>
                  </div>
                  <div className="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
                    <Coins className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Invoiced Billed</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1 flex items-center font-mono">
                      ₹{(stats?.totalBilled ?? 0).toFixed(2)}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">Sum of {stats?.billCount ?? 0} invoices created</p>
                  </div>
                  <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-505 uppercase tracking-widest">Outstanding (All time)</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1 flex items-center font-mono">
                      ₹{dues.reduce((sum, d) => sum + (d?.balance_due ?? 0), 0).toFixed(2)}
                    </h3>
                    <p className="text-[10px] text-red-500 font-semibold mt-1">Dues pending collection</p>
                  </div>
                  <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 font-bold">
                    <AlertTriangle className="h-5 w-5 text-red-655" />
                  </div>
                </div>

              </div>

              {/* Split breakdown by Payment Mode */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Collections by Mode</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cash</p>
                    <p className="text-xl font-bold text-slate-800 mt-1 font-mono">₹{(stats?.cashCollected ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">UPI</p>
                    <p className="text-xl font-bold text-slate-800 mt-1 font-mono">₹{(stats?.upiCollected ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Card</p>
                    <p className="text-xl font-bold text-slate-800 mt-1 font-mono">₹{(stats?.cardCollected ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bank Transfer</p>
                    <p className="text-xl font-bold text-slate-800 mt-1 font-mono">₹{(stats?.bankCollected ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* OUTSTANDING DUES TABLE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <AlertTriangle className="h-4.5 w-4.5 text-red-500 mr-2" /> Outstanding Dues List
              </h3>
              <button
                onClick={exportOutstandingDues}
                disabled={duesLoading || dues.length === 0}
                className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold underline cursor-pointer"
              >
                Export Dues List CSV
              </button>
            </div>

            <DataTable
              columns={[
                { key: 'patient_code', header: 'Patient Code', sortable: true, render: (d: any) => <span className="font-mono text-xs font-semibold">{d.patient?.patient_code || 'Walk-in'}</span> },
                { key: 'patient_name', header: 'Patient Name', sortable: true, sortValue: (d: any) => d.patient?.full_name || d.walkin_name || '', render: (d: any) => <span className="font-bold text-slate-900">{d.patient?.full_name || d.walkin_name}</span> },
                { key: 'phone', header: 'Phone', sortable: true, sortValue: (d: any) => d.patient?.phone || '', render: (d: any) => <span className="font-mono text-xs text-slate-500">{d.patient?.phone || 'N/A'}</span> },
                { key: 'bill_no', header: 'Invoice No', sortable: true, render: (d: any) => <span className="font-mono font-bold text-slate-800">{d.bill_no}</span> },
                { key: 'grand_total', header: 'Invoice Total', sortable: true, align: 'right', render: (d: any) => <span className="font-mono font-bold">₹{d.grand_total.toFixed(2)}</span> },
                { key: 'balance_due', header: 'Balance Due', sortable: true, align: 'right', render: (d: any) => <span className="font-mono font-bold text-red-600">₹{d.balance_due.toFixed(2)}</span> },
                {
                  key: 'status',
                  header: 'Status',
                  sortable: true,
                  align: 'center',
                  render: (d: any) => (
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      d.amount_paid > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {d.amount_paid > 0 ? 'PARTIAL' : 'UNPAID'}
                    </span>
                  )
                }
              ]}
              data={dues}
              loading={duesLoading}
              rowKey={(d) => d.id}
              searchPlaceholder="Search dues by patient or invoice..."
              emptyMessage="No outstanding dues recorded!"
              emptySubtext="All patient invoices have been fully settled."
            />
          </div>
        </div>
      )}

      {/* --- GST SUMMARY TAB --- */}
      {activeReportTab === 'gst' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
            GST Summary breakdown (CGST + SGST split)
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-sm">
            {gstLoading ? (
              <div className="p-8 text-center text-slate-400">Loading GST report...</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="px-6 py-4">GST Rate (%)</th>
                    <th className="px-6 py-4 text-right">Taxable Value</th>
                    <th className="px-6 py-4 text-right">CGST Split (Half)</th>
                    <th className="px-6 py-4 text-right">SGST Split (Half)</th>
                    <th className="px-6 py-4 text-right font-bold">Total Tax Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-mono">
                  {gstSummary.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20">
                      <td className="px-6 py-3.5 font-sans font-semibold text-slate-800">{row.rate}%</td>
                      <td className="px-6 py-3.5 text-right">₹{row.taxableValue.toFixed(2)}</td>
                      <td className="px-6 py-3.5 text-right">₹{row.cgst.toFixed(2)}</td>
                      <td className="px-6 py-3.5 text-right">₹{row.sgst.toFixed(2)}</td>
                      <td className="px-6 py-3.5 text-right text-slate-900 font-bold">₹{row.totalTax.toFixed(2)}</td>
                    </tr>
                  ))}
                  {gstSummary.length === 0 && (
                    <tr className="font-sans">
                      <td colSpan={5} className="p-8 text-center text-slate-400">No GST transactions recorded in the range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* --- INVENTORY REPORT TAB --- */}
      {activeReportTab === 'inventory' && (
        <div className="space-y-6">
          {inventoryLoading ? (
            <div className="h-28 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Valuation cards */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl text-slate-100 shadow-sm border border-slate-800">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Inventory Valuation (Purchase Cost)</p>
                  <h3 className="text-3xl font-black text-white mt-1 font-mono">
                    ₹{inventoryValuation.purchaseValuation.toFixed(2)}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Total valuation at purchase price</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inventory Valuation (Selling Price)</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1 font-mono">
                    ₹{inventoryValuation.sellingValuation.toFixed(2)}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Total valuation at selling price</p>
                </div>
              </div>

              {/* Alert Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Expired Batches */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center">
                    <AlertTriangle className="h-4.5 w-4.5 mr-1.5 text-red-500" /> Expired Stock ({expiredList.length})
                  </h3>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto text-xs">
                    {expiredList.map(b => (
                      <div key={b.id} className="py-2 flex justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{b.medicine?.name}</p>
                          <p className="text-slate-400 mt-0.5 font-mono">Batch: {b.batch_no} | Exp: {new Date(b.expiry_date).toLocaleDateString('en-GB')}</p>
                        </div>
                        <span className="font-bold text-red-600">{b.qty_available} left</span>
                      </div>
                    ))}
                    {expiredList.length === 0 && <p className="text-slate-400 text-center py-4">No expired items.</p>}
                  </div>
                </div>

                {/* Expiring Soon <= 30 Days */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-yellow-600 uppercase tracking-wider flex items-center">
                    <CalendarDays className="h-4.5 w-4.5 mr-1.5" /> Expiring ≤ 30 Days ({expiringSoonList.length})
                  </h3>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto text-xs">
                    {expiringSoonList.map(b => (
                      <div key={b.id} className="py-2 flex justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{b.medicine?.name}</p>
                          <p className="text-slate-400 mt-0.5 font-mono">Batch: {b.batch_no} | Exp: {new Date(b.expiry_date).toLocaleDateString('en-GB')}</p>
                        </div>
                        <span className="font-bold text-yellow-600">{b.qty_available} left</span>
                      </div>
                    ))}
                    {expiringSoonList.length === 0 && <p className="text-slate-400 text-center py-4">No items expiring soon.</p>}
                  </div>
                </div>

                {/* Low Stock (total stock < reorder level) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center">
                    <TrendingDown className="h-4.5 w-4.5 mr-1.5" /> Low Stock Items ({lowStockList.length})
                  </h3>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto text-xs">
                    {lowStockList.map(m => {
                      const totalAvail = m.batches?.reduce((sum, b) => sum + b.qty_available, 0) || 0
                      return (
                        <div key={m.id} className="py-2 flex justify-between">
                          <div>
                            <p className="font-semibold text-slate-800">{m.name}</p>
                            <p className="text-slate-400 mt-0.5">Reorder Level: {m.reorder_level}</p>
                          </div>
                          <span className="font-bold text-indigo-600">{totalAvail} left</span>
                        </div>
                      )
                    })}
                    {lowStockList.length === 0 && <p className="text-slate-400 text-center py-4">All stock levels normal.</p>}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* --- STOCK LEDGER TAB --- */}
      {activeReportTab === 'ledger' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase">Select Stock Batch:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-80 bg-white"
            >
              <option value="">Select Batch...</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.medicine?.name} - Batch {b.batch_no} (Avail: {b.qty_available})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-sm">
            {ledgerLoading ? (
              <div className="p-8 text-center text-slate-400">Loading ledger logs...</div>
            ) : selectedBatchId ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Movement Type</th>
                    <th className="px-6 py-4 text-right">Quantity</th>
                    <th className="px-6 py-4">Reason / Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-sans">
                  {ledgerLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20">
                      <td className="px-6 py-3.5 text-xs font-mono">
                        {new Date(log.created_at).toLocaleString('en-GB')}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">
                        {log.user?.username || 'System'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.type === 'IN' || log.type === 'RETURN' ? 'bg-cyan-100 text-cyan-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-bold">
                        {log.qty > 0 ? `+${log.qty}` : log.qty}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-500">
                        {log.reason} 
                        {log.bill?.bill_no && ` (Invoice: ${log.bill.bill_no})`}
                        {log.purchase?.purchase_invoice_no && ` (Purchase Inv: ${log.purchase.purchase_invoice_no})`}
                      </td>
                    </tr>
                  ))}
                  {ledgerLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">No ledger transactions logged for this batch.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-slate-400">
                Please select an active medicine batch from the dropdown above to inspect its stock movements history.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- VENDORS PURCHASES SUMMARY TAB --- */}
      {activeReportTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-sm">
          {vendorsLoading ? (
            <div className="p-8 text-center text-slate-400">Loading vendor summaries...</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="px-6 py-4">Vendor Name</th>
                  <th className="px-6 py-4 font-mono">Phone</th>
                  <th className="px-6 py-4 font-mono">GSTIN</th>
                  <th className="px-6 py-4 text-center">Total Purchases Count</th>
                  <th className="px-6 py-4 text-right">Total Amount Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {vendorPurchases.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/20">
                    <td className="px-6 py-3.5 font-bold text-slate-800">{v.name}</td>
                    <td className="px-6 py-3.5 font-mono">{v.phone || 'N/A'}</td>
                    <td className="px-6 py-3.5 font-mono uppercase text-xs">{v.gstin || 'N/A'}</td>
                    <td className="px-6 py-3.5 text-center font-semibold">{v.purchaseCount}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900 font-mono">₹{v.totalSpent.toFixed(2)}</td>
                  </tr>
                ))}
                {vendorPurchases.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">No vendor summaries found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  )
}
