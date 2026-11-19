# ezyourlife

**Live site:** https://ezyourlife.com

A platform with 2,000+ AI-powered tools for Indian professionals, students, and creators — built with Vite, React, Tailwind, shadcn/ui, and Supabase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS, shadcn/ui (Radix UI) |
| Backend | Supabase (Postgres + Edge Functions) |
| AI | Google Gemini (via project API keys) |
| Deployment | Vercel (production + preview branches) |
| Mobile | Capacitor (iOS shell app) |

---

## Running Locally

### Requirements

- **Node.js** v18 or higher ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- **npm** (comes with Node.js)
- A `.env` file in the project root (see below)

### Setup

```sh
# 1. Clone the repo
git clone https://github.com/werethinkers/ezmylife02.git
cd ezmylife02

# 2. Install dependencies (always use --no-package-lock)
npm install --no-package-lock

# 3. Create your .env file
cp .env.example .env   # or create it manually — see below

# 4. Start the dev server
npm run dev
# Opens at http://localhost:8080
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL="https://cmwnjexfpcfpoeyemxhb.supabase.co"
VITE_SUPABASE_PROJECT_ID="cmwnjexfpcfpoeyemxhb"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_0d1Osr0mqhLIlJHUW-nJqQ_g65tRdbr"
```

These are public keys — safe to commit for local dev.

---

## Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start local dev server at localhost:8080 |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run check:apps` | Verify all apps are correctly defined |
| `npm run gen:catalog -- <vertical>` | Generate catalog migration for a vertical |
| `npm run preview` | Preview the production build locally |

---

## Branching & Deployment

```
sumit-developer  →  development.ezyourlife.com  (auto-deploy on push)
staging          →  staging preview             (auto-deploy on push)
main             →  ezyourlife.com              (production)
```

- All changes go in via Pull Request — direct pushes to `staging` and `main` are blocked
- A push to `main` deploys automatically to production via Vercel
- See `docs/branching.md` for the full branching guide

---

## Project Structure

```
src/
  apps/          # App definitions and runtime
  data/          # Catalog, tools database, placements
  components/    # Shared UI components
  pages/         # Route-level page components
  lib/           # Utilities, SEO, auth helpers
supabase/
  functions/     # Edge Functions (AI, payments, etc.)
  migrations/    # Database migrations (apply in order)
docs/            # Internal guides and planning docs
```

---

## Adding a New App

One file per vertical in each of these locations, plus one line in each folder's index:

1. `src/data/catalog/<vertical>.ts`
2. `src/apps/defs/<vertical>.ts`
3. `supabase/functions/_shared/appSpecs/<vertical>.ts`
4. `src/apps/prices/<vertical>.ts`

Then run:

```sh
npm run check:apps
npm run gen:catalog -- <vertical>
```

See `docs/launch-plan.md` for the full app-adding checklist.
