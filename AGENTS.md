# AGENTS.md

- Backend functions get AI only through `supabase/functions/_shared/ai.ts` (`aiFetch`, `AI`, `getAiKey`) or `_shared/llm.ts` (`chat`, `image`); never read `LOVABLE_API_KEY`/`GEMINI_API_KEY_*` or call the gateway URL directly. Why: one place handles the Lovable key plus the backup Gemini keys, so new apps added via GitHub work without key setup. `npm run check:apps` enforces it.
