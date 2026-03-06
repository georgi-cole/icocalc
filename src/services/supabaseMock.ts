/**
 * supabaseMock.ts
 *
 * A tiny in-memory mock of the Supabase client, used when
 * REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY are not set.
 *
 * ⚠️  FOR LOCAL DEVELOPMENT / UI TESTING ONLY — not for production.
 *
 * Implements the subset of the Supabase JS client API used by this app:
 *   - auth.getUser()
 *   - from(table).select().is().eq().not().in().gte().lte().order().limit().range().single()
 *   - from(table).insert().select().single()
 *   - from(table).update().eq().select().single()
 *   - from(table).upsert().select().limit()
 *   - channel().on().subscribe() / removeChannel()
 *
 * Data is seeded with 2 members and 3 entries so the UI renders something
 * meaningful out-of-the-box.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>
type Store = { [table: string]: Row[] }

// ─── Seed data ──────────────────────────────────────────────────────────────

const MOCK_USER_ID = 'mock-user-00000000-0000-0000-0000-000000000001'
const MOCK_USER_EMAIL = 'demo@example.com'

const MEMBER_ID_1 = 'mock-member-00000000-0000-0000-0000-000000000001'
const MEMBER_ID_2 = 'mock-member-00000000-0000-0000-0000-000000000002'

const MS_PER_DAY = 86_400_000

const now = new Date().toISOString()

const store: Store = {
  members: [
    {
      id: MEMBER_ID_1,
      user_id: MOCK_USER_ID,
      role: 'admin',
      created_at: now,
      updated_at: now,
      updated_by: null,
    },
    {
      id: MEMBER_ID_2,
      user_id: 'mock-user-00000000-0000-0000-0000-000000000002',
      role: 'member',
      created_at: now,
      updated_at: now,
      updated_by: null,
    },
  ],
  entries: [
    {
      id: 'mock-entry-00000000-0000-0000-0000-000000000001',
      member_id: MEMBER_ID_1,
      title: 'Sample Entry 1',
      body: 'This is a sample entry created by the in-memory mock.',
      created_at: new Date(Date.now() - 2 * MS_PER_DAY).toISOString(),
      updated_at: new Date(Date.now() - 2 * MS_PER_DAY).toISOString(),
      updated_by: null,
      deleted_at: null,
    },
    {
      id: 'mock-entry-00000000-0000-0000-0000-000000000002',
      member_id: MEMBER_ID_1,
      title: 'Sample Entry 2',
      body: 'Another sample entry for UI testing purposes.',
      created_at: new Date(Date.now() - MS_PER_DAY).toISOString(),
      updated_at: new Date(Date.now() - MS_PER_DAY).toISOString(),
      updated_by: null,
      deleted_at: null,
    },
    {
      id: 'mock-entry-00000000-0000-0000-0000-000000000003',
      member_id: MEMBER_ID_2,
      title: 'Deleted Entry (restored)',
      body: 'This entry was soft-deleted and can be restored.',
      created_at: new Date(Date.now() - 3 * MS_PER_DAY).toISOString(),
      updated_at: new Date(Date.now() - 3 * MS_PER_DAY).toISOString(),
      updated_by: null,
      deleted_at: new Date(Date.now() - MS_PER_DAY).toISOString(),
    },
  ],
  audit_log: [],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uuid(): string {
  // Simple pseudo-UUID for seeded inserts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function cloneRows(rows: Row[]): Row[] {
  return rows.map((r) => ({ ...r }))
}

// ─── Chainable query builder ─────────────────────────────────────────────────

interface QueryResult<T = unknown> {
  data: T | null
  error: null
}

type FilterFn = (row: Row) => boolean

class MockQueryBuilder {
  private table: string
  private _filters: FilterFn[] = []
  private _orderCol: string | null = null
  private _orderAsc: boolean = true
  private _limitN: number | null = null
  private _rangeFrom: number | null = null
  private _rangeTo: number | null = null
  private _insertData: Row | Row[] | null = null
  private _updateData: Row | null = null
  private _upsertData: Row | null = null
  private _deleteOp: boolean = false
  private _returnSingle: boolean = false
  private _selectCalled: boolean = false

  constructor(table: string) {
    this.table = table
  }

  // ── Read ──

  select(_columns?: string): this {
    this._selectCalled = true
    return this
  }

  is(col: string, val: unknown): this {
    if (val === null) {
      this._filters.push((row) => row[col] === null || row[col] === undefined)
    } else {
      this._filters.push((row) => row[col] === val)
    }
    return this
  }

  eq(col: string, val: unknown): this {
    this._filters.push((row) => row[col] === val)
    return this
  }

  not(col: string, op: string, val: unknown): this {
    if (op === 'is') {
      if (val === null) {
        this._filters.push((row) => row[col] !== null && row[col] !== undefined)
      } else {
        this._filters.push((row) => row[col] !== val)
      }
    }
    return this
  }

  in(col: string, vals: unknown[]): this {
    this._filters.push((row) => vals.includes(row[col]))
    return this
  }

  gte(col: string, val: string): this {
    this._filters.push((row) => String(row[col] ?? '') >= val)
    return this
  }

  lte(col: string, val: string): this {
    this._filters.push((row) => String(row[col] ?? '') <= val)
    return this
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this._orderCol = col
    this._orderAsc = opts?.ascending !== false
    return this
  }

  limit(n: number): this {
    this._limitN = n
    return this
  }

  range(from: number, to: number): this {
    this._rangeFrom = from
    this._rangeTo = to
    return this
  }

  single(): this {
    this._returnSingle = true
    return this
  }

  // ── Write ──

  insert(data: Row | Row[]): this {
    this._insertData = data
    return this
  }

  update(data: Row): this {
    this._updateData = data
    return this
  }

  upsert(data: Row): this {
    this._upsertData = data
    return this
  }

  delete(): this {
    this._deleteOp = true
    return this
  }

  // ── Execute (thenable) ──

  then(
    resolve: (result: QueryResult) => void,
    _reject?: (err: unknown) => void,
  ): Promise<QueryResult> {
    return Promise.resolve(this._execute()).then(resolve, _reject)
  }

  // Allow await without .then() confusion by making this a proper thenable
  // (Services use `const { data, error } = await supabase.from(...).select(...)`)
  private _execute(): QueryResult {
    const tableRows: Row[] = store[this.table] ?? []

    // ── INSERT ──
    if (this._insertData !== null) {
      const toInsert = Array.isArray(this._insertData)
        ? this._insertData
        : [this._insertData]

      const inserted: Row[] = toInsert.map((row) => ({
        id: uuid(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...row,
      }))

      if (!store[this.table]) store[this.table] = []
      store[this.table].push(...inserted)

      if (this._returnSingle) {
        return { data: { ...inserted[0] }, error: null }
      }
      return { data: cloneRows(inserted), error: null }
    }

    // ── UPSERT ──
    // Matches on `id` field: updates the existing row if found, otherwise inserts.
    if (this._upsertData !== null) {
      const row = this._upsertData as Row
      const idx = store[this.table]?.findIndex((r) => r.id === row.id) ?? -1
      if (idx >= 0) {
        store[this.table][idx] = { ...store[this.table][idx], ...row, updated_at: new Date().toISOString() }
        return { data: [{ ...store[this.table][idx] }], error: null }
      } else {
        const newRow = { id: uuid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...row }
        if (!store[this.table]) store[this.table] = []
        store[this.table].push(newRow)
        return { data: [{ ...newRow }], error: null }
      }
    }

    // ── DELETE ──
    if (this._deleteOp) {
      const before = store[this.table] ?? []
      const remaining = before.filter((row) => !this._filters.every((f) => f(row)))
      store[this.table] = remaining
      return { data: null, error: null }
    }

    // ── UPDATE ──
    if (this._updateData !== null) {
      const updates = { ...this._updateData, updated_at: new Date().toISOString() }
      let updated: Row | null = null
      store[this.table] = (store[this.table] ?? []).map((row) => {
        if (this._filters.every((f) => f(row))) {
          const newRow = { ...row, ...updates }
          updated = newRow
          return newRow
        }
        return row
      })

      if (this._returnSingle) {
        return { data: updated ? { ...updated } : null, error: null }
      }
      return { data: updated ? [{ ...updated }] : [], error: null }
    }

    // ── SELECT ──
    let rows = cloneRows(store[this.table] ?? [])

    for (const f of this._filters) {
      rows = rows.filter(f)
    }

    if (this._orderCol) {
      const col = this._orderCol
      const asc = this._orderAsc
      rows.sort((a, b) => {
        const av = String(a[col] ?? '')
        const bv = String(b[col] ?? '')
        return asc ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    }

    if (this._rangeFrom !== null && this._rangeTo !== null) {
      rows = rows.slice(this._rangeFrom, this._rangeTo + 1)
    } else if (this._limitN !== null) {
      rows = rows.slice(0, this._limitN)
    }

    if (this._returnSingle) {
      return { data: rows[0] ?? null, error: null }
    }

    return { data: rows, error: null }
  }
}

// ─── No-op realtime channel ──────────────────────────────────────────────────

class MockChannel {
  on(_event: string, _filter: unknown, _callback: unknown): this {
    return this
  }

  subscribe(callback?: (status: string) => void): this {
    // Immediately report as subscribed
    if (callback) setTimeout(() => callback('SUBSCRIBED'), 0)
    return this
  }
}

// ─── Mock auth ───────────────────────────────────────────────────────────────

const mockAuth = {
  getUser: async () => ({
    data: {
      user: {
        id: MOCK_USER_ID,
        email: MOCK_USER_EMAIL,
        role: 'authenticated',
        aud: 'authenticated',
      },
    },
    error: null,
  }),
}

// ─── Mock supabase object ────────────────────────────────────────────────────

export const mockSupabase = {
  auth: mockAuth,

  from(table: string): MockQueryBuilder {
    return new MockQueryBuilder(table)
  },

  channel(_name: string): MockChannel {
    return new MockChannel()
  },

  removeChannel(_channel: unknown): Promise<void> {
    return Promise.resolve()
  },
}
