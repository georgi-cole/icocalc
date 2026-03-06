# IcoCalc

IcoCalc is a Supabase-backed renovation ledger app built with **Vite + React + TypeScript + Tailwind CSS**.

🌐 **Live app:** https://georgi-cole.github.io/icocalc/

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Supabase](https://supabase.com/) project (free tier is sufficient) — **optional**, see *Mock mode* below

---

## Getting started locally

### Option A — Mock mode (no Supabase required)

You can run the app immediately without any Supabase credentials. In mock mode
the app uses an in-memory store pre-seeded with sample data so every page
renders and basic create / list / edit flows work.

> ⚠️ Mock-mode data is ephemeral — it is reset every time the app reloads.
> It is intended **for local UI testing only**, not for production use.

```bash
git clone https://github.com/georgi-cole/icocalc.git
cd icocalc
npm install
npm run dev     # open http://localhost:5173/icocalc/
```

No `.env.local` file is needed. The browser console will show:

```
[supabaseClient] … Running in MOCK MODE with in-memory data.
```

---

### Option B — Real Supabase project

#### 1. Clone the repository

```bash
git clone https://github.com/georgi-cole/icocalc.git
cd icocalc
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Configure environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Open `.env.local` and replace the placeholder values:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> **Where to find these values**
> 1. Log in to [supabase.com](https://supabase.com/) and open your project.
> 2. Go to **Settings → API**.
> 3. Copy the **Project URL** → `VITE_SUPABASE_URL`.
> 4. Copy the **`anon` / `public`** key → `VITE_SUPABASE_ANON_KEY`.
>
> ⚠️ Never commit your `.env.local` or any file containing real credentials.
>
> **Note:** Vite only exposes env vars prefixed with `VITE_` to browser code
> (via `import.meta.env.VITE_*`). Do **not** use `REACT_APP_*` variables.

#### 4. Start the development server

```bash
npm run dev
```

The app will be available at <http://localhost:5173/icocalc/>.

---

### 5. Build for production

```bash
npm run build
```

The production build is output to `./dist`.

### 6. Preview the production build locally

```bash
npm run preview
```

---

## Deploying to GitHub Pages

Pushes to the `main` branch automatically trigger the
`.github/workflows/deploy-to-gh-pages.yml` workflow, which builds the app and
pushes the output to the `gh-pages` branch.

The workflow publishes `./dist` (Vite's default output directory) to the
`gh-pages` branch. A `404.html` redirect file is included so SPA client-side
routing works on GitHub Pages.

### Required repository secrets

Before the workflow can run successfully, add the following secrets to the
repository (**Settings → Secrets and variables → Actions → New repository secret**):

| Secret name              | Value                              |
| ------------------------ | ---------------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL          |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase `anon` / `public` key|

> If the secrets are absent the build still succeeds (mock mode is used), but
> the deployed app will run with in-memory data only.

> The `GITHUB_TOKEN` secret is provided automatically by GitHub Actions — you
> do **not** need to add it manually.

### Enabling GitHub Pages

1. Go to **Settings → Pages** in your repository.
2. Under **Source**, select **Deploy from a branch**.
3. Choose the `gh-pages` branch and `/ (root)` folder, then click **Save**.

The live URL will be: **https://georgi-cole.github.io/icocalc/**

---

## Supabase Auth & Row Level Security notes

- The sign-in form uses `supabase.auth.signInWithPassword` (email + password).
- Your Supabase project must have **Email** authentication enabled
  (Dashboard → Authentication → Providers).
- For the `entries` table inserts to work, ensure your Supabase project has
  appropriate Row Level Security (RLS) policies allowing authenticated users to
  `SELECT` and `INSERT` rows.
- CORS is handled automatically by the Supabase JS client.

---

## Troubleshooting

### `VITE_SUPABASE_*` variables are missing

**Symptom:** The browser console shows
`[supabaseClient] … Running in MOCK MODE with in-memory data.`

This is expected when no `.env.local` is present. The app still works using
sample in-memory data (see *Mock mode* above).

**To switch to a real Supabase project:** Create `.env.local` with both
variables set (see *Option B* above).

**Fix (CI/CD):** Ensure both repository secrets are set in
**Settings → Secrets and variables → Actions** (see *Required repository secrets* above).

---

### GitHub Pages shows a 404 or blank page

| Cause | Fix |
| ----- | ---- |
| No build artifacts on `gh-pages` | Verify the workflow ran and `gh-pages` branch exists |
| Pages source not configured | Go to **Settings → Pages** and set source to `gh-pages` branch |
| App served from a sub-path | `base: '/icocalc/'` is already set in `vite.config.ts` |
| SPA routing 404 | `404.html` redirect is included in every build automatically |
