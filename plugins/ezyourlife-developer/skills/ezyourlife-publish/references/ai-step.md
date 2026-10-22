# File app with an AI step

For an app whose own screens matter (cards, tables, charts, a designed flow) and which asks an AI somewhere inside: typically a Google AI Studio export with a React front end and a small Express server that calls Gemini.

The page keeps its screens. The AI call moves to EzYourLife: the page calls `window.ezyourlife.ai(inputs)`, EzYourLife runs the instructions you saved on its own AI, charges the visitor credits per AI result (the app itself opens free), and sends the result back. Keys, prompts and prices never reach the page.

## 1. Read the server

Find each AI call: `generateContent`, `generateContentStream`, `chats.create`, `chat.completions`, `messages.create`. For each, note the system instruction, the prompt template, the response schema (if it returns JSON), the model, and which values from the page it uses. Note also what the page does when the call fails: that fallback stays.

One AI step per app. If the app has several calls, fold them into one set of instructions that returns every part (JSON with a field per part), or split the app.

## 2. Save the step

```
dev_save_ai_step(app_id, {
  inputs:   [{key: "yearVibe", label: "Year and vibe"}, {key: "rating", label: "Rating out of 10"}],
  fallback: "The page builds a simple recap from the answers without AI.",
  ai: {
    system: "You are ... (the developer's real instructions: role, rules, tone, never invent facts)",
    task:   "Using the inputs, produce JSON with: title (string), summary (string), highlights (array of 3 short strings) ...",
    model:  "flash",
    maxTokens: 1024,
    json:   true
  }
})
```

- `json: true` when the page draws an object. Describe every field in `ai.task`, exactly as the page reads them (put the old `responseSchema` into words). The page receives the parsed object.
- `json: false` for plain text.
- The inputs reach the AI as `- key: value` lines.
- No keys, no outside URLs to fetch: the AI cannot browse.

## 3. Change the page

Replace the call to the app's server:

```js
let result;
try {
  if (typeof window.ezyourlife === "undefined") throw new Error("no ai");
  result = await window.ezyourlife.ai({ yearVibe, rating });
} catch (e) {
  result = buildFallback(yearVibe, rating); // the app's own fallback, kept
}
```

Errors carry `e.code`: `login`, `credits`, `limit`, `busy`, `unavailable`, `failed`. Show the fallback for all of them (the store opens its own sign-in or buy-credits prompt for `login` and `credits`). Delete the server, `.env`, keys, wallet and payment code. Build with the normal command (`npm install --legacy-peer-deps` first if peers conflict), open the build once.

## 4. Upload, save the step, test

Upload as a file app (see SKILL.md step 2b; zip route when the workspace cannot reach EzYourLife). A new upload keeps the saved step; saving the step before any upload fails. Then `dev_test_run(app_id, inputs)` with the app's own sample values exactly as the page sends them. Read the result as the visitor's page would receive it: all fields present, specific, nothing invented. Improve `ai.system`/`ai.task`, save, run again. The checks need a successful run of this exact step. The preview link also runs the AI for real (free, 25 test runs a day).

## 5. Price

You do not set, estimate or mention a price. EzYourLife measures what a result costs; the admin sees a suggested price next to the measured cost and sets credits per AI result at approval (never below 2). The developer is told only that the team sets it.
