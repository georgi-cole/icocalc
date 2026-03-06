import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

interface Entry {
  id: string
  description: string
  amount: number
  date: string
}

export default function Entries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data, error }: { data: Entry[] | null; error: { message: string } | null }) => {
        if (error) {
          setFetchError(error.message)
        } else if (data) {
          setEntries(data)
        }
      })
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    const parsedAmount = Number(amount)
    if (isNaN(parsedAmount)) {
      setSubmitError('Amount must be a valid number.')
      return
    }
    const { data, error } = await supabase
      .from('entries')
      .insert([{ description, amount: parsedAmount, date }])
      .select()
    if (error) {
      setSubmitError(error.message)
      return
    }
    if (data) setEntries((prev) => [...data, ...prev])
    setDescription('')
    setAmount('')
    setDate('')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Entries</h1>
      {fetchError && <p className="text-red-600 text-sm mb-4">{fetchError}</p>}
      <form onSubmit={handleAdd} className="space-y-3 mb-8">
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Entry
        </button>
      </form>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.id} className="border rounded p-3 flex justify-between">
            <span>{entry.description}</span>
            <span className="text-gray-600">
              {entry.date} — ${entry.amount}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
