import React, { useState } from 'react'
import toast from 'react-hot-toast'
import ReportFiltersPanel from '../components/ReportFilters'
import {
  fetchEntriesForReport,
  exportEntriesCSVBlob,
  summarizeByMonth,
  ReportFilters,
  MonthSummary,
} from '../services/reportService'
import { shareOrDownloadBlob } from '../utils/share'
import { Entry } from '../models'

const MAX_PREVIEW_LENGTH = 80

export default function Reports() {
  const [filters, setFilters] = useState<ReportFilters>({})
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [summary, setSummary] = useState<MonthSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleRun = async () => {
    setLoading(true)
    const { data, error } = await fetchEntriesForReport(filters)
    if (error) {
      toast.error('Failed to load report data')
    } else {
      const rows = data ?? []
      setEntries(rows)
      setSummary(summarizeByMonth(rows))
    }
    setLoading(false)
  }

  const handleExport = async () => {
    setExporting(true)
    const { blob, error } = await exportEntriesCSVBlob(filters)
    if (error || !blob) {
      toast.error('Failed to export CSV')
    } else {
      const now = new Date().toISOString().slice(0, 10)
      const filename = `entries-report-${now}.csv`
      try {
        await shareOrDownloadBlob(blob, filename)
      } catch {
        toast.error('Export cancelled or failed')
      }
    }
    setExporting(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

        {entries !== null && (
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-transform"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm mb-6">
        <ReportFiltersPanel
          filters={filters}
          onChange={setFilters}
          onApply={handleRun}
          loading={loading}
        />
      </div>

      {loading && (
        <p className="text-center text-sm text-gray-500">Loading…</p>
      )}

      {!loading && entries !== null && (
        <>
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-3">
              Summary — {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </h2>

            {summary.length === 0 ? (
              <p className="text-sm text-gray-500">No entries found for the selected period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Month</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Entries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {summary.map((row) => (
                      <tr key={row.month}>
                        <td className="px-4 py-2 text-gray-700">{row.month}</td>
                        <td className="px-4 py-2 text-right text-gray-900 font-medium">
                          {row.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {entries.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <h2 className="text-base font-semibold text-gray-800 px-4 py-3 border-b border-gray-200">
                Entries
              </h2>
              <div className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <div key={entry.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{entry.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(entry.created_at).toLocaleDateString()}
                      {entry.body ? ` — ${entry.body.slice(0, MAX_PREVIEW_LENGTH)}${entry.body.length > MAX_PREVIEW_LENGTH ? '…' : ''}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
