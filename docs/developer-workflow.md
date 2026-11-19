# Developer Workflow — Sumit Solanki

## Setup Summary

| What | Where |
|---|---|
| Developer branch | `sumit-developer` (branched from `staging`) |
| Live dev URL | https://development.ezyourlife.com |
| Staging | https://staging branch → PR to `staging` |
| Production | https://ezyourlife.com ← only Vijay merges `staging → main` |

---

## How Sumit Works

### 1. Daily development
```bash
git checkout sumit-developer
git pull origin sumit-developer
# make changes
git add .
git commit -m "feat: description"
git push origin sumit-developer
```
Every push to `sumit-developer` auto-deploys to **development.ezyourlife.com** within ~30 seconds.

### 2. When ready to push to staging
1. Open a PR on GitHub: `sumit-developer → staging`
2. Title it clearly, describe what changed and why
3. Tag Vijay for review

### 3. What the PR check does
- GitHub checks for merge conflicts with current `staging`
- Vijay reviews the diff — no code that breaks existing features
- Vijay approves and merges

### 4. Staging → Production (Vijay only)
Only Vijay can open and merge `staging → main`. Sumit has **no write access to `main`**.

---

## Database Access (Supabase)

Sumit needs to be invited to the Supabase project.

**Vijay action needed:**
1. Go to https://supabase.com/dashboard/project/cmwnjexfpcfpoeyemxhb/settings/team
2. Invite `sumitsolanki.dev@gmail.com`
3. Set role: **Developer** (can create tables, run migrations; cannot change project settings or delete the project)

New tables Sumit creates must come with a migration file in `supabase/migrations/` so the change is tracked in the PR.

---

## Branch Protection Rules (Vijay to set once)

These prevent Sumit from pushing directly to `staging` or `main`.

### Via GitHub UI
1. Go to https://github.com/werethinkers/ezmylife02/settings/branches
2. **Protect `main`**: Add rule → branch name `main` → check "Require a pull request before merging" → Required approvals: 1 → Save
3. **Protect `staging`**: Add rule → branch name `staging` → check "Require a pull request before merging" → Required approvals: 1 → Save

### Via GitHub CLI (run in Terminal)
```bash
# Protect main
gh api repos/werethinkers/ezmylife02/branches/main/protection \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  --field 'required_status_checks=null' \
  --field 'enforce_admins=false' \
  --field 'required_pull_request_reviews={"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field 'restrictions=null' \
  --field 'allow_force_pushes=false' \
  --field 'allow_deletions=false'

# Protect staging
gh api repos/werethinkers/ezmylife02/branches/staging/protection \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  --field 'required_status_checks=null' \
  --field 'enforce_admins=false' \
  --field 'required_pull_request_reviews={"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field 'restrictions=null' \
  --field 'allow_force_pushes=false' \
  --field 'allow_deletions=false'
```

---

## Inviting Sumit to GitHub

```bash
gh api repos/werethinkers/ezmylife02/collaborators/sumitsolanki-dev \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  --field permission=push
```

> Replace `sumitsolanki-dev` with Sumit's actual GitHub username once you know it. He'll receive an email invitation.

---

## Flow Diagram

```
sumit-developer branch
        |
        | git push
        v
development.ezyourlife.com (auto-deploy, Vercel Preview)
        |
        | PR: sumit-developer → staging
        | (Vijay reviews + approves)
        v
staging branch
        |
        | PR: staging → main
        | (Vijay only, production release)
        v
ezyourlife.com (production)
```

---

## Environment Variables

The `sumit-developer` branch shares the same Vercel project env vars — it talks to the **same Supabase project** (`cmwnjexfpcfpoeyemxhb`). Any table Sumit creates is immediately available in production too, so migrations should be reviewed in the PR before merging.
