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

- **Prices live in `ip_products.price_credits`, in credits only.** `ip_pay_with_credits` charges them; the browser never sends an amount. Admins edit them at `/admin/instant`. `price_inr` is kept as an internal value (the ₹999 kit's design limits read it); a product without `price_credits` costs `ip_credits_for_inr(price_inr)`. The old rupee page checkout only runs with the `PAGES_RUPEE_CHECKOUT=on` secret. Short of credits, the builder sends people to `/credits?next=…` and back.
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

Business websites can also turn on extra sections with `extras` (notice ribbon, numbers strip, brands, steps, questions) and `listOrder` (a "send your list on WhatsApp" box). Schools, hotels and shops in `catalog/stores.ts` use them; each section shows only when it has content.

A product that needs a new kind of interaction (for example a new celebration "moment") adds an option to its family renderer, so every product in that family can use it.

## Known limitation: link previews

Lovable hosts the app as a single-page app, so `/p/:slug` sets its title and Open Graph tags in JavaScript. Google reads them, but WhatsApp, Facebook and Instagram crawlers don't run JavaScript, so `/p/` links preview with the site-wide card. The `share` action of `ip-checkout` (`supabase/functions/_shared/sharepage.ts`) therefore writes a static page with the page's own tags and stores its address in `share_url`:

- **Page sites (when the `PAGES_ORG` secret is set):** each page gets its own repo `PAGES_ORG/page-<slug>`, served by GitHub Pages at `<slug>.ezyourlife.com`. Its `index.html` holds the preview tags and shows `ezyourlife.com/p/<slug>` full screen in a frame, so forms and buttons work as on the site. `/p/<slug>` moves visitors to the subdomain once it answers. Setup: a GitHub organisation for the pages, with ezyourlife.com verified in its settings (this stops anyone else claiming a subdomain). A wildcard `CNAME *` to `<org>.github.io` at Hostinger. `GITHUB_SHARE_TOKEN` with Administration, Contents and Pages read and write on that organisation, plus `PAGES_ORG`. Names that have their own DNS records are listed in `RESERVED` there and never used.
- **Otherwise:** one file per page in `werethinkers/ezyourlife-share`, at `share.ezyourlife.com/p/<slug>/`, which forwards to `/p/<slug>`.

## Send all on WhatsApp

Every published card and website has "Send to everyone, each by name" in its share kit (`src/instant/BulkSend.tsx`).

- **People:** the phone's contact book (Contact Picker, Chrome on Android; the person picks who), a contacts file (.vcf from iPhone or Android, .csv from Google Contacts; read on the device only), or a pasted list. Up to 2,000, one per number (`src/instant/contacts.ts`).
- **Price, asked before anything is sent** (consent checkbox, `ip_bulk_send_start` charges and records the consent time in one transaction; queue sends reach it through the `ip_bulk_send_queue` database function the site calls directly, automatic sends through the function):
  - *From my WhatsApp:* 1 credit per 10 people, rounded up. Each chat opens with that person's message; the sender taps send, and the next person is waiting. Only the count is stored.
  - *Send automatically:* 4 credits a person with a valid number. `supabase/functions/ip-bulk-send` sends through Wavo in batches of 40, chaining itself until done; failed messages are refunded by `ip_bulk_send_finish`. Names and numbers of delivered messages are wiped when the send ends.
- Automatic mode stays hidden ("Coming soon") until the Wavo template `card_send_ezyourlife` (or `WAVO_TPL_CARD_SEND`) is approved: body {{1}} recipient name, {{2}} sender name, {{3}} product name; URL button `https://ezyourlife.com/{{1}}`.
- Each person's link carries `?to=<name>`: festival cards say "Dear Rahul,", invitations say "Dear Rahul, you're invited".
- Prices are in `ip_bulk_send_price()` (server) and `src/lib/creditRate.ts` (display); keep them the same.

## The Signature version (Nov 2026)

Every design whose family is listed in `SIGNATURE_FAMILIES` (`src/instant/catalog/index.ts`) gets one extra
version in front of its ten: id `signature`, style `prime`, with the colours and fonts of the design's own
first version. It is the default for new pages. The ten older versions keep their ids, so published pages
do not change, and a page whose saved version is missing falls back to the old first version
(`fallbackTheme`), never to Signature.

- Done: `business` (`src/instant/renderers/Business.tsx`, the `.s-prime` rules and `CountUp`, `ReviewStack`, `Fold`).
- To add a family: give its renderer a `prime` layout, then add the family to `SIGNATURE_FAMILIES`.
- The pictures in `public/design-previews` still show the older first version until they are remade.
