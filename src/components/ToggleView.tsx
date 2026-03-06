import React from 'react'

interface ToggleViewProps {
  view: 'timeline' | 'table'
  setView: (v: 'timeline' | 'table') => void
}

export default function ToggleView({ view, setView }: ToggleViewProps) {
  return (
    <div className="inline-flex rounded-md overflow-hidden border border-gray-300">
      <button
        onClick={() => setView('timeline')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          view === 'timeline'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        Timeline
      </button>
      <button
        onClick={() => setView('table')}
        className={`px-3 py-1.5 text-sm font-medium border-l border-gray-300 transition-colors ${
          view === 'table'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        Table
      </button>
    </div>
  )
}
