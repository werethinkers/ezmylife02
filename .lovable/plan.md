# Give every app the AI key, with one shared helper for new apps

## What's wrong
The AI key (LOVABLE_API_KEY) and your 5 Gemini keys are saved. Three apps (ai-app, flagship-app, bulk-run) use the shared helper, which tries the Lovable key first and then your Gemini keys. Eleven others call the Lovable key directly, so when it fails (out of credits, rate limit, key not registered) they fail too. These are content-generator, notebook-ai, personalized-tools, promptmaster-ai, scan-business-card, smart-assistant, startup-analyser, tools-chat, video-generator, bulk-tool-media and generate-promo-page.

## Fix
1. Check the key works. If the AI service says it isn't registered, issue a new one (rotate once) and redeploy.
2. Add one shared helper, `_shared/ai.ts`, with:
   - `AI` constants: the gateway address, the default text model, the default image model.
   - `getAiKey()`: returns the Lovable key, or throws a clear error if it's missing.
   - `aiFetch(body)`: sends the request to the Lovable gateway and falls back to your Gemini keys 1..10 on 402, 429 or 401/403. This reuses the existing logic in `llm.ts`.
   - Matching image support, so the image apps get the same fallback.
3. Switch all 11 direct-calling apps to `aiFetch`. Their prompts, prices and billing stay the same.
4. Document the rule in AGENTS.md and the docs: a new app added through GitHub must import `aiFetch` / `chat` from `_shared/ai.ts` and must never read the key itself. Add a check in `npm run check:apps` that fails when a function calls the gateway directly.
5. Redeploy the 11 apps and send one test request to each through the backend. Confirm each returns a result and check the logs.

## Not changing
Screens, prices, billing and payment code.
