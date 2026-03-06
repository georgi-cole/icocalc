import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  fetchAuditLog,
  restoreFromAudit,
  AuditRow,
  AuditFilters,
} from '../services/auditService'
import DiffViewer from '../components/DiffViewer'

export default function Audit() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AuditRow | null>(null)
  const [restoring, setRestoring] = useState(false)

  const [filters, setFilters] = useState<AuditFilters>({
    tableName: '',
    actorId: '',
    recordId: '',
    from: '',
    to: '',
    limit: 50,
    offset: 0,
  })

  const load = async (f: AuditFilters) => {
    setLoading(true)
    const clean: AuditFilters = {
      ...(f.tableName ? { tableName: f.tableName } : {}),
      ...(f.actorId ? { actorId: f.actorId } : {}),
      ...(f.recordId ? { recordId: f.recordId } : {}),
      ...(f.from ? { from: f.from } : {}),
      ...(f.to ? { to: f.to } : {}),
      limit: f.limit ?? 50,
    }
    const { data, error } = await fetchAuditLog(clean)
    if (error) {
      toast.error('Failed to load audit log')
    } else {
      setRows(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    setSelected(null)
    load(filters)
  }

  const handleRestore = async () => {
    if (!selected) return
    setRestoring(true)
    const { data, error } = await restoreFromAudit(selected.record_id)
    if (error) {
      toast.error(`Restore failed: ${error.message ?? 'Unknown error'}`)
    } else if (data) {
      toast.success('Entry restored successfully (subject to RLS)')
    }
    setRestoring(false)
  }

  const selectedOld =
    selected?.payload?.old && typeof selected.payload.old === 'object'
      ? (selected.payload.old as Record<string, unknown>)
      : null

  const selectedNew =
    selected?.payload?.new && typeof selected.payload.new === 'object'
      ? (selected.payload.new as Record<string, unknown>)
      : selected?.payload && typeof selected.payload === 'object'
      ? (selected.payload as Record<string, unknown>)
      : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Log</h1>

      <form onSubmit={handleApply} className="flex flex-wrap gap-3 mb-6">
        <input
          name="tableName"
          value={filters.tableName ?? ''}
          onChange={handleFilterChange}
          placeholder="Table name"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="actorId"
          value={filters.actorId ?? ''}
          onChange={handleFilterChange}
          placeholder="Actor ID"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="recordId"
          value={filters.recordId ?? ''}
          onChange={handleFilterChange}
          placeholder="Record ID"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="from"
          type="datetime-local"
          value={filters.from ?? ''}
          onChange={handleFilterChange}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="to"
          type="datetime-local"
          value={filters.to ?? ''}
          onChange={handleFilterChange}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Apply
        </button>
      </form>

      {loading ? (
        <p className="text-center text-sm text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm text-gray-500">No audit records found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Time</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Table</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Record ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actor ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelected(selected?.id === row.id ? null : row)}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                    selected?.id === row.id ? 'bg-blue-100' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.table_name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        row.action === 'INSERT'
                          ? 'bg-green-100 text-green-700'
                          : row.action === 'UPDATE'
                          ? 'bg-yellow-100 text-yellow-700'
                          : row.action === 'DELETE'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {row.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs truncate max-w-xs">
                    {row.record_id}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs truncate max-w-xs">
                    {row.actor_id ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">
              Diff — {selected.action} on{' '}
              <span className="font-mono text-sm">{selected.table_name}</span>
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {restoring ? 'Restoring…' : 'Attempt restore'}
              </button>
              <button
                onClick={() => setSelected(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
          <DiffViewer oldValue={selectedOld} newValue={selectedNew} />
          <p className="mt-3 text-xs text-gray-400">
            Note: Client-side restore is subject to Row Level Security (RLS). If the operation
            fails, an admin server RPC may be required.
          </p>
        </div>
      )}
    </div>
  )
}
