# Supabase Migrations

This directory contains idempotent SQL migrations for the **icocalc** project.

---

## Migration files

| File | Description |
|------|-------------|
| `supabase/migrations/1_init_schema.sql` | Creates `members`, `entries`, and `audit_log` tables; installs trigger functions for `updated_at`/`updated_by` stamping and append-only audit logging; enables Row-Level Security (RLS) with member-only access policies. |

---

## Prerequisites

- A Supabase project (cloud or local via the [Supabase CLI](https://supabase.com/docs/guides/cli)).
- The `auth.users` table provided by Supabase Auth must exist before running this migration.

---

## Running migrations

### Option A – Supabase CLI (recommended)

```bash
# Install the CLI if needed
npm install -g supabase

# Log in and link your project
supabase login
supabase link --project-ref <your-project-ref>

# Apply all pending migrations
supabase db push
```

### Option B – Supabase Dashboard SQL editor

1. Open your project in the [Supabase Dashboard](https://app.supabase.com).
2. Navigate to **SQL Editor**.
3. Paste the contents of `supabase/migrations/1_init_schema.sql` and click **Run**.

### Option C – psql directly

```bash
psql "$DATABASE_URL" -f supabase/migrations/1_init_schema.sql
```

---

## Verifying the migration

After running the migration, execute the following queries to confirm everything is in place.

### 1. Tables exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('members', 'entries', 'audit_log');
```

Expected result: three rows (`members`, `entries`, `audit_log`).

### 2. Triggers exist

```sql
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

You should see `trg_members_set_updated_fields`, `trg_members_audit`, `trg_entries_set_updated_fields`, and `trg_entries_audit`.

### 3. RLS is enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('members', 'entries', 'audit_log');
```

All three tables should show `rowsecurity = true`.

### 4. Policies exist

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Testing with a real user

1. **Create a test user** via Supabase Auth (Dashboard → Authentication → Users → Invite user, or via the Auth API).

2. **Add the user to `members`:**

   ```sql
   INSERT INTO public.members (user_id, role)
   VALUES ('<user-uuid-from-auth>', 'member');
   ```

3. **Create an entry for that member:**

   ```sql
   INSERT INTO public.entries (member_id, title, body)
   VALUES (
       (SELECT id FROM public.members WHERE user_id = '<user-uuid-from-auth>'),
       'First entry',
       'Hello, world!'
   );
   ```

4. **Confirm the audit log captured the inserts:**

   ```sql
   SELECT * FROM public.audit_log ORDER BY changed_at DESC LIMIT 10;
   ```

5. **Test RLS isolation:** Authenticate as a *different* user (or use `SET LOCAL role` in a transaction) and confirm that `SELECT * FROM public.members` returns no rows for the other user's data.

---

## Schema overview

### `public.members`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key, auto-generated |
| `user_id` | `uuid` | FK → `auth.users.id`, unique |
| `role` | `text` | Default `'member'` |
| `created_at` | `timestamptz` | Set on insert |
| `updated_at` | `timestamptz` | Auto-updated by trigger |
| `updated_by` | `uuid` | FK → `auth.users.id`, auto-set by trigger |

### `public.entries`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key, auto-generated |
| `member_id` | `uuid` | FK → `public.members.id` |
| `title` | `text` | Required |
| `body` | `text` | Optional |
| `created_at` | `timestamptz` | Set on insert |
| `updated_at` | `timestamptz` | Auto-updated by trigger |
| `updated_by` | `uuid` | FK → `auth.users.id`, auto-set by trigger |

### `public.audit_log`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `bigserial` | Auto-incrementing PK |
| `table_name` | `text` | Source table name |
| `record_id` | `uuid` | PK of the affected row |
| `operation` | `text` | `INSERT`, `UPDATE`, or `DELETE` |
| `changed_by` | `uuid` | FK → `auth.users.id` |
| `changed_at` | `timestamptz` | Timestamp of the change |
| `old_data` | `jsonb` | Previous row state (UPDATE/DELETE) |
| `new_data` | `jsonb` | New row state (INSERT/UPDATE) |

---

## Row-Level Security policies

| Table | Policy | Operation | Rule |
|-------|--------|-----------|------|
| `members` | `members_select_self` | SELECT | `user_id = auth.uid()` |
| `members` | `members_insert_self` | INSERT | `user_id = auth.uid()` |
| `members` | `members_update_self` | UPDATE | `user_id = auth.uid()` |
| `members` | `members_delete_self` | DELETE | `user_id = auth.uid()` |
| `entries` | `entries_select_members` | SELECT | Owning member matches `auth.uid()` |
| `entries` | `entries_insert_members` | INSERT | Owning member matches `auth.uid()` |
| `entries` | `entries_update_members` | UPDATE | Owning member matches `auth.uid()` |
| `entries` | `entries_delete_members` | DELETE | Owning member matches `auth.uid()` |
| `audit_log` | `audit_log_select_members` | SELECT | Caller exists in `members` |
