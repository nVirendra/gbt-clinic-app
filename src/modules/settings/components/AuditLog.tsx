import React, { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, RefreshCw, Lock } from 'lucide-react'
import { useSettingsStore } from '../store'
import { AuditLogEntry } from '../../../types'
import { DataTable, ColumnDef } from '../../../components/common/DataTable'

function formatDetails(jsonStr: string | null): string {
  if (!jsonStr) return 'N/A'
  try {
    const obj = JSON.parse(jsonStr)
    return Object.entries(obj)
      .map(([key, val]) => `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
      .join(', ')
  } catch {
    return jsonStr
  }
}

export default function AuditLog() {
  const logs = useSettingsStore((state) => state.auditLogs)
  const loading = useSettingsStore((state) => state.loading)
  const fetchAuditLogs = useSettingsStore((state) => state.fetchAuditLogs)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const rows = useMemo(() => {
    return logs.map((log) => ({
      ...log,
      username: log.user?.username || 'SYSTEM',
      formattedDetails: formatDetails(log.details_json)
    }))
  }, [logs])

  const columns: ColumnDef<any>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      sortValue: (row) => new Date(row.timestamp).getTime(),
      render: (row) => (
        <span className="font-mono text-xs text-slate-600 font-semibold">
          {new Date(row.timestamp).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
          })}
        </span>
      )
    },
    {
      key: 'username',
      header: 'User',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
          {row.username}
        </span>
      )
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (row) => (
        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
          row.action.includes('DELETE') || row.action.includes('CANCEL')
            ? 'bg-red-100 text-red-800 border border-red-200'
            : row.action.includes('CREATE') || row.action.includes('ADD')
            ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
        }`}>
          {row.action}
        </span>
      )
    },
    {
      key: 'entity',
      header: 'Entity',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
          {row.entity}
        </span>
      )
    },
    {
      key: 'entity_id',
      header: 'Record ID',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {row.entity_id || 'N/A'}
        </span>
      )
    },
    {
      key: 'formattedDetails',
      header: 'Audit Trail Details',
      render: (row) => (
        <span className="text-xs text-slate-600 truncate max-w-xs block font-sans" title={row.formattedDetails}>
          {row.formattedDetails}
        </span>
      )
    }
  ]

  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (actionFilter && !r.action.toLowerCase().includes(actionFilter.toLowerCase())) return false
      if (entityFilter && !r.entity.toLowerCase().includes(entityFilter.toLowerCase())) return false
      return true
    })
  }, [rows, actionFilter, entityFilter])

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* HEADER BANNER */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" /> Immutable Security Audit Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Read-only system log tracking all user actions, logins, billing updates, and records.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
        </button>
      </div>

      {/* REUSABLE DATA TABLE WITH FILTER BAR */}
      <DataTable
        columns={columns}
        data={filteredRows}
        loading={loading}
        rowKey={(row) => row.id}
        searchPlaceholder="Search logs by user, action, entity, or details..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterFields={[
          {
            id: 'action',
            label: 'Action Type',
            type: 'select',
            options: [
              { label: 'CREATE', value: 'CREATE' },
              { label: 'UPDATE', value: 'UPDATE' },
              { label: 'DELETE', value: 'DELETE' },
              { label: 'LOGIN', value: 'LOGIN' }
            ],
            placeholder: 'All Actions'
          },
          {
            id: 'entity',
            label: 'Entity',
            type: 'select',
            options: [
              { label: 'PATIENT', value: 'PATIENT' },
              { label: 'BILL', value: 'BILL' },
              { label: 'MEDICINE', value: 'MEDICINE' },
              { label: 'PURCHASE', value: 'PURCHASE' },
              { label: 'SETTINGS', value: 'SETTINGS' }
            ],
            placeholder: 'All Entities'
          }
        ]}
        activeFilterValues={{ action: actionFilter, entity: entityFilter }}
        onFilterChange={(fId, val) => {
          if (fId === 'action') setActionFilter(val)
          if (fId === 'entity') setEntityFilter(val)
        }}
        onClearAllFilters={() => {
          setActionFilter('')
          setEntityFilter('')
        }}
        emptyMessage="No audit logs recorded"
        emptySubtext="System events will automatically appear here as operations occur."
      />
    </div>
  )
}
