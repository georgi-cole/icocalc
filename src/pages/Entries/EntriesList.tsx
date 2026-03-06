import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Entry } from '../../models'
import {
  fetchEntries,
  fetchDeletedEntries,
  softDeleteEntry,
  restoreEntry,
} from '../../services/entriesService'
import { subscribeToEntries } from '../../services/realtime'
import ConfirmModal from '../../components/ConfirmModal'
import Filters, { FiltersState } from '../../components/Filters'
import TimelineItem from '../../components/TimelineItem'
import ToggleView from '../../components/ToggleView'
import toast from 'react-hot-toast'

const DEFAULT_FILTERS: FiltersState = {
  search: '',
  showDeleted: false,
  sortBy: 'created_at',
  sortDir: 'desc',
}

export default function EntriesList() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'timeline' | 'table'>('timeline')
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const showDeletedRef = useRef(filters.showDeleted)

  useEffect(() => {
    showDeletedRef.current = filters.showDeleted
  }, [filters.showDeleted])

  const loadEntries = useCallback(async () => {
    setLoading(true)
    const { data, error } = filters.showDeleted
      ? await fetchDeletedEntries()
      : await fetchEntries()
    if (error) {
      toast.error('Failed to load entries')
    } else {
      setEntries(data ?? [])
    }
    setLoading(false)
  }, [filters.showDeleted])

  useEffect(() => {
    loadEntries()

    const subscription = subscribeToEntries(({ eventType, entry, oldEntry }) => {
      const showDeleted = showDeletedRef.current

      if (eventType === 'INSERT' && entry) {
        // Only prepend if the entry matches the current view (not soft-deleted)
        if (!showDeleted && !entry.deleted_at) {
          setEntries((prev) =>
            prev.some((e) => e.id === entry.id) ? prev : [entry, ...prev],
          )
        }
      } else if (eventType === 'UPDATE' && entry) {
        setEntries((prev) => {
          const exists = prev.some((e) => e.id === entry.id)
          if (showDeleted) {
            // In deleted view: upsert if entry is now deleted, remove if restored
            if (entry.deleted_at) {
              return exists
                ? prev.map((e) => (e.id === entry.id ? entry : e))
                : [entry, ...prev]
            } else {
              return prev.filter((e) => e.id !== entry.id)
            }
          } else {
            // In active view: upsert if still active, remove if soft-deleted
            if (!entry.deleted_at) {
              return exists
                ? prev.map((e) => (e.id === entry.id ? entry : e))
                : [entry, ...prev]
            } else {
              return prev.filter((e) => e.id !== entry.id)
            }
          }
        })
      } else if (eventType === 'DELETE') {
        const id = oldEntry?.id ?? entry?.id
        if (id) {
          setEntries((prev) => prev.filter((e) => e.id !== id))
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [loadEntries])

  const handleDelete = (id: string) => setConfirmId(id)

  const handleConfirmDelete = async () => {
    if (!confirmId) return
    const { data, error } = await softDeleteEntry(confirmId)
    if (error) {
      toast.error('Failed to delete entry')
    } else {
      toast.success('Entry deleted')
      const deletedAt = data?.deleted_at ?? new Date().toISOString()
      setEntries((prev) =>
        prev.map((e) =>
          e.id === confirmId ? { ...e, deleted_at: deletedAt } : e
        )
      )
    }
    setConfirmId(null)
  }

  const handleRestore = async (id: string) => {
    const { error } = await restoreEntry(id)
    if (error) {
      toast.error('Failed to restore entry')
    } else {
      toast.success('Entry restored')
      setEntries((prev) => prev.filter((e) => e.id !== id))
    }
  }

  const displayed = entries
    .filter((e) => {
      const q = filters.search.toLowerCase()
      return !q || e.title.toLowerCase().includes(q) || (e.body ?? '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const key = filters.sortBy
      const av = a[key] ?? (key === 'title' ? '' : '1970-01-01T00:00:00.000Z')
      const bv = b[key] ?? (key === 'title' ? '' : '1970-01-01T00:00:00.000Z')
      return filters.sortDir === 'asc'
        ? av < bv ? -1 : av > bv ? 1 : 0
        : av > bv ? -1 : av < bv ? 1 : 0
    })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Entries</h1>
        <div className="flex items-center gap-3">
          <ToggleView view={view} setView={setView} />
          <Link
            to="/entries/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New entry
          </Link>
        </div>
      </div>

      <Filters filters={filters} onChange={setFilters} />

      {loading ? (
        <p className="mt-8 text-center text-sm text-gray-500">Loading…</p>
      ) : displayed.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-500">No entries found.</p>
      ) : view === 'timeline' ? (
        <div className="mt-4">
          {displayed.map((entry) => (
            <TimelineItem
              key={entry.id}
              entry={entry}
              onDelete={handleDelete}
              onRestore={handleRestore}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {displayed.map((entry) => (
                <tr key={entry.id} className={entry.deleted_at ? 'opacity-60' : ''}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {entry.deleted_at ? (
                      <span className="line-through text-gray-400">{entry.title}</span>
                    ) : (
                      <Link to={`/entries/${entry.id}/edit`} className="text-blue-700 hover:underline">
                        {entry.title}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(entry.updated_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.deleted_at ? (
                      <button
                        onClick={() => handleRestore(entry.id)}
                        className="text-xs font-medium text-green-600 hover:text-green-700"
                      >
                        Restore
                      </button>
                    ) : (
                      <div className="flex justify-end gap-3">
                        <Link
                          to={`/entries/${entry.id}/edit`}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmId)}
        title="Delete entry?"
        message="This will soft-delete the entry. You can restore it later."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}
