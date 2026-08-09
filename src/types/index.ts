export interface Patient {
  id: string
  patient_code: string
  full_name: string
  dob: string | null
  age_years: number | null
  gender: string
  phone: string
  address: string | null
  referring_doctor: string | null
  allergies_notes: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  bills?: Bill[]
}

export interface Vendor {
  id: string
  name: string
  phone: string
  address: string
  gstin: string | null
  drug_license_no?: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Medicine {
  id: string
  name: string
  strength?: string | null
  generic_name?: string | null
  manufacturer?: string | null
  pack?: string | null
  type: string
  unit_label: string
  hsn_code: string | null
  rack_no?: string | null
  reorder_level: number
  default_gst_percent: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  batches?: InventoryBatch[]
}

export interface Purchase {
  id: string
  vendor_id: string
  purchase_invoice_no: string
  purchase_date: string
  purchase_type?: string
  due_date?: string | null
  payment_date?: string | null
  payment_status?: string
  payment_mode?: string | null
  taxable_amount?: number
  cgst_amount?: number
  sgst_amount?: number
  igst_amount?: number
  gst_amount?: number
  gst_percent?: number
  total_amount: number
  paid_amount?: number
  pending_amount?: number
  notes: string | null
  created_at: string
  updated_at: string
  vendor?: Vendor
  batches?: InventoryBatch[]
}

export interface InventoryBatch {
  id: string
  medicine_id: string
  purchase_id: string
  batch_no: string
  expiry_date: string
  qty_purchased: number
  qty_free?: number
  qty_available: number
  mrp?: number
  discount_percent?: number
  taxable_amount?: number
  cgst_amount?: number
  sgst_amount?: number
  igst_amount?: number
  gst_percent?: number
  purchase_price_per_unit: number
  selling_price_per_unit: number
  created_at: string
  updated_at: string
  medicine?: Medicine
}

export interface Service {
  id: string
  name: string
  default_price: number
  price: number
  gst_percent: number
  sac_code: string | null
  is_active: boolean
  category?: string | null
  created_at: string
  updated_at: string
}

export interface BillItem {
  id: string
  bill_id: string
  item_type: 'SERVICE' | 'MEDICINE' | 'MISC'
  service_id: string | null
  batch_id: string | null
  description: string
  qty: number
  unit_price: number
  discount_amount: number
  gst_percent: number
  line_total: number
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  bill_id: string
  amount: number
  mode: 'CASH' | 'CARD' | 'UPI' | 'BANK'
  reference_no: string | null
  paid_at: string
  is_refund: boolean
  created_at: string
  updated_at: string
}

export interface Bill {
  id: string
  bill_no: string
  patient_id: string | null
  walkin_name: string | null
  bill_date: string
  status: 'DRAFT' | 'FINALIZED' | 'CANCELLED'
  subtotal: number
  discount_total: number
  tax_total: number
  round_off: number
  grand_total: number
  amount_paid: number
  balance_due: number
  notes: string | null
  created_at: string
  updated_at: string
  patient?: Patient | null
  items?: BillItem[]
  payments?: Payment[]
}

export interface ClinicProfile {
  id: string
  name: string
  address: string
  phone: string
  email: string
  logo: string | null
  gstin: string
  defaultTaxRate: number
  invoicePrefix: string
  fyReset: boolean
  backupDir: string
  autoLockMinutes: number
}

export interface UserSummary {
  id: string
  username: string
  role: 'ADMIN' | 'RECEPTIONIST'
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CollectionSummary {
  totalCollected: number
  cashCollected: number
  cardCollected: number
  upiCollected: number
  bankCollected: number
  totalBilled: number
  totalDues: number
  paymentCount: number
  billCount: number
}

export interface GstSummaryRow {
  rate: number
  taxableValue: number
  cgst: number
  sgst: number
  totalTax: number
}

// ==========================================
// Scan Purchase Invoice
// ==========================================
export interface ScanExtractedVendor {
  name: string
  gstin: string | null
  drugLicenseNo: string | null
  address: string | null
  phone: string | null
}

export interface ScanExtractedItem {
  rawName: string
  pack: string | null
  hsnCode: string | null
  batchNumber: string | null
  expiryDate: string | null // YYYY-MM
  quantity: number
  freeQuantity: number
  mrp: number
  purchaseRate: number
  discountPct: number
  gstPct: number
  lineAmount: number
}

export interface ScanExtractedPurchase {
  invoiceNumber: string | null
  invoiceDate: string | null
  subtotal: number
  totalDiscount: number
  cgst: number
  sgst: number
  igst: number
  grandTotal: number
}

export interface ScanVendorMatch {
  status: 'matched' | 'new'
  vendorId: string | null
  matchedVendor: (Vendor & { score: number }) | null
  extracted: ScanExtractedVendor
}

export interface ScanMedicineCandidate extends Medicine {
  score: number
}

export interface ScanItemMatch {
  status: 'matched' | 'ambiguous' | 'new'
  medicineId: string | null
  matchedMedicine: ScanMedicineCandidate | null
  suggestions: ScanMedicineCandidate[]
  extracted: ScanExtractedItem
}

export interface ScanInvoiceResult {
  vendor: ScanVendorMatch
  items: ScanItemMatch[]
  purchase: ScanExtractedPurchase
  validation: {
    sumOfLineAmounts: number
    grandTotal: number
    difference: number
    mismatch: boolean
  }
}

export type ScanCommitVendor =
  | { mode: 'existing'; vendorId: string }
  | {
      mode: 'new'
      data: {
        name: string
        phone: string
        address: string
        gstin?: string | null
        drug_license_no?: string | null
        notes?: string | null
      }
    }

interface ScanCommitBatchFields {
  batchNo?: string
  expiryDate: string
  qty: number
  freeQty?: number
  mrp?: number
  discountPercent?: number
  gstPercent?: number
  purchasePrice: number
  sellingPrice: number
  lineAmount: number
}

export type ScanCommitItem = ScanCommitBatchFields &
  (
    | { mode: 'existing'; medicineId: string }
    | {
        mode: 'new'
        data: {
          name: string
          unit_label: string
          strength?: string | null
          generic_name?: string | null
          manufacturer?: string | null
          pack?: string | null
          type?: string
          hsn_code?: string | null
          rack_no?: string | null
          reorder_level?: number
          default_gst_percent?: number
        }
      }
  )

export interface ScanCommitPayload {
  vendor: ScanCommitVendor
  items: ScanCommitItem[]
  purchase: {
    invoiceNumber: string
    invoiceDate: string
    purchaseDate: string
    purchaseType?: 'CASH' | 'CREDIT'
    dueDate?: string | null
    paymentDate?: string | null
    paymentStatus?: 'PAID' | 'PENDING' | 'PARTIAL'
    paymentMode?: string | null
    paidAmount?: number
    pendingAmount?: number
    notes?: string | null
    grandTotal: number
  }
  confirmMismatch?: boolean
}

export interface AuditLogEntry {
  id: string
  user_id: string | null
  action: string
  entity: string
  entity_id: string | null
  details_json: string | null
  at: string
  user?: {
    username: string
  } | null
}

declare global {
  interface Window {
    api: {
      // Settings & Profile
      getSettings(): Promise<Record<string, string>>
      updateSettings(args: { data: Record<string, string>; userId: string }): Promise<{ success: boolean }>
      getClinicProfile(): Promise<ClinicProfile>
      updateClinicProfile(args: { data: Partial<ClinicProfile>; userId: string }): Promise<{ success: boolean }>

      // Patients
      getPatients(searchQuery?: string): Promise<Patient[]>
      getPatientById(id: string): Promise<Patient | null>
      checkDuplicatePatient(args: { phone: string; fullName: string }): Promise<{ duplicate: boolean; patient?: Patient }>
      createPatient(args: { data: Partial<Patient>; userId: string }): Promise<Patient>
      updatePatient(args: { id: string; data: Partial<Patient>; userId: string }): Promise<Patient>
      deletePatient(args: { id: string; userId: string }): Promise<Patient>

      // Vendors
      getVendors(): Promise<Vendor[]>
      createVendor(args: { data: Partial<Vendor>; userId: string }): Promise<Vendor>
      updateVendor(args: { id: string; data: Partial<Vendor>; userId: string }): Promise<Vendor>
      deleteVendor(args: { id: string; userId: string }): Promise<Vendor>

      // Medicines
      getMedicines(): Promise<Medicine[]>
      createMedicine(args: { data: Partial<Medicine>; userId: string }): Promise<Medicine>
      updateMedicine(args: { id: string; data: Partial<Medicine>; userId: string }): Promise<Medicine>
      deleteMedicine(args: { id: string; userId: string }): Promise<Medicine>

      // Purchases
      createPurchase(args: { data: any; userId: string }): Promise<Purchase>
      getPurchases(): Promise<Purchase[]>

      // Scan Purchase Invoice
      scanPurchaseInvoice(file: File): Promise<ScanInvoiceResult>
      commitScannedPurchase(args: { data: ScanCommitPayload; userId: string }): Promise<Purchase>

      // Inventory Batches
      getInventoryBatches(): Promise<InventoryBatch[]>
      getMedicineBatches(medicineId: string): Promise<InventoryBatch[]>
      adjustStock(args: { batchId: string; qty: number; reason: string; userId: string }): Promise<InventoryBatch>

      // Services
      getServices(): Promise<Service[]>
      createService(args: any): Promise<Service>
      updateService(args: any): Promise<Service>
      deleteService(args: any): Promise<Service>

      // Bills
      getBills(filters?: { status?: string; patientId?: string; startDate?: string; endDate?: string }): Promise<Bill[]>
      getBillById(id: string): Promise<Bill | null>
      createBill(args: {
        data: {
          patientId?: string
          walkinName?: string
          date?: string
          status: 'DRAFT' | 'FINALIZED'
          discount?: number
          taxRate?: number
          paidAmount?: number
          paymentMode?: string
          transactionId?: string
          notes?: string
          items: Array<{
            itemType: 'SERVICE' | 'MEDICINE' | 'MISC'
            serviceId?: string
            batchId?: string
            name: string
            price: number
            quantity: number
            discount?: number
            gstPercent?: number
          }>
        }
        userId: string
      }): Promise<Bill>
      finalizeBill(args: {
        billId: string
        paidAmount: number
        paymentMode: string
        transactionId?: string
        userId: string
      }): Promise<Bill>
      cancelBill(args: {
        billId: string
        reason: string
        adminUsername?: string
        adminPassword?: string
        userId: string
      }): Promise<Bill>

      // Payments
      recordPayment(args: {
        billId: string
        amount: number
        mode: string
        referenceNo?: string
        userId: string
      }): Promise<Bill>

      // Reports
      getCollectionSummary(args: { startDate: string; endDate: string }): Promise<CollectionSummary>
      getOutstandingDues(): Promise<Bill[]>
      getGstSummary(args: { startDate: string; endDate: string }): Promise<GstSummaryRow[]>
      getInventoryValuation(): Promise<{ purchaseValuation: number; sellingValuation: number }>
      getInventoryAlerts(): Promise<{ expiredCount: number; expiringCount: number; lowStockCount: number }>
      getBatchLedger(batchId: string): Promise<any[]>
      getVendorPurchases(): Promise<any[]>

      // Auth & User Management
      getCurrentUser(): Promise<UserSummary | null>
      login(args: { username: string; password: string }): Promise<{ success: boolean; message?: string; user?: UserSummary }>
      createUser(args: { username: string; password: string; role: string; userId: string }): Promise<{ success: boolean; message?: string; user?: UserSummary }>
      getUsers(): Promise<UserSummary[]>
      resetPassword(args: { id: string; password: string; userId: string }): Promise<{ success: boolean }>
      toggleUserActive(args: { id: string; is_active: boolean; userId: string }): Promise<{ success: boolean }>
      getAuditLogs(): Promise<AuditLogEntry[]>

      // Backups
      backupDatabase(customPath?: string): Promise<{ success: boolean; message: string }>
      restoreDatabase(userId: string): Promise<{ success: boolean; message: string }>

      // Printing
      printInvoice(billId: string): Promise<boolean>
    }
  }
}
