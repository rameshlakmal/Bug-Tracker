# Defect Tracker

Internal web app to replace Excel-based defect-count tracking.

You enter per-developer defect counts (Priority / Severity / Status) and generate consistent reports and trends. Sprints are supported, but you can also do feature/module-wise reporting when sprints are not relevant.

## What This Platform Is For

- Replace the manual Excel defect-count sheet with a simple workflow
- Track counts per Project and Developer, optionally grouped by Sprint
- Support Feature/Module-wise reporting (e.g. Login, Payments, Reports)
- Generate a "report page" that matches the usual spreadsheet tables
- See sprint-wise totals and charts in Trends

Note: sprint total is computed as the sum of all PRIORITY counts for that sprint.

## Key Features

- Entry: enter counts for Priority / Severity / Status + Suggestions
- Feature/module support: optional "Feature / Module" field; filter reports by feature, or view "by feature" totals
- Admin: manage Projects, Sprints, Developers; assign developers to projects
- Report: tables with themed, level-colored headers and feature filters
- Trends: chart + totals table

## Tech Stack

- UI: React + Vite + Tailwind
- API: Express (TypeScript)
- DB: SQLite via Prisma

## Run Locally

Prereqs: Node.js (LTS recommended)

1) Start the API

```bash
cd server
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

API runs at `http://localhost:3001`.

2) Start the UI

```bash
cd client
npm install
npm run dev
```

UI runs at `http://localhost:5173`.

If the UI looks unstyled after dependency changes, restart Vite with:

```bash
cd client
npm run dev:clean
```

## First-Time Setup

1) Go to `Admin`
2) Add Developers
3) Create/verify Projects and assign developers to projects
4) (Optional) Add Sprints
5) Go to `Entry` and enter counts

Tip: If you don't use sprints for a project, keep using the project's "Default" sprint and use Feature/Module for grouping.

## Hosting (Free Platforms)

This is a split app (UI + API). The main decision is where the database lives.

The UI calls the API at the same origin under `/api/...` (dev uses a Vite proxy). In production, you should either:

- deploy UI + API behind a single domain (recommended), or
- configure your static host to proxy/rewrite `/api/*` to the API service.

### Option A (Simplest): Keep SQLite

- Host API on Render (free web service)
- Host UI on Vercel or Netlify

Important: SQLite must be persisted. If your hosting provider uses ephemeral disks, your data resets on redeploy/restart.

Recommended settings:

- API env:
  - `CLIENT_ORIGIN` = your deployed UI origin
  - `DATABASE_URL` = `file:./dev.db` (or a mounted persistent path if supported)

Example Netlify proxy (create `netlify.toml` in `client/`):

```toml
[[redirects]]
  from = "/api/*"
  to = "https://YOUR_API_HOST/:splat"
  status = 200
  force = true
```

Example Vercel proxy (create `vercel.json` in `client/`):

```json
{
  "rewrites": [{ "source": "/api/(.*)", "destination": "https://YOUR_API_HOST/api/$1" }]
}
```

### Option B (More Reliable): Use Free Postgres

- DB: Neon or Supabase (free Postgres)
- API: Render / Fly.io
- UI: Vercel / Netlify

This avoids SQLite persistence issues and is the most reliable "free" deployment.

Prisma tip (recommended):

- Use the Supabase pooler URL for `DATABASE_URL` in production.
- Keep the Supabase direct URL in `DIRECT_URL` for migrations.
- Locally, you can use the direct URL for both `DATABASE_URL` and `DIRECT_URL`.

## Troubleshooting

- Prisma generate on Windows can fail with `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`.
  - Stop any running server processes using Prisma, then rerun: `npm --prefix server run prisma:generate`
