import React, { useEffect, useMemo, useState } from 'react'
import { Search, ShieldAlert } from 'lucide-react'
import { useSettingsStore } from '../store'

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
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  // Debounce search input so filtering doesn't run on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 200)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Pre-format each log's details once per fetch, not once per render
  const rows = useMemo(() => {
    return logs.map(log => ({
      log,
      username: log.user?.username.toLowerCase() || 'system',
      action: log.action.toLowerCase(),
      entity: log.entity.toLowerCase(),
      details: log.details_json?.toLowerCase() || '',
      formattedDetails: formatDetails(log.details_json)
    }))
  }, [logs])

  // Filter logs based on debounced search query
  const filteredLogs = useMemo(() => {
    const query = debouncedQuery.toLowerCase()
    if (!query) return rows
    return rows.filter(row =>
      row.username.includes(query) ||
      row.action.includes(query) ||
      row.entity.includes(query) ||
      row.details.includes(query)
    )
  }, [rows, debouncedQuery])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by user, action, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          onClick={fetchAuditLogs}
          className="px-4 py-2 bg-slate-950 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 shadow-md transition-all cursor-pointer"
        >
          Refresh Logs
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Record ID</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-teal-500"></div>
                      <span>Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShieldAlert className="h-8 w-8 text-slate-300" />
                      <span>No audit logs found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(({ log, formattedDetails }) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs font-mono">
                      {new Date(log.at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                      {log.user?.username || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold">
                      <span className={`px-2 py-1 rounded-full ${
                        log.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        log.action.includes('UPDATE') ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        log.action.includes('DELETE') || log.action.includes('CANCEL') ? 'bg-red-50 text-red-700 border border-red-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                      {log.entity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-400 max-w-[120px] truncate" title={log.entity_id || ''}>
                      {log.entity_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs max-w-xs sm:max-w-md truncate" title={formattedDetails}>
                      {formattedDetails}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
