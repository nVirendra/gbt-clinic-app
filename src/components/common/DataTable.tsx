import React, { useState, useMemo } from 'react'
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Inbox, 
  FilterX,
  Plus
} from 'lucide-react'
import { FilterBar, FilterFieldDef, fuzzyMatchTokens } from './FilterBar'

export interface ColumnDef<T> {
  key: string
  header: React.ReactNode
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
  render?: (row: T, index: number) => React.ReactNode
  sortValue?: (row: T) => string | number
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  rowKey?: (row: T, index: number) => string
  searchPlaceholder?: string
  searchQuery?: string
  onSearchChange?: (query: string) => void
  searchFilterKeys?: Array<keyof T | string>
  filterFields?: FilterFieldDef[]
  activeFilterValues?: Record<string, any>
  onFilterChange?: (filterId: string, value: any) => void
  onClearAllFilters?: () => void
  datePreset?: string
  onDatePresetChange?: (preset: string, startDate?: string, endDate?: string) => void
  customFilters?: React.ReactNode
  emptyMessage?: string
  emptySubtext?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  onRowClick?: (row: T) => void
  highlightedRowId?: string
  defaultSortColumn?: string
  defaultSortDirection?: 'asc' | 'desc'
  initialPageSize?: number
  actionsHeader?: string
  toolbarActions?: React.ReactNode
  hideFilterBar?: boolean
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  rowKey,
  searchPlaceholder = 'Search records...',
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  searchFilterKeys,
  filterFields = [],
  activeFilterValues = {},
  onFilterChange,
  onClearAllFilters,
  datePreset,
  onDatePresetChange,
  customFilters,
  emptyMessage = 'No records found',
  emptySubtext = 'Get started by creating your first entry.',
  emptyActionLabel,
  onEmptyAction,
  onRowClick,
  highlightedRowId,
  defaultSortColumn,
  defaultSortDirection = 'asc',
  initialPageSize = 10,
  toolbarActions,
  hideFilterBar = false
}: DataTableProps<T>) {
  // Local state if external search state isn't passed
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery
  const setSearchQuery = externalOnSearchChange || setLocalSearchQuery

  // Sorting State
  const [sortColumn, setSortColumn] = useState<string | null>(defaultSortColumn || null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  // Handle Sort Click
  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      if (sortDirection === 'asc') setSortDirection('desc')
      else {
        setSortColumn(null)
        setSortDirection('asc')
      }
    } else {
      setSortColumn(colKey)
      setSortDirection('asc')
    }
  }

  // Filtered & Sorted Data computation with Fuzzy Token Search
  const filteredData = useMemo(() => {
    let result = [...data]

    // Search query filter with fuzzy multi-token matching
    const query = searchQuery.trim()
    if (query) {
      result = result.filter((row) => {
        if (searchFilterKeys && searchFilterKeys.length > 0) {
          const combinedStr = searchFilterKeys
            .map((key) => row[key as string])
            .filter((v) => v !== undefined && v !== null)
            .join(' ')
          return fuzzyMatchTokens(combinedStr, query)
        }
        // Default search across all object string/number values
        const combinedStr = Object.values(row)
          .filter((val) => val !== undefined && val !== null && typeof val !== 'object')
          .join(' ')
        return fuzzyMatchTokens(combinedStr, query)
      })
    }

    // Sort evaluation
    if (sortColumn) {
      const colDef = columns.find((c) => c.key === sortColumn)
      result.sort((a, b) => {
        let valA = colDef?.sortValue ? colDef.sortValue(a) : a[sortColumn]
        let valB = colDef?.sortValue ? colDef.sortValue(b) : b[sortColumn]

        if (valA === undefined || valA === null) valA = ''
        if (valB === undefined || valB === null) valB = ''

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA
        }

        const strA = String(valA).toLowerCase()
        const strB = String(valB).toLowerCase()
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
      })
    }

    return result
  }, [data, searchQuery, searchFilterKeys, sortColumn, sortDirection, columns])

  // Pagination calculation
  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const validCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (validCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const pageData = filteredData.slice(startIndex, endIndex)

  const isFiltered = Boolean(searchQuery.trim()) || Object.values(activeFilterValues).some(Boolean)

  return (
    <div className="space-y-4 font-sans text-slate-800">
      
      {/* UNIFIED FILTER BAR */}
      {!hideFilterBar && (
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q)
            setCurrentPage(1)
          }}
          searchPlaceholder={searchPlaceholder}
          filterFields={filterFields}
          activeFilterValues={activeFilterValues}
          onFilterChange={(fId, val) => {
            if (onFilterChange) onFilterChange(fId, val)
            setCurrentPage(1)
          }}
          onClearAllFilters={onClearAllFilters}
          resultCount={filteredData.length}
          totalCount={data.length}
          loading={loading}
          datePreset={datePreset}
          onDatePresetChange={(p, s, e) => {
            if (onDatePresetChange) onDatePresetChange(p, s, e)
            setCurrentPage(1)
          }}
          customToolbarActions={
            <>
              {customFilters}
              {toolbarActions}
            </>
          }
        />
      )}

      {/* MAIN TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#0B132B] border-b border-[#162244] text-cyan-500 font-black uppercase text-[11px] tracking-wider sticky top-0 z-10">
                {columns.map((col) => {
                  const isSorted = sortColumn === col.key
                  const alignClass = 
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'

                  return (
                    <th
                      key={col.key}
                      style={{ width: col.width }}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`px-5 py-3.5 transition-colors ${alignClass} ${
                        col.sortable ? 'cursor-pointer hover:text-white select-none' : ''
                      }`}
                    >
                      <div className={`inline-flex items-center gap-1.5 ${alignClass === 'text-right' ? 'justify-end' : alignClass === 'text-center' ? 'justify-center' : 'justify-start'}`}>
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-cyan-500/80">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-cyan-500 font-bold" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-cyan-500 font-bold" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-[#0B132B] text-sm">
              
              {/* SKELETON LOADING STATE */}
              {loading ? (
                [...Array(pageSize > 5 ? 5 : pageSize)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className="px-5 py-4">
                        <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageData.length > 0 ? (
                pageData.map((row, rIdx) => {
                  const rKey = rowKey ? rowKey(row, rIdx) : row.id || `row-${rIdx}`
                  const isHighlighted = highlightedRowId === rKey

                  return (
                    <tr
                      key={rKey}
                      onClick={() => onRowClick && onRowClick(row)}
                      className={`transition-colors ${
                        onRowClick ? 'cursor-pointer' : ''
                      } ${
                        isHighlighted 
                          ? 'bg-cyan-500/10 font-bold border-l-4 border-l-cyan-500' 
                          : 'hover:bg-[#F4F5F7]'
                      }`}
                    >
                      {columns.map((col) => {
                        const alignClass = 
                          col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'

                        return (
                          <td key={col.key} className={`px-5 py-3.5 ${alignClass}`}>
                            {col.render ? col.render(row, rIdx) : row[col.key] ?? '-'}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              ) : (
                /* EMPTY OR NO MATCHING FILTER STATE */
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    {isFiltered ? (
                      <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                        <FilterX className="w-10 h-10 text-slate-300" />
                        <p className="font-bold text-[#0B132B] text-sm">No matching records found</p>
                        <p className="text-xs text-slate-400">No results match your active search or filter criteria.</p>
                        <button
                          onClick={() => {
                            setSearchQuery('')
                            if (onClearAllFilters) onClearAllFilters()
                            if (onDatePresetChange) onDatePresetChange('all')
                          }}
                          className="mt-2 inline-flex items-center gap-1 px-4 py-2 bg-[#0B132B] hover:bg-[#162244] text-cyan-500 font-bold rounded-xl text-xs transition cursor-pointer shadow-xs border border-cyan-500/40"
                        >
                          <X className="w-3.5 h-3.5" /> Clear All Filters
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                        <Inbox className="w-10 h-10 text-slate-300" />
                        <p className="font-bold text-[#0B132B] text-sm">{emptyMessage}</p>
                        <p className="text-xs text-slate-400">{emptySubtext}</p>
                        {emptyActionLabel && onEmptyAction && (
                          <button
                            onClick={onEmptyAction}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B132B] hover:bg-[#162244] text-cyan-500 font-extrabold rounded-xl text-xs shadow-sm transition cursor-pointer border border-cyan-500/40"
                          >
                            <Plus className="w-4 h-4" /> {emptyActionLabel}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {!loading && totalItems > 0 && (
          <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-4">
              <span>
                Showing <strong className="text-slate-800 font-mono">{startIndex + 1}</strong> to{' '}
                <strong className="text-slate-800 font-mono">{endIndex}</strong> of{' '}
                <strong className="text-slate-800 font-mono">{totalItems}</strong> entries
              </span>

              {/* Page Size Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Page Navigation Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  disabled={validCurrentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-2 font-bold text-slate-800">
                  Page {validCurrentPage} of {totalPages}
                </span>

                <button
                  disabled={validCurrentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
