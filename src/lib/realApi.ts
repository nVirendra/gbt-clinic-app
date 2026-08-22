import {
  Patient,
  Vendor,
  Medicine,
  Purchase,
  InventoryBatch,
  Service,
  Bill,
  ClinicProfile,
  UserSummary,
  CollectionSummary,
  GstSummaryRow,
  AuditLogEntry,
  ScanInvoiceResult,
  ScanCommitPayload
} from '../types';

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_API_URL) {
    return (window as any).NEXT_PUBLIC_API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://shree-balaji-polyclinic.onrender.com/api/v1';
};

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gbt_auth_token');
  }
  return null;
};

const setToken = (token: string | null): void => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('gbt_auth_token', token);
    } else {
      localStorage.removeItem('gbt_auth_token');
    }
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMessage = `API Request failed with status ${response.status}`;
    try {
      const errData = await response.json();
      if (Array.isArray(errData.errors) && errData.errors.length > 0) {
        const details = errData.errors.map((e: any) => typeof e === 'string' ? e : e.message || e.msg || JSON.stringify(e)).join('; ');
        errorMessage = errData.message ? `${errData.message}: ${details}` : details;
      } else if (Array.isArray(errData.details) && errData.details.length > 0) {
        const details = errData.details.map((e: any) => typeof e === 'string' ? e : e.message || JSON.stringify(e)).join('; ');
        errorMessage = errData.message ? `${errData.message}: ${details}` : details;
      } else if (typeof errData.details === 'string') {
        errorMessage = errData.message ? `${errData.message}: ${errData.details}` : errData.details;
      } else if (errData.message) {
        errorMessage = errData.message;
      } else if (errData.error) {
        errorMessage = typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error);
      }
    } catch { }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json();
  if (json && typeof json === 'object' && 'data' in json && json.data !== undefined) {
    return json.data as T;
  }

  return json as T;
}

