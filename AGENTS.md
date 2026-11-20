# AGENTS.md

- Backend functions get AI only through `supabase/functions/_shared/ai.ts` (`aiFetch`, `AI`, `hasAiKey`) or `_shared/llm.ts` (`chat`, `image`); never read `GEMINI_API_KEY_*` or call Google's model endpoint directly. Why: one place rotates through the project's Gemini keys, so new apps added via GitHub work without key setup. `npm run check:apps` enforces it.
