import React from 'react'
import { UserCheck, UserPlus, Calendar, User, Search } from 'lucide-react'
import { Patient } from '../../../../types'
import PatientTypeahead from '../PatientTypeahead'

interface CustomerHeaderPanelProps {
  selectedPatient: Patient | null
  onSelectPatient: (p: Patient | null) => void
  isWalkin: boolean
  onToggleWalkin: (isWalkin: boolean) => void
  walkinName: string
  onChangeWalkinName: (name: string) => void
  billDate: string
  onChangeBillDate: (date: string) => void
  patients: Patient[]
  onOpenQuickAddPatient: () => void
}

export const CustomerHeaderPanel: React.FC<CustomerHeaderPanelProps> = ({
  selectedPatient,
  onSelectPatient,
  isWalkin,
  onToggleWalkin,
  walkinName,
  onChangeWalkinName,
  billDate,
  onChangeBillDate,
  patients,
  onOpenQuickAddPatient
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-cyan-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 1 — Customer / Patient Selection</h3>
            <p className="text-xs text-slate-500">Link patient record or process quick walk-in sale</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenQuickAddPatient}
          className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 cursor-pointer bg-cyan-50 px-3 py-1.5 rounded-xl border border-cyan-200 transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Quick Add Patient
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Patient / Walk-in Selector */}
        <div className="md:col-span-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Customer / Patient <span className="text-red-500">*</span>
            </label>

            {/* Walk-in Customer Checkbox Toggle */}
            <label className="inline-flex items-center text-xs text-cyan-700 font-bold cursor-pointer hover:text-cyan-900 transition-colors">
              <input
                type="checkbox"
                checked={isWalkin}
                onChange={(e) => {
                  onToggleWalkin(e.target.checked)
                  if (e.target.checked) onSelectPatient(null)
                }}
                className="mr-1.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              Walk-in Customer (OTC Sale)
            </label>
          </div>

          {isWalkin ? (
            <input
              type="text"
              placeholder="Enter Walk-in Customer Name e.g. Cash Sale / OTC..."
              value={walkinName}
              onChange={(e) => onChangeWalkinName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-cyan-300 bg-cyan-50/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-semibold text-slate-900"
            />
          ) : (
            <PatientTypeahead
              patients={patients}
              value={selectedPatient ? selectedPatient.id : ''}
              onChange={onSelectPatient}
              disabled={isWalkin}
            />
          )}
        </div>

        {/* Invoice Date */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Invoice Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={billDate}
            onChange={(e) => onChangeBillDate(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-semibold text-slate-800"
          />
        </div>
      </div>

      {/* SELECTED PATIENT SUMMARY CARD */}
      {selectedPatient && !isWalkin && (
        <div className="p-3 bg-cyan-50/80 border border-cyan-200/80 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 text-cyan-950 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-600 text-white rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-sm font-bold text-cyan-950 block">{selectedPatient.full_name}</strong>
              <div className="flex items-center gap-3 text-[11px] text-cyan-800 mt-0.5">
                <span>Code: <strong className="font-mono">{selectedPatient.patient_code}</strong></span>
                <span>Phone: <strong>{selectedPatient.phone}</strong></span>
                {selectedPatient.age_years && <span>Age: <strong>{selectedPatient.age_years} yrs</strong></span>}
                {selectedPatient.gender && <span>Gender: <strong>{selectedPatient.gender}</strong></span>}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectPatient(null)}
            className="text-[11px] font-bold text-cyan-800 hover:text-cyan-950 bg-white px-2.5 py-1 rounded-lg border border-cyan-200 cursor-pointer"
          >
            Change Patient
          </button>
        </div>
      )}
    </div>
  )
}
