import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/instant/catalog";
import { GROUPS, groupOf } from "@/instant/catalog/groups";
import { ProductRenderer } from "@/instant/renderers";
import { useProducts } from "@/instant/useProducts";
import { promoFor, promoSeo } from "@/instant/promo";
import { inr, pageUrlFor } from "@/instant/util";
import { FlowSteps } from "@/components/brand/FlowSteps";
import { GiveGet } from "@/components/brand/GiveGet";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";

/** A promotional landing page for one product: what it is, a live sample, price, FAQ, and a way in. */
export default function ProductPromo() {
  const { productId = "" } = useParams();
  const product = getProduct(productId);
  const { list, rows } = useProducts();
  if (!product) return <Navigate to="/websites" replace />;

  const row = rows.get(product.id);
  if (row && !row.is_active) return <Navigate to="/create" replace />;
  const price = row?.price_inr ?? product.price;
  const days = row?.hosting_days ?? 365;
  const promo = promoFor(product);
  const theme = product.themes[0];
  const g = groupOf(product.id);
  const related = list.filter((l) => l.product.id !== product.id && l.product.category === product.category)
    .sort((a, b) => Number(groupOf(b.product.id) === g) - Number(groupOf(a.product.id) === g)).slice(0, 4);
  const groupName = GROUPS[product.category].find((x) => x.id === g)?.name;
  const create = `/create/${product.id}`;
  const priceText = price ? inr(price) : "Free";
  const isSite = (WEBSITE_CATEGORIES as readonly string[]).includes(product.category);
  const home = isSite ? "/websites" : "/cards";
  const hosting = days >= 365 ? `${Math.round(days / 365)} year${days >= 730 ? "s" : ""}` : `${days} days`;

  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "Product", name: `${product.name} | EZYOURLIFE`, description: promo.pitch,
      brand: { "@type": "Brand", name: "EZYOURLIFE" }, url: `https://ezyourlife.com/make/${product.id}`,
      offers: { "@type": "Offer", price: String(price), priceCurrency: "INR", availability: "https://schema.org/InStock", url: `https://ezyourlife.com${create}` },
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

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-3xl border-2 border-ink shadow-block-lg" style={{ background: theme.c.bg, color: theme.c.tx }}>
          <div className="grid items-center gap-10 p-6 md:grid-cols-[1.1fr_1fr] md:p-10">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: theme.c.ac2 }}>{promo.eyebrow}{product.seasonal ? ` · ${product.seasonal}` : ""}</p>
              <h1 className="mt-3 text-4xl font-bold leading-[1.05] text-balance md:text-6xl" style={{ fontFamily: theme.f.d }}>
                <span aria-hidden="true">{product.glyph} </span>{promo.headline}
              </h1>
              <p className="mt-4 max-w-xl text-lg opacity-90 md:text-xl">{product.tagline}</p>
              <p className="mt-3 max-w-xl opacity-80">{promo.pitch}</p>
              <ul className="mt-6 grid gap-1.5 text-sm opacity-90">
                {["Ready in about 5 minutes", "Opens on any phone, no app needed", "Free edits, same link"].map((x) => (
                  <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4" style={{ color: theme.c.ac }} /> {x}</li>
                ))}
              </ul>
            </div>
            <div className="mx-auto w-full max-w-[340px]">
              <div className="overflow-hidden rounded-[2.2rem] border-[9px] border-ink bg-ink shadow-block">
                <div className="ip-frame relative h-[560px] overflow-hidden" style={{ transform: "translateZ(0)", ["--ip-vh" as string]: "560px", background: theme.c.bg }}>
                  <div className="h-full overflow-y-auto overflow-x-hidden">
                    <ProductRenderer product={product} theme={theme} content={product.sample} mode="preview" pageUrl={pageUrlFor()} />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs opacity-75">Live sample · scroll and tap around</p>
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

      <main className="mx-auto grid max-w-5xl gap-14 px-4 py-10 pb-28">
        <section aria-labelledby="feat-h">
          <h2 id="feat-h" className="text-2xl font-bold md:text-3xl">What you get</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {promo.features.map((f) => (
              <div key={f.title} className="block-card flex gap-4 p-5">
                <span className="text-3xl" aria-hidden="true">{f.icon}</span>
                <div><h3 className="font-body text-[17px] font-bold">{f.title}</h3><p className="mt-1 text-[15px] text-muted-foreground">{f.text}</p></div>
              </div>
            ))}
          </div>
        </section>

        {product.themes.length > 1 && (
          <section aria-labelledby="style-h">
            <h2 id="style-h" className="text-2xl font-bold md:text-3xl">{product.themes.length} styles to choose from</h2>
            <div className="mt-6 flex flex-wrap gap-4">
              {product.themes.map((t) => (
                <div key={t.id} className="w-[150px] overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-block-sm">
                  <div className="relative h-20 border-b-2 border-ink" style={{ background: t.c.bg }}>
                    <span className="absolute bottom-2 left-3 flex gap-1">{[t.c.ac, t.c.ac2, t.c.ac3].map((c) => <i key={c} className="h-4 w-4 rounded-full border-2 border-ink" style={{ background: c }} />)}</span>
                  </div>
                  <p className="px-3 py-2 text-sm font-semibold">{t.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="how-h">
          <h2 id="how-h" className="text-2xl font-bold md:text-3xl">How it works</h2>
          <ol className="mt-6 grid gap-5 md:grid-cols-3">
            {promo.steps.map(([t, d], i) => (
              <li key={t} className="block-card p-5">
                <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-sun font-display font-extrabold">{i + 1}</span>
                <h3 className="mt-3 font-body text-[17px] font-bold">{t}</h3><p className="mt-1 text-[15px] text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="price-h" className="grid items-center gap-6 rounded-3xl border-2 border-ink bg-ink p-6 text-cream shadow-block-lg md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <h2 id="price-h" className="text-2xl font-bold md:text-3xl">{priceText}, <span className="text-sun">paid once</span></h2>
            <p className="mt-2 text-cream/85">Your {product.name.toLowerCase()} {promo.audience}, live on its own link for {hosting}. Pay securely with UPI, cards or netbanking, and get your invoice by email right away.</p>
          </div>
          <Button asChild size="lg" className="h-14 px-8 text-base"><Link to={create}>{isSite ? "Build my website" : "Start making"} <ArrowRight className="h-5 w-5" /></Link></Button>
        </section>

        <section aria-labelledby="faq-h">
          <h2 id="faq-h" className="text-2xl font-bold md:text-3xl">Questions</h2>
          <div className="mt-6 grid gap-3">
            {promo.faqs.map(([q, a]) => (
              <details key={q} className="group rounded-2xl border-2 border-ink bg-card p-5">
                <summary className="flex cursor-pointer list-none justify-between gap-4 font-bold">{q}<span className="text-xl leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary>
                <p className="mt-3 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section aria-labelledby="rel-h">
            <h2 id="rel-h" className="text-2xl font-bold md:text-3xl">Other designs</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map(({ product: r, price: rp }) => (
                <Link key={r.id} to={`/make/${r.id}`} className="block-card block-lift p-4">
                  <span className="text-3xl" aria-hidden="true">{r.glyph}</span>
                  <p className="mt-2 font-bold leading-tight">{r.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{rp ? `${inr(rp)} once` : "Free"}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-2 border-ink bg-card px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 md:hidden">
        <div className="min-w-0"><p className="truncate text-xs text-muted-foreground">{product.name}</p><p className="font-bold">{priceText} <span className="text-xs font-semibold text-muted-foreground">once</span></p></div>
        <Button asChild className="ml-auto h-12 px-6"><Link to={create}>{isSite ? "Build it" : "Make it"}</Link></Button>
      </div>
    </div>
  );
}
