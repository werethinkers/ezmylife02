## Goal

Reshape the Home page to mirror the screenshot's layout (sections + composition) while keeping our existing dark/teal color scheme. Rename "Tools" → "AI Apps" everywhere user-facing (route too), trim the navbar (drop Bulk Jobs and Contact), defer auth until a paid action is taken, and keep all backend logic intact.

## 1. Navbar cleanup (`src/components/Navbar.tsx`)

- Remove "Contact" and "Bulk Jobs" links.
- Rename "Tools" → "AI Apps" and point to `/ai-apps`.
- Final desktop links: Home, AI Apps, Credits, About; signed-in users also see Get Extension.
- Mobile menu mirrors the same list.

## 2. Merge Contact into About (`src/pages/About.tsx`, `src/pages/Contact.tsx`)

- Append the Contact page content (form + contact info) as a section at the bottom of About (anchor id `#contact`).
- Keep `/contact` route alive with a small redirect component to `/about#contact` so existing links don't break.
- Remove "Contact" from `SEOFooter` and any other internal nav lists; add a "Contact" link inside the About footer area pointing to `#contact`.

## 3. Rename Tools → AI Apps + new route `/ai-apps`

Route + navigation:
- In `src/App.tsx`, mount the existing `Tools` page at both `/ai-apps` (canonical) and `/tools` (redirect to `/ai-apps`) so old links keep working.
- Update all internal `Link to="/tools"` → `/ai-apps` in: `Navbar`, `Home`, `SEOFooter`, `ToolsHero`, `ToolsChatbot`, `RequestToolSection`, `BulkPromoSection`, `Credits`, `Auth`, `Profile`, `AdminDashboard`, `ToolLandscapeCard`, etc.
- Update sitemap edge function to emit `/ai-apps`.

User-facing copy rename (case-preserving) in headings, buttons, titles, descriptions, SEO meta, JSON-LD, page titles:
- "Tools" → "AI Apps", "Explore Tools" → "Explore AI Apps", "Browse Tools" → "Browse AI Apps", "AI Tools" → "AI Apps", "Discover Tools" → "Discover AI Apps", "Featured Tools" → "Featured AI Apps", "Hot Tools" → "Hot AI Apps", "Trending Tools" → "Trending AI Apps", "Most Used Tools" → "Most Used AI Apps", "Explore More Tools" → "Explore More AI Apps", "All Tools" → "All AI Apps", "Live Tools" admin counter → "Live AI Apps".
- Memory rule "200+ live AI tools" copy → "200+ live AI apps" wherever it appears in user-facing copy (About, Home hero, SEO, Tools page).

Code identifiers, table names, `tool_id` fields, admin schemas, edge function names, file/component names — **untouched**.

## 4. Home page redesign — current dark theme + screenshot composition (`src/pages/Home.tsx`)

Replace the current hero+features+categories layout with this stack, all using existing tokens (`bg-background`, `bg-card`, `text-foreground`, `bg-primary`, `text-primary`, `border-border/50`, our teal/cyan gradient). No light theme.

Sections, top to bottom:

1. **Top search bar** (full-width, inside container, styled like the screenshot's bar but dark): rounded pill with search icon, placeholder "Search AI apps, tools and more…". Submitting routes to `/ai-apps?q=…`.

2. **Hero split row** (two columns on lg, stacked on mobile):
   - Left: small chip "AI Marketplace for Everyday Superpowers", H1 "Find the right AI apps. Simplify life. **Spend smarter.**" (last line in our gradient text, not purple), short paragraph, two CTAs ("Explore AI Apps" → `/ai-apps`, "How It Works" → scrolls to step section), and three small chips below: "200+ AI Apps", "Happy users", "4.8 ★ rating".
   - Right: "Your Credits" glass card with current balance (uses `useWallet` if signed in, else shows "—"), "Top Up Credits" button → `/credits`, "Transaction History" link → `/credits/history`, plus a 3-icon trust strip ("Pay with Credits / Secure & Safe / Use Instantly"). Decorative wallet illustration replaced with our existing `Zap`/coin-style gradient orb (no new imagery).

3. **Browse by Categories** row: 8 category pills with icon + label + "N AI Apps" count. Counts pulled from live `tools_catalog` grouped by `category`. Click → `/ai-apps?category=…`.

4. **Featured AI Apps** carousel: reuses `ToolSection` (already non-autoscrolling) with `featured` slice from `useHomeSections`. Each card uses the existing `ToolLandscapeCard` (per the prior approval). Heading right link "View all AI apps →" → `/ai-apps`.

5. **Simple. Credit-Based. Hassle-Free.** how-it-works strip + Popular Credit Packs side panel (single section, two columns):
   - Left: 4 numbered steps (Buy Credits → Choose an AI App → Pay with Credits → Start Using) with arrow connectors, all in dark cards with teal accents.
   - Right: "Popular Credit Packs" panel listing top 3 packs from `creditPacks.ts` (Starter / Pro "Best Value" / Ultimate) with INR price; "View All Packs" → `/credits`.

6. **Top Picks for You** row: 5 small horizontal cards (compact variant). Source = `hot` slice from `useHomeSections`. "View more →" → `/ai-apps`.

7. **Trust strip**: "Trusted by thousands of smart users worldwide" + small avatar cluster + "10K+ Happy Users". Pure presentational, no data binding.

8. **Footer**: existing `SEOFooter` (with Contact removed in step 2).

Drop from current Home: parallax background, 5 problem cards, the existing categories grid, big launch-offer banner (move launch-offer banner to a single line in the credits panel as "Use code ezyLAUNCH for free credits" link). RequestToolSection and BulkPromoSection stay above the footer.

## 5. Defer auth until paid action

Audit `Link to="/auth"` and `navigate("/auth")` calls. Anywhere that fires for browsing-only flows (preview, hero CTAs, "Explore", Tools listing, ToolLandscapeCard "Start Using" when the tool has no AI cost / `is_free`), allow anonymous and only prompt login through `LoginPromptDialog` when the user actually triggers:
- A paid run (any tool with credits > 0).
- Buying credits, redeeming a coupon, opening Bulk Mode runs, opening Get Extension downloads.

Keep ProtectedRoute on routes that genuinely need a user (Profile, Credits History, Bulk Jobs, Admin, MeetNudge dashboards, Speedy Notebook, PromptMaster, StartupAnalyser saves). Public Tool Viewer remains viewable; charge step prompts login.

Specific edits:
- `Home` hero "Get Started" CTA → routes to `/ai-apps` (was `/auth`).
- `ToolsHero` / `ToolLandscapeCard` already public; ensure "Start Using" only triggers login dialog when tool requires credits.
- `BulkModeToggle` / `BulkDropzone` already gated; keep.

## 6. Memory updates

After implementation, update `mem://navigation/navbar-links` (drop Contact + Bulk Jobs, rename Tools→AI Apps, route /ai-apps), update `mem://project/brand-identity` (terminology: refer to listings as "AI apps" in user-facing copy), and add a new `mem://design/home-layout` describing the new section order.

## Out of scope

- No theme/color overhaul — we keep current dark palette and teal/cyan accents.
- No DB schema changes (`tools_catalog`, `tool_pricing`, etc. unchanged).
- No changes to admin internals beyond label rename.
- No new images generated — reuse existing logo and gradient orbs.
- "My Tools" / saved areas, Tool Viewer iframe behavior, Bulk Mode logic, AI/billing flows untouched.
