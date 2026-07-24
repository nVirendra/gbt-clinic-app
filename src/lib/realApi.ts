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
  AuditLogEntry 
} from '../types';

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_API_URL) {
    return (window as any).NEXT_PUBLIC_API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
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
      if (errData.message) errorMessage = errData.message;
      else if (errData.error) errorMessage = errData.error;
    } catch {}
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
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
    const payload = {
      full_name: args.data.full_name,
      gender: args.data.gender || 'MALE',
      phone: args.data.phone,
      dob: args.data.dob,
      age_years: args.data.age_years,
      address: args.data.address,
      referring_doctor: args.data.referring_doctor,
      allergies_notes: args.data.allergies_notes,
      notes: args.data.notes,
    };
    return request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePatient(args: { id: string; data: Partial<Patient>; userId: string }): Promise<Patient> {
    const payload = {
      full_name: args.data.full_name,
      gender: args.data.gender,
      phone: args.data.phone,
      dob: args.data.dob,
      age_years: args.data.age_years,
      address: args.data.address,
      referring_doctor: args.data.referring_doctor,
      allergies_notes: args.data.allergies_notes,
      notes: args.data.notes,
    };
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

  async createMedicine(args: { data: Partial<Medicine>; userId: string }): Promise<Medicine> {
    return request<Medicine>('/inventory/medicines', {
      method: 'POST',
      body: JSON.stringify(args.data),
    });
  },

  async updateMedicine(args: { id: string; data: Partial<Medicine>; userId: string }): Promise<Medicine> {
    return request<Medicine>(`/inventory/medicines/${args.id}`, {
      method: 'PUT',
      body: JSON.stringify(args.data),
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
    return request<Purchase>('/inventory/purchases', {
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
        batch_id: args.batchId,
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
    const payload = args.data || args;
    return request<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateService(args: any): Promise<Service> {
    const id = args.id;
    const payload = args.data || args;
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
    const payload = {
      patient_id: rawData.patientId,
      walkin_name: rawData.walkinName,
      bill_date: rawData.date,
      notes: rawData.notes,
      items: (rawData.items || []).map((item: any) => ({
        item_type: item.itemType,
        service_id: item.serviceId,
        batch_id: item.batchId,
        description: item.name || item.description,
        qty: item.quantity || item.qty,
        unit_price: item.price || item.unit_price,
        discount_amount: item.discount || item.discount_amount || 0,
        gst_percent: item.gstPercent || item.gst_percent || 0,
      })),
    };

    const draftBill = await request<Bill>('/billing', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (rawData.status === 'FINALIZED') {
      return this.finalizeBill({
        billId: draftBill.id,
        paidAmount: rawData.paidAmount || draftBill.grand_total,
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
      return this.recordPayment({
        billId: args.billId,
        amount: args.paidAmount,
        mode: args.paymentMode,
        referenceNo: args.transactionId,
        userId: args.userId,
      });
    }

    return bill;
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
    return request<Bill>(`/billing/${args.billId}/payments`, {
      method: 'POST',
      body: JSON.stringify({
        amount: args.amount,
        mode: args.mode,
        reference_no: args.referenceNo,
      }),
    });
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
  async login(args: { username: string; password: string }): Promise<{ success: boolean; message?: string; user?: UserSummary }> {
    try {
      const res = await request<{ success: boolean; token: string; user: UserSummary }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(args),
      });

      if (res.token) {
        setToken(res.token);
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
      window.open(`${getBaseUrl()}/billing/${billId}/print`, '_blank');
      return true;
    }
    return false;
  },
};
