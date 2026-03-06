import React from 'react'

interface DiffViewerProps {
  oldValue?: Record<string, unknown> | null
  newValue?: Record<string, unknown> | null
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{label}</p>
      <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-800 overflow-auto max-h-64 whitespace-pre-wrap break-words">
        {value == null ? <span className="italic text-gray-400">—</span> : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}

export default function DiffViewer({ oldValue, newValue }: DiffViewerProps) {
  return (
    <div className="flex gap-4 mt-2">
      <JsonBlock label="Before" value={oldValue} />
      <JsonBlock label="After" value={newValue} />
    </div>
  )
}
