export interface Entry {
  id: string
  member_id: string
  title: string
  body: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
  deleted_at: string | null
}

export type EntryInsert = Pick<Entry, 'member_id' | 'title' | 'body'>
export type EntryUpdate = Partial<Pick<Entry, 'title' | 'body'>>
