import { useState } from "react";
import { creditsForInr, fmtCredits } from "@/lib/creditRate";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { Shelf } from "@/components/store/Shelf";
import { ProductCard } from "@/components/instant/ProductCard";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/instant/catalog";
import { GROUPS, groupOf } from "@/instant/catalog/groups";
import { DesignRail, DeviceFrame, DeviceToggle, Swatch, styleLabel } from "@/instant/DesignPreview";
import { useProducts } from "@/instant/useProducts";
import { promoFor, promoSeo } from "@/instant/promo";
import { plainName } from "@/instant/util";
import { seasonGap } from "@/instant/season";
import { FlowSteps } from "@/components/brand/FlowSteps";
import { GiveGet } from "@/components/brand/GiveGet";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";
import { EDITORIAL_PROMOS, EditorialPromo } from "./EditorialPromo";

/** A promotional landing page for one product: what it is, a live sample, price, FAQ, and a way in. */
export default function ProductPromo() {
  const { productId = "" } = useParams();
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

  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "Product", name: `${product.name} | EZYOURLIFE`, description: promo.pitch,
      brand: { "@type": "Brand", name: "EZYOURLIFE" }, url: `https://ezyourlife.com/make/${product.id}`,
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: promo.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageSeo {...promoSeo(product)} path={`/make/${product.id}`} jsonLd={jsonLd}
        keywords={`${product.name.toLowerCase()}, online ${product.name.toLowerCase()}, ${product.category}, whatsapp, ezyourlife`} />
      <Navbar section={isSite ? "websites" : "cards"} />

      <div className="mx-auto max-w-7xl px-4 pt-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm font-medium text-muted-foreground" aria-label="Breadcrumb">
          <Link to={home} className="underline underline-offset-4 hover:text-ink">{isSite ? "Websites" : "Cards & invites"}</Link>
          <span aria-hidden="true">›</span>
          <Link to={`${home}?cat=${product.category}${groupName ? `&type=${g}` : ""}`} className="underline underline-offset-4 hover:text-ink">{groupName ?? product.category}</Link>
        </nav>
        <FlowSteps flow={isSite ? "website" : "card"} step={1} className="max-w-3xl" />
      </div>

      {EDITORIAL_PROMOS.has(product.id) ? (
        <EditorialPromo product={product} promo={promo} priceText={priceText} hasPrice={!!price} hosting={hosting} create={create} related={related} />
      ) : (
        <>
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-3xl border-2 border-ink shadow-block-lg transition-colors duration-300" style={{ background: theme.c.bg, color: theme.c.tx }}>
          <div className={device === "laptop" ? "grid gap-8 p-6 md:p-10" : "grid items-center gap-10 p-6 md:grid-cols-[1.1fr_1fr] md:p-10"}>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: theme.c.ac }}>{promo.eyebrow}{product.seasonal ? ` · ${product.seasonal}` : ""}</p>
              <h1 className="mt-3 text-4xl font-bold leading-[1.05] text-balance md:text-6xl" style={{ fontFamily: theme.f.d }}>
                <span aria-hidden="true">{product.glyph} </span>{promo.headline}
              </h1>
              <p className="mt-4 max-w-xl text-lg opacity-90 md:text-xl">{product.tagline}</p>
              {device === "phone" && <p className="mt-3 max-w-xl opacity-80">{promo.pitch}</p>}
              <ul className={device === "laptop" ? "mt-5 flex flex-wrap gap-x-6 gap-y-1.5 text-sm opacity-90" : "mt-6 grid gap-1.5 text-sm opacity-90"}>
                {[`${product.themes.length} designs to pick from`, "Opens on any phone, tablet or laptop", "Ready in about 5 minutes", "Free edits, same link"].map((x) => (
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
          <GiveGet
            give={isSite ? "your business name, phone and services" : "names, a photo and your message"}
            get={isSite ? `your own website link, live for ${hosting}` : `a card link to send on WhatsApp, live for ${hosting}`}
            time="about 5 minutes"
          />
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-ink bg-sun p-4 shadow-block-sm">
            <div>
              <p className="font-display text-3xl font-extrabold">{priceText}</p>
              <p className="text-sm font-semibold">{price ? "paid once" : "no payment"} · live for {hosting}</p>
            </div>
            <Button asChild size="lg" className="h-12 px-6">
              <Link to={create}>{isSite ? "Build my website" : "Start making"} <ArrowRight className="h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">You see the full result before you pay. Sign in is asked only when you publish.</p>
      </section>

      <main className="mx-auto grid max-w-5xl gap-14 px-4 py-10 pb-28 [&>section]:min-w-0">
        <section aria-labelledby="feat-h">
          <h2 id="feat-h" className="text-2xl font-bold md:text-3xl">What you get</h2>
          <Shelf className="mt-5">
            {promo.features.map((f) => (
              <div key={f.title} className="block-card flex w-[78%] shrink-0 snap-start flex-col gap-2 p-5 sm:w-[46%] md:w-[31%]">
                <span className="text-4xl" aria-hidden="true">{f.icon}</span>
                <h3 className="font-body text-[18px] font-bold leading-snug">{f.title}</h3><p className="text-[15px] leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </Shelf>
        </section>

        {product.themes.length > 1 && (
          <section aria-labelledby="style-h">
            <h2 id="style-h" className="text-2xl font-bold md:text-3xl">{product.themes.length} designs to choose from</h2>
            <p className="mt-2 text-muted-foreground">Each one changes the colours, fonts and layout. Tap one to see it live above.</p>
            <Shelf className="mt-5">
              {product.themes.map((t) => (
                <button key={t.id} type="button" onClick={() => { setDesignId(t.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-pressed={t.id === theme.id}
                  className={"w-[60%] shrink-0 snap-start overflow-hidden rounded-2xl border-2 border-ink bg-card text-left shadow-block-sm transition-transform hover:-translate-y-0.5 sm:w-[30%] md:w-[23%]" + (t.id === theme.id ? " ring-4 ring-sun" : "")}>
                  <div className="relative flex h-24 items-end justify-between border-b-2 border-ink p-3" style={{ background: t.c.bg, color: t.c.tx }}>
                    <span className="text-2xl font-bold leading-none" style={{ fontFamily: t.f.d }}>Aa</span>
                    <span className="flex gap-1">{[t.c.ac, t.c.ac2, t.c.ac3].map((c) => <i key={c} className="h-4 w-4 rounded-full border-2 border-ink" style={{ background: c }} />)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2"><Swatch t={t} className="h-5 w-5" /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{t.name}</span><span className="block text-xs text-muted-foreground">{styleLabel(t)}</span></span></div>
                </button>
              ))}
            </Shelf>
          </section>
        )}

        <section aria-labelledby="how-h">
          <h2 id="how-h" className="text-2xl font-bold md:text-3xl">How it works</h2>
          <Shelf className="mt-5">
            {promo.steps.map(([t, d], i) => (
              <div key={t} className="block-card flex w-[78%] shrink-0 snap-start flex-col gap-2 p-5 sm:w-[46%] md:w-[31%]">
                <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-sun font-display font-extrabold">{i + 1}</span>
                <h3 className="font-body text-[18px] font-bold leading-snug">{t}</h3><p className="text-[15px] leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </Shelf>
        </section>

        <section aria-labelledby="price-h" className="grid items-center gap-6 rounded-3xl border-2 border-ink bg-ink p-6 text-cream shadow-block-lg md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <h2 id="price-h" className="text-2xl font-bold md:text-3xl">{priceText}, <span className="text-sun">paid once</span></h2>
            <p className="mt-2 text-cream/85">Your {plainName(product.name)} {promo.audience}, live on its own link for {hosting}. Pay securely with UPI, cards or netbanking, and get your invoice by email right away.</p>
          </div>
          <Button asChild size="lg" className="h-14 px-8 text-base"><Link to={create}>{isSite ? "Build my website" : "Start making"} <ArrowRight className="h-5 w-5" /></Link></Button>
        </section>

        <section aria-labelledby="faq-h">
          <h2 id="faq-h" className="text-2xl font-bold md:text-3xl">Questions</h2>
          <Shelf className="mt-5">
            {promo.faqs.map(([q, a]) => (
              <div key={q} className="block-card flex w-[78%] shrink-0 snap-start flex-col gap-2 p-5 sm:w-[46%] md:w-[31%]">
                <h3 className="font-body text-[17px] font-bold leading-snug">{q}</h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">{a}</p>
              </div>
            ))}
          </Shelf>
        </section>

        {related.length > 0 && (
          <section aria-labelledby="rel-h">
            <h2 id="rel-h" className="text-2xl font-bold md:text-3xl">Other designs</h2>
            <Shelf className="mt-5">
              {related.map((r) => (
                <ProductCard key={r.product.id} l={r} />
              ))}
            </Shelf>
          </section>
        )}
      </main>
        </>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-2 border-ink bg-card px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 md:hidden">
        <div className="min-w-0"><p className="truncate text-xs text-muted-foreground">{product.name}</p><p className="font-bold">{priceText} <span className="text-xs font-semibold text-muted-foreground">once</span></p></div>
        <Button asChild className="ml-auto h-12 px-6"><Link to={create}>{isSite ? "Build it" : "Make it"}</Link></Button>
      </div>
    </div>
  );
}
