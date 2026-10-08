import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/instant/catalog";
import { getMyPage, type PageRow } from "@/instant/api";
import { ShareKit } from "@/instant/ShareKit";
import { pageUrlFor } from "@/instant/util";
import { useConfetti } from "@/instant/parts";

export default function PublishDone() {
  const { pageId = "" } = useParams();
  const [page, setPage] = useState<PageRow | null>(null);
  const [tries, setTries] = useState(0);
  const { ref, burst } = useConfetti();

  // After payment the webhook may publish a few seconds later, so wait for it.
  useEffect(() => {
    let stop = false;
    const load = async () => {
      const row = await getMyPage(pageId).catch(() => null);
      if (stop) return;
      setPage(row);
      if (row && row.status !== "published" && tries < 40) setTimeout(() => setTries((t) => t + 1), 3000);
    };
    load();
    return () => { stop = true; };
  }, [pageId, tries]);

  const live = page?.status === "published" && page.slug;
  useEffect(() => { if (live) setTimeout(() => burst(undefined, undefined, 160, 1.6), 250); }, [live, burst]);

  const product = page ? getProduct(page.product_id) : undefined;
  const theme = product?.themes.find((t) => t.id === page?.variant_id) ?? product?.themes[0];
  const content = page?.published_content ?? page?.content ?? {};

  return (
    <div className="min-h-screen bg-muted/30 relative">
      <canvas ref={ref} className="fixed inset-0 w-full h-full pointer-events-none z-50" aria-hidden="true" />
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-xl grid gap-6 pb-24">
        {!page && <div className="grid place-items-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
        {page && !live && (
          <div className="rounded-3xl border bg-background p-8 grid gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Confirming your payment…</h1>
            <p className="text-muted-foreground">This usually takes a few seconds. You can leave this page; it will be in My Pages as soon as Razorpay confirms.</p>
            {tries >= 40 && <p className="text-sm">Still waiting. If money was deducted, it will reflect shortly or be refunded by Razorpay automatically. <Link to="/my-pages" className="underline">Go to My Pages</Link></p>}
          </div>
        )}
        {live && product && theme && (
          <>
            <div className="rounded-3xl border bg-background p-6 md:p-8 grid gap-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <h1 className="font-display text-3xl font-bold">It's live!</h1>
              <p className="text-muted-foreground">Your {product.name.toLowerCase()} is published. Send it now.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="h-12 rounded-xl"><a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-2" /> Open page</a></Button>
                <Button asChild variant="outline" className="h-12 rounded-xl"><Link to="/my-pages">My Pages</Link></Button>
              </div>
            </div>
            <div className="rounded-3xl border bg-background p-6 md:p-8">
              <ShareKit product={product} theme={theme} content={content} url={pageUrlFor(page.slug)} slug={page.slug!} />
            </div>
            <p className="text-center text-sm text-muted-foreground">Need a change? <Link className="underline" to={`/create/${product.id}?page=${page.id}`}>Edit it</Link> any time. Updates are free.</p>
            <Button asChild variant="ghost"><Link to="/create">Make something else</Link></Button>
          </>
        )}
      </main>
    </div>
  );
}