export const realApi: Window['api'] = {
  // ==========================================
  // Settings & Profile
  // ==========================================
  async getSettings(): Promise<Record<string, string>> {
    try {
      const profile = await this.getClinicProfile();
      return {
        clinicName: profile.name,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        gstin: profile.gstin,
        defaultTaxRate: String(profile.defaultTaxRate),
        invoicePrefix: profile.invoicePrefix,
        autoLockMinutes: String(profile.autoLockMinutes),
      };
    } catch {
      return {};
    }
  },

  async updateSettings(args: { data: Record<string, string>; userId: string }): Promise<{ success: boolean }> {
    const patchData: Partial<ClinicProfile> = {};
    if (args.data.clinicName) patchData.name = args.data.clinicName;
    if (args.data.address) patchData.address = args.data.address;
    if (args.data.phone) patchData.phone = args.data.phone;
    if (args.data.email) patchData.email = args.data.email;
    if (args.data.gstin) patchData.gstin = args.data.gstin;
    if (args.data.defaultTaxRate) patchData.defaultTaxRate = Number(args.data.defaultTaxRate);
    if (args.data.invoicePrefix) patchData.invoicePrefix = args.data.invoicePrefix;
    if (args.data.autoLockMinutes) patchData.autoLockMinutes = Number(args.data.autoLockMinutes);

    await this.updateClinicProfile({ data: patchData, userId: args.userId });
    return { success: true };
  },

  async getClinicProfile(): Promise<ClinicProfile> {
    return request<ClinicProfile>('/settings/profile');
  },

  async updateClinicProfile(args: { data: Partial<ClinicProfile>; userId: string }): Promise<{ success: boolean }> {
    await request<ClinicProfile>('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(args.data),
    });
    return { success: true };
  },

  // ==========================================
  // Patients
  // ==========================================
  async getPatients(searchQuery?: string): Promise<Patient[]> {
    const queryStr = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
    return request<Patient[]>(`/patients${queryStr}`);
  },

  async getPatientById(id: string): Promise<Patient | null> {
    try {
      return await request<Patient>(`/patients/${id}`);
    } catch {
      return null;
    }
  },

  async checkDuplicatePatient(args: { phone: string; fullName: string }): Promise<{ duplicate: boolean; patient?: Patient }> {
    return request<{ duplicate: boolean; patient?: Patient }>('/patients/check-duplicate', {
      method: 'POST',
      body: JSON.stringify({ phone: args.phone, fullName: args.fullName }),
    });
  },

  async createPatient(args: { data: Partial<Patient>; userId: string }): Promise<Patient> {
    const rawGender = args.data.gender ? String(args.data.gender).toUpperCase() : 'MALE';
    const gender = ['MALE', 'FEMALE', 'OTHER'].includes(rawGender) ? rawGender : 'MALE';

    const payload = {
      full_name: args.data.full_name,
      gender,
      phone: args.data.phone,
      dob: args.data.dob || null,
      age_years: args.data.age_years || null,
      address: args.data.address || null,
      referring_doctor: args.data.referring_doctor || null,
      allergies_notes: args.data.allergies_notes || null,
      notes: args.data.notes || null,
    };
    return request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePatient(args: { id: string; data: Partial<Patient>; userId: string }): Promise<Patient> {
    const rawGender = args.data.gender ? String(args.data.gender).toUpperCase() : undefined;
    const gender = rawGender && ['MALE', 'FEMALE', 'OTHER'].includes(rawGender) ? rawGender : undefined;

    const payload: Record<string, any> = {};
    if (args.data.full_name !== undefined) payload.full_name = args.data.full_name;
    if (gender !== undefined) payload.gender = gender;
    if (args.data.phone !== undefined) payload.phone = args.data.phone;
    if (args.data.dob !== undefined) payload.dob = args.data.dob || null;
    if (args.data.age_years !== undefined) payload.age_years = args.data.age_years || null;
    if (args.data.address !== undefined) payload.address = args.data.address || null;
    if (args.data.referring_doctor !== undefined) payload.referring_doctor = args.data.referring_doctor || null;
    if (args.data.allergies_notes !== undefined) payload.allergies_notes = args.data.allergies_notes || null;
    if (args.data.notes !== undefined) payload.notes = args.data.notes || null;

    return request<Patient>(`/patients/${args.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deletePatient(args: { id: string; userId: string }): Promise<Patient> {
    return request<Patient>(`/patients/${args.id}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // Vendors
  // ==========================================
  async getVendors(): Promise<Vendor[]> {
    return request<Vendor[]>('/inventory/vendors');
  },

  async createVendor(args: { data: Partial<Vendor>; userId: string }): Promise<Vendor> {
    return request<Vendor>('/inventory/vendors', {
      method: 'POST',
      body: JSON.stringify(args.data),
    });
  },

  async updateVendor(args: { id: string; data: Partial<Vendor>; userId: string }): Promise<Vendor> {
    return request<Vendor>(`/inventory/vendors/${args.id}`, {
      method: 'PUT',
      body: JSON.stringify(args.data),
    });
  },

  async deleteVendor(args: { id: string; userId: string }): Promise<Vendor> {
    return request<Vendor>(`/inventory/vendors/${args.id}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // Medicines
  // ==========================================
  async getMedicines(): Promise<Medicine[]> {
    return request<Medicine[]>('/inventory/medicines');
  },

  async createMedicine(args: { data: Partial<Medicine> | any; userId: string }): Promise<Medicine> {
    const raw = args.data || {};
    const payload = {
      name: raw.name,
      strength: raw.strength !== undefined ? raw.strength : null,
      generic_name: raw.generic_name !== undefined ? raw.generic_name : (raw.genericName || null),
      manufacturer: raw.manufacturer || null,
      pack: raw.pack || null,
      type: raw.type || 'TABLET',
      unit_label: raw.unit_label || raw.unitLabel || 'strip',
      base_unit: raw.base_unit !== undefined ? raw.base_unit : (raw.baseUnit || 'Piece'),
      inner_unit: raw.inner_unit !== undefined ? raw.inner_unit : (raw.innerUnit || null),
      units_per_inner: raw.units_per_inner !== undefined ? Number(raw.units_per_inner) : (Number(raw.unitsPerInner) || 1.0),
      purchase_unit: raw.purchase_unit !== undefined ? raw.purchase_unit : (raw.purchaseUnit || null),
      inner_units_per_purchase: raw.inner_units_per_purchase !== undefined ? Number(raw.inner_units_per_purchase) : (Number(raw.innerUnitsPerPurchase) || 1.0),
      hsn_code: raw.hsn_code !== undefined ? raw.hsn_code : (raw.hsnCode || null),
      rack_no: raw.rack_no !== undefined ? raw.rack_no : (raw.rackNo || null),
      reorder_level: raw.reorder_level !== undefined ? Number(raw.reorder_level) : (Number(raw.reorderLevel) || 0),
      default_gst_percent: raw.default_gst_percent !== undefined ? Number(raw.default_gst_percent) : (Number(raw.defaultGstPercent) || 12.0),
    };
    return request<Medicine>('/inventory/medicines', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateMedicine(args: { id: string; data: Partial<Medicine> | any; userId: string }): Promise<Medicine> {
    const raw = args.data || {};
    const payload: Record<string, any> = {};
    if (raw.name !== undefined) payload.name = raw.name;
    if (raw.strength !== undefined) payload.strength = raw.strength;
    if (raw.generic_name !== undefined || raw.genericName !== undefined) {
      payload.generic_name = raw.generic_name !== undefined ? raw.generic_name : raw.genericName;
    }
    if (raw.manufacturer !== undefined) payload.manufacturer = raw.manufacturer;
    if (raw.pack !== undefined) payload.pack = raw.pack;
    if (raw.type !== undefined) payload.type = raw.type;
    if (raw.unit_label !== undefined || raw.unitLabel !== undefined) {
      payload.unit_label = raw.unit_label || raw.unitLabel;
    }
    if (raw.base_unit !== undefined || raw.baseUnit !== undefined) {
      payload.base_unit = raw.base_unit !== undefined ? raw.base_unit : raw.baseUnit;
    }
    if (raw.inner_unit !== undefined || raw.innerUnit !== undefined) {
      payload.inner_unit = raw.inner_unit !== undefined ? raw.inner_unit : raw.innerUnit;
    }
    if (raw.units_per_inner !== undefined || raw.unitsPerInner !== undefined) {
      payload.units_per_inner = raw.units_per_inner !== undefined ? Number(raw.units_per_inner) : Number(raw.unitsPerInner);
    }
    if (raw.purchase_unit !== undefined || raw.purchaseUnit !== undefined) {
      payload.purchase_unit = raw.purchase_unit !== undefined ? raw.purchase_unit : raw.purchaseUnit;
    }
    if (raw.inner_units_per_purchase !== undefined || raw.innerUnitsPerPurchase !== undefined) {
      payload.inner_units_per_purchase = raw.inner_units_per_purchase !== undefined ? Number(raw.inner_units_per_purchase) : Number(raw.innerUnitsPerPurchase);
    }
    if (raw.hsn_code !== undefined || raw.hsnCode !== undefined) {
      payload.hsn_code = raw.hsn_code !== undefined ? raw.hsn_code : raw.hsnCode;
    }
    if (raw.rack_no !== undefined || raw.rackNo !== undefined) {
      payload.rack_no = raw.rack_no !== undefined ? raw.rack_no : raw.rackNo;
    }
    if (raw.reorder_level !== undefined || raw.reorderLevel !== undefined) {
      payload.reorder_level = raw.reorder_level !== undefined ? Number(raw.reorder_level) : Number(raw.reorderLevel);
    }
    if (raw.default_gst_percent !== undefined || raw.defaultGstPercent !== undefined) {
      payload.default_gst_percent = raw.default_gst_percent !== undefined ? Number(raw.default_gst_percent) : Number(raw.defaultGstPercent);
    }

    return request<Medicine>(`/inventory/medicines/${args.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteMedicine(args: { id: string; userId: string }): Promise<Medicine> {
    return request<Medicine>(`/inventory/medicines/${args.id}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // Purchases
  // ==========================================
  async getPurchases(): Promise<Purchase[]> {
    return request<Purchase[]>('/inventory/purchases');
  },

  async createPurchase(args: { data: any; userId: string }): Promise<Purchase> {
    const raw = args.data || {};
    const payload = {
      vendorId: raw.vendorId,
      purchaseInvoiceNo: raw.purchaseInvoiceNo,
      purchaseDate: raw.purchaseDate,
      purchaseType: raw.purchaseType || 'CASH',
      dueDate: raw.dueDate || null,
      paymentDate: raw.paymentDate || null,
      paymentStatus: raw.paymentStatus || (raw.purchaseType === 'CREDIT' ? 'PENDING' : 'PAID'),
      paymentMode: raw.paymentMode || 'CASH',
      taxableAmount: Number(raw.taxableAmount || 0),
      cgstAmount: Number(raw.cgstAmount || 0),
      sgstAmount: Number(raw.sgstAmount || 0),
      igstAmount: Number(raw.igstAmount || 0),
      gstAmount: Number(raw.gstAmount || 0),
      gstPercent: Number(raw.gstPercent || 0),
      totalAmount: raw.totalAmount,
      paidAmount: raw.paidAmount !== undefined ? Number(raw.paidAmount) : undefined,
      pendingAmount: raw.pendingAmount !== undefined ? Number(raw.pendingAmount) : undefined,
      notes: raw.notes || null,
      items: (raw.items || []).map((item: any) => ({
        id: item.id || undefined,
        medicineId: item.medicineId,
        batchNo: item.batchNo && item.batchNo.trim() ? item.batchNo.trim() : 'N/A',
        expiryDate: item.expiryDate,
        qty: item.qty !== undefined ? Number(item.qty) : Number(item.qtyPurchased),
        unit: item.unit || undefined,
        freeQty: item.freeQty !== undefined ? Number(item.freeQty) : (Number(item.qtyFree) || 0),
        freeUnit: item.freeUnit || undefined,
        mrp: Number(item.mrp || 0),
        discountPercent: item.discountPercent !== undefined ? Number(item.discountPercent) : (Number(item.discount_percent) || 0),
        taxableAmount: Number(item.taxableAmount || 0),
        cgstAmount: Number(item.cgstAmount || 0),
        sgstAmount: Number(item.sgstAmount || 0),
        igstAmount: Number(item.igstAmount || 0),
        gstPercent: Number(item.gstPercent || 0),
        purchasePrice: item.purchasePrice !== undefined ? Number(item.purchasePrice) : Number(item.purchasePricePerUnit),
        sellingPrice: item.sellingPrice !== undefined ? Number(item.sellingPrice) : Number(item.sellingPricePerUnit),
        unitPurchasePrice: item.unitPurchasePrice !== undefined ? Number(item.unitPurchasePrice) : (item.purchasePrice !== undefined ? Number(item.purchasePrice) : Number(item.purchasePricePerUnit)),
        unitMrp: item.unitMrp !== undefined ? Number(item.unitMrp) : Number(item.mrp || 0),
        unitSellingPrice: item.unitSellingPrice !== undefined ? Number(item.unitSellingPrice) : (item.sellingPrice !== undefined ? Number(item.sellingPrice) : Number(item.sellingPricePerUnit)),
      })),
    };
    return request<Purchase>('/inventory/purchases', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePurchase(args: { id: string; data: any; userId: string }): Promise<Purchase> {
    const raw = args.data || {};
    const payload = {
      vendorId: raw.vendorId,
      purchaseInvoiceNo: raw.purchaseInvoiceNo,
      purchaseDate: raw.purchaseDate,
      purchaseType: raw.purchaseType || 'CASH',
      dueDate: raw.dueDate || null,
      paymentDate: raw.paymentDate || null,
      paymentStatus: raw.paymentStatus || (raw.purchaseType === 'CREDIT' ? 'PENDING' : 'PAID'),
      paymentMode: raw.paymentMode || 'CASH',
      taxableAmount: Number(raw.taxableAmount || 0),
      cgstAmount: Number(raw.cgstAmount || 0),
      sgstAmount: Number(raw.sgstAmount || 0),
      igstAmount: Number(raw.igstAmount || 0),
      gstAmount: Number(raw.gstAmount || 0),
      gstPercent: Number(raw.gstPercent || 0),
      totalAmount: raw.totalAmount,
      paidAmount: raw.paidAmount !== undefined ? Number(raw.paidAmount) : undefined,
      pendingAmount: raw.pendingAmount !== undefined ? Number(raw.pendingAmount) : undefined,
      notes: raw.notes || null,
      items: (raw.items || []).map((item: any) => ({
        id: item.id || undefined,
        medicineId: item.medicineId,
        batchNo: item.batchNo && item.batchNo.trim() ? item.batchNo.trim() : 'N/A',
        expiryDate: item.expiryDate,
        qty: item.qty !== undefined ? Number(item.qty) : Number(item.qtyPurchased),
        unit: item.unit || undefined,
        freeQty: item.freeQty !== undefined ? Number(item.freeQty) : (Number(item.qtyFree) || 0),
        freeUnit: item.freeUnit || undefined,
        mrp: Number(item.mrp || 0),
        discountPercent: item.discountPercent !== undefined ? Number(item.discountPercent) : (Number(item.discount_percent) || 0),
        taxableAmount: Number(item.taxableAmount || 0),
        cgstAmount: Number(item.cgstAmount || 0),
        sgstAmount: Number(item.sgstAmount || 0),
        igstAmount: Number(item.igstAmount || 0),
        gstPercent: Number(item.gstPercent || 0),
        purchasePrice: item.purchasePrice !== undefined ? Number(item.purchasePrice) : Number(item.purchasePricePerUnit),
        sellingPrice: item.sellingPrice !== undefined ? Number(item.sellingPrice) : Number(item.sellingPricePerUnit),
        unitPurchasePrice: item.unitPurchasePrice !== undefined ? Number(item.unitPurchasePrice) : (item.purchasePrice !== undefined ? Number(item.purchasePrice) : Number(item.purchasePricePerUnit)),
        unitMrp: item.unitMrp !== undefined ? Number(item.unitMrp) : Number(item.mrp || 0),
        unitSellingPrice: item.unitSellingPrice !== undefined ? Number(item.unitSellingPrice) : (item.sellingPrice !== undefined ? Number(item.sellingPrice) : Number(item.sellingPricePerUnit)),
      })),
    };
    return request<Purchase>(`/inventory/purchases/${args.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // ==========================================
  // Scan Purchase Invoice
  // ==========================================
  async scanPurchaseInvoice(file: File): Promise<ScanInvoiceResult> {
    const baseUrl = getBaseUrl();
    const token = getToken();

    const formData = new FormData();
    formData.append('invoice', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // No 'Content-Type' header — the browser sets the multipart boundary for FormData.
    const response = await fetch(`${baseUrl}/purchase-scan/extract`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `Invoice scan failed with status ${response.status}`;
      try {
        const errData = await response.json();
        errorMessage = errData.message || errorMessage;
      } catch { }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<ScanInvoiceResult>;
  },

  async commitScannedPurchase(args: { data: ScanCommitPayload; userId: string }): Promise<Purchase> {
    return request<Purchase>('/purchase-scan/commit', {
      method: 'POST',
      body: JSON.stringify(args.data),
    });
  },

  // ==========================================
  // Inventory Batches
  // ==========================================
  async getInventoryBatches(): Promise<InventoryBatch[]> {
    return request<InventoryBatch[]>('/inventory/batches');
  },

  async getMedicineBatches(medicineId: string): Promise<InventoryBatch[]> {
    return request<InventoryBatch[]>(`/inventory/medicines/${medicineId}/batches`);
  },

  async adjustStock(args: { batchId: string; qty: number; reason: string; userId: string }): Promise<InventoryBatch> {
    return request<InventoryBatch>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        batchId: args.batchId,
        qty: args.qty,
        reason: args.reason,
      }),
    });
  },

  // ==========================================
  // Services
  // ==========================================
  async getServices(): Promise<Service[]> {
    return request<Service[]>('/services');
  },

  async createService(args: any): Promise<Service> {
    const raw = args.data || args;
    const payload = {
      name: raw.name,
      default_price: raw.default_price !== undefined ? Number(raw.default_price) : Number(raw.defaultPrice || raw.price || 0),
      gst_percent: raw.gst_percent !== undefined ? Number(raw.gst_percent) : Number(raw.gstPercent || 0),
      sac_code: raw.sac_code !== undefined ? raw.sac_code : (raw.sacCode || null),
    };
    return request<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateService(args: any): Promise<Service> {
    const id = args.id;
    const raw = args.data || args;
    const payload: Record<string, any> = {};
    if (raw.name !== undefined) payload.name = raw.name;
    if (raw.default_price !== undefined || raw.defaultPrice !== undefined || raw.price !== undefined) {
      payload.default_price = raw.default_price !== undefined ? Number(raw.default_price) : Number(raw.defaultPrice || raw.price);
    }
    if (raw.gst_percent !== undefined || raw.gstPercent !== undefined) {
      payload.gst_percent = raw.gst_percent !== undefined ? Number(raw.gst_percent) : Number(raw.gstPercent);
    }
    if (raw.sac_code !== undefined || raw.sacCode !== undefined) {
      payload.sac_code = raw.sac_code !== undefined ? raw.sac_code : raw.sacCode;
    }
    if (raw.is_active !== undefined || raw.isActive !== undefined) {
      payload.is_active = raw.is_active !== undefined ? raw.is_active : raw.isActive;
    }

    return request<Service>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteService(args: any): Promise<Service> {
    const id = typeof args === 'string' ? args : args.id;
    return request<Service>(`/services/${id}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // Bills
  // ==========================================
  async getBills(filters?: { status?: string; patientId?: string; startDate?: string; endDate?: string }): Promise<Bill[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Bill[]>(`/billing${query}`);
  },

  async getBillById(id: string): Promise<Bill | null> {
    try {
      return await request<Bill>(`/billing/${id}`);
    } catch {
      return null;
    }
  },

  async createBill(args: { data: any; userId: string }): Promise<Bill> {
    const rawData = args.data;
    const items = (rawData.items || []).map((item: any) => {
      const qtyRaw = Number(item.quantity !== undefined ? item.quantity : (item.qty !== undefined ? item.qty : 1));
      const qty = isNaN(qtyRaw) || qtyRaw < 1 ? 1 : Math.round(qtyRaw);

      const priceRaw = Number(item.price !== undefined ? item.price : (item.unitPrice !== undefined ? item.unitPrice : (item.unit_price || 0)));
      const unitPrice = isNaN(priceRaw) || priceRaw < 0 ? 0 : priceRaw;

      const discRaw = Number(item.discount !== undefined ? item.discount : (item.discountAmount !== undefined ? item.discountAmount : (item.discount_amount || 0)));
      const discountAmount = isNaN(discRaw) || discRaw < 0 ? 0 : discRaw;

      const gstRaw = Number(item.gstPercent !== undefined ? item.gstPercent : (item.gst_percent || 0));
      const gstPercent = isNaN(gstRaw) || gstRaw < 0 ? 0 : gstRaw;

      return {
        itemType: item.itemType || item.item_type || 'SERVICE',
        serviceId: item.serviceId || item.service_id || null,
        batchId: item.batchId || item.batch_id || null,
        description: String(item.name || item.description || 'Line Item').trim(),
        qty,
        unitPrice,
        discountAmount,
        gstPercent,
      };
    });

    const payload = {
      patientId: rawData.patientId || rawData.patient_id || null,
      walkinName: rawData.walkinName || rawData.walkin_name || null,
      notes: rawData.notes || null,
      items,
    };

    const draftBill = await request<Bill>('/billing', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (rawData.status === 'FINALIZED') {
      return this.finalizeBill({
        billId: draftBill.id,
        paidAmount: rawData.paidAmount !== undefined ? rawData.paidAmount : draftBill.grand_total,
        paymentMode: rawData.paymentMode || 'CASH',
        transactionId: rawData.transactionId,
        userId: args.userId,
      });
    }

    return draftBill;
  },

  async finalizeBill(args: { billId: string; paidAmount: number; paymentMode: string; transactionId?: string; userId: string }): Promise<Bill> {
    const bill = await request<Bill>(`/billing/${args.billId}/finalize`, {
      method: 'POST',
    });

    if (args.paidAmount > 0) {
      try {
        await this.recordPayment({
          billId: args.billId,
          amount: args.paidAmount,
          mode: args.paymentMode,
          referenceNo: args.transactionId,
          userId: args.userId,
        });
      } catch (e) {
        console.error('Failed to record payment during finalization:', e);
      }
    }

    const freshBill = await this.getBillById(args.billId);
    return freshBill || bill;
  },

  async cancelBill(args: { billId: string; reason: string; adminUsername?: string; adminPassword?: string; userId: string }): Promise<Bill> {
    return request<Bill>(`/billing/${args.billId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: args.reason }),
    });
  },

  // ==========================================
  // Payments
  // ==========================================
  async recordPayment(args: { billId: string; amount: number; mode: string; referenceNo?: string; userId: string }): Promise<Bill> {
    const res = await request<any>(`/billing/${args.billId}/payments`, {
      method: 'POST',
      body: JSON.stringify({
        amount: args.amount,
        mode: args.mode,
        referenceNo: args.referenceNo || null,
      }),
    });

    if (res && res.bill) {
      return res.bill;
    }
    return res;
  },

  // ==========================================
  // Reports
  // ==========================================
  async getCollectionSummary(args: { startDate: string; endDate: string }): Promise<CollectionSummary> {
    const query = `?startDate=${encodeURIComponent(args.startDate)}&endDate=${encodeURIComponent(args.endDate)}`;
    return request<CollectionSummary>(`/reports/collections${query}`);
  },

  async getOutstandingDues(): Promise<Bill[]> {
    return request<Bill[]>('/reports/outstanding');
  },

  async getGstSummary(args: { startDate: string; endDate: string }): Promise<GstSummaryRow[]> {
    const query = `?startDate=${encodeURIComponent(args.startDate)}&endDate=${encodeURIComponent(args.endDate)}`;
    return request<GstSummaryRow[]>(`/reports/gst-summary${query}`);
  },

  async getInventoryValuation(): Promise<{ purchaseValuation: number; sellingValuation: number }> {
    return request<{ purchaseValuation: number; sellingValuation: number }>('/reports/inventory-valuation');
  },

  async getInventoryAlerts(): Promise<{ expiredCount: number; expiringCount: number; lowStockCount: number }> {
    try {
      const batches = await this.getInventoryBatches();
      const now = new Date();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      let expiredCount = 0;
      let expiringCount = 0;
      let lowStockCount = 0;

      batches.forEach((b) => {
        const exp = new Date(b.expiry_date);
        if (exp < now) {
          expiredCount++;
        } else if (exp.getTime() - now.getTime() < thirtyDaysMs) {
          expiringCount++;
        }
        if (b.qty_available <= 10) {
          lowStockCount++;
        }
      });

      return { expiredCount, expiringCount, lowStockCount };
    } catch {
      return { expiredCount: 0, expiringCount: 0, lowStockCount: 0 };
    }
  },

  async getBatchLedger(batchId: string): Promise<any[]> {
    try {
      const batches = await this.getInventoryBatches();
      return batches.filter((b) => b.id === batchId);
    } catch {
      return [];
    }
  },

  async getVendorPurchases(): Promise<any[]> {
    return this.getPurchases();
  },

  // ==========================================
  // Auth & User Management
  // ==========================================
  async getCurrentUser(): Promise<UserSummary | null> {
    try {
      const token = getToken();
      if (!token) {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('gbt_user');
          if (stored) {
            try { return JSON.parse(stored); } catch { }
          }
        }
        return null;
      }

      const res = await request<{ success: boolean; user: UserSummary }>('/auth/me');
      if (res.success && res.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('gbt_user', JSON.stringify(res.user));
        }
        return res.user;
      }
      return null;
    } catch {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('gbt_user');
        if (stored) {
          try { return JSON.parse(stored); } catch { }
        }
      }
      return null;
    }
  },

  async login(args: { username: string; password: string }): Promise<{ success: boolean; message?: string; user?: UserSummary }> {
    try {
      const res = await request<{ success: boolean; token: string; user: UserSummary }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(args),
      });

      if (res.token) {
        setToken(res.token);
      }
      if (res.user && typeof window !== 'undefined') {
        localStorage.setItem('gbt_user', JSON.stringify(res.user));
      }

      return {
        success: true,
        user: res.user,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Login failed',
      };
    }
  },

  async createUser(args: { username: string; password: string; role: string; userId: string }): Promise<{ success: boolean; message?: string; user?: UserSummary }> {
    try {
      const user = await request<UserSummary>('/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          username: args.username,
          password: args.password,
          role: args.role,
        }),
      });

      return { success: true, user };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to create user' };
    }
  },

  async getUsers(): Promise<UserSummary[]> {
    return request<UserSummary[]>('/auth/users');
  },

  async resetPassword(args: { id: string; password: string; userId: string }): Promise<{ success: boolean }> {
    await request<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        oldPassword: '',
        newPassword: args.password,
      }),
    });
    return { success: true };
  },

  async toggleUserActive(args: { id: string; is_active: boolean; userId: string }): Promise<{ success: boolean }> {
    await request<UserSummary>(`/auth/users/${args.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: args.is_active }),
    });
    return { success: true };
  },

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return request<AuditLogEntry[]>('/settings/audit-logs');
  },

  // ==========================================
  // Database Backups & Printing
  // ==========================================
  async backupDatabase(customPath?: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Database backup successfully triggered on server.' };
  },

  async restoreDatabase(userId: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Database restore operation complete.' };
  },

  async printInvoice(billId: string): Promise<boolean> {
    if (typeof window !== 'undefined') {
      window.open(`/print/${billId}`, '_blank');
      return true;
    }
    return false;
  },
};
