import React from 'react'
import { ReportFilters } from '../services/reportService'

interface ReportFiltersProps {
  filters: ReportFilters
  onChange: (next: ReportFilters) => void
  onApply: () => void
  loading: boolean
}

export default function ReportFiltersPanel({
  filters,
  onChange,
  onApply,
  loading,
}: ReportFiltersProps) {
  const set = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) =>
    onChange({ ...filters, [key]: value })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          From
        </label>
        <input
          type="date"
          value={filters.from ?? ''}
          onChange={(e) => set('from', e.target.value || undefined)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          To
        </label>
        <input
          type="date"
          value={filters.to ?? ''}
          onChange={(e) => set('to', e.target.value || undefined)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="button"
        onClick={onApply}
        disabled={loading}
        className="w-full sm:w-auto rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-transform"
      >
        {loading ? 'Loading…' : 'Run report'}
      </button>
    </div>
  )
}
