import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Edit2, Trash2, Layers, Search, X } from 'lucide-react'
import { useServicesStore } from '../store'
import { useAuthStore } from '../../auth/store'
import { Service } from '../../../types'

export default function Services() {
  const services = useServicesStore((state) => state.services)
  const loading = useServicesStore((state) => state.loading)
  const fetchServices = useServicesStore((state) => state.fetchServices)
  const createService = useServicesStore((state) => state.createService)
  const updateService = useServicesStore((state) => state.updateService)
  const deleteService = useServicesStore((state) => state.deleteService)

  const currentUser = useAuthStore((state) => state.user)

  const [searchQuery, setSearchQuery] = useState('')

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', price: '', category: '' })
  const [editFormData, setEditFormData] = useState({ id: '', name: '', price: '', category: '' })

  useEffect(() => {
    fetchServices()
  }, [])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.price) {
      alert('Name and Price are required.')
      return
    }

    try {
      await createService({
        data: {
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category
        },
        userId: currentUser?.id || ''
      })
      setShowAddModal(false)
      setFormData({ name: '', price: '', category: '' })
      fetchServices()
    } catch (e: any) {
      console.error('Failed to create service:', e)
      alert(e.message || 'Error creating service. (Ensure the name is unique)')
    }
  }

  const openEdit = (service: Service) => {
    setEditFormData({
      id: service.id,
      name: service.name,
      price: service.price.toString(),
      category: service.category || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editFormData.name.trim() || !editFormData.price) {
      alert('Name and Price are required.')
      return
    }

    try {
      await updateService({
        id: editFormData.id,
        data: {
          name: editFormData.name,
          price: parseFloat(editFormData.price),
          category: editFormData.category
        },
        userId: currentUser?.id || ''
      })
      setShowEditModal(false)
      fetchServices()
    } catch (e: any) {
      console.error('Failed to update service:', e)
      alert(e.message || 'Error updating service.')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the price list?`)) {
      return
    }

    try {
      await deleteService({ id, userId: currentUser?.id || '' })
      fetchServices()
    } catch (e: any) {
      console.error('Failed to delete service:', e)
      alert(e.message || 'Error deleting service.')
    }
  }

  const filteredServices = useMemo(() => {
    const query = searchQuery.toLowerCase()
    if (!query) return services
    return services.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.category && s.category.toLowerCase().includes(query))
    )
  }, [services, searchQuery])

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* TOP CONTROLLER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search price list by item name..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
          />
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service / Procedure
        </button>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading && filteredServices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading price list...</div>
        ) : filteredServices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No services configured yet. Add items to configure your price list.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold">
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Service / Item Name</th>
                <th className="px-6 py-4 text-right">Standard Price</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-slate-50/40 transition">
                  <td className="px-6 py-4">
                    {service.category ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">
                        {service.category}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Uncategorized</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{service.name}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 font-mono">
                    ₹{(service?.price ?? service?.default_price ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-center space-x-1.5">
                    <button
                      onClick={() => openEdit(service)}
                      title="Edit Service"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition inline-flex items-center cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id, service.name)}
                      title="Delete Service"
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition inline-flex items-center cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: ADD SERVICE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center">
                <Layers className="h-5 w-5 text-teal-600 mr-2" /> Add Price List Item
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-500 p-1 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Service / Procedure Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dental Scaling, Consultation"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Category (optional)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Consultations, Laboratory, Dental"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition shadow-sm cursor-pointer"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SERVICE */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center">
                <Layers className="h-5 w-5 text-teal-600 mr-2" /> Edit Price List Item
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-500 p-1 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Service / Procedure Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Category (optional)
                </label>
                <input
                  type="text"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 font-medium text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-655 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition shadow-sm cursor-pointer"
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
