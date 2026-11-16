#!/usr/bin/env bash
# Deploys every Supabase edge function from this repo without Lovable credits.
# Needs SUPABASE_ACCESS_TOKEN in the environment (Supabase dashboard > Account > Access Tokens).
# Usage: scripts/deploy-functions.sh [function-name]   (no name = all functions)
set -euo pipefail
: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN first}"
cd "$(dirname "$0")/.."
npx --yes supabase@latest functions deploy ${1:-} --project-ref vrsadzjyugbusfazdgyi --use-api
