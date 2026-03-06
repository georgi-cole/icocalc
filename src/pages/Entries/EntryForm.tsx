import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createEntry, fetchEntryById, updateEntry } from '../../services/entriesService'
import { supabase } from '../../services/supabaseClient'
import toast from 'react-hot-toast'

interface FormState {
  title: string
  body: string
}

interface FormErrors {
  title?: string
}

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!values.title.trim()) {
    errors.title = 'Title is required'
  } else if (values.title.trim().length > 255) {
    errors.title = 'Title must be 255 characters or fewer'
  }
  return errors
}

async function fetchCurrentMemberId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (error || !data) return null
  return data.id
}

export default function EntryForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [form, setForm] = useState<FormState>({ title: '', body: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [memberId, setMemberId] = useState<string>('')

  useEffect(() => {
    const init = async () => {
      setInitializing(true)

      if (isEditing && id) {
        const { data, error } = await fetchEntryById(id)
        if (error || !data) {
          toast.error('Failed to load entry')
          navigate('/entries')
          return
        }
        setForm({ title: data.title, body: data.body ?? '' })
        setMemberId(data.member_id)
      } else {
        const mId = await fetchCurrentMemberId()
        if (!mId) {
          toast.error('Unable to determine your member ID. Please sign in again.')
          navigate('/entries')
          return
        }
        setMemberId(mId)
      }

      setInitializing(false)
    }

    init()
  }, [id, isEditing, navigate])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    if (isEditing && id) {
      const { error } = await updateEntry(id, {
        title: form.title.trim(),
        body: form.body.trim() || null,
      })
      if (error) {
        toast.error('Failed to update entry')
        setLoading(false)
        return
      }
      toast.success('Entry updated')
    } else {
      const { error } = await createEntry({
        member_id: memberId,
        title: form.title.trim(),
        body: form.body.trim() || null,
      })
      if (error) {
        toast.error('Failed to create entry')
        setLoading(false)
        return
      }
      toast.success('Entry created')
    }

    navigate('/entries')
  }

  if (initializing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit entry' : 'New entry'}
      </h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="Entry title"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title}</p>
          )}
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
            Body
          </label>
          <textarea
            id="body"
            name="body"
            value={form.body}
            onChange={handleChange}
            rows={6}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Entry content (optional)"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : isEditing ? 'Save changes' : 'Create entry'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/entries')}
            className="text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
