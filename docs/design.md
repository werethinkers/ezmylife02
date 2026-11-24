# EZYOURLIFE design guide

The site has two looks while it moves over. The **modern look** (below, under "Modern look") is the
approved design for Home (`/`), Business apps (`/ai-apps`), Websites and cards (`/websites`, `/cards`,
`/create`), Studios (`/studios`), Prices (`/credits`), About (`/about`), Sign in/up (`/auth`), For creators
(`/creators`) and List your app (`/list-your-app`). Every other page keeps the bright **block look** described
next. New pages in those areas use the modern look; elsewhere, keep the block look until that page is moved over.

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

## Modern look

Calm paper page, hairline borders, soft shadows, one orange accent, and a dark mode.

- **Where it lives:** `src/components/modern/`. Wrap a page in `<ModernPage section="…">` (header, footer, light/dark),
  and add its path to `MODERN_PATHS` in `src/components/modern/theme.ts` so the phone tab bar matches.
  `<ModernPage chrome={false}>` drops the header and footer for a focused page that draws its own (sign in/up).
- **Don't use shadcn's `<Button>`:** its default and outline variants hardcode the block look's colours
  (`bg-pink`, `border-foreground`, `hover:bg-sun`), not the `.ez-modern` tokens, so they stay pink with a thick
  border on a modern page. Use a plain `<button>`/`<a>`/`<Link>` with `BTN_PRIMARY`, `BTN_INK` or `BTN_OUTLINE`
  from `styles.ts` instead. `Input`, `Textarea`, `Label`, `Tabs` and `Accordion` are token-based and fine as-is.
- **Colours:** page `#F7F6F2` (light) / `#0F1115` (dark); cards white / `zinc-900`; borders `zinc-200` / `zinc-800`;
  text `zinc-900` / `zinc-100`, quieter text `zinc-600` / `zinc-400`; accent orange `#EA580C` (`orange-600`) for buttons
  and fills, `orange-700` / `orange-400` for small orange text so it stays readable. Each goal has a gradient
  (`GOAL_GRADIENT` in `styles.ts`) used for badges and for app cards without a picture.
- **Fonts:** Space Grotesk for headings (`font-display`), Inter for body text, both self-hosted in `public/fonts`
  with Hind behind them for Hindi. The `.ez-modern` class in `src/index.css` switches the fonts and the colour tokens,
  so the rest of the site is untouched.
- **Shadows:** use `shadow-soft-*`. The plain `shadow-sm/lg/…` names are the block look's hard ink shadows.
- **Pieces:** `ShowcaseCard` (picture fills the card, price and name on a dark fade, one white button), `ToolCard`
  (apps and studios, opens Quick Look), `DesignCard` (websites and cards: card shows the design, button starts it),
  `SectionHead`, `PageHeader`, `CtaBand`, `EmptyState`, `ModernSteps` (the 4-step flow), and the class names in
  `styles.ts` (`BTN_PRIMARY`, `BTN_INK`, `BTN_OUTLINE`, `pillClass`, `subPillClass`, `CARD`).
- **Dark mode:** every colour needs its `dark:` partner. The visitor's choice is remembered in the browser
  (`ez.theme.v1`). Menus that open outside the page (dropdowns, popovers) take `ez-modern` (and `dark`) on their content
  so they match.
- **Emphasis:** gradient text (orange → amber → rose) is allowed in this look, for one phrase in a hero heading.
- **Same words rules:** everything under "Words" below still applies: sentence case, real numbers only, true prices.

## Words

Plain words a shop owner understands at first look.

- Say what people get, not what the tech is. "You get a ready PDF you can send", not "AI-powered document generation".
- Use sentence case: "Business apps", not "Business Apps".
- Use the same names everywhere: Business apps, Websites, Cards & invites, Prices, My websites and cards.
- Every price claim must be true: credits are used only when an app gives a result; websites and cards are paid once.
- Don't show ratings, reviews, user counts or testimonials unless they are real.

## The 4-step flow

Every app, website and card shows the same steps with `<FlowSteps flow="app|website|card" step={n} />`
(`<ModernSteps>` on modern pages, same words):

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
- **Header, phone tab bar and footer:** `src/components/Navbar.tsx`, `src/components/MobileDock.tsx`, `src/components/SEOFooter.tsx`
  (modern pages: `ModernHeader`, `ModernFooter`; the tab bar switches by itself). Their links all come from `src/components/brand/nav.ts`.
- **Shared app frame:** `src/apps/shell/` (`AppShell`, `OutputPanel`, `StepLabel`).

## Design ideas (private)

`/admin/design-ideas` (admins only) lists new looks that are not live yet, each with a preview and its own full page at `/admin/design-ideas/<id>` (`?view=phone` for a phone frame). The ideas and their parts live in `src/design-ideas/` (`registry.tsx` lists them). They read the real catalogue and prices; only the shop and thali grouping is design (`src/design-ideas/data.ts`). The first idea is the Bazaar home page. A "Campaigns" tab on the same page holds the stand-up style voice (roast machine, home line, loading lines, 404, price tags, refund line, push notes, Instagram posts), in `src/design-ideas/campaigns/`. Nothing here is linked from the public site.
