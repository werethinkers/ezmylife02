# Adapting an app for EzYourLife

EzYourLife runs every developer app inside a sandboxed iframe with a unique, empty origin. Inside it:

| Works | Does not work |
|---|---|
| HTML, CSS, JavaScript, canvas, SVG, WebAssembly | Cookies |
| Forms, buttons, alerts and confirms | localStorage, sessionStorage, IndexedDB (they throw `SecurityError`) |
| Downloads (`<a download>`, Blob URLs) | Reaching the page around it (`window.top`, `parent`) |
| Opening links in a new tab | Camera, microphone, location, notifications |
| Clipboard writes from a click (may need a fallback) | History-API routing (`pushState` paths) |
| `fetch` to public APIs that allow any origin (CORS `*`) | Its own login, payments or server |

## Checklist

Work through these in order and keep a list of every change for the developer.

### 1. Secrets
Search the whole project, not only the source folder, including `.env*`, config and build output:

```
grep -rnE "sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{35}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36}|xox[abprs]-|BEGIN [A-Z ]*PRIVATE KEY|eyJ[A-Za-z0-9_-]{10,}\.eyJ" .
```

Remove every hit from the app. If a key was ever committed, tell the developer to rotate it; deleting it from the file does not make it safe.

### 2. AI, login, payments, own backend
- **AI calls** (OpenAI, Anthropic, Gemini, Groq, OpenRouter, Mistral, Cohere, Together, Hugging Face, DeepSeek, Perplexity, xAI, Replicate): remove them. If the feature can be done without AI (rules, templates, calculations), rewrite it that way. Otherwise remove the feature and tell the developer.
- **Login** (Firebase Auth, Auth0, Supabase Auth, Clerk and so on): remove it. EzYourLife handles sign-in and charges credits before the app opens.
- **Payments** (Razorpay, Stripe, PayPal, Cashfree, Paytm): remove them. EzYourLife charges credits per use.
- **Own backend**: if the app needs its own server or database to work, stop. It cannot be published yet.

### 3. Storage that survives the sandbox
Replace direct storage calls with a safe wrapper that falls back to memory:

```js
const memory = new Map();
export const store = {
  get(k) { try { return window.localStorage.getItem(k); } catch { return memory.has(k) ? memory.get(k) : null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch { memory.set(k, String(v)); } },
  remove(k) { try { window.localStorage.removeItem(k); } catch { memory.delete(k); } },
};
```

Do the same for `sessionStorage`. For IndexedDB, wrap opening it in try/catch and keep data in memory when it fails. Libraries that persist state, such as Zustand `persist` or redux-persist, need the safe storage passed in, or persistence turned off. Tell the developer that data now lasts only while the app is open, and suggest a "Download my data" button if users need to keep their work.

### 4. Routing
Use hash routing (`#/page`):
- React Router: `HashRouter` or `createHashRouter`.
- Vue Router: `createWebHashHistory()`.
- SvelteKit: `router: { type: 'hash' }` in the kit config, built with the static adapter into a single page.

Plain apps that switch views in JavaScript need no change.

### 5. Stay inside the frame
Remove `window.top`, `top.location`, `parent.location` and `parent.document`. Links to other sites should use `target="_blank" rel="noopener"`.

### 6. Phones
- `<meta name="viewport" content="width=device-width, initial-scale=1">` in the head.
- No fixed widths over 375 px; tap targets at least 44 px; no horizontal scrolling.

### 7. Size
- Compress images: WebP, at most about 1600 px wide.
- Load big libraries (charting, PDF, maps) from cdnjs, jsDelivr or unpkg instead of bundling them, when that makes the file much smaller.
- Remove unused fonts and assets.
- Target under 2 MB. The hard limit is 10 MB.

### 8. Outside addresses
List every external host the app calls (fonts, CDNs, public APIs). The checks show this list to the admin, who will ask about anything unusual. Remove analytics and tracking scripts; EzYourLife has its own.

## What to tell the developer
End with a short list:
- what was removed and why
- what was changed (storage, routing, layout)
- anything that now behaves differently, for example "your saved lists last only until the tab closes"
