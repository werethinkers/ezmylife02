# EZYOURLIFE design guide

One bright look for the whole site. Keep new pages in this style.

## Look

- **Page:** warm cream background (`bg-background`), white cards (`bg-card`).
- **Outlines:** thick ink borders (`border-2 border-ink`) with a hard offset shadow (`shadow-block-sm`, `shadow-block`, `shadow-block-lg`). No soft blurs, glows or gradients.
- **Fonts:** Unbounded for headings (`font-display`), Hind for body text (also covers Hindi). Both are self-hosted in `public/fonts` (see `src/fonts.css`).
- **Colours:** one per business goal. Use them as solid fills with ink text.
  - Get customers → `bg-pink`
  - Run your business → `bg-sun`
  - Photos & content → `bg-teal`
  - Smart helpers → `bg-sky`
  - Learn & grow → `bg-lime`
  - Warnings → `bg-coral`
  - Websites → `bg-teal`, Cards → `bg-sun`
- **Emphasis:** the highlighter mark (`.marker`) or a tilted sun box, not gradient text.
- **Ready-made pieces:** `.block-card` (outlined card) and `.block-lift` (lifts on hover).

## Words

Plain words a shop owner understands at first look.

- Say what people get, not what the tech is. "You get a ready PDF you can send", not "AI-powered document generation".
- Use sentence case: "Business apps", not "Business Apps".
- Use the same names everywhere: Business apps, Websites, Cards & invites, Prices, My websites and cards.
- Every price claim must be true: credits are used only when an app gives a result; websites and cards are paid once.
- Don't show ratings, reviews, user counts or testimonials unless they are real.

## The 4-step flow

Every app, website and card shows the same steps with `<FlowSteps flow="app|website|card" step={n} />`:

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| App | See what it does (`/promo/…`) | Use it (`/tool/…`) | Get your result | Save or share |
| Website | Pick a design (`/make/…`) | Add your details (`/create/…`) | Pay once | Go live |
| Card | Pick a design | Add your details | Pay once | Send it |

Pair it with `<GiveGet give="…" get="…" />` so the purpose is clear at a glance.

## Where things live

- **Goals, categories, "you give / you get", how an app opens:** `src/data/goals.ts`. Add new catalogue categories here.
- **How an app opens (from its engine):** `src/data/appKind.ts`.
- **Menu sections and the website/card split:** `src/components/brand/nav.ts`.
- **Header, phone tab bar and footer:** `src/components/Navbar.tsx`, `src/components/MobileDock.tsx`, `src/components/SEOFooter.tsx`.
- **Shared app frame:** `src/apps/shell/` (`AppShell`, `OutputPanel`, `StepLabel`).

## Design ideas (private)

`/admin/design-ideas` (admins only) lists new looks that are not live yet, each with a preview and its own full page at `/admin/design-ideas/<id>` (`?view=phone` for a phone frame). The ideas and their parts live in `src/design-ideas/` (`registry.tsx` lists them). They read the real catalogue and prices; only the shop and thali grouping is design (`src/design-ideas/data.ts`). The first idea is the Bazaar home page. Nothing here is linked from the public site.
