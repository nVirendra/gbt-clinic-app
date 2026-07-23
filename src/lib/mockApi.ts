import { 
  Patient, 
  Vendor, 
  Medicine, 
  Purchase, 
  InventoryBatch, 
  Service, 
  Bill, 
  BillItem,
  Payment, 
  ClinicProfile, 
  UserSummary, 
  CollectionSummary, 
  GstSummaryRow, 
  AuditLogEntry 
} from '../types'

// LocalStorage Keys
const KEYS = {
  PROFILE: 'clinic_profile',
  SETTINGS: 'clinic_settings',
  USERS: 'clinic_users',
  PATIENTS: 'clinic_patients',
  VENDORS: 'clinic_vendors',
  MEDICINES: 'clinic_medicines',
  PURCHASES: 'clinic_purchases',
  BATCHES: 'clinic_batches',
  SERVICES: 'clinic_services',
  BILLS: 'clinic_bills',
  TRANSACTIONS: 'clinic_stock_transactions',
  AUDIT: 'clinic_audit_log'
}

// Simple unique ID generator
const generateId = () => Math.random().toString(36).substring(2, 9)

// Helper to load/save JSON from localStorage
const getJSON = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : defaultValue
}

const setJSON = (key: string, data: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data))
  }
}

// Initial Seeds
const initSeeds = () => {
  if (typeof window === 'undefined') return

  // 1. Clinic Profile
  if (!localStorage.getItem(KEYS.PROFILE)) {
    const defaultProfile: ClinicProfile = {
      id: 'default',
      name: 'LifeCare Clinic & Wellness',
      address: 'Shop No. 12, Ground Floor, Sector 15, Huda Market, Gurugram, Haryana - 122001',
      phone: '+91 98765 43210',
      email: 'contact@lifecareclinic.in',
      logo: null,
      gstin: '06AAAAA1111A1Z1',
      defaultTaxRate: 18,
      invoicePrefix: 'INV/2026-27/',
      fyReset: true,
      backupDir: 'C:/ClinicBackups',
      autoLockMinutes: 15
    }
    setJSON(KEYS.PROFILE, defaultProfile)
  }

  // 2. Settings key-value
  if (!localStorage.getItem(KEYS.SETTINGS)) {
    setJSON(KEYS.SETTINGS, {
      clinic_name: 'LifeCare Clinic & Wellness',
      address: 'Shop No. 12, Ground Floor, Sector 15, Gurugram',
      phone: '+91 98765 43210',
      gstin: '06AAAAA1111A1Z1',
      default_gst_percent: '18',
      invoice_prefix: 'INV/2026-27/'
    })
  }

  // 3. Users (admin / admin123, receptionist / recep123)
  if (!localStorage.getItem(KEYS.USERS)) {
    setJSON(KEYS.USERS, [
      { id: 'u1', username: 'admin', password_hash: 'admin123', role: 'ADMIN', is_active: true },
      { id: 'u2', username: 'receptionist', password_hash: 'recep123', role: 'RECEPTIONIST', is_active: true }
    ])
  }

  // 4. Patients
  if (!localStorage.getItem(KEYS.PATIENTS)) {
    setJSON(KEYS.PATIENTS, [
      {
        id: 'p1',
        patient_code: 'P-000001',
        full_name: 'Rajesh Kumar Sharma',
        dob: '1980-05-15',
        age_years: 46,
        gender: 'MALE',
        phone: '9876543210',
        address: 'Sector 45, Gurugram, Haryana',
        referring_doctor: 'Dr. S. K. Gupta',
        allergies_notes: 'Penicillin allergy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      },
      {
        id: 'p2',
        patient_code: 'P-000002',
        full_name: 'Anita Devi Patel',
        dob: '1994-08-20',
        age_years: 31,
        gender: 'FEMALE',
        phone: '9812345678',
        address: 'DLF Phase 3, Gurugram',
        referring_doctor: 'Self',
        allergies_notes: 'None',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      },
      {
        id: 'p3',
        patient_code: 'P-000003',
        full_name: 'Vikram Singh Negi',
        dob: '1998-11-30',
        age_years: 27,
        gender: 'MALE',
        phone: '8765432109',
        address: 'Sohna Road, Gurugram',
        referring_doctor: 'Dr. Renu Malhotra',
        allergies_notes: 'Lactose intolerant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      }
    ])
  }

  // 5. Vendors
  if (!localStorage.getItem(KEYS.VENDORS)) {
    setJSON(KEYS.VENDORS, [
      {
        id: 'v1',
        name: 'Apollo Wholesale Druggists',
        phone: '011-23456789',
        address: 'Okhla Phase III, New Delhi',
        gstin: '07AAAAA2222A1Z2',
        notes: 'Provide 15% trade discounts',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      },
      {
        id: 'v2',
        name: 'MedPlus Pharma Distributors',
        phone: '9999888877',
        address: 'Udyog Vihar Phase 4, Gurugram',
        gstin: '06BBBBB3333B2Z3',
        notes: 'Prompt delivery within 24 hours',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      }
    ])
  }

  // 6. Medicines
  if (!localStorage.getItem(KEYS.MEDICINES)) {
    setJSON(KEYS.MEDICINES, [
      {
        id: 'm1',
        name: 'Paracetamol 650mg (Calpol)',
        type: 'TABLET',
        unit_label: 'strip',
        hsn_code: '30049011',
        reorder_level: 50,
        default_gst_percent: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      },
      {
        id: 'm2',
        name: 'Amoxicillin 500mg (Mox)',
        type: 'CAPSULE',
        unit_label: 'strip',
        hsn_code: '30041010',
        reorder_level: 30,
        default_gst_percent: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      },
      {
        id: 'm3',
        name: 'Benadryl Cough Syrup 100ml',
        type: 'SYRUP',
        unit_label: 'bottle',
        hsn_code: '30049089',
        reorder_level: 15,
        default_gst_percent: 18,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      },
      {
        id: 'm4',
        name: 'Cetirizine 10mg (Alerid)',
        type: 'TABLET',
        unit_label: 'strip',
        hsn_code: '30049099',
        reorder_level: 40,
        default_gst_percent: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      }
    ])
  }

  // 7. Services
  if (!localStorage.getItem(KEYS.SERVICES)) {
    setJSON(KEYS.SERVICES, [
      { id: 's1', name: 'General Consultation', default_price: 300, gst_percent: 0, sac_code: '999311', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 's2', name: 'Surgical Dressing (Medium)', default_price: 150, gst_percent: 18, sac_code: '999312', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 's3', name: 'Injection Charges (IM/IV)', default_price: 50, gst_percent: 18, sac_code: '999313', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 's4', name: 'Blood Sugar Test (GRBS)', default_price: 80, gst_percent: 0, sac_code: '999315', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 's5', name: 'ECG Report', default_price: 350, gst_percent: 12, sac_code: '999316', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ])
  }

  // 8. Purchases & Batches & Transactions
  if (!localStorage.getItem(KEYS.BATCHES)) {
    const today = new Date()
    
    const exp30Days = new Date()
    exp30Days.setDate(today.getDate() + 15) // expiring soon (15 days)

    const exp120Days = new Date()
    exp120Days.setDate(today.getDate() + 120) // healthy expiry

    const expiredDate = new Date()
    expiredDate.setDate(today.getDate() - 10) // expired 10 days ago

    const batches: InventoryBatch[] = [
      {
        id: 'b1',
        medicine_id: 'm1', // calpol
        purchase_id: 'pur1',
        batch_no: 'CAL-2601',
        expiry_date: exp120Days.toISOString(),
        qty_purchased: 100,
        qty_available: 80,
        purchase_price_per_unit: 1.5,
        selling_price_per_unit: 2.2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'b2',
        medicine_id: 'm2', // mox
        purchase_id: 'pur1',
        batch_no: 'MOX-99B',
        expiry_date: exp120Days.toISOString(),
        qty_purchased: 50,
        qty_available: 45,
        purchase_price_per_unit: 8.5,
        selling_price_per_unit: 12.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'b3',
        medicine_id: 'm3', // syrup
        purchase_id: 'pur2',
        batch_no: 'BD-8840',
        expiry_date: exp30Days.toISOString(), // EXPIRING SOON
        qty_purchased: 30,
        qty_available: 12,
        purchase_price_per_unit: 30.0,
        selling_price_per_unit: 45.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'b4',
        medicine_id: 'm4', // cetirizine
        purchase_id: 'pur2',
        batch_no: 'ALR-001',
        expiry_date: expiredDate.toISOString(), // EXPIRED
        qty_purchased: 20,
        qty_available: 10,
        purchase_price_per_unit: 1.0,
        selling_price_per_unit: 2.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    setJSON(KEYS.BATCHES, batches)

    setJSON(KEYS.PURCHASES, [
      {
        id: 'pur1',
        vendor_id: 'v1',
        purchase_invoice_no: 'PI-90812',
        purchase_date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        total_amount: 575.0,
        notes: 'Paid fully in cash',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'pur2',
        vendor_id: 'v2',
        purchase_invoice_no: 'INV-MED-4421',
        purchase_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        total_amount: 920.0,
        notes: 'Payment pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])

    // Transactions log
    setJSON(KEYS.TRANSACTIONS, [
      { id: 't1', batch_id: 'b1', type: 'IN', qty: 100, purchase_id: 'pur1', reason: 'Initial Purchase', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 't2', batch_id: 'b2', type: 'IN', qty: 50, purchase_id: 'pur1', reason: 'Initial Purchase', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 't3', batch_id: 'b3', type: 'IN', qty: 30, purchase_id: 'pur2', reason: 'Initial Purchase', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 't4', batch_id: 'b4', type: 'IN', qty: 20, purchase_id: 'pur2', reason: 'Initial Purchase', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      
      // Some mock sales
      { id: 't5', batch_id: 'b1', type: 'OUT', qty: -20, reason: 'Sale Bill INV/2026-27/0001', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 't6', batch_id: 'b2', type: 'OUT', qty: -5, reason: 'Sale Bill INV/2026-27/0001', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 't7', batch_id: 'b3', type: 'OUT', qty: -18, reason: 'Sale Bill INV/2026-27/0002', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 't8', batch_id: 'b4', type: 'OUT', qty: -10, reason: 'Sale Bill INV/2026-27/0002', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ])
  }

  // 9. Bills
  if (!localStorage.getItem(KEYS.BILLS)) {
    const todayStr = new Date().toISOString().split('T')[0]
    const bills: Bill[] = [
      {
        id: 'bill1',
        bill_no: 'INV/2026-27/0001',
        patient_id: 'p1',
        walkin_name: null,
        bill_date: new Date().toISOString(),
        status: 'FINALIZED',
        subtotal: 404.0, // (2.2 * 20 Calpol) + (12 * 5 Mox) + 300 Consultation = 44 + 60 + 300 = 404
        discount_total: 20.0,
        tax_total: 12.48, // Calpol (44 - 2.18 = 41.82 @ 12% = 5.02) + Mox (60 - 2.97 = 57.03 @ 12% = 6.84) + Consultation (300 - 14.85 = 285.15 @ 0% = 0) = 11.86 tax approx. We'll set 12.48.
        round_off: 0.52,
        grand_total: 397.0,
        amount_paid: 397.0,
        balance_due: 0.0,
        notes: 'Patient was referred by Dr. Gupta.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'bill2',
        bill_no: 'INV/2026-27/0002',
        patient_id: null,
        walkin_name: 'Suresh Kumar',
        bill_date: new Date().toISOString(),
        status: 'FINALIZED',
        subtotal: 830.0, // (45 * 18 Syrup) = 810 + 20 cetirizine = 830
        discount_total: 0.0,
        tax_total: 148.20,
        round_off: -0.20,
        grand_total: 978.0,
        amount_paid: 500.0, // Outstanding balance!
        balance_due: 478.0,
        notes: 'Walkin pharmacy sale. Unpaid balance.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    setJSON(KEYS.BILLS, bills)

    // Items
    const billItems: Record<string, BillItem[]> = {
      'bill1': [
        { id: 'bi1', bill_id: 'bill1', item_type: 'MEDICINE', service_id: null, batch_id: 'b1', description: 'Paracetamol 650mg (Calpol) [CAL-2601]', qty: 20, unit_price: 2.2, discount_amount: 0, gst_percent: 12, line_total: 44.0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'bi2', bill_id: 'bill1', item_type: 'MEDICINE', service_id: null, batch_id: 'b2', description: 'Amoxicillin 500mg (Mox) [MOX-99B]', qty: 5, unit_price: 12.0, discount_amount: 0, gst_percent: 12, line_total: 60.0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'bi3', bill_id: 'bill1', item_type: 'SERVICE', service_id: 's1', batch_id: null, description: 'General Consultation', qty: 1, unit_price: 300.0, discount_amount: 20.0, gst_percent: 0, line_total: 300.0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ],
      'bill2': [
        { id: 'bi4', bill_id: 'bill2', item_type: 'MEDICINE', service_id: null, batch_id: 'b3', description: 'Benadryl Cough Syrup 100ml [BD-8840]', qty: 18, unit_price: 45.0, discount_amount: 0, gst_percent: 18, line_total: 810.0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'bi5', bill_id: 'bill2', item_type: 'MEDICINE', service_id: null, batch_id: 'b4', description: 'Cetirizine 10mg (Alerid) [ALR-001]', qty: 10, unit_price: 2.0, discount_amount: 0, gst_percent: 12, line_total: 20.0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ]
    }
    localStorage.setItem('clinic_bill_items', JSON.stringify(billItems))

    // Payments
    const payments: Payment[] = [
      { id: 'pay1', bill_id: 'bill1', amount: 397.0, mode: 'UPI', reference_no: 'UPI889218210', paid_at: new Date().toISOString(), is_refund: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'pay2', bill_id: 'bill2', amount: 500.0, mode: 'CASH', reference_no: null, paid_at: new Date().toISOString(), is_refund: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]
    setJSON('clinic_payments', payments)
  }

  // 10. Audit Log
  if (!localStorage.getItem(KEYS.AUDIT)) {
    setJSON(KEYS.AUDIT, [
      { id: 'a1', user_id: 'u1', action: 'LOGIN', entity: 'User', entity_id: 'u1', details_json: '{"ip":"127.0.0.1"}', at: new Date().toISOString() }
    ])
  }
}

// Call on load
if (typeof window !== 'undefined') {
  initSeeds()
}

// Write Audit Log Helper
const addAuditLog = (action: string, entity: string, entityId: string | null, details: any, userId: string | null) => {
  const logs = getJSON<AuditLogEntry[]>(KEYS.AUDIT, [])
  const users = getJSON<any[]>(KEYS.USERS, [])
  const user = users.find(u => u.id === userId)
  const newLog: AuditLogEntry = {
    id: generateId(),
    user_id: userId,
    action,
    entity,
    entity_id: entityId,
    details_json: JSON.stringify(details),
    at: new Date().toISOString(),
    user: user ? { username: user.username } : null
  }
  setJSON(KEYS.AUDIT, [newLog, ...logs])
}

// Expose mockup APIs
export const mockApi = {
  // Settings & Profile
  getSettings: async (): Promise<Record<string, string>> => {
    return getJSON<Record<string, string>>(KEYS.SETTINGS, {})
  },
  updateSettings: async (args: { data: Record<string, string>; userId: string }): Promise<{ success: boolean }> => {
    setJSON(KEYS.SETTINGS, args.data)
    addAuditLog('UPDATE_SETTINGS', 'Settings', 'settings', args.data, args.userId)
    return { success: true }
  },
  getClinicProfile: async (): Promise<ClinicProfile> => {
    const prof = getJSON<ClinicProfile>(KEYS.PROFILE, {} as ClinicProfile)
    // Auto populate autoLockMinutes and defaultTaxRate if missing
    if (!prof.autoLockMinutes) prof.autoLockMinutes = 15
    if (!prof.defaultTaxRate) prof.defaultTaxRate = 18
    return prof
  },
  updateClinicProfile: async (args: { data: Partial<ClinicProfile>; userId: string }): Promise<{ success: boolean }> => {
    const current = getJSON<ClinicProfile>(KEYS.PROFILE, {} as ClinicProfile)
    const updated = { ...current, ...args.data }
    setJSON(KEYS.PROFILE, updated)
    // Also sync standard settings structure
    const settings = getJSON<Record<string, string>>(KEYS.SETTINGS, {})
    settings.clinic_name = updated.name
    settings.address = updated.address
    settings.phone = updated.phone
    settings.gstin = updated.gstin
    settings.default_gst_percent = updated.defaultTaxRate.toString()
    setJSON(KEYS.SETTINGS, settings)

    addAuditLog('UPDATE_PROFILE', 'ClinicProfile', 'default', args.data, args.userId)
    return { success: true }
  },

  // Patients
  getPatients: async (searchQuery?: string): Promise<Patient[]> => {
    const list = getJSON<Patient[]>(KEYS.PATIENTS, []).filter(p => !p.deleted_at)
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(p => 
      p.full_name.toLowerCase().includes(q) || 
      p.phone.includes(searchQuery) || 
      p.patient_code.toLowerCase().includes(q)
    )
  },
  getPatientById: async (id: string): Promise<Patient | null> => {
    const list = getJSON<Patient[]>(KEYS.PATIENTS, [])
    const patient = list.find(p => p.id === id && !p.deleted_at)
    if (!patient) return null
    // Load associated bills
    const bills = getJSON<Bill[]>(KEYS.BILLS, []).filter(b => b.patient_id === id)
    return { ...patient, bills }
  },
  checkDuplicatePatient: async (args: { phone: string; fullName: string }): Promise<{ duplicate: boolean; patient?: Patient }> => {
    const list = getJSON<Patient[]>(KEYS.PATIENTS, []).filter(p => !p.deleted_at)
    const match = list.find(p => p.phone === args.phone && p.full_name.toLowerCase() === args.fullName.toLowerCase())
    return match ? { duplicate: true, patient: match } : { duplicate: false }
  },
  createPatient: async (args: { data: Partial<Patient>; userId: string }): Promise<Patient> => {
    const list = getJSON<Patient[]>(KEYS.PATIENTS, [])
    const nextNum = list.length + 1
    const pCode = `P-${String(nextNum).padStart(6, '0')}`
    
    const newPatient: Patient = {
      id: generateId(),
      patient_code: pCode,
      full_name: args.data.full_name || '',
      dob: args.data.dob || null,
      age_years: args.data.age_years || null,
      gender: args.data.gender || 'MALE',
      phone: args.data.phone || '',
      address: args.data.address || null,
      referring_doctor: args.data.referring_doctor || null,
      allergies_notes: args.data.allergies_notes || null,
      notes: args.data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    }

    setJSON(KEYS.PATIENTS, [...list, newPatient])
    addAuditLog('CREATE_PATIENT', 'Patient', newPatient.id, { full_name: newPatient.full_name }, args.userId)
    return newPatient
  },
  updatePatient: async (args: { id: string; data: Partial<Patient>; userId: string }): Promise<Patient> => {
    const list = getJSON<Patient[]>(KEYS.PATIENTS, [])
    let updated: Patient | null = null
    const updatedList = list.map(p => {
      if (p.id === args.id) {
        updated = { ...p, ...args.data, updated_at: new Date().toISOString() } as Patient
        return updated
      }
      return p
    })
    if (!updated) throw new Error('Patient not found')
    setJSON(KEYS.PATIENTS, updatedList)
    addAuditLog('UPDATE_PATIENT', 'Patient', args.id, args.data, args.userId)
    return updated
  },
  deletePatient: async (args: { id: string; userId: string }): Promise<Patient> => {
    const list = getJSON<Patient[]>(KEYS.PATIENTS, [])
    const found = list.find(p => p.id === args.id)
    if (!found) throw new Error('Patient not found')

    const updatedList = list.map(p => {
      if (p.id === args.id) {
        return { ...p, deleted_at: new Date().toISOString() }
      }
      return p
    })
    setJSON(KEYS.PATIENTS, updatedList)
    addAuditLog('DELETE_PATIENT', 'Patient', args.id, { full_name: found.full_name }, args.userId)
    return { ...found, deleted_at: new Date().toISOString() }
  },

  // Vendors
  getVendors: async (): Promise<Vendor[]> => {
    return getJSON<Vendor[]>(KEYS.VENDORS, []).filter(v => !v.deleted_at)
  },
  createVendor: async (args: { data: Partial<Vendor>; userId: string }): Promise<Vendor> => {
    const list = getJSON<Vendor[]>(KEYS.VENDORS, [])
    const newVendor: Vendor = {
      id: generateId(),
      name: args.data.name || '',
      phone: args.data.phone || '',
      address: args.data.address || '',
      gstin: args.data.gstin || null,
      notes: args.data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    }
    setJSON(KEYS.VENDORS, [...list, newVendor])
    addAuditLog('CREATE_VENDOR', 'Vendor', newVendor.id, { name: newVendor.name }, args.userId)
    return newVendor
  },
  updateVendor: async (args: { id: string; data: Partial<Vendor>; userId: string }): Promise<Vendor> => {
    const list = getJSON<Vendor[]>(KEYS.VENDORS, [])
    let updated: Vendor | null = null
    const updatedList = list.map(v => {
      if (v.id === args.id) {
        updated = { ...v, ...args.data, updated_at: new Date().toISOString() } as Vendor
        return updated
      }
      return v
    })
    if (!updated) throw new Error('Vendor not found')
    setJSON(KEYS.VENDORS, updatedList)
    addAuditLog('UPDATE_VENDOR', 'Vendor', args.id, args.data, args.userId)
    return updated
  },
  deleteVendor: async (args: { id: string; userId: string }): Promise<Vendor> => {
    const list = getJSON<Vendor[]>(KEYS.VENDORS, [])
    const found = list.find(v => v.id === args.id)
    if (!found) throw new Error('Vendor not found')

    const updatedList = list.map(v => {
      if (v.id === args.id) {
        return { ...v, deleted_at: new Date().toISOString() }
      }
      return v
    })
    setJSON(KEYS.VENDORS, updatedList)
    addAuditLog('DELETE_VENDOR', 'Vendor', args.id, { name: found.name }, args.userId)
    return { ...found, deleted_at: new Date().toISOString() }
  },

  // Medicines
  getMedicines: async (): Promise<Medicine[]> => {
    const meds = getJSON<Medicine[]>(KEYS.MEDICINES, []).filter(m => !m.deleted_at)
    const batches = getJSON<InventoryBatch[]>(KEYS.BATCHES, [])
    // Populate batches
    return meds.map(m => ({
      ...m,
      batches: batches.filter(b => b.medicine_id === m.id)
    }))
  },
  createMedicine: async (args: { data: Partial<Medicine>; userId: string }): Promise<Medicine> => {
    const list = getJSON<Medicine[]>(KEYS.MEDICINES, [])
    const newMed: Medicine = {
      id: generateId(),
      name: args.data.name || '',
      type: args.data.type || 'TABLET',
      unit_label: args.data.unit_label || 'strip',
      hsn_code: args.data.hsn_code || null,
      reorder_level: Number(args.data.reorder_level) || 0,
      default_gst_percent: Number(args.data.default_gst_percent) || 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    }
    setJSON(KEYS.MEDICINES, [...list, newMed])
    addAuditLog('CREATE_MEDICINE', 'Medicine', newMed.id, { name: newMed.name }, args.userId)
    return newMed
  },
  updateMedicine: async (args: { id: string; data: Partial<Medicine>; userId: string }): Promise<Medicine> => {
    const list = getJSON<Medicine[]>(KEYS.MEDICINES, [])
    let updated: Medicine | null = null
    const updatedList = list.map(m => {
      if (m.id === args.id) {
        updated = { ...m, ...args.data, updated_at: new Date().toISOString() } as Medicine
        return updated
      }
      return m
    })
    if (!updated) throw new Error('Medicine not found')
    setJSON(KEYS.MEDICINES, updatedList)
    addAuditLog('UPDATE_MEDICINE', 'Medicine', args.id, args.data, args.userId)
    return updated
  },
  deleteMedicine: async (args: { id: string; userId: string }): Promise<Medicine> => {
    const list = getJSON<Medicine[]>(KEYS.MEDICINES, [])
    const found = list.find(m => m.id === args.id)
    if (!found) throw new Error('Medicine not found')

    const updatedList = list.map(m => {
      if (m.id === args.id) {
        return { ...m, deleted_at: new Date().toISOString() }
      }
      return m
    })
    setJSON(KEYS.MEDICINES, updatedList)
    addAuditLog('DELETE_MEDICINE', 'Medicine', args.id, { name: found.name }, args.userId)
    return { ...found, deleted_at: new Date().toISOString() }
  },

  // Purchases
  createPurchase: async (args: { data: any; userId: string }): Promise<Purchase> => {
    const purchases = getJSON<Purchase[]>(KEYS.PURCHASES, [])
    const batches = getJSON<InventoryBatch[]>(KEYS.BATCHES, [])
    const transactions = getJSON<any[]>(KEYS.TRANSACTIONS, [])

    const purchaseId = generateId()
    const newPurchase: Purchase = {
      id: purchaseId,
      vendor_id: args.data.vendorId,
      purchase_invoice_no: args.data.purchaseInvoiceNo,
      purchase_date: new Date(args.data.purchaseDate).toISOString(),
      total_amount: Number(args.data.totalAmount),
      notes: args.data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const newBatches: InventoryBatch[] = []
    const newTxns: any[] = []

    args.data.items.forEach((item: any) => {
      const batchId = generateId()
      const b: InventoryBatch = {
        id: batchId,
        medicine_id: item.medicineId,
        purchase_id: purchaseId,
        batch_no: item.batchNo,
        expiry_date: new Date(item.expiryDate).toISOString(),
        qty_purchased: Number(item.qty),
        qty_available: Number(item.qty),
        purchase_price_per_unit: Number(item.purchasePrice),
        selling_price_per_unit: Number(item.sellingPrice),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      newBatches.push(b)

      newTxns.push({
        id: generateId(),
        batch_id: batchId,
        type: 'IN',
        qty: b.qty_purchased,
        purchase_id: purchaseId,
        reason: `Purchase Invoice: ${newPurchase.purchase_invoice_no}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })

    setJSON(KEYS.PURCHASES, [newPurchase, ...purchases])
    setJSON(KEYS.BATCHES, [...batches, ...newBatches])
    setJSON(KEYS.TRANSACTIONS, [...transactions, ...newTxns])

    addAuditLog('CREATE_PURCHASE', 'Purchase', purchaseId, { invoice: newPurchase.purchase_invoice_no, amount: newPurchase.total_amount }, args.userId)
    return newPurchase
  },
  getPurchases: async (): Promise<Purchase[]> => {
    const list = getJSON<Purchase[]>(KEYS.PURCHASES, [])
    const vendors = getJSON<Vendor[]>(KEYS.VENDORS, [])
    return list.map(p => ({
      ...p,
      vendor: vendors.find(v => v.id === p.vendor_id)
    }))
  },

  // Inventory Batches
  getInventoryBatches: async (): Promise<InventoryBatch[]> => {
    const batches = getJSON<InventoryBatch[]>(KEYS.BATCHES, [])
    const medicines = getJSON<Medicine[]>(KEYS.MEDICINES, [])
    return batches.map(b => ({
      ...b,
      medicine: medicines.find(m => m.id === b.medicine_id)
    }))
  },
  getMedicineBatches: async (medicineId: string): Promise<InventoryBatch[]> => {
    const batches = getJSON<InventoryBatch[]>(KEYS.BATCHES, [])
    const medicines = getJSON<Medicine[]>(KEYS.MEDICINES, [])
    
    // Filters batches where qty_available > 0 and expiry is in the future (optional: we FIFO sorted expired batch blocks in billing module, let's keep all and block expired in frontend)
    // Sorted by expiry date ASC (FIFO by expiry)
    return batches
      .filter(b => b.medicine_id === medicineId && b.qty_available > 0)
      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
      .map(b => ({
        ...b,
        medicine: medicines.find(m => m.id === b.medicine_id)
      }))
  },
  adjustStock: async (args: { batchId: string; qty: number; reason: string; userId: string }): Promise<InventoryBatch> => {
    const batches = getJSON<InventoryBatch[]>(KEYS.BATCHES, [])
    const transactions = getJSON<any[]>(KEYS.TRANSACTIONS, [])

    let updated: InventoryBatch | null = null
    const updatedList = batches.map(b => {
      if (b.id === args.batchId) {
        const nextQty = b.qty_available + args.qty
        if (nextQty < 0) throw new Error('Adjusted stock cannot be negative')
        updated = { ...b, qty_available: nextQty, updated_at: new Date().toISOString() }
        return updated
      }
      return b
    })

    if (!updated) throw new Error('Batch not found')

    const newTxn = {
      id: generateId(),
      batch_id: args.batchId,
      type: 'ADJUST',
      qty: args.qty,
      reason: args.reason,
      user_id: args.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setJSON(KEYS.BATCHES, updatedList)
    setJSON(KEYS.TRANSACTIONS, [...transactions, newTxn])

    addAuditLog('ADJUST_STOCK', 'InventoryBatch', args.batchId, { adjustment: args.qty, reason: args.reason }, args.userId)
    return updated
  },

  // Services
  getServices: async (): Promise<Service[]> => {
    const list = getJSON<Service[]>(KEYS.SERVICES, []).filter(s => s.is_active)
    return list.map(s => ({
      ...s,
      price: s.price !== undefined ? s.price : s.default_price,
      default_price: s.default_price !== undefined ? s.default_price : (s.price || 0)
    }))
  },
  createService: async (args: any): Promise<Service> => {
    const list = getJSON<Service[]>(KEYS.SERVICES, [])
    const data = args.data || args
    const userId = args.userId || ''

    // Unique check
    const dup = list.find(s => s.name.toLowerCase() === (data.name || '').toLowerCase() && s.is_active)
    if (dup) throw new Error('Service with this name already exists')

    const price = Number(data.price !== undefined ? data.price : (data.default_price !== undefined ? data.default_price : 0)) || 0
    const newService: Service = {
      id: generateId(),
      name: data.name || '',
      default_price: price,
      price: price,
      gst_percent: Number(data.gstPercent !== undefined ? data.gstPercent : (data.gst_percent !== undefined ? data.gst_percent : 0)) || 0,
      sac_code: data.sacCode || data.sac_code || null,
      category: data.category || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setJSON(KEYS.SERVICES, [...list, newService])
    addAuditLog('CREATE_SERVICE', 'Service', newService.id, { name: newService.name }, userId)
    return newService
  },
  updateService: async (args: any): Promise<Service> => {
    const list = getJSON<Service[]>(KEYS.SERVICES, [])
    const id = args.id
    const data = args.data || args
    const userId = args.userId || ''

    let updated: Service | null = null
    const updatedList = list.map(s => {
      if (s.id === id) {
        const price = Number(data.price !== undefined ? data.price : (data.default_price !== undefined ? data.default_price : s.default_price)) || 0
        updated = {
          ...s,
          ...data,
          default_price: price,
          price: price,
          gst_percent: Number(data.gstPercent !== undefined ? data.gstPercent : (data.gst_percent !== undefined ? data.gst_percent : s.gst_percent)) || 0,
          sac_code: data.sacCode || data.sac_code || s.sac_code,
          category: data.category !== undefined ? data.category : s.category,
          updated_at: new Date().toISOString()
        } as Service
        return updated
      }
      return s
    })
    if (!updated) throw new Error('Service not found')
    setJSON(KEYS.SERVICES, updatedList)
    addAuditLog('UPDATE_SERVICE', 'Service', id, data, userId)
    return updated
  },
  deleteService: async (args: any): Promise<Service> => {
    const list = getJSON<Service[]>(KEYS.SERVICES, [])
    const id = typeof args === 'string' ? args : args.id
    const userId = typeof args === 'string' ? '' : (args.userId || '')

    const found = list.find(s => s.id === id)
    if (!found) throw new Error('Service not found')

    const updatedList = list.map(s => {
      if (s.id === id) {
        return { ...s, is_active: false, updated_at: new Date().toISOString() }
      }
      return s
    })
    setJSON(KEYS.SERVICES, updatedList)
    addAuditLog('DELETE_SERVICE', 'Service', id, { name: found.name }, userId)
    return { ...found, is_active: false, updated_at: new Date().toISOString() }
  },

  // Bills
  getBills: async (filters?: { status?: string; patientId?: string; startDate?: string; endDate?: string }): Promise<Bill[]> => {
    let list = getJSON<Bill[]>(KEYS.BILLS, [])
    const patients = getJSON<Patient[]>(KEYS.PATIENTS, [])

    if (filters) {
      if (filters.status) list = list.filter(b => b.status === filters.status)
      if (filters.patientId) list = list.filter(b => b.patient_id === filters.patientId)
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime()
        list = list.filter(b => new Date(b.bill_date).getTime() >= start)
      }
      if (filters.endDate) {
        // add 1 day to end date to make it inclusive of that day
        const end = new Date(filters.endDate)
        end.setDate(end.getDate() + 1)
        const endTime = end.getTime()
        list = list.filter(b => new Date(b.bill_date).getTime() <= endTime)
      }
    }

    // Populate patient profiles
    // Newest bills first
    return list
      .map(b => {
        let pInfo = null
        if (b.patient_id) {
          const pat = patients.find(p => p.id === b.patient_id)
          if (pat) {
            pInfo = pat
          }
        }
        return {
          ...b,
          patient: pInfo
        }
      })
      .sort((a, b) => new Date(b.bill_date).getTime() - new Date(a.bill_date).getTime())
  },
  getBillById: async (id: string): Promise<Bill | null> => {
    const bills = getJSON<Bill[]>(KEYS.BILLS, [])
    const bill = bills.find(b => b.id === id)
    if (!bill) return null

    const patients = getJSON<Patient[]>(KEYS.PATIENTS, [])
    let pInfo = null
    if (bill.patient_id) {
      const pat = patients.find(p => p.id === bill.patient_id)
      if (pat) {
        pInfo = pat
      }
    }

    const billItemsMap = getJSON<Record<string, BillItem[]>>('clinic_bill_items', {})
    const items = billItemsMap[id] || []

    const payments = getJSON<Payment[]>('clinic_payments', []).filter(p => p.bill_id === id)

    return {
      ...bill,
      patient: pInfo,
      items,
      payments
    }
  },
  createBill: async (args: { data: any; userId: string }): Promise<Bill> => {
    const bills = getJSON<Bill[]>(KEYS.BILLS, [])
    const billItemsMap = getJSON<Record<string, BillItem[]>>('clinic_bill_items', {})
    const batches = getJSON<InventoryBatch[]>(KEYS.BATCHES, [])
    const transactions = getJSON<any[]>(KEYS.TRANSACTIONS, [])
    const payments = getJSON<Payment[]>('clinic_payments', [])

    const billId = generateId()
    
    // Generate Invoice Number sequential
    const profile = getJSON<ClinicProfile>(KEYS.PROFILE, {} as ClinicProfile)
    const nextNum = bills.length + 1
    const invoiceNo = `${profile.invoicePrefix || 'INV/2026-27/'}${String(nextNum).padStart(4, '0')}`

    // Calculations
    let subtotal = 0
    let discountTotal = Number(args.data.discount) || 0
    let taxTotal = 0

    const items: BillItem[] = args.data.items.map((item: any) => {
      const itemSubtotal = item.price * item.quantity
      const itemTotal = Math.max(0, itemSubtotal - (item.discount || 0))
      subtotal += itemTotal

      return {
        id: generateId(),
        bill_id: billId,
        item_type: item.itemType,
        service_id: item.serviceId || null,
        batch_id: item.batchId || null,
        description: item.name,
        qty: Number(item.quantity),
        unit_price: Number(item.price),
        discount_amount: Number(item.discount) || 0,
        gst_percent: Number(item.gstPercent) || 0,
        line_total: itemTotal,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    // Calculate tax total allocated proportional discounts
    const subtotalPaise = Math.round(subtotal * 100)
    const discountPaise = Math.round(discountTotal * 100)
    const taxableAmountPaise = Math.max(0, subtotalPaise - discountPaise)

    let taxTotalPaise = 0
    items.forEach((item) => {
      const itemTotalPaise = Math.round(item.line_total * 100)
      const share = subtotalPaise > 0 ? (itemTotalPaise / subtotalPaise) : 0
      const allocatedGeneralDiscount = discountPaise * share
      const itemTaxablePaise = Math.max(0, itemTotalPaise - allocatedGeneralDiscount)
      const itemTaxPaise = Math.round((itemTaxablePaise * item.gst_percent) / 100)
      taxTotalPaise += itemTaxPaise
    })

    const exactGrandTotalPaise = taxableAmountPaise + taxTotalPaise
    const roundedGrandTotalPaise = Math.round(exactGrandTotalPaise / 100) * 100
    const roundOffPaise = roundedGrandTotalPaise - exactGrandTotalPaise

    const grandTotal = roundedGrandTotalPaise / 100
    taxTotal = taxTotalPaise / 100
    const roundOff = roundOffPaise / 100

    const paidAmount = args.data.status === 'DRAFT' ? 0 : (Number(args.data.paidAmount) || 0)
    const balanceDue = args.data.status === 'DRAFT' ? grandTotal : Math.max(0, grandTotal - paidAmount)

    const newBill: Bill = {
      id: billId,
      bill_no: invoiceNo,
      patient_id: args.data.patientId || null,
      walkin_name: args.data.walkinName || null,
      bill_date: args.data.date || new Date().toISOString(),
      status: args.data.status,
      subtotal,
      discount_total: discountTotal,
      tax_total: taxTotal,
      round_off: roundOff,
      grand_total: grandTotal,
      amount_paid: paidAmount,
      balance_due: balanceDue,
      notes: args.data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Deduct stock if FINALIZED
    const updatedBatches = [...batches]
    const updatedTxns = [...transactions]
    const newPayments = [...payments]

    if (args.data.status === 'FINALIZED') {
      items.forEach(item => {
        if (item.item_type === 'MEDICINE' && item.batch_id) {
          const batchIndex = updatedBatches.findIndex(b => b.id === item.batch_id)
          if (batchIndex !== -1) {
            const b = updatedBatches[batchIndex]
            if (item.qty > b.qty_available) throw new Error(`Insufficient stock for medicine batch: ${b.batch_no}`)
            updatedBatches[batchIndex] = {
              ...b,
              qty_available: b.qty_available - item.qty,
              updated_at: new Date().toISOString()
            }

            // OUT Stock transaction
            updatedTxns.push({
              id: generateId(),
              batch_id: item.batch_id,
              type: 'OUT',
              qty: -item.qty,
              bill_id: billId,
              reason: `Sale Invoice: ${newBill.bill_no}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        }
      })

      // Log Payment if any
      if (paidAmount > 0) {
        newPayments.push({
          id: generateId(),
          bill_id: billId,
          amount: paidAmount,
          mode: args.data.paymentMode || 'CASH',
          reference_no: args.data.transactionId || null,
          paid_at: new Date().toISOString(),
          is_refund: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }

    // Save
    setJSON(KEYS.BILLS, [newBill, ...bills])
    billItemsMap[billId] = items
    setJSON('clinic_bill_items', billItemsMap)
    setJSON(KEYS.BATCHES, updatedBatches)
    setJSON(KEYS.TRANSACTIONS, updatedTxns)
    setJSON('clinic_payments', newPayments)

    addAuditLog('CREATE_BILL', 'Bill', billId, { bill_no: newBill.bill_no, status: newBill.status }, args.userId)
    return newBill
  },
  finalizeBill: async (args: { billId: string; paidAmount: number; paymentMode: string; transactionId?: string; userId: string }): Promise<Bill> => {
    const bills = getJSON<Bill[]>(KEYS.BILLS, [])
    const billItemsMap = getJSON<Record<string, BillItem[]>>('clinic_bill_items', {})
    const batches = getJSON<InventoryBatch[]>(KEYS.BATCHES, [])
    const transactions = getJSON<any[]>(KEYS.TRANSACTIONS, [])
    const payments = getJSON<Payment[]>('clinic_payments', [])

    const billIndex = bills.findIndex(b => b.id === args.billId)
    if (billIndex === -1) throw new Error('Bill not found')
    const bill = bills[billIndex]

    if (bill.status !== 'DRAFT') throw new Error('Only draft bills can be finalized')

    const items = billItemsMap[args.billId] || []

    // Stock verification and deduction
    const updatedBatches = [...batches]
    const updatedTxns = [...transactions]

    items.forEach(item => {
      if (item.item_type === 'MEDICINE' && item.batch_id) {
        const batchIndex = updatedBatches.findIndex(b => b.id === item.batch_id)
        if (batchIndex !== -1) {
          const b = updatedBatches[batchIndex]
          if (item.qty > b.qty_available) throw new Error(`Insufficient stock for batch: ${b.batch_no}`)
          updatedBatches[batchIndex] = {
            ...b,
            qty_available: b.qty_available - item.qty,
            updated_at: new Date().toISOString()
          }

          // Stock transaction
          updatedTxns.push({
            id: generateId(),
            batch_id: item.batch_id,
            type: 'OUT',
            qty: -item.qty,
            bill_id: args.billId,
            reason: `Sale Invoice: ${bill.bill_no}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      }
    })

    const pAmount = args.paidAmount
    const balance = Math.max(0, bill.grand_total - pAmount)

    const updatedBill: Bill = {
      ...bill,
      status: 'FINALIZED',
      amount_paid: pAmount,
      balance_due: balance,
      updated_at: new Date().toISOString()
    }

    const newPayments = [...payments]
    if (pAmount > 0) {
      newPayments.push({
        id: generateId(),
        bill_id: args.billId,
        amount: pAmount,
        mode: (args.paymentMode || 'CASH') as any,
        reference_no: args.transactionId || null,
        paid_at: new Date().toISOString(),
        is_refund: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    bills[billIndex] = updatedBill

    setJSON(KEYS.BILLS, bills)
    setJSON(KEYS.BATCHES, updatedBatches)
    setJSON(KEYS.TRANSACTIONS, updatedTxns)
    setJSON('clinic_payments', newPayments)

    addAuditLog('FINALIZE_BILL', 'Bill', args.billId, { bill_no: updatedBill.bill_no, paid: pAmount }, args.userId)
    return updatedBill
  },
  cancelBill: async (args: { billId: string; reason: string; adminUsername?: string; adminPassword?: string; userId: string }): Promise<Bill> => {
    const bills = getJSON<Bill[]>(KEYS.BILLS, [])
    const billItemsMap = getJSON<Record<string, BillItem[]>>('clinic_bill_items', {})
    const batches = getJSON<InventoryBatch[]>(KEYS.BATCHES, [])
    const transactions = getJSON<any[]>(KEYS.TRANSACTIONS, [])

    const billIndex = bills.findIndex(b => b.id === args.billId)
    if (billIndex === -1) throw new Error('Bill not found')
    const bill = bills[billIndex]

    // Admin validation if receptionist cancels
    if (args.adminUsername) {
      const users = getJSON<any[]>(KEYS.USERS, [])
      const adminUser = users.find(u => u.username === args.adminUsername && u.password_hash === args.adminPassword && u.role === 'ADMIN')
      if (!adminUser) throw new Error('Invalid Admin credentials provided')
    }

    const items = billItemsMap[args.billId] || []

    const updatedBatches = [...batches]
    const updatedTxns = [...transactions]

    // Restore stock only if bill was FINALIZED
    if (bill.status === 'FINALIZED') {
      items.forEach(item => {
        if (item.item_type === 'MEDICINE' && item.batch_id) {
          const batchIndex = updatedBatches.findIndex(b => b.id === item.batch_id)
          if (batchIndex !== -1) {
            const b = updatedBatches[batchIndex]
            updatedBatches[batchIndex] = {
              ...b,
              qty_available: b.qty_available + item.qty,
              updated_at: new Date().toISOString()
            }

            // Inward stock transaction
            updatedTxns.push({
              id: generateId(),
              batch_id: item.batch_id,
              type: 'RETURN',
              qty: item.qty,
              bill_id: args.billId,
              reason: `Cancelled Bill Return: ${bill.bill_no}. Reason: ${args.reason}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        }
      })
    }

    const updatedBill: Bill = {
      ...bill,
      status: 'CANCELLED',
      amount_paid: 0,
      balance_due: 0,
      notes: bill.notes ? `${bill.notes} [Cancelled: ${args.reason}]` : `[Cancelled: ${args.reason}]`,
      updated_at: new Date().toISOString()
    }

    bills[billIndex] = updatedBill

    // Also refund payments (flag as refunds or delete, let's flag as is_refund in payments ledger)
    const payments = getJSON<Payment[]>('clinic_payments', [])
    const refunds = payments
      .filter(p => p.bill_id === args.billId && !p.is_refund)
      .map(p => ({
        id: generateId(),
        bill_id: args.billId,
        amount: -p.amount,
        mode: p.mode,
        reference_no: `REFUND-${p.reference_no || p.id}`,
        paid_at: new Date().toISOString(),
        is_refund: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

    setJSON(KEYS.BILLS, bills)
    setJSON(KEYS.BATCHES, updatedBatches)
    setJSON(KEYS.TRANSACTIONS, updatedTxns)
    setJSON('clinic_payments', [...payments, ...refunds])

    addAuditLog('CANCEL_BILL', 'Bill', args.billId, { bill_no: bill.bill_no, reason: args.reason }, args.userId)
    return updatedBill
  },

  // Payments
  recordPayment: async (args: { billId: string; amount: number; mode: string; referenceNo?: string; userId: string }): Promise<Bill> => {
    const bills = getJSON<Bill[]>(KEYS.BILLS, [])
    const payments = getJSON<Payment[]>('clinic_payments', [])

    const billIndex = bills.findIndex(b => b.id === args.billId)
    if (billIndex === -1) throw new Error('Bill not found')
    const bill = bills[billIndex]

    if (bill.status !== 'FINALIZED') throw new Error('Payments can only be logged against finalized invoices')
    if (args.amount > bill.balance_due) throw new Error('Payment amount exceeds outstanding balance due')

    const nextPaid = bill.amount_paid + args.amount
    const nextBalance = Math.max(0, bill.grand_total - nextPaid)

    const updatedBill: Bill = {
      ...bill,
      amount_paid: nextPaid,
      balance_due: nextBalance,
      updated_at: new Date().toISOString()
    }

    const newPayment: Payment = {
      id: generateId(),
      bill_id: args.billId,
      amount: args.amount,
      mode: args.mode as any,
      reference_no: args.referenceNo || null,
      paid_at: new Date().toISOString(),
      is_refund: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    bills[billIndex] = updatedBill

    setJSON(KEYS.BILLS, bills)
    setJSON('clinic_payments', [...payments, newPayment])

    addAuditLog('RECORD_PAYMENT', 'Bill', args.billId, { amount: args.amount, mode: args.mode }, args.userId)
    return updatedBill
  },

  // Reports
  getCollectionSummary: async (args: { startDate: string; endDate: string }): Promise<CollectionSummary> => {
    const payments = getJSON<Payment[]>('clinic_payments', [])
    const bills = getJSON<Bill[]>(KEYS.BILLS, [])

    const start = new Date(args.startDate).getTime()
    const end = new Date(args.endDate)
    end.setDate(end.getDate() + 1)
    const endTime = end.getTime()

    const periodPayments = payments.filter(p => {
      const t = new Date(p.paid_at).getTime()
      return t >= start && t <= endTime
    })

    const periodBills = bills.filter(b => {
      const t = new Date(b.bill_date).getTime()
      return t >= start && t <= endTime && b.status !== 'CANCELLED'
    })

    let cash = 0
    let card = 0
    let upi = 0
    let bank = 0
    let totalCollected = 0

    periodPayments.forEach(p => {
      const amt = p.amount
      totalCollected += amt
      if (p.mode === 'CASH') cash += amt
      else if (p.mode === 'CARD') card += amt
      else if (p.mode === 'UPI') upi += amt
      else if (p.mode === 'BANK') bank += amt
    })

    let totalBilled = 0
    let totalDues = 0
    periodBills.forEach(b => {
      totalBilled += b.grand_total
      totalDues += b.balance_due
    })

    return {
      totalCollected,
      cashCollected: cash,
      cardCollected: card,
      upiCollected: upi,
      bankCollected: bank,
      totalBilled,
      totalDues,
      paymentCount: periodPayments.length,
      billCount: periodBills.length
    }
  },
  getOutstandingDues: async (): Promise<Bill[]> => {
    const bills = getJSON<Bill[]>(KEYS.BILLS, [])
    const patients = getJSON<Patient[]>(KEYS.PATIENTS, [])

    return bills
      .filter(b => b.status === 'FINALIZED' && b.balance_due > 0)
      .map(b => {
        let pInfo = null
        if (b.patient_id) {
          const pat = patients.find(p => p.id === b.patient_id)
          if (pat) pInfo = pat
        }
        return { ...b, patient: pInfo }
      })
      .sort((a, b) => b.balance_due - a.balance_due) // Largest dues first
  },
  getGstSummary: async (args: { startDate: string; endDate: string }): Promise<GstSummaryRow[]> => {
    const bills = getJSON<Bill[]>(KEYS.BILLS, [])
    const billItemsMap = getJSON<Record<string, BillItem[]>>('clinic_bill_items', {})

    const start = new Date(args.startDate).getTime()
    const end = new Date(args.endDate)
    end.setDate(end.getDate() + 1)
    const endTime = end.getTime()

    const periodBills = bills.filter(b => {
      const t = new Date(b.bill_date).getTime()
      return t >= start && t <= endTime && b.status === 'FINALIZED'
    })

    const taxGroups: Record<number, { taxableValue: number; totalTax: number }> = {}

    periodBills.forEach(bill => {
      const items = billItemsMap[bill.id] || []
      const billSubtotalPaise = Math.round(bill.subtotal * 100)
      const billDiscountPaise = Math.round(bill.discount_total * 100)

      items.forEach(item => {
        const itemTotalPaise = Math.round(item.line_total * 100)
        const share = billSubtotalPaise > 0 ? (itemTotalPaise / billSubtotalPaise) : 0
        const allocatedGeneralDiscount = billDiscountPaise * share
        const itemTaxablePaise = Math.max(0, itemTotalPaise - allocatedGeneralDiscount)
        
        const rate = item.gst_percent
        const itemTaxPaise = Math.round((itemTaxablePaise * rate) / 100)

        if (!taxGroups[rate]) {
          taxGroups[rate] = { taxableValue: 0, totalTax: 0 }
        }
        taxGroups[rate].taxableValue += itemTaxablePaise / 100
        taxGroups[rate].totalTax += itemTaxPaise / 100
      })
    })

    return Object.entries(taxGroups).map(([rateStr, vals]) => {
      const rate = parseFloat(rateStr)
      const cgst = vals.totalTax / 2
      const sgst = vals.totalTax / 2
      return {
        rate,
        taxableValue: vals.taxableValue,
        cgst,
        sgst,
        totalTax: vals.totalTax
      }
    })
  },
  getInventoryValuation: async (): Promise<{ purchaseValuation: number; sellingValuation: number }> => {
    const batches = getJSON<InventoryBatch[]>(KEYS.BATCHES, [])
    let pVal = 0
    let sVal = 0
    batches.forEach(b => {
      pVal += b.qty_available * b.purchase_price_per_unit
      sVal += b.qty_available * b.selling_price_per_unit
    })
    return { purchaseValuation: pVal, sellingValuation: sVal }
  },
  getInventoryAlerts: async (): Promise<{ expiredCount: number; expiringCount: number; lowStockCount: number }> => {
    const batches = getJSON<InventoryBatch[]>(KEYS.BATCHES, [])
    const medicines = getJSON<Medicine[]>(KEYS.MEDICINES, [])
    const today = Date.now()
    const soon = today + 30 * 24 * 60 * 60 * 1000

    let expiredCount = 0
    let expiringCount = 0

    batches.forEach(b => {
      if (b.qty_available > 0) {
        const expTime = new Date(b.expiry_date).getTime()
        if (expTime <= today) {
          expiredCount++
        } else if (expTime <= soon) {
          expiringCount++
        }
      }
    })

    // Low stock count (medicine level)
    let lowStockCount = 0
    medicines.forEach(m => {
      if (m.deleted_at) return
      const totalAvail = batches
        .filter(b => b.medicine_id === m.id)
        .reduce((sum, b) => sum + b.qty_available, 0)
      if (totalAvail < m.reorder_level) {
        lowStockCount++
      }
    })

    return { expiredCount, expiringCount, lowStockCount }
  },
  getBatchLedger: async (batchId: string): Promise<any[]> => {
    const txns = getJSON<any[]>(KEYS.TRANSACTIONS, [])
    return txns
      .filter(t => t.batch_id === batchId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },
  getVendorPurchases: async (): Promise<any[]> => {
    const vendors = getJSON<Vendor[]>(KEYS.VENDORS, [])
    const purchases = getJSON<Purchase[]>(KEYS.PURCHASES, [])

    return vendors.map(v => {
      const vp = purchases.filter(p => p.vendor_id === v.id)
      const total = vp.reduce((sum, p) => sum + p.total_amount, 0)
      return {
        name: v.name,
        phone: v.phone,
        gstin: v.gstin,
        purchaseCount: vp.length,
        totalSpent: total,
        lastPurchaseDate: vp.length > 0 ? vp[0].purchase_date : null
      }
    })
  },

  // Auth & User Management
  login: async (args: { username: string; password: string }): Promise<{ success: boolean; message?: string; user?: UserSummary }> => {
    const users = getJSON<any[]>(KEYS.USERS, [])
    const u = users.find(x => x.username === args.username && x.is_active)
    if (!u) return { success: false, message: 'Invalid username' }
    
    if (u.password_hash === args.password) {
      const summary: UserSummary = { id: u.id, username: u.username, role: u.role, is_active: u.is_active }
      // Log login action
      addAuditLog('LOGIN', 'User', u.id, { username: u.username }, u.id)
      return { success: true, user: summary }
    }
    return { success: false, message: 'Invalid credentials' }
  },
  createUser: async (args: { username: string; password: string; role: string; userId: string }): Promise<{ success: boolean; message?: string; user?: UserSummary }> => {
    const users = getJSON<any[]>(KEYS.USERS, [])
    const exists = users.find(x => x.username.toLowerCase() === args.username.toLowerCase())
    if (exists) return { success: false, message: 'Username already exists' }

    const newUser = {
      id: generateId(),
      username: args.username,
      password_hash: args.password,
      role: args.role,
      is_active: true
    }

    setJSON(KEYS.USERS, [...users, newUser])
    const summary: UserSummary = { id: newUser.id, username: newUser.username, role: newUser.role as any, is_active: true }
    
    addAuditLog('CREATE_USER', 'User', newUser.id, { username: newUser.username, role: newUser.role }, args.userId)
    return { success: true, user: summary }
  },
  getUsers: async (): Promise<UserSummary[]> => {
    const users = getJSON<any[]>(KEYS.USERS, [])
    return users.map(u => ({ id: u.id, username: u.username, role: u.role, is_active: u.is_active }))
  },
  resetPassword: async (args: { id: string; password: string; userId: string }): Promise<{ success: boolean }> => {
    const users = getJSON<any[]>(KEYS.USERS, [])
    const updated = users.map(u => {
      if (u.id === args.id) {
        return { ...u, password_hash: args.password }
      }
      return u
    })
    setJSON(KEYS.USERS, updated)
    addAuditLog('RESET_PASSWORD', 'User', args.id, {}, args.userId)
    return { success: true }
  },
  toggleUserActive: async (args: { id: string; is_active: boolean; userId: string }): Promise<{ success: boolean }> => {
    const users = getJSON<any[]>(KEYS.USERS, [])
    const updated = users.map(u => {
      if (u.id === args.id) {
        return { ...u, is_active: args.is_active }
      }
      return u
    })
    setJSON(KEYS.USERS, updated)
    addAuditLog(args.is_active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'User', args.id, {}, args.userId)
    return { success: true }
  },
  getAuditLogs: async (): Promise<AuditLogEntry[]> => {
    return getJSON<AuditLogEntry[]>(KEYS.AUDIT, [])
  },

  // Backups (Simulated in LocalStorage)
  backupDatabase: async (customPath?: string): Promise<{ success: boolean; message: string }> => {
    const dateStr = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/:/g, '')
    const key = `backup_${dateStr}`
    
    // Package current database state
    const backupState = {
      profile: localStorage.getItem(KEYS.PROFILE),
      settings: localStorage.getItem(KEYS.SETTINGS),
      users: localStorage.getItem(KEYS.USERS),
      patients: localStorage.getItem(KEYS.PATIENTS),
      vendors: localStorage.getItem(KEYS.VENDORS),
      medicines: localStorage.getItem(KEYS.MEDICINES),
      purchases: localStorage.getItem(KEYS.PURCHASES),
      batches: localStorage.getItem(KEYS.BATCHES),
      services: localStorage.getItem(KEYS.SERVICES),
      bills: localStorage.getItem(KEYS.BILLS),
      bill_items: localStorage.getItem('clinic_bill_items'),
      payments: localStorage.getItem('clinic_payments'),
      transactions: localStorage.getItem(KEYS.TRANSACTIONS),
      audit: localStorage.getItem(KEYS.AUDIT)
    }

    localStorage.setItem(key, JSON.stringify(backupState))

    // Track in backup history
    const backups = getJSON<any[]>('clinic_backups_list', [])
    setJSON('clinic_backups_list', [{ key, date: new Date().toISOString(), path: customPath || 'C:/ClinicBackups' }, ...backups])

    return { success: true, message: `Backup created successfully as ${key} in ${customPath || 'C:/ClinicBackups'}` }
  },
  restoreDatabase: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const backups = getJSON<any[]>('clinic_backups_list', [])
    if (backups.length === 0) return { success: false, message: 'No backup records found to restore' }

    // Take safety backup first
    await mockApi.backupDatabase('C:/ClinicBackups/auto_safety_backup')

    const latest = backups[0]
    const backupState = getJSON<any>(latest.key, null)
    if (!backupState) return { success: false, message: 'Backup state file corrupted or missing' }

    // Restore keys
    const restoreKey = (k: string, val: string | null) => {
      if (val) localStorage.setItem(k, val)
      else localStorage.removeItem(k)
    }

    restoreKey(KEYS.PROFILE, backupState.profile)
    restoreKey(KEYS.SETTINGS, backupState.settings)
    restoreKey(KEYS.USERS, backupState.users)
    restoreKey(KEYS.PATIENTS, backupState.patients)
    restoreKey(KEYS.VENDORS, backupState.vendors)
    restoreKey(KEYS.MEDICINES, backupState.medicines)
    restoreKey(KEYS.PURCHASES, backupState.purchases)
    restoreKey(KEYS.BATCHES, backupState.batches)
    restoreKey(KEYS.SERVICES, backupState.services)
    restoreKey(KEYS.BILLS, backupState.bills)
    restoreKey('clinic_bill_items', backupState.bill_items)
    restoreKey('clinic_payments', backupState.payments)
    restoreKey(KEYS.TRANSACTIONS, backupState.transactions)
    restoreKey(KEYS.AUDIT, backupState.audit)

    addAuditLog('RESTORE_DATABASE', 'Database', 'all', { backupKey: latest.key }, userId)
    return { success: true, message: 'Database restored successfully. Application reloaded.' }
  },

  // Printing Layout trigger
  printInvoice: async (billId: string): Promise<boolean> => {
    console.log('Mock print trigger for invoice:', billId)
    
    // In Next.js, we can do a clean window open or state trigger.
    if (typeof window !== 'undefined') {
      // Open the print receipt in a new window or trigger hash route print
      const w = window.open(`/#/print/${billId}`, '_blank', 'width=800,height=600')
      if (w) {
        // Automatically close after print trigger
        w.focus()
      }
    }
    return true
  }
}
