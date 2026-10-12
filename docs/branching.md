# Branches and merging

Many pieces of work run at once (often one Claude thread each). They all land in one branch,
`staging`, and reach `main` together through one PR. Nothing goes live until Abhijay merges
that PR and presses Publish in Lovable (see "How changes go live" in `docs/launch-plan.md`).

```
main  ◄── one PR, merged when Abhijay says go ── staging ◄── PR ── feature branch (one per piece of work)
  │                                                 ▲
  └── Lovable edits land here; the merge train ─────┘ brings them into staging after every push to main
```

## For each piece of work

1. Branch from `staging`, not `main`: `git fetch origin staging && git checkout -b <short-name> origin/staging`.
   Name it after the work (`cut-ai-cost`, `phase-3-health-apps`), not after the thread.
2. Push the branch and open a PR with **base `staging`**. Draft while working, ready when done.
   The Checks workflow runs the build and `npm run check:apps` on it.
3. Never push to another piece of work's branch. Never push to `main` directly.
4. Database SQL goes in a new file in `supabase/migrations/` with a fresh timestamp. Never edit an
   existing migration; two branches editing the same file is the one conflict nothing can avoid.

## Bringing everything together

The merge train (`scripts/merge-train.mjs`) merges `main` and then every open, ready PR into
`staging`. A branch that conflicts or breaks the build is left out and named in the output; the
rest still go in. GitHub marks each merged PR as merged.

- Runs by itself after every push to `main`, and by hand from the Actions tab ("Merge train", Run workflow).
- Locally: `node scripts/merge-train.mjs` (dry run), `--push` to push, or name branches to merge only those.

Then the one PR from `staging` into `main` carries everything. Merge it with a merge commit (not
squash), so `staging` and `main` keep a shared history and the next round merges cleanly.

## Files that would collide, and what to do instead

Every new app or page used to add lines next to each other in the same few lists, which made
branches conflict. These lists now use git's "union" merge (`.gitattributes`), which keeps the
lines from both sides:

| Adding | Put the content in | Add one line each to (union-merged) |
|---|---|---|
| A vertical of apps | its own file in `src/apps/defs/`, `src/apps/prices/`, `supabase/functions/_shared/appSpecs/`, `src/data/catalog/` | `src/apps/defs/groups.ts`, `src/apps/prices/groups.ts`, `supabase/functions/_shared/appSpecs/groups.ts`, `src/data/catalog/index.ts` |
| A page | `src/pages/...` | `src/featureRoutes.tsx` (not `src/App.tsx`) |

Rules for union-merged files: every line must stand on its own (one import per line, one entry
per line, trailing comma), and nothing else goes in them. The build and `npm run check:apps`
catch a union that went wrong, such as the same vertical added twice.

Leave these to the release step on `staging`, not to feature branches, because every branch
would change the same line:

- The app count: `APP_COUNT_FALLBACK` in `src/lib/appCount.ts`, `index.html`, `public/llms.txt`, the MCP text.
- The progress table in `docs/launch-plan.md`.
- `src/integrations/supabase/types.ts` (Lovable regenerates it).

Edits to shared code (`src/App.tsx`, `ToolViewer`, `Home`, `_shared/llm.ts`) can still conflict.
Keep them small, and when the train skips a branch, merge `staging` into that branch, fix the
conflict there, and push; the next train takes it.
