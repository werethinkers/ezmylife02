# Ezyourlife

Vite + React + Tailwind + shadcn, Supabase backend, synced with Lovable. Live at https://ezyourlife.com.

- **The 2,000-app launch plan, the progress table and how changes go live are in `docs/launch-plan.md`. Read it before any launch work.**
- Never message the Lovable agent or use anything that spends Lovable credits. Changes go through this repo.
- A push to `main` does not go live by itself. See "How changes go live" in the plan.
- Adding apps: one file per vertical in `src/data/catalog/`, `src/apps/defs/`, `supabase/functions/_shared/appSpecs/` and `src/apps/prices/`. Then `npm run check:apps` and `npm run gen:catalog -- <vertical>`.
- Install with `npm install --no-package-lock` (the lock file is stale; Lovable builds with bun).
- Look and wording: `docs/design.md` and `docs/instant-products.md`.
- Stop and ask before touching payment, wallet or credit-charging code, the price or name of a live app, or deleting data.
