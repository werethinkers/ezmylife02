# Public API (v1)

One edge function, `supabase/functions/api`, lets the EzMe Mac app, the browser extension and outside
developers use Ezyourlife apps. Address: `https://vrsadzjyugbusfazdgyi.supabase.co/functions/v1/api/v1`.

## Who can call it

- `Authorization: Bearer <ezyourlife.com sign-in token>`: the website's own session.
- `Authorization: Bearer ezy_live_…`: an API key made at `/developers/keys`. Stored only as a SHA-256 hash
  in `api_keys`; each key has a daily credit limit (`api_key_runs` logs what it spent).
- EzMe connects with `/developers/keys?app=ezme&redirect=ezme://ezyourlife-connected`: the signed-in person presses
  "Connect EzMe", a key named "EzMe on my Mac" is made and handed back to the app. Only `ezme://` redirects are allowed.

Whoever calls, the person's own wallet pays at the website's prices, through the same `start_tool_run` /
`complete_tool_run` as every other app. Failed runs are not charged. The function never changes prices or the wallet code.

## Routes

| Route | What | Credits |
| --- | --- | --- |
| `GET /apps?q=&category=&runnable=true&limit=&offset=` | Ranked search of live apps, with price, goal colour and whether the API can run it | free, no key |
| `GET /apps/{id}` | One app with its input boxes, sample and options | free, no key |
| `POST /apps/{id}/run` | `{inputs}`, or `{messages}` for chat, `{images}` for photo readers, `{prompt, style, aspect}` for images, `{action:"refine", previous, instruction}` | the app's price |
| `POST /prompt/improve` | PromptMaster magic write: `{prompt, goal?}` | PromptMaster's price |
| `POST /prompt/brainstorm` | PromptMaster brainstorm: `{topic, styles?}` | PromptMaster's price |
| `GET /cards?q=` | Card, invite and website designs, each with its `/create/<id>` link | free, no key |
| `GET`, `PUT /shortcuts`, `DELETE /shortcuts/{key}` | The person's synced shortcuts (same list as the extension and Speedy Notebook) | free |
| `GET /wallet` | Balance, free and paid split, last 50 charges, packs | free |
| `POST /wallet/topup` | `{pack_id}` returns `checkout_url` (`/credits?pack=…`, which opens Razorpay) | none |
| `GET`, `POST /keys`, `DELETE /keys/{id}` | Manage keys (website session only) | free |

Apps the API runs are listed in `supabase/functions/_shared/apiCatalog.ts`, generated from `src/apps/defs` by
`node scripts/gen-api-catalog.mjs` (296 apps on 7 Nov 2026). Calculators, converters, photo presets, trackers and
coaching sessions run only on the site: `run` answers `409 web_only` with the app's link. Run the generator again
after adding apps.

## Going live

1. Apply `supabase/migrations/20261107150000_public_api_keys.sql` through the Lovable database connection.
2. Merge and Publish as in `docs/launch-plan.md`, then confirm the `api` function answers
   `GET …/functions/v1/api/v1/apps?q=invoice`.
