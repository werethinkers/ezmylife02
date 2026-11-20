import { useState } from "react";
import { creditsForInr, fmtCredits } from "@/lib/creditRate";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import { getProduct } from "@/instant/catalog";
import { GROUPS, groupOf } from "@/instant/catalog/groups";
import { DesignRail, DeviceFrame, DeviceToggle, Swatch, styleLabel } from "@/instant/DesignPreview";
import { useProducts } from "@/instant/useProducts";
import { promoFor, promoSeo } from "@/instant/promo";
import { toDesignLite } from "@/components/modern/designLite";
import { plainName } from "@/instant/util";
import { seasonGap } from "@/instant/season";
import { ModernSteps } from "@/components/modern/ModernSteps";
import { GiveGet } from "@/components/brand/GiveGet";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { ModernPage } from "@/components/modern/ModernPage";
import { DesignCard } from "@/components/modern/DesignCard";
import { ShareButton } from "@/components/modern/ShareButton";
import { MetricsStrip } from "@/components/modern/MetricsStrip";
import { AboutCard } from "@/components/modern/AboutCard";
import { BTN_PRIMARY, CARD, CONTAINER, FOCUS_RING } from "@/components/modern/styles";
import { cn } from "@/lib/utils";
import { EDITORIAL_PROMOS, EditorialPromo } from "./EditorialPromo";

// Below md: a single-row snap-scroll strip so cards peek in from the right; at md+ this is a plain grid.
const ROW_CLASS = "flex overflow-x-auto snap-x snap-mandatory items-stretch gap-3.5 pb-3 -mx-4 px-4 scroll-px-4 no-scrollbar md:grid md:gap-4 md:pb-0 md:mx-0 md:px-0 md:grid-cols-3";
// A width (not just a min-width) so the card's own text wraps instead of stretching the card to fit it unwrapped.
const CARD_ITEM = "w-[82vw] max-w-[320px] shrink-0 snap-start whitespace-normal break-words md:w-auto md:max-w-none md:min-w-0 self-stretch";

/**
 * A promotional landing page for one product: what it is, a live sample, price, FAQ, and a way in.
 * Normally reached at `/make/:productId`. `/promo/:slug` (src/pages/PromoPage.tsx) renders this same
 * page for a website or card slug, passing `productIdOverride`/`pathOverride` so the address bar and
 * SEO tags read `/promo/...` while the canonical tag still points here, its one real address.
 */
