# Instant Digital Products Engine

Select → customise → preview → pay → publish → share, for 100+ ready-made products.

## How it fits together

| Piece | Where |
|---|---|
| Product definitions (fields, steps, designs, WhatsApp copy, samples) | `src/instant/catalog/*.ts` |
| Field building blocks per family | `src/instant/fields.ts` |
| Design variants (colours + fonts) | `src/instant/themes.ts` |
| Renderers, one per family, code-split | `src/instant/renderers/` (`Celebration`, `Festival`, `Event`, `Business`, `Menu`, `Profile`) |
| Shared pieces (confetti, music box, lead form, icons) | `src/instant/parts.tsx` |
| Share image, QR poster | `src/instant/shareImage.ts`, `src/instant/ShareKit.tsx` |
| Screens | `src/pages/instant/` |
| Database, security rules, publishing functions, product prices | `supabase/migrations/20261008160000_instant_products.sql` |
| Checkout (server-priced Razorpay orders, verification) | `supabase/functions/ip-checkout` |
| Payment fallback when the browser tab dies | `supabase/functions/razorpay-webhook` (handles page orders too) |

Routes: `/create` (gallery), `/create/:productId` (builder), `/p/:slug` (published page),
`/create/done/:pageId`, `/my-pages`, `/my-pages/:pageId` (leads/RSVPs), `/admin/instant` (prices).

## Rules the engine enforces

- **Prices live in `ip_products`.** The checkout function reads them; the browser never sends an amount. Admins edit them at `/admin/instant`.
- **Only the publish functions write `published_content`, `status` and `slug`.** A trigger resets those columns on any owner update. Owners edit `content` (their draft) and push it live with `ip_republish`.
- **The public reads one function:** `ip_get_public_page(slug)` returns the snapshot of a live, unexpired page and nothing about the owner.
- **Leads, RSVPs and orders go through `ip_submit_lead`,** which validates the phone number and rate-limits per page and per phone. Only the page owner can read them.
- **Photos** are shrunk in the browser (EXIF and GPS stripped), then uploaded to `page-media/{owner}/{page}/`. Renderers only display images from that bucket.
- **Personal pages** get unguessable slugs and `noindex`. Business, menu and profile pages get clean slugs, are indexable, and carry `LocalBusiness` JSON-LD.
- **Sample reviews, ratings, team members and the sample WhatsApp number can't be published.** The builder blocks them until the owner replaces them.

## Adding a product

1. Add an entry to the right file in `src/instant/catalog/` using that file's `make({...})` helper: name, glyph, price, designs, labels, WhatsApp templates and a realistic sample.
2. Add a row to `ip_products` in a new migration (same `id`, family, category, name, price).
3. That's it. The gallery, builder, renderer, share kit, QR and checkout all pick it up.

A product that needs a new kind of interaction (for example a new celebration "moment") adds an option to its family renderer, so every product in that family can use it.

## Known limitation: link previews

Lovable hosts the app as a single-page app, so `/p/:slug` sets its title and Open Graph tags in JavaScript. Google reads them; WhatsApp, Facebook and Instagram crawlers don't run JavaScript, so links preview with the site-wide card. The fix is an edge worker in front of `ezyourlife.com/p/*` (for example a Cloudflare Worker) that calls `ip_get_public_page` and writes the tags into the HTML. This needs DNS access for `ezyourlife.com`.
