# IcoCalc

IcoCalc is a Supabase-backed calculator/entries app built with React and TypeScript.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Supabase](https://supabase.com/) project (free tier is sufficient)

---

## Getting started locally

### 1. Clone the repository

```bash
git clone https://github.com/georgi-cole/icocalc.git
cd icocalc
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Open `.env.local` and replace the placeholder values:

```
REACT_APP_SUPABASE_URL=https://<your-project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<your-anon-key>
```

> **Where to find these values**
> 1. Log in to [supabase.com](https://supabase.com/) and open your project.
> 2. Go to **Settings → API**.
> 3. Copy the **Project URL** → `REACT_APP_SUPABASE_URL`.
> 4. Copy the **`anon` / `public`** key → `REACT_APP_SUPABASE_ANON_KEY`.
>
> ⚠️ Never commit your `.env.local` or any file containing real credentials.

### 4. Start the development server

```bash
npm start
```

The app will be available at <http://localhost:3000>.

> **Note:** If `package.json` uses a different start script (e.g. `dev` for Vite projects), run `npm run dev` instead.

### 5. Build for production

```bash
npm run build
```

The production build is output to `./build` (Create React App) or `./dist` (Vite).

### 6. Preview the production build locally

```bash
npx serve -s build
```

---

## Deploying to GitHub Pages

Pushes to the `main` branch automatically trigger the
`.github/workflows/deploy-to-gh-pages.yml` workflow, which builds the app and
pushes the output to the `gh-pages` branch.

### Required repository secrets

Before the workflow can run successfully, add the following secrets to the
repository (**Settings → Secrets and variables → Actions → New repository secret**):

| Secret name                  | Value                                         |
| ---------------------------- | --------------------------------------------- |
| `REACT_APP_SUPABASE_URL`     | Your Supabase project URL                     |
| `REACT_APP_SUPABASE_ANON_KEY`| Your Supabase `anon` / `public` key           |

> The `GITHUB_TOKEN` secret is provided automatically by GitHub Actions — you
> do **not** need to add it manually.

### Enabling GitHub Pages

1. Go to **Settings → Pages** in your repository.
2. Under **Source**, select **Deploy from a branch**.
3. Choose the `gh-pages` branch and `/ (root)` folder, then click **Save**.

---

## Troubleshooting

### `REACT_APP_SUPABASE_*` variables are missing

**Symptom:** The app throws an error such as
`REACT_APP_SUPABASE_URL is not configured` and does not render.

**Fix (local):** Ensure `.env.local` exists at the repository root and contains
both variables (see step 3 above).

**Fix (CI/CD):** Ensure both repository secrets are set in
**Settings → Secrets and variables → Actions** (see *Required repository secrets* above).

---

### GitHub Pages shows a 404 or blank page

**Possible causes and fixes:**

| Cause | Fix |
| ----- | ---- |
| No build artifacts committed to `gh-pages` | Verify that the workflow ran successfully and that the `gh-pages` branch exists. |
| Pages source not configured | Go to **Settings → Pages** and set the source to the `gh-pages` branch. |
| Wrong `publish_dir` in workflow | If your project uses Vite, change `publish_dir: ./build` to `publish_dir: ./dist` in `.github/workflows/deploy-to-gh-pages.yml`. |
| App served from a sub-path | Set the `homepage` field in `package.json` (CRA) or `base` in `vite.config.ts` to the repository sub-path (e.g. `/icocalc`). |