export default function ProductPromo({ productIdOverride, pathOverride }: { productIdOverride?: string; pathOverride?: string } = {}) {
  const { productId: paramId = "" } = useParams();
  const productId = productIdOverride ?? paramId;
  const product = getProduct(productId);
  const { list, rows } = useProducts();
  const [designId, setDesignId] = useState<string | null>(null);
  const [device, setDevice] = useState<"phone" | "laptop">("phone");
  if (!product) return <Navigate to="/websites" replace />;

  const row = rows.get(product.id);
  if (row && !row.is_active) return <Navigate to="/create" replace />;
  const price = row?.price_credits ?? creditsForInr(row?.price_inr ?? product.price); // credits
  const days = row?.hosting_days ?? 365;
  const promo = promoFor(product);
  const theme = product.themes.find((t) => t.id === designId) ?? product.themes[0];
  const g = groupOf(product.id);
  const related = list.filter((l) => l.product.id !== product.id && l.product.category === product.category)
    .sort((a, b) => seasonGap(a.product.id) - seasonGap(b.product.id) || Number(groupOf(b.product.id) === g) - Number(groupOf(a.product.id) === g)).slice(0, 4);
  const groupName = GROUPS[product.category].find((x) => x.id === g)?.name;
  const create = `/create/${product.id}?design=${theme.id}`;
  const priceText = price ? fmtCredits(price) : "Free";
  const isSite = (WEBSITE_CATEGORIES as readonly string[]).includes(product.category);
  const home = isSite ? "/websites" : "/cards";
  const hosting = days >= 365 ? `${Math.round(days / 365)} year${days >= 730 ? "s" : ""}` : `${days} days`;
  const canonicalPath = `/make/${product.id}`;
  const seoPath = pathOverride ?? canonicalPath;
  const giveText = isSite ? "your business name, phone and services" : "names, a photo and your message";
  const getText = isSite ? `your own website link, live for ${hosting}` : `a card link to send on WhatsApp, live for ${hosting}`;
  const heroChecklist = [`${product.themes.length} design${product.themes.length === 1 ? "" : "s"} to pick from`, "Opens on any phone, tablet or laptop", "Ready in about 5 minutes", "Free edits, same link"];

  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "Product", name: `${product.name} | EZYOURLIFE`, description: promo.pitch,
      brand: { "@type": "Brand", name: "EZYOURLIFE" }, url: `https://ezyourlife.com${canonicalPath}`,
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: promo.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <ModernPage section={isSite ? "websites" : "cards"}>
      <PageSeo {...promoSeo(product)} path={seoPath} canonicalPath={pathOverride ? canonicalPath : undefined} jsonLd={jsonLd}
        keywords={`${product.name.toLowerCase()}, online ${product.name.toLowerCase()}, ${product.category}, whatsapp, ezyourlife`} />

      <div className={cn(CONTAINER, "pt-6")}>
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400" aria-label="Breadcrumb">
          <Link to={home} className={cn("underline underline-offset-4 hover:text-zinc-900 dark:hover:text-white", FOCUS_RING)}>{isSite ? "Websites" : "Cards & invites"}</Link>
          <span aria-hidden="true">›</span>
          <Link to={`${home}?cat=${product.category}${groupName ? `&type=${g}` : ""}`} className={cn("underline underline-offset-4 hover:text-zinc-900 dark:hover:text-white", FOCUS_RING)}>{groupName ?? product.category}</Link>
        </nav>
        <ModernSteps flow={isSite ? "website" : "card"} step={1} className="max-w-3xl" />
      </div>

      {EDITORIAL_PROMOS.has(product.id) ? (
        <EditorialPromo product={product} promo={promo} priceText={priceText} hasPrice={!!price} hosting={hosting} create={create} related={related} />
      ) : (
        <>
      <section className={cn(CONTAINER, "py-8")}>
        <div className="overflow-hidden rounded-3xl border border-zinc-200 shadow-soft-lg transition-colors duration-300 dark:border-zinc-800" style={{ background: theme.c.bg, color: theme.c.tx }}>
          <div className={device === "laptop" ? "grid gap-8 p-6 md:p-10" : "grid items-center gap-10 p-6 md:grid-cols-[1.1fr_1fr] md:p-10"}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center whitespace-nowrap rounded-full bg-orange-600 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                  {isSite ? "Website" : "Card & invite"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold opacity-60">By EZYOURLIFE</span>
                  <ShareButton path={seoPath} className="border-black/10 bg-white/15 text-current hover:bg-white/25" />
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold uppercase tracking-widest" style={{ color: theme.c.ac }}>{promo.eyebrow}{product.seasonal ? ` · ${product.seasonal}` : ""}</p>
              <h1 className="mt-3 text-4xl font-bold leading-[1.05] text-balance md:text-6xl" style={{ fontFamily: theme.f.d }}>
                <span aria-hidden="true">{product.glyph} </span>{promo.headline}
              </h1>
              <p className="mt-4 max-w-xl text-lg opacity-90 md:text-xl">{product.tagline}</p>
              {device === "phone" && <p className="mt-3 max-w-xl opacity-80">{promo.pitch}</p>}
              <ul className={device === "laptop" ? "mt-5 flex flex-wrap gap-x-6 gap-y-1.5 text-sm opacity-90" : "mt-6 grid gap-1.5 text-sm opacity-90"}>
                {heroChecklist.map((x) => (
                  <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4" style={{ color: theme.c.ac }} /> {x}</li>
                ))}
              </ul>
              <div className="mt-7 grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold">Pick a design · <span className="font-semibold opacity-80">{theme.name}, {styleLabel(theme).toLowerCase()}</span></p>
                  <DeviceToggle value={device} onChange={setDevice} dark={theme.dark} />
                </div>
                <DesignRail product={product} value={theme.id} onChange={setDesignId} dark={theme.dark} />
              </div>
            </div>
            <div className="min-w-0">
              <DeviceFrame product={product} theme={theme} device={device} height={device === "laptop" ? 640 : 600} />
              <p className="mt-3 text-center text-xs opacity-75">Live sample · scroll and tap around{device === "phone" ? " · switch to Laptop to see the big-screen layout" : ""}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <GiveGet give={giveText} get={getText} time="about 5 minutes" />
          <div className={cn("flex flex-wrap items-center justify-between gap-4 p-4 shadow-soft-sm", CARD)}>
            <div>
              <p className="font-display text-3xl font-extrabold">{priceText}</p>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{price ? "paid once" : "no payment"} · live for {hosting}</p>
            </div>
            <Link to={create} className={cn(BTN_PRIMARY, "h-12 px-6")}>
              {isSite ? "Build my website" : "Start making"} <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </div>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">You see the full result before you pay. Sign in is asked only when you publish.</p>

        <MetricsStrip
          className="mt-5"
          cells={[
            { value: priceText, label: price ? "Paid once" : "Free" },
            { value: isSite ? "1 Website" : "1 Card link", label: `Live for ${hosting}` },
            { value: "100 Free", label: "Starter credits", accent: true },
          ]}
        />
      </section>

      <main className={cn(CONTAINER, "grid max-w-5xl gap-14 py-10 pb-28 [&>section]:min-w-0")}>
        <section aria-labelledby="about-h">
          <AboutCard
            title={`About this ${isSite ? "website" : "card & invite"}`}
            description={promo.pitch}
            giveItems={[giveText]}
            getItems={heroChecklist}
            tags={[groupName ?? product.category, isSite ? "Website" : "Card & invite", price ? "One-time payment" : "Free", "WhatsApp ready"].filter(Boolean)}
          />
        </section>

        <section aria-labelledby="feat-h">
          <h2 id="feat-h" className="font-display text-2xl font-bold md:text-3xl">What you get</h2>
          <div className={cn(ROW_CLASS, "mt-5")}>
            {promo.features.map((f) => (
              <div key={f.title} className={cn("flex flex-col gap-2 p-5", CARD, CARD_ITEM)}>
                <span className="text-4xl" aria-hidden="true">{f.icon}</span>
                <h3 className="text-[18px] font-bold leading-snug">{f.title}</h3>
                <p className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {product.themes.length > 1 && (
          <section aria-labelledby="style-h">
            <h2 id="style-h" className="font-display text-2xl font-bold md:text-3xl">{product.themes.length} designs to choose from</h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">Each one changes the colours, fonts and layout. Tap one to see it live above.</p>
            <div className={cn(ROW_CLASS, "mt-5 md:grid-cols-4")}>
              {product.themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setDesignId(t.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  aria-pressed={t.id === theme.id}
                  className={cn(
                    "w-[42vw] max-w-[180px] shrink-0 snap-start overflow-hidden rounded-2xl border bg-white text-left shadow-soft-sm transition-transform hover:-translate-y-0.5 dark:bg-zinc-900 md:w-auto md:max-w-none",
                    t.id === theme.id ? "border-orange-500 ring-2 ring-orange-500" : "border-zinc-200 dark:border-zinc-800",
                  )}
                >
                  <div className="relative flex h-24 items-end justify-between border-b border-zinc-200 p-3 dark:border-zinc-800" style={{ background: t.c.bg, color: t.c.tx }}>
                    <span className="text-2xl font-bold leading-none" style={{ fontFamily: t.f.d }}>Aa</span>
                    <span className="flex gap-1">{[t.c.ac, t.c.ac2, t.c.ac3].map((c) => <i key={c} className="h-4 w-4 rounded-full border border-black/10" style={{ background: c }} />)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Swatch t={t} className="h-5 w-5" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{t.name}</span>
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">{styleLabel(t)}</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="how-h">
          <h2 id="how-h" className="font-display text-2xl font-bold md:text-3xl">How it works</h2>
          <div className={cn(ROW_CLASS, "mt-5")}>
            {promo.steps.map(([t, d], i) => (
              <div key={t} className={cn("flex flex-col gap-2 p-5", CARD, CARD_ITEM)}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 font-display font-extrabold text-orange-700 dark:bg-orange-950 dark:text-orange-300">{i + 1}</span>
                <h3 className="text-[18px] font-bold leading-snug">{t}</h3>
                <p className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="price-h" className="grid items-center gap-6 rounded-3xl bg-zinc-950 p-6 text-white shadow-soft-lg dark:bg-zinc-900 md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <h2 id="price-h" className="font-display text-2xl font-bold md:text-3xl">{priceText}, <span className="text-amber-400">paid once</span></h2>
            <p className="mt-2 text-zinc-300">Your {plainName(product.name)} {promo.audience}, live on its own link for {hosting}. Pay securely with UPI, cards or netbanking, and get your invoice by email right away. New accounts get 100 free credits to start.</p>
          </div>
          <Link to={create} className={cn(BTN_PRIMARY, "h-14 px-8 text-base")}>
            {isSite ? "Build my website" : "Start making"} <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </section>

        <section aria-labelledby="faq-h">
          <h2 id="faq-h" className="font-display text-2xl font-bold md:text-3xl">Questions</h2>
          <div className={cn(ROW_CLASS, "mt-5")}>
            {promo.faqs.map(([q, a]) => (
              <div key={q} className={cn("flex flex-col gap-2 p-5", CARD, CARD_ITEM)}>
                <h3 className="text-[17px] font-bold leading-snug">{q}</h3>
                <p className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section aria-labelledby="rel-h">
            <h2 id="rel-h" className="font-display text-2xl font-bold md:text-3xl">Other designs</h2>
            <div className={cn(ROW_CLASS, "mt-5 md:grid-cols-4")}>
              {related.map((r) => (
                <DesignCard key={r.product.id} d={toDesignLite(r)} size="md" className={CARD_ITEM} />
              ))}
            </div>
          </section>
        )}
      </main>
        </>
      )}

      {/* Reached at /make/:id, there's no bottom tab bar, so this sits flush at the screen edge.
          Reached at /promo/:slug, the modern tab bar is already there (DOCK_PATHS in MobileDock.tsx
          includes /promo/), so this sits as a pill above it instead, the same way PromoPage.tsx's
          app/studio sticky bar does. */}
      <div
        className={cn(
          "z-40 flex items-center gap-3 border-zinc-200 bg-[#F7F6F2]/95 backdrop-blur-[14px] dark:border-zinc-800 dark:bg-[#0F1115]/95 md:hidden",
          pathOverride
            ? "sticky bottom-[76px] mx-4 mb-4 rounded-2xl border p-2.5 pl-4 shadow-soft"
            : "fixed inset-x-0 bottom-0 border-t px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3",
        )}
      >
        <div className="min-w-0">
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{product.name}</p>
          <p className="font-bold">{priceText} <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">once</span></p>
        </div>
        <Link to={create} className={cn(BTN_PRIMARY, "ml-auto h-12 px-6")}>
          {isSite ? "Build it" : "Make it"}
        </Link>
      </div>
    </ModernPage>
  );
}
