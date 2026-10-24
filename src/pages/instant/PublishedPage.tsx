import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/instant/catalog";
import { ProductRenderer } from "@/instant/renderers";
import { getPublicPage, recordHit } from "@/instant/api";
import { pageUrlFor } from "@/instant/util";
import { describe } from "@/instant/meta";
import { resolveImg } from "@/instant/parts";

const MARK = "data-ip-meta";
function setMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); el.setAttribute(MARK, ""); document.head.appendChild(el); }
  el.setAttribute("content", value);
}

export default function PublishedPage() {
  const { slug = "" } = useParams();
  const q = useQuery({ queryKey: ["ip-public", slug], queryFn: () => getPublicPage(slug), staleTime: 60_000, retry: 1 });
  const page = q.data;
  const product = page ? getProduct(page.product_id) : undefined;
  const theme = product ? product.themes.find((t) => t.id === page?.variant_id) ?? product.themes[0] : undefined;

  useEffect(() => { if (page) recordHit(slug); }, [page, slug]);

  // A page with its own subdomain (<slug>.ezyourlife.com, see supabase/functions/_shared/sharepage.ts)
  // shows this page inside it. Opened directly here, move to the subdomain once it answers, so the
  // address people copy is the one whose link preview shows the page.
  useEffect(() => {
    const own = page?.share_url;
    if (!own || !/^https:\/\/[a-z0-9-]+\.ezyourlife\.com\/$/.test(own) || window.top !== window.self) return;
    let live = true;
    fetch(own, { cache: "no-store" }).then((r) => { if (live && r.ok) location.replace(own + location.search); }, () => undefined);
    return () => { live = false; };
  }, [page?.share_url]);

  useEffect(() => {
    if (!page || !product || !theme) return;
    const c = page.content ?? {};
    const { title, desc } = describe(product, c);
    const url = pageUrlFor(slug);
    const prevTitle = document.title;
    document.title = title;
    setMeta("name", "description", desc);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", product.indexable ? "website" : "article");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "theme-color", theme.c.bg);
    setMeta("name", "robots", product.indexable ? "index,follow" : "noindex,nofollow");
    const img = [c.gallery?.[0]?.photo, c.photo, c.cover, c.memories?.[0]?.photo].map((x) => resolveImg(x)).find((x) => x && x.startsWith("http"));
    const og = page.og_image || img;
    if (og) setMeta("property", "og:image", og);
    let ld: HTMLScriptElement | null = null;
    if (product.family === "business" || product.family === "menu") {
      ld = document.createElement("script"); ld.type = "application/ld+json"; ld.setAttribute(MARK, "");
      ld.text = JSON.stringify({
        "@context": "https://schema.org", "@type": product.family === "menu" ? "Restaurant" : "LocalBusiness", name: c.name, description: c.tagline, url,
        telephone: c.phone ? `+91${String(c.phone).replace(/\D/g, "").slice(-10)}` : undefined,
        address: c.address ? { "@type": "PostalAddress", streetAddress: c.address, addressLocality: c.city || c.area, addressCountry: "IN" } : undefined,
        ...(c.rating && c.reviews_count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: c.rating, reviewCount: c.reviews_count } } : {}),
      });
      document.head.appendChild(ld);
    }
    return () => { document.title = prevTitle; ld?.remove(); setMeta("name", "robots", "index,follow"); };
  }, [page, product, theme, slug]);

  if (q.isLoading) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-4 border-muted border-t-primary animate-spin" aria-label="Loading" /></div>;
  if (!page || !product || !theme) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center bg-background">
        <div className="grid gap-4 max-w-sm">
          <p className="text-5xl" aria-hidden="true">🔗</p>
          <h1 className="text-2xl font-bold">This page isn't available</h1>
          <p className="text-muted-foreground">The link may be mistyped, or the owner has taken the page down.</p>
          <Link to="/create" className="inline-flex justify-center rounded-xl bg-primary text-primary-foreground h-12 items-center px-5 font-semibold">Make your own page</Link>
        </div>
      </div>
    );
  }
  return <ProductRenderer product={product} theme={theme} content={page.content ?? {}} mode="live" slug={slug} pageUrl={pageUrlFor(slug)} />;
}

