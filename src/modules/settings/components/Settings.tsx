import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Users, 
  Database, 
  UserPlus, 
  ShieldAlert, 
  Upload, 
  Percent,
  Download,
  Key,
  X,
  Check
} from 'lucide-react'
import { useSettingsStore } from '../store'
import { useAuthStore } from '../../auth/store'
import { useServicesStore } from '../../services/store'
import { Service, UserSummary } from '../../../types'

export default function Settings() {
  const profile = useSettingsStore((state) => state.profile)
  const fetchProfile = useSettingsStore((state) => state.fetchProfile)
  const updateProfile = useSettingsStore((state) => state.updateProfile)
  const backupDatabase = useSettingsStore((state) => state.backupDatabase)
  const restoreDatabase = useSettingsStore((state) => state.restoreDatabase)
  
  const currentUser = useAuthStore((state) => state.user)
  const users = useAuthStore((state) => state.usersList)
  const fetchUsers = useAuthStore((state) => state.fetchUsers)
  const createUser = useAuthStore((state) => state.createUser)
  const toggleUserActive = useAuthStore((state) => state.toggleUserActive)
  const resetPassword = useAuthStore((state) => state.resetPassword)

  const services = useServicesStore((state) => state.services)
  const fetchServices = useServicesStore((state) => state.fetchServices)
  const createService = useServicesStore((state) => state.createService)
  const updateService = useServicesStore((state) => state.updateService)
  const deleteService = useServicesStore((state) => state.deleteService)

  // Tabs: 'profile', 'services', 'users', 'database'
  const [activeSubTab, setActiveSubTab] = useState('profile')

  // Clinic profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    defaultTaxRate: '18',
    invoicePrefix: 'INV',
    fyReset: true,
    backupDir: '',
    autoLockMinutes: '15'
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // Users management states
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'RECEPTIONIST' })
  const [userError, setUserError] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  
  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedUserToReset, setSelectedUserToReset] = useState<UserSummary | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)

  // Services price list management states
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: '',
    gstPercent: '18',
    sacCode: '',
    isActive: true
  })

  // Load profile values on mount/profile change
  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        address: profile.address || '',
        phone: profile.phone || '',
        email: profile.email || '',
        gstin: profile.gstin || '',
        defaultTaxRate: (profile.defaultTaxRate ?? 0).toString(),
        invoicePrefix: profile.invoicePrefix || 'INV',
        fyReset: profile.fyReset ?? true,
        backupDir: profile.backupDir || '',
        autoLockMinutes: (profile.autoLockMinutes ?? 15).toString()
      })
    }
  }, [profile])

  useEffect(() => {
    if (activeSubTab === 'users' && currentUser?.role === 'ADMIN') {
      fetchUsers()
    } else if (activeSubTab === 'services') {
      fetchServices()
    }
  }, [activeSubTab])

  // Save profile updates
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileForm.name.trim()) {
      alert('Clinic Name is required.')
      return
    }

    setSavingProfile(true)
    try {
      await updateProfile({
        name: profileForm.name,
        address: profileForm.address,
        phone: profileForm.phone,
        email: profileForm.email,
        gstin: profileForm.gstin,
        defaultTaxRate: parseFloat(profileForm.defaultTaxRate) || 18.0,
        invoicePrefix: profileForm.invoicePrefix || 'INV',
        fyReset: profileForm.fyReset,
        backupDir: profileForm.backupDir,
        autoLockMinutes: parseInt(profileForm.autoLockMinutes, 10) || 15
      }, currentUser?.id || '')
      alert('Settings updated successfully!')
      fetchProfile()
    } catch (e) {
      console.error('Profile update failed:', e)
      alert('Error updating settings.')
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle Add User Submit
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserError('')
    if (!userForm.username.trim() || !userForm.password.trim()) {
      setUserError('Username and password are required.')
      return
    }
    if (userForm.password.length < 6) {
      setUserError('Password must be at least 6 characters.')
      return
    }

    setCreatingUser(true)
    try {
      const res = await createUser(
        userForm.username.trim(),
        userForm.password,
        userForm.role,
        currentUser?.id || ''
      )

      if (res.success) {
        alert('User successfully registered!')
        setUserForm({ username: '', password: '', role: 'RECEPTIONIST' })
      } else {
        setUserError(res.message || 'Username already exists.')
      }
    } catch (err) {
      console.error(err)
      setUserError('Failed to create account.')
    } finally {
      setCreatingUser(false)
    }
  }

  // Toggle User Active Status (Admin only)
  const handleToggleUserActive = async (id: string, active: boolean) => {
    if (!confirm(`Are you sure you want to ${active ? 'activate' : 'deactivate'} this user?`)) return
    try {
      await toggleUserActive(id, active, currentUser?.id || '')
    } catch (e: any) {
      alert(e.message || 'Failed to toggle active status')
    }
  }

  // Reset User Password (Admin only)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserToReset || !newPassword.trim()) return
    if (newPassword.length < 6) return alert('Password must be at least 6 characters.')

    setResettingPassword(true)
    try {
      await resetPassword(selectedUserToReset.id, newPassword, currentUser?.id || '')
      alert(`Password successfully reset for ${selectedUserToReset.username}!`)
      setShowResetModal(false)
      setSelectedUserToReset(null)
      setNewPassword('')
    } catch (e: any) {
      alert(e.message || 'Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  // Backup Trigger
  const handleBackup = async () => {
    try {
      const res = await backupDatabase(profileForm.backupDir ? `${profileForm.backupDir}\\clinic-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db` : undefined)
      if (res.success) {
        alert(res.message)
      } else {
        alert('Backup Failed: ' + res.message)
      }
    } catch (err) {
      console.error(err)
      alert('Error triggering backup')
    }
  }

  // Restore Trigger
  const handleRestore = async () => {
    if (currentUser?.role !== 'ADMIN') {
      alert('Admin privileges are required to restore database.')
      return
    }
    const confirmRestore = confirm('CRITICAL WARNING: Restoring the database will replace all current invoices, patients, and inventory records. A safety backup of your current database will be created. Do you want to proceed?')
    if (!confirmRestore) return

    try {
      const res = await restoreDatabase(currentUser.id)
      if (res.success) {
        alert(res.message)
        window.location.reload() // Force restart/reload renderer to load new SQLite file
      } else {
        alert('Restore failed: ' + res.message)
      }
    } catch (err) {
      console.error(err)
      alert('Error restoring database')
    }
  }

  // SERVICES CRUD
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceForm.name.trim() || !serviceForm.price) return alert('Name and Price are required')

    try {
      const data = {
        name: serviceForm.name,
        price: parseFloat(serviceForm.price) || 0,
        gstPercent: parseFloat(serviceForm.gstPercent) || 18.0,
        sacCode: serviceForm.sacCode || null,
        isActive: serviceForm.isActive
      }

      if (editingService) {
        await updateService({ id: editingService.id, data, userId: currentUser?.id || '' })
        alert('Service updated successfully!')
      } else {
        await createService({ data, userId: currentUser?.id || '' })
        alert('Service created successfully!')
      }
      setShowServiceModal(false)
      setEditingService(null)
      setServiceForm({ name: '', price: '', gstPercent: '18', sacCode: '', isActive: true })
      fetchServices()
    } catch (err: any) {
      alert(err.message || 'Error saving service')
    }
  }

  const startEditService = (s: Service) => {
    setEditingService(s)
    const priceVal = s.price !== undefined ? s.price : s.default_price
    setServiceForm({
      name: s.name,
      price: priceVal.toString(),
      gstPercent: s.gst_percent.toString(),
      sacCode: s.sac_code || '',
      isActive: s.is_active
    })
    setShowServiceModal(true)
  }

  const handleDeactivateService = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this service? It will no longer show in price list.')) return
    try {
      await deleteService({ id, userId: currentUser?.id || '' })
      fetchServices()
    } catch (e: any) {
      alert(e.message || 'Failed to delete service')
    }
  }

  return (
    <div className="h-full flex gap-8">
      {/* Sub Tabs Navigation */}
      <div className="w-48 bg-white border border-slate-200 p-4 rounded-xl flex flex-col space-y-1.5 flex-shrink-0 self-start shadow-sm">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`w-full text-left px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'profile' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          Clinic Settings
        </button>
        <button
          onClick={() => setActiveSubTab('services')}
          className={`w-full text-left px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'services' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          Price List (Services)
        </button>
        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setActiveSubTab('users')}
            className={`w-full text-left px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'users' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            Staff Management
          </button>
        )}
        <button
          onClick={() => setActiveSubTab('database')}
          className={`w-full text-left px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'database' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          Backup & Restore
        </button>
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 bg-white border border-slate-200/80 shadow-sm p-6 rounded-2xl overflow-y-auto">
        
        {/* --- PROFILE / GENERAL SETTINGS --- */}
        {activeSubTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center">
              <Building2 className="h-5 w-5 text-teal-600 mr-2" /> Clinic Settings & Invoicing Rules
            </h3>
            
            <form onSubmit={handleProfileSubmit} className="max-w-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Clinic Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">GSTIN / Tax Code</label>
                  <input
                    type="text"
                    value={profileForm.gstin}
                    onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Address *</label>
                <textarea
                  rows={2}
                  required
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Default GST Rate (%)</label>
                  <input
                    type="number"
                    value={profileForm.defaultTaxRate}
                    onChange={(e) => setProfileForm({ ...profileForm, defaultTaxRate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono text-right bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Invoice Prefix</label>
                  <input
                    type="text"
                    value={profileForm.invoicePrefix}
                    onChange={(e) => setProfileForm({ ...profileForm, invoicePrefix: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono uppercase bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Auto-Lock Idle (Mins)</label>
                  <input
                    type="number"
                    value={profileForm.autoLockMinutes}
                    onChange={(e) => setProfileForm({ ...profileForm, autoLockMinutes: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono text-right bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Auto-Backup Directory Path</label>
                  <input
                    type="text"
                    placeholder="e.g. C:\Backups"
                    value={profileForm.backupDir}
                    onChange={(e) => setProfileForm({ ...profileForm, backupDir: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-mono"
                  />
                </div>
                <div className="flex items-center mt-6">
                  <label className="inline-flex items-center text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileForm.fyReset}
                      onChange={(e) => setProfileForm({ ...profileForm, fyReset: e.target.checked })}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 mr-2 h-4 w-4"
                    />
                    Reset Invoice sequence at Financial Year
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-semibold hover:bg-teal-600 shadow-md shadow-teal-500/10 cursor-pointer transition-all disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- SERVICES PRICE LIST TAB --- */}
        {activeSubTab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center">
                <Percent className="h-5 w-5 text-teal-600 mr-2" /> Price List (Clinic Services)
              </h3>
              <button
                onClick={() => {
                  setEditingService(null)
                  setServiceForm({ name: '', price: '', gstPercent: '18', sacCode: '', isActive: true })
                  setShowServiceModal(true)
                }}
                className="px-4 py-1.8 bg-teal-500 text-white rounded-lg text-xs font-semibold hover:bg-teal-600 shadow-md shadow-teal-500/10 cursor-pointer transition-all"
              >
                Add Service
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="px-5 py-3">Service Name</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">GST %</th>
                    <th className="px-4 py-3">SAC Code</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {services.map(s => {
                    const priceVal = s.price !== undefined ? s.price : s.default_price
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/20">
                        <td className="px-5 py-3 font-semibold text-slate-800">{s.name}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">₹{priceVal.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono">{s.gst_percent}%</td>
                        <td className="px-4 py-3 font-mono text-xs">{s.sac_code || 'N/A'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {s.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right space-x-3">
                          <button
                            onClick={() => startEditService(s)}
                            className="text-xs font-semibold text-indigo-650 hover:text-indigo-800 cursor-pointer"
                          >
                            Edit
                          </button>
                          {s.is_active && (
                            <button
                              onClick={() => handleDeactivateService(s.id)}
                              className="text-xs font-semibold text-red-500 hover:text-red-800 cursor-pointer"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {services.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">No services configured.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- STAFF MANAGEMENT TAB (Admin only) --- */}
        {activeSubTab === 'users' && currentUser?.role === 'ADMIN' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center">
              <Users className="h-5 w-5 text-teal-600 mr-2" /> Staff Accounts & Credentials
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Register User Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <UserPlus className="h-4 w-4 mr-1.5" /> Register Staff Account
                </h4>

                {userError && (
                  <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs">
                    <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 text-red-500" />
                    <span>{userError}</span>
                  </div>
                )}

                <form onSubmit={handleUserSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      placeholder="e.g. receptionist_joy"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">
                      Role / Privilege
                    </label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-white"
                    >
                      <option value="RECEPTIONIST">Receptionist (Billing/Patients/Stock)</option>
                      <option value="ADMIN">Admin (Full Access & Settings)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="bg-slate-950 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                  >
                    {creatingUser ? 'Creating...' : 'Register User'}
                  </button>
                </form>
              </div>

              {/* Right Column: Registered Users list */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Users</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-white">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="px-4 py-2.5">Username</th>
                        <th className="px-4 py-2.5">Role</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/30">
                          <td className="px-4 py-3 font-semibold text-slate-800">{u.username}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                              u.role === 'ADMIN' 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {u.is_active ? (
                              <span className="text-green-600 flex items-center"><Check className="h-3 w-3 mr-0.5" /> Active</span>
                            ) : (
                              <span className="text-slate-400 italic">Inactive</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUserToReset(u)
                                setNewPassword('')
                                setShowResetModal(true)
                              }}
                              title="Reset Password"
                              className="text-indigo-650 hover:text-indigo-850 font-semibold cursor-pointer"
                            >
                              Reset Pass
                            </button>
                            {u.id !== currentUser?.id && (
                              <button
                                onClick={() => handleToggleUserActive(u.id, !u.is_active)}
                                className={`font-semibold cursor-pointer ${
                                  u.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-750'
                                }`}
                              >
                                {u.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- DATABASE BACKUP & RESTORE TAB --- */}
        {activeSubTab === 'database' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center">
              <Database className="h-5 w-5 text-teal-600 mr-2" /> Database Backups & Administration
            </h3>

            <div className="max-w-md space-y-6">
              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/60 text-slate-600 text-sm space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center">
                  <ShieldAlert className="h-4.5 w-4.5 text-amber-500 mr-2" /> Why Backup?
                </h4>
                <p className="leading-relaxed text-xs">
                  Because this application runs **100% offline**, all patient records and invoices are saved exclusively on this computer. 
                  In case of system failure, having backups saved to an external USB or shared drive is the only way to safeguard your data.
                </p>
                <p className="leading-relaxed text-xs font-semibold text-teal-700">
                  Recommended: Perform a backup export at the end of every working day.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Backup Button */}
                <button
                  onClick={handleBackup}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl hover:bg-teal-50/10 transition group cursor-pointer"
                >
                  <Download className="h-8 w-8 text-slate-400 group-hover:text-teal-600 transition" />
                  <span className="text-sm font-bold text-slate-800 mt-2.5">Backup Database</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 text-center px-2">Export a database copy (.db)</span>
                </button>

                {/* Restore Button */}
                {currentUser?.role === 'ADMIN' ? (
                  <button
                    onClick={handleRestore}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-red-400 rounded-2xl hover:bg-red-50/10 transition group cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-slate-400 group-hover:text-red-500 transition" />
                    <span className="text-sm font-bold mt-2.5 text-red-700">Restore Database</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 text-center px-2">Import an existing backup copy</span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50 text-slate-300 opacity-60">
                    <Upload className="h-8 w-8 text-slate-300" />
                    <span className="text-sm font-bold mt-2.5">Restore Database</span>
                    <span className="text-[9px] text-center px-2">Admin privilege required</span>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>

      {/* PASSWORD RESET MODAL */}
      {showResetModal && selectedUserToReset && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-md font-bold text-slate-900 flex items-center"><Key className="h-4.5 w-4.5 text-teal-555 mr-2" /> Reset Staff Password</h3>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <p className="text-xs text-slate-500">
                You are resetting the password for staff user: <strong className="text-slate-800">{selectedUserToReset.username}</strong>
              </p>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-650 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg text-xs font-semibold hover:bg-teal-600 shadow-md shadow-teal-500/10 disabled:opacity-50"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE MODAL */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-md font-bold text-slate-900">{editingService ? 'Edit Price List Service' : 'Add New Service'}</h3>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Injection Administration"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-mono text-right bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={serviceForm.gstPercent}
                    onChange={(e) => setServiceForm({ ...serviceForm, gstPercent: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-mono text-right bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SAC Code (India Service Classification)</label>
                <input
                  type="text"
                  placeholder="e.g. 999311"
                  value={serviceForm.sacCode}
                  onChange={(e) => setServiceForm({ ...serviceForm, sacCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-mono bg-white"
                />
              </div>

              <div className="flex items-center">
                <label className="inline-flex items-center text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceForm.isActive}
                    onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 mr-2 h-4 w-4"
                  />
                  Service is active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-650 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg text-xs font-semibold hover:bg-teal-600 shadow-md shadow-teal-500/10"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
