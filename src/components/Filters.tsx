import React from 'react'

export interface FiltersState {
  search: string
  showDeleted: boolean
  sortBy: 'created_at' | 'updated_at' | 'title'
  sortDir: 'asc' | 'desc'
}

interface FiltersProps {
  filters: FiltersState
  onChange: (next: FiltersState) => void
}

export default function Filters({ filters, onChange }: FiltersProps) {
  const set = <K extends keyof FiltersState>(key: K, value: FiltersState[K]) =>
    onChange({ ...filters, [key]: value })

  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      <input
        type="text"
        placeholder="Search entries…"
        value={filters.search}
        onChange={(e) => set('search', e.target.value)}
        className="flex-1 min-w-[160px] rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <select
        value={filters.sortBy}
        onChange={(e) => set('sortBy', e.target.value as FiltersState['sortBy'])}
        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="created_at">Date created</option>
        <option value="updated_at">Date updated</option>
        <option value="title">Title</option>
      </select>

      <select
        value={filters.sortDir}
        onChange={(e) => set('sortDir', e.target.value as FiltersState['sortDir'])}
        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="desc">Newest first</option>
        <option value="asc">Oldest first</option>
      </select>

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.showDeleted}
          onChange={(e) => set('showDeleted', e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Show deleted
      </label>
    </div>
  )
}
