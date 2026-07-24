import React, { useState, useEffect } from 'react'
import { 
  Search, 
  UserPlus, 
  Edit2, 
  Trash2,
  Phone, 
  MapPin, 
  User, 
  History, 
  AlertOctagon, 
  Stethoscope, 
  FileText,
  X
} from 'lucide-react'
import { usePatientsStore } from '../store'
import { useAuthStore } from '../../auth/store'

export default function Patients() {
  const patients = usePatientsStore((state) => state.patients)
  const selectedPatient = usePatientsStore((state) => state.selectedPatient)
  const loading = usePatientsStore((state) => state.loading)
  const detailLoading = usePatientsStore((state) => state.detailLoading)
  const fetchPatients = usePatientsStore((state) => state.fetchPatients)
  const selectPatient = usePatientsStore((state) => state.selectPatient)
  const createPatient = usePatientsStore((state) => state.createPatient)
  const updatePatient = usePatientsStore((state) => state.updatePatient)
  const deletePatient = usePatientsStore((state) => state.deletePatient)
  const checkDuplicate = usePatientsStore((state) => state.checkDuplicate)

  const currentUser = useAuthStore((state) => state.user)

  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    ageYears: '',
    gender: 'MALE',
    phone: '',
    address: '',
    referringDoctor: '',
    allergiesNotes: '',
    notes: ''
  })

  const [editFormData, setEditFormData] = useState({
    id: '',
    fullName: '',
    dob: '',
    ageYears: '',
    gender: 'MALE',
    phone: '',
    address: '',
    referringDoctor: '',
    allergiesNotes: '',
    notes: ''
  })

  // Load patients list on start
  useEffect(() => {
    fetchPatients()
  }, [])

  // Handle Search Input with debounce
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchPatients(searchQuery)
    }, 300)
    return () => clearTimeout(delaySearch)
  }, [searchQuery])

  // Handle Create Patient Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName || !formData.phone) {
      alert('Name and Phone number are required.')
      return
    }

    // Duplicate Check
    try {
      const dup = await checkDuplicate(formData.phone, formData.fullName)
      if (dup.duplicate) {
        const proceed = confirm(`A patient with similar name (${dup.patient?.full_name}) and same phone number exists. Do you still want to register this patient?`)
        if (!proceed) return
      }
    } catch (e) {
      console.error('Duplicate check failed:', e)
    }

    try {
      await createPatient({
        full_name: formData.fullName,
        dob: formData.dob || null,
        age_years: formData.ageYears ? parseInt(formData.ageYears) : null,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        referring_doctor: formData.referringDoctor,
        allergies_notes: formData.allergiesNotes,
        notes: formData.notes
      }, currentUser?.id || '')

      setShowAddModal(false)
      // Reset form
      setFormData({
        fullName: '',
        dob: '',
        ageYears: '',
        gender: 'MALE',
        phone: '',
        address: '',
        referringDoctor: '',
        allergiesNotes: '',
        notes: ''
      })
    } catch (e) {
      console.error('Failed to register patient:', e)
      alert('Error creating patient records')
    }
  }

  // Open Edit Modal
  const openEditModal = () => {
    if (!selectedPatient) return
    setEditFormData({
      id: selectedPatient.id,
      fullName: selectedPatient.full_name,
      dob: selectedPatient.dob ? new Date(selectedPatient.dob).toISOString().split('T')[0] : '',
      ageYears: selectedPatient.age_years ? selectedPatient.age_years.toString() : '',
      gender: selectedPatient.gender,
      phone: selectedPatient.phone,
      address: selectedPatient.address || '',
      referringDoctor: selectedPatient.referring_doctor || '',
      allergiesNotes: selectedPatient.allergies_notes || '',
      notes: selectedPatient.notes || ''
    })
    setShowEditModal(true)
  }

  // Handle Update Patient Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editFormData.fullName || !editFormData.phone) {
      alert('Name and Phone are required.')
      return
    }

    try {
      await updatePatient(editFormData.id, {
        full_name: editFormData.fullName,
        dob: editFormData.dob || null,
        age_years: editFormData.ageYears ? parseInt(editFormData.ageYears) : null,
        gender: editFormData.gender,
        phone: editFormData.phone,
        address: editFormData.address,
        referring_doctor: editFormData.referringDoctor,
        allergies_notes: editFormData.allergiesNotes,
        notes: editFormData.notes
      }, currentUser?.id || '')
      setShowEditModal(false)
    } catch (e) {
      console.error('Failed to update patient profile:', e)
      alert('Error updating patient details')
    }
  }

  // Soft Delete Patient
  const handleDeletePatient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patient record? This will soft-delete their profile.')) return
    try {
      await deletePatient(id, currentUser?.id || '')
      alert('Patient record soft-deleted')
    } catch (e: any) {
      alert(e.message || 'Failed to delete patient')
    }
  }

  // Calculate stats for patient details
  const getPatientStats = () => {
    if (!selectedPatient?.bills) return { totalBilled: 0, outstanding: 0 }
    let totalBilled = 0
    let outstanding = 0
    selectedPatient.bills.forEach(b => {
      totalBilled += b.grand_total
      outstanding += b.balance_due
    })
    return { totalBilled, outstanding }
  }

  const { totalBilled, outstanding } = getPatientStats()

  return (
    <div className="h-full flex gap-8">
      
      {/* LEFT COLUMN: List & Search */}
      <div className="w-1/3 min-w-[320px] bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50 flex-shrink-0">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Code, Phone..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 rounded-xl text-sm transition shadow-sm cursor-pointer"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Register Patient
          </button>
        </div>

        {/* Patients Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading && patients.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading patients...</div>
          ) : patients.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No patients found.</div>
          ) : (
            patients.map((pat) => (
              <button
                key={pat.id}
                onClick={() => selectPatient(pat.id)}
                className={`w-full text-left p-4.5 transition flex items-center justify-between border-l-4 ${
                  selectedPatient?.id === pat.id
                    ? 'bg-teal-50/40 border-teal-500'
                    : 'border-transparent hover:bg-slate-50/50'
                }`}
              >
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-900 truncate">{pat.full_name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{pat.patient_code}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{pat.gender}, {pat.age_years || (pat.dob ? (new Date().getFullYear() - new Date(pat.dob).getFullYear()) : 'N/A')} yrs</p>
                  <p className="mt-0.5 font-mono">{pat.phone}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Details Pane */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
        {detailLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : selectedPatient ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Detail Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between flex-shrink-0 bg-slate-50/20">
              <div className="flex space-x-4">
                <div className="h-16 w-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xl uppercase">
                  {selectedPatient.full_name.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h2 className="text-xl font-bold text-slate-900">{selectedPatient.full_name}</h2>
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {selectedPatient.patient_code}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-slate-500 mt-1">
                    <span>{selectedPatient.gender}, {selectedPatient.age_years || (selectedPatient.dob ? (new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()) : 'N/A')} years</span>
                    <span>•</span>
                    <span className="flex items-center font-mono">
                      <Phone className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      {selectedPatient.phone}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={openEditModal}
                  className="flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition cursor-pointer"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDeletePatient(selectedPatient.id)}
                    className="flex items-center bg-red-50 hover:bg-red-100 text-red-600 font-medium px-4 py-2 rounded-xl text-sm transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Record
                  </button>
                )}
              </div>
            </div>

            {/* Detail Panels (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 uppercase">Total Invoiced Amount</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">₹{totalBilled.toFixed(2)}</p>
                </div>
                <div className={`border p-4 rounded-xl ${outstanding > 0 ? 'bg-red-50/50 border-red-200' : 'bg-green-50/50 border-green-200'}`}>
                  <p className="text-xs font-bold text-slate-500 uppercase">Outstanding Dues</p>
                  <p className={`text-xl font-bold mt-1 ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{outstanding.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Profile Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Info Block */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <User className="h-4 w-4 mr-1.5" /> Clinical & General Info
                  </h3>
                  
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3 text-sm">
                    {selectedPatient.address && (
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-slate-400 mr-2.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400">Address</p>
                          <p className="text-slate-700 mt-0.5">{selectedPatient.address}</p>
                        </div>
                      </div>
                    )}
                    {selectedPatient.referring_doctor && (
                      <div className="flex items-start">
                        <Stethoscope className="h-4 w-4 text-slate-400 mr-2.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400">Referring Doctor</p>
                          <p className="text-slate-700 mt-0.5">{selectedPatient.referring_doctor}</p>
                        </div>
                      </div>
                    )}
                    {selectedPatient.notes && (
                      <div className="flex items-start">
                        <FileText className="h-4 w-4 text-slate-400 mr-2.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400">General Notes</p>
                          <p className="text-slate-700 mt-0.5">{selectedPatient.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Allergies & Alerts Block */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <AlertOctagon className="h-4 w-4 mr-1.5" /> Medical Allergies & Alerts
                  </h3>
                  
                  <div className={`p-4 rounded-xl border min-h-[110px] flex flex-col justify-center ${
                    selectedPatient.allergies_notes 
                      ? 'bg-red-50/30 border-red-200 text-red-800' 
                      : 'bg-slate-50/50 border-slate-100 text-slate-500'
                  }`}>
                    {selectedPatient.allergies_notes ? (
                      <div className="flex items-start">
                        <AlertOctagon className="h-5 w-5 text-red-500 mr-2.5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold uppercase text-red-500 tracking-wider">Allergies Warning</p>
                          <p className="text-sm font-semibold text-red-900 mt-0.5">{selectedPatient.allergies_notes}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-sm py-4">No known allergies logged.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Patient Visit & Bill History */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <History className="h-4 w-4 mr-1.5" /> Visit & Invoice History
                </h3>

                <div className="border border-slate-200/60 rounded-xl overflow-hidden">
                  {!selectedPatient.bills || selectedPatient.bills.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm bg-slate-50/30">
                      No invoices recorded for this patient yet.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Invoice Number</th>
                          <th className="px-6 py-3 text-right">Grand Total</th>
                          <th className="px-6 py-3 text-right">Balance Due</th>
                          <th className="px-6 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {selectedPatient.bills.map((bill) => (
                          <tr key={bill.id} className="hover:bg-slate-50/40 transition">
                            <td className="px-6 py-4">
                              {new Date(bill.bill_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="px-6 py-4 font-mono font-medium text-slate-900">{bill.bill_no}</td>
                            <td className="px-6 py-4 text-right font-semibold">₹{bill.grand_total.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-semibold">
                              {bill.balance_due > 0 ? (
                                <span className="text-red-500">₹{bill.balance_due.toFixed(2)}</span>
                              ) : (
                                <span className="text-green-500">₹0.00</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                                bill.status === 'CANCELLED'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : bill.status === 'DRAFT'
                                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                  : bill.balance_due === 0
                                  ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {bill.status === 'FINALIZED' && bill.balance_due > 0 && bill.amount_paid > 0 ? 'PARTIAL' : bill.status === 'FINALIZED' && bill.balance_due === 0 ? 'PAID' : bill.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm">
            Select a patient or click "Register Patient" to add a new record.
          </div>
        )}
      </div>

      {/* MODAL: Add Patient */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <h3 className="font-bold text-slate-800 text-lg flex items-center">
                <UserPlus className="h-5 w-5 text-teal-600 mr-2" /> Register New Patient
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-500 p-1 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="Enter patient full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="Enter 10-digit number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={formData.ageYears}
                    onChange={(e) => setFormData({ ...formData, ageYears: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="or enter age"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                  placeholder="Enter full postal address"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Referring Doctor (if any)
                  </label>
                  <input
                    type="text"
                    value={formData.referringDoctor}
                    onChange={(e) => setFormData({ ...formData, referringDoctor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="Dr. Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 text-red-500">
                  Known Allergies
                </label>
                <input
                  type="text"
                  value={formData.allergiesNotes}
                  onChange={(e) => setFormData({ ...formData, allergiesNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-red-50/10 placeholder-red-300"
                  placeholder="e.g. Penicillin, Peanuts (leave blank if none)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  General Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                  placeholder="Clinical history, comments, or general instructions..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition shadow-sm cursor-pointer"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Patient */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <h3 className="font-bold text-slate-800 text-lg flex items-center">
                <Edit2 className="h-5 w-5 text-teal-600 mr-2" /> Edit Patient Profile
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-500 p-1 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editFormData.dob}
                    onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={editFormData.ageYears}
                    onChange={(e) => setEditFormData({ ...editFormData, ageYears: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Gender *
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Referring Doctor
                  </label>
                  <input
                    type="text"
                    value={editFormData.referringDoctor}
                    onChange={(e) => setEditFormData({ ...editFormData, referringDoctor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 text-red-500">
                  Known Allergies
                </label>
                <input
                  type="text"
                  value={editFormData.allergiesNotes}
                  onChange={(e) => setEditFormData({ ...editFormData, allergiesNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-red-50/10 text-red-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  General Notes
                </label>
                <textarea
                  rows={3}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 font-medium text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-655 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
