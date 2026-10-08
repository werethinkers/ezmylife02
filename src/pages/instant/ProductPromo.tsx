import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/instant/catalog";
import { GROUPS, groupOf } from "@/instant/catalog/groups";
import { ProductRenderer } from "@/instant/renderers";
import { useProducts } from "@/instant/useProducts";
import { promoFor } from "@/instant/promo";
import { inr, pageUrlFor } from "@/instant/util";

/** A promotional landing page for one product: what it is, a live sample, price, FAQ, and a way in. */
export default function ProductPromo() {
  const { productId = "" } = useParams();
  const product = getProduct(productId);
  const { list, rows } = useProducts();
  if (!product) return <Navigate to="/create" replace />;

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
      <PageSeo title={`${product.name}: make it online in minutes from ${priceText} | EZYOURLIFE`}
        description={`${product.tagline} ${promo.pitch}`.slice(0, 158)} path={`/make/${product.id}`} jsonLd={jsonLd}
        keywords={`${product.name.toLowerCase()}, online ${product.name.toLowerCase()}, ${product.category}, whatsapp, ezyourlife`} />
      <Navbar />

      <section className="relative overflow-hidden" style={{ background: `linear-gradient(150deg, ${theme.c.sf}, ${theme.c.bg})`, color: theme.c.tx }}>
        <div className="container mx-auto px-4 py-12 md:py-20 grid md:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div className="min-w-0">
            <nav className="text-sm opacity-75 mb-4" aria-label="Breadcrumb">
              <Link to="/create" className="hover:underline">Create</Link> <span aria-hidden="true">/</span>{" "}
              <Link to={`/create?cat=${product.category}${groupName ? `&type=${g}` : ""}`} className="hover:underline">{groupName ?? product.category}</Link>
            </nav>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: theme.c.ac2 }}>{promo.eyebrow}{product.seasonal ? ` · ${product.seasonal}` : ""}</p>
            <h1 className="mt-3 text-4xl md:text-6xl font-bold leading-[1.05] text-balance" style={{ fontFamily: theme.f.d }}>
              <span aria-hidden="true">{product.glyph} </span>{promo.headline}
            </h1>
            <p className="mt-4 text-lg md:text-xl opacity-90 max-w-xl">{product.tagline}</p>
            <p className="mt-3 opacity-75 max-w-xl">{promo.pitch}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to={create} className="inline-flex items-center gap-2 h-14 px-7 rounded-2xl font-semibold text-base shadow-lg" style={{ background: theme.c.ac, color: theme.c.on }}>
                Create yours now <ArrowRight className="h-5 w-5" />
              </Link>
              <span className="text-sm opacity-80"><strong className="text-lg">{priceText}</strong> · one-time · live for {hosting}</span>
            </div>
            <ul className="mt-6 grid gap-1.5 text-sm opacity-85">
              {["Ready in about 5 minutes", "Opens on any phone, no app needed", "Free edits, same link"].map((x) => (
                <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4" style={{ color: theme.c.ac }} /> {x}</li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-[340px]">
            <div className="rounded-[2.2rem] border-[9px] border-black/85 bg-black/85 shadow-2xl overflow-hidden">
              <div className="ip-frame relative h-[600px] overflow-hidden" style={{ transform: "translateZ(0)", ["--ip-vh" as string]: "600px", background: theme.c.bg }}>
                <div className="h-full overflow-y-auto overflow-x-hidden">
                  <ProductRenderer product={product} theme={theme} content={product.sample} mode="preview" pageUrl={pageUrlFor()} />
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs opacity-70">Live sample · scroll and tap around</p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-14 grid gap-16 max-w-5xl pb-28">
        <section aria-labelledby="feat-h">
          <h2 id="feat-h" className="font-display text-3xl font-bold">What you get</h2>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {promo.features.map((f) => (
              <div key={f.title} className="rounded-2xl border bg-card p-5 flex gap-4">
                <span className="text-3xl" aria-hidden="true">{f.icon}</span>
                <div><h3 className="font-semibold">{f.title}</h3><p className="text-sm text-muted-foreground mt-1">{f.text}</p></div>
              </div>
            ))}
          </div>
        </section>

        {product.themes.length > 1 && (
          <section aria-labelledby="style-h">
            <h2 id="style-h" className="font-display text-3xl font-bold">{product.themes.length} styles to choose from</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {product.themes.map((t) => (
                <div key={t.id} className="rounded-2xl border overflow-hidden w-[150px]">
                  <div className="h-20 relative" style={{ background: `linear-gradient(140deg, ${t.c.sf}, ${t.c.bg})` }}>
                    <span className="absolute left-3 bottom-2 flex gap-1">{[t.c.ac, t.c.ac2, t.c.ac3].map((c) => <i key={c} className="h-4 w-4 rounded-full border border-white/40" style={{ background: c }} />)}</span>
                  </div>
                  <p className="px-3 py-2 text-sm font-medium">{t.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="how-h">
          <h2 id="how-h" className="font-display text-3xl font-bold">How it works</h2>
          <ol className="mt-6 grid md:grid-cols-3 gap-4">
            {promo.steps.map(([t, d], i) => (
              <li key={t} className="rounded-2xl border bg-card p-5">
                <span className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold">{i + 1}</span>
                <h3 className="mt-3 font-semibold">{t}</h3><p className="text-sm text-muted-foreground mt-1">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="price-h" className="rounded-3xl border bg-muted/40 p-6 md:p-10 grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <h2 id="price-h" className="font-display text-3xl font-bold">{priceText}, one time</h2>
            <p className="mt-2 text-muted-foreground">Your {product.name.toLowerCase()} {promo.audience}, live on its own link for {hosting}. Pay securely with UPI, cards or netbanking, and get your invoice by email right away.</p>
          </div>
          <Button asChild size="lg" className="h-14 rounded-2xl px-8 text-base"><Link to={create}>Start creating <ArrowRight className="h-5 w-5 ml-2" /></Link></Button>
        </section>

        <section aria-labelledby="faq-h">
          <h2 id="faq-h" className="font-display text-3xl font-bold">Questions</h2>
          <div className="mt-6 grid gap-3">
            {promo.faqs.map(([q, a]) => (
              <details key={q} className="rounded-2xl border bg-card p-5 group">
                <summary className="font-semibold cursor-pointer list-none flex justify-between gap-4">{q}<span className="text-muted-foreground group-open:rotate-45 transition-transform" aria-hidden="true">+</span></summary>
                <p className="mt-3 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section aria-labelledby="rel-h">
            <h2 id="rel-h" className="font-display text-3xl font-bold">You may also like</h2>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map(({ product: r, price: rp }) => (
                <Link key={r.id} to={`/make/${r.id}`} className="rounded-2xl border bg-card p-4 hover:shadow-lg transition-shadow">
                  <span className="text-3xl" aria-hidden="true">{r.glyph}</span>
                  <p className="mt-2 font-semibold leading-tight">{r.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{rp ? inr(rp) : "Free"}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-background/95 backdrop-blur border-t px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] flex items-center gap-3">
        <div className="min-w-0"><p className="text-xs text-muted-foreground truncate">{product.name}</p><p className="font-bold">{priceText}</p></div>
        <Button asChild className="ml-auto h-12 rounded-xl px-6"><Link to={create}>Create yours</Link></Button>
      </div>
    </div>
  );
}
