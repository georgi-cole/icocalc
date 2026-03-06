import React from 'react'
import { Link } from 'react-router-dom'
import { Entry } from '../models'

interface TimelineItemProps {
  entry: Entry
  onDelete: (id: string) => void
  onRestore: (id: string) => void
}

export default function TimelineItem({ entry, onDelete, onRestore }: TimelineItemProps) {
  const isDeleted = Boolean(entry.deleted_at)

  return (
    <div
      className={`relative pl-6 pb-6 before:absolute before:left-1.5 before:top-2 before:h-full before:w-0.5 before:bg-gray-200 ${
        isDeleted ? 'opacity-60' : ''
      }`}
    >
      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-blue-500 bg-white" />
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {isDeleted ? (
                <span className="line-through text-gray-400">{entry.title}</span>
              ) : (
                <Link to={`/entries/${entry.id}/edit`} className="hover:underline text-blue-700">
                  {entry.title}
                </Link>
              )}
            </h3>
            {entry.body && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-3">{entry.body}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isDeleted ? (
              <button
                onClick={() => onRestore(entry.id)}
                className="text-xs font-medium text-green-600 hover:text-green-700"
              >
                Restore
              </button>
            ) : (
              <>
                <Link
                  to={`/entries/${entry.id}/edit`}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Edit
                </Link>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {new Date(entry.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
