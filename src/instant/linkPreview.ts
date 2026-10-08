import { useEffect, useRef, useState } from "react";
import type { Product, Theme } from "./types";
import { checkout, setOgImage, uploadDataUrl, type PageRow } from "./api";
import { drawShareCard } from "./shareImage";
import { describe } from "./meta";
import { pageUrlFor } from "./util";

/**
 * Makes a published page's link preview its own: draws the 1200×630 card from what the creator
 * picked, stores it as the page's og_image, and asks the server to (re)write the share page that
 * WhatsApp/Facebook read. Returns the share link, or null when share pages aren't set up yet.
 */
export async function refreshLinkPreview(page: PageRow, product: Product, theme: Theme): Promise<string | null> {
  if (page.status !== "published" || !page.slug) return null;
  const content = page.published_content ?? page.content ?? {};
  const cv = await drawShareCard(product, theme, content, pageUrlFor(page.slug), "Link preview");
  const og = await uploadDataUrl(page.owner_id, page.id, cv.toDataURL("image/jpeg", 0.86));
  await setOgImage(page.id, og);
  const { title, desc } = describe(product, content);
  const r = await checkout({ action: "share", page_id: page.id, product_id: product.id, title, description: desc });
  return (r?.share_url as string | null) ?? null;
}

/**
 * GitHub Pages takes about a minute to put a new share page online, and WhatsApp remembers a link's
 * preview from the first time it reads it. So a brand-new share link is only handed out once it
 * answers; until then the page's own link is used. Gives up waiting after two minutes.
 */
async function waitUntilLive(url: string, stop: () => boolean): Promise<void> {
  const until = Date.now() + 120_000;
  while (Date.now() < until && !stop()) {
    try { if ((await fetch(url, { cache: "no-store" })).ok) return; } catch { /* not reachable yet */ }
    await new Promise((r) => setTimeout(r, 5000));
  }
}

/** Runs refreshLinkPreview once for a page (always, or only while it has no share link yet).
 *  link: the share link to send (null until ready); preparing: a preview is being set up. */
export function useLinkPreview(page: PageRow | null, product: Product | undefined, theme: Theme | undefined, always: boolean) {
  const [link, setLink] = useState<string | null>(page?.share_url ?? null);
  const [preparing, setPreparing] = useState(false);
  const done = useRef<string | null>(null);
  const live = page?.status === "published" && !!page.slug;
  useEffect(() => {
    let stopped = false;
    setLink(page?.share_url ?? null);
    if (!page || !live || !product || !theme || done.current === page.id) return;
    if (!always && page.share_url) return;
    done.current = page.id;
    const hadLink = !!page.share_url; // an existing share link keeps working while it is refreshed
    if (!hadLink) setPreparing(true);
    refreshLinkPreview(page, product, theme)
      .then(async (u) => {
        if (!u) return;
        if (!hadLink) await waitUntilLive(u, () => stopped);
        if (!stopped) setLink(u);
      }, (e) => console.warn("link preview", e))
      .finally(() => { if (!stopped) setPreparing(false); });
    return () => { stopped = true; done.current = null; };
  }, [page, live, product, theme, always]);
  return { link, preparing };
}
