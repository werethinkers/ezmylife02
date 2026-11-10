import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Inbox, Pencil, Plus, Share2, Trash2, EyeOff, Globe } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { fallbackTheme, getProduct } from "@/instant/catalog";
import { deleteDraft, leadCounts, myPages, republish, unpublish, type PageRow } from "@/instant/api";
import { ShareKit } from "@/instant/ShareKit";
import { pageUrlFor } from "@/instant/util";
import { useLinkPreview } from "@/instant/linkPreview";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";

const STATUS: Record<PageRow["status"], [string, string]> = {
  draft: ["Draft", "bg-muted text-muted-foreground"], pending_payment: ["Awaiting payment", "bg-amber-100 text-amber-800"],
  published: ["Live", "bg-green-100 text-green-800"], unpublished: ["Offline", "bg-muted text-muted-foreground"], removed: ["Removed", "bg-red-100 text-red-800"],
};

/**
 * What the ₹999 kit handed over: the credits, and the website and visiting card
 * that are already paid for. Shown only to someone who has bought a kit.
 * ?kit=1 means they have just come back from paying.
 */
function KitPanel({ justBought }: { justBought: boolean }) {
  const ents = useQuery({
    queryKey: ["kit-entitlements"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("kit_my_entitlements");
      if (error) throw new Error(error.message);
      return (data ?? []) as { id: string; scope: "business" | "card"; used: boolean; page_id: string | null; pick_product?: string | null; pick_theme?: string | null }[];
    },
  });
  const wallet = useWallet();

  const rows = ents.data ?? [];
  if (rows.length === 0) return null;

  const left = (scope: "business" | "card") => rows.filter((r) => r.scope === scope && !r.used).length;
  // Opens the design the influencer chose for this buyer; the buyer can still pick another there.
  const whereFor = (scope: "business" | "card", fallback: string) => {
    const r = rows.find((x) => x.scope === scope && !x.used && x.pick_product && getProduct(x.pick_product));
    if (!r?.pick_product) return fallback;
    return `/create/${r.pick_product}${r.pick_theme ? `?design=${encodeURIComponent(r.pick_theme)}` : ""}`;
  };
  const items = [
    { scope: "business" as const, title: "A website for your business", where: whereFor("business", "/websites"),
      body: "Pick any business design, add your name, photos and prices, then publish. Publishing is already paid for." },
    { scope: "card" as const, title: "A digital visiting card", where: whereFor("card", "/create/digital-visiting-card"),
      body: "Your name, number and WhatsApp on one link you can send to anyone. Publishing is already paid for." },
  ];

  return (
    <section className="mb-6 grid gap-3 rounded-3xl border-2 border-ink bg-sand/60 p-5">
      <div>
        <h2 className="font-display text-xl font-extrabold">
          {justBought ? "Thank you. Here is everything in your kit." : "Your kit"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {wallet.isLoading
            ? "Your credits are in your wallet."
            : `${wallet.total.toLocaleString("en-IN")} credits are in your wallet.`}{" "}
          These two are paid for, so publishing them costs you nothing.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => {
          const n = left(it.scope);
          return (
            <div key={it.scope} className="grid gap-2 rounded-2xl border-2 border-ink bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold">{it.title}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${n > 0 ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                  {n > 0 ? "Paid for · not made yet" : "Used"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{it.body}</p>
              {n > 0 && <Button asChild size="sm" className="w-fit"><Link to={it.where}>Make it now</Link></Button>}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Credits are spent only when an app gives you a result. Anything you make beyond these two is priced as usual.
      </p>
    </section>
  );
}

export default function MyPages() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const justBought = params.get("kit") === "1";
  const { toast } = useToast();
  const pages = useQuery({ queryKey: ["ip-my-pages"], queryFn: myPages });
  const counts = useQuery({ queryKey: ["ip-lead-counts"], queryFn: leadCounts });
  const [sharing, setSharing] = useState<PageRow | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["ip-my-pages"] }); qc.invalidateQueries({ queryKey: ["ip-lead-counts"] }); };
  const act = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); toast({ title: ok }); refresh(); } catch (e) { toast({ title: "Couldn't do that", description: e instanceof Error ? e.message : "", variant: "destructive" }); } };

  const sp = sharing ? getProduct(sharing.product_id) : undefined;
  const st = sp?.themes.find((t) => t.id === sharing?.variant_id) ?? (sp && fallbackTheme(sp));
  const { link, preparing, prefs, apply } = useLinkPreview(sharing, sp, st, false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 pb-24">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-extrabold">My websites and cards</h1>
            <p className="text-muted-foreground">Everything you've made, with views and enquiries.</p>
          </div>
          <Button asChild><Link to="/create"><Plus className="h-4 w-4" /> Make something</Link></Button>
        </div>
        <KitPanel justBought={justBought} />

        {pages.isLoading && <p className="text-muted-foreground">Loading…</p>}
        {pages.data && pages.data.length === 0 && (
          <div className="grid gap-3 rounded-3xl border-2 border-dashed border-ink/60 bg-sand/60 p-10 text-center">
            <p className="text-lg font-bold">Make your first website or card</p>
            <p className="text-muted-foreground">Make a birthday surprise, an invitation or a website for your business. It's live in minutes.</p>
            <div className="flex flex-wrap justify-center gap-2"><Button asChild><Link to="/websites">See website designs</Link></Button><Button asChild variant="outline"><Link to="/cards">See card designs</Link></Button></div>
          </div>
        )}
        <div className="grid gap-3">
          {pages.data?.map((p) => {
            const prod = getProduct(p.product_id);
            const [label, cls] = STATUS[p.status];
            const n = counts.data?.[p.id] ?? 0;
            return (
              <article key={p.id} className="grid gap-3 rounded-2xl border-2 border-ink bg-card p-4 shadow-block-sm md:p-5">
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden="true">{prod?.glyph ?? "📄"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-bold">{p.title || prod?.name}</h2><span className={"text-xs font-semibold px-2 py-0.5 rounded-full " + cls}>{label}</span></div>
                    <p className="text-sm text-muted-foreground">{prod?.name}{p.slug ? ` · ${pageUrlFor(p.slug).replace("https://", "")}` : ""}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">{p.views.toLocaleString("en-IN")} views{p.expires_at ? ` · live until ${new Date(p.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.status === "published" && p.slug && <>
                    <Button size="sm" variant="outline" asChild><a href={`/p/${p.slug}`} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4 mr-1.5" /> View</a></Button>
                    <Button size="sm" variant="outline" onClick={() => setSharing(p)}><Share2 className="h-4 w-4 mr-1.5" /> Share & QR</Button>
                  </>}
                  {prod && <Button size="sm" variant="outline" asChild><Link to={`/create/${prod.id}?page=${p.id}`}><Pencil className="h-4 w-4 mr-1.5" /> {p.status === "draft" || p.status === "pending_payment" ? "Continue" : "Edit"}</Link></Button>}
                  {p.slug && <Button size="sm" variant="outline" asChild><Link to={`/my-pages/${p.id}`}><Inbox className="h-4 w-4 mr-1.5" /> {prod?.family === "event" ? "RSVPs" : "Leads"}{n ? ` (${n} new)` : ""}</Link></Button>}
                  {p.status === "published" && <Button size="sm" variant="ghost" onClick={() => act(() => unpublish(p.id), "Page taken offline")}><EyeOff className="h-4 w-4 mr-1.5" /> Take offline</Button>}
                  {p.status === "unpublished" && <Button size="sm" variant="ghost" onClick={() => act(() => republish(p.id), "Page is live again")}><Globe className="h-4 w-4 mr-1.5" /> Put back online</Button>}
                  {(p.status === "draft" || p.status === "pending_payment") && <Button size="sm" variant="ghost" onClick={() => act(() => deleteDraft(p.id), "Draft deleted")}><Trash2 className="h-4 w-4 mr-1.5" /> Delete</Button>}
                </div>
              </article>
            );
          })}
        </div>
      </main>
      <Dialog open={!!sharing} onOpenChange={(o) => !o && setSharing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Share {sharing?.title}</DialogTitle></DialogHeader>
          {sharing && sp && st && sharing.slug && <ShareKit product={sp} theme={st} content={sharing.published_content ?? sharing.content} url={pageUrlFor(sharing.slug)} slug={sharing.slug} link={link} preparing={preparing} prefs={prefs} onSavePrefs={apply} pageId={sharing.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
