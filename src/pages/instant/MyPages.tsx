import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Inbox, Pencil, Plus, Share2, Trash2, EyeOff, Globe } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getProduct } from "@/instant/catalog";
import { deleteDraft, leadCounts, myPages, republish, unpublish, type PageRow } from "@/instant/api";
import { ShareKit } from "@/instant/ShareKit";
import { pageUrlFor } from "@/instant/util";

const STATUS: Record<PageRow["status"], [string, string]> = {
  draft: ["Draft", "bg-muted text-muted-foreground"], pending_payment: ["Awaiting payment", "bg-amber-100 text-amber-800"],
  published: ["Live", "bg-green-100 text-green-800"], unpublished: ["Offline", "bg-muted text-muted-foreground"], removed: ["Removed", "bg-red-100 text-red-800"],
};

export default function MyPages() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const pages = useQuery({ queryKey: ["ip-my-pages"], queryFn: myPages });
  const counts = useQuery({ queryKey: ["ip-lead-counts"], queryFn: leadCounts });
  const [sharing, setSharing] = useState<PageRow | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["ip-my-pages"] }); qc.invalidateQueries({ queryKey: ["ip-lead-counts"] }); };
  const act = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); toast({ title: ok }); refresh(); } catch (e) { toast({ title: "Couldn't do that", description: e instanceof Error ? e.message : "", variant: "destructive" }); } };

  const sp = sharing ? getProduct(sharing.product_id) : undefined;
  const st = sp?.themes.find((t) => t.id === sharing?.variant_id) ?? sp?.themes[0];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl pb-24">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold">My Pages</h1>
            <p className="text-muted-foreground">Everything you've made, with views and enquiries.</p>
          </div>
          <Button asChild className="rounded-xl"><Link to="/create"><Plus className="h-4 w-4 mr-2" /> Create</Link></Button>
        </div>
        {pages.isLoading && <p className="text-muted-foreground">Loading…</p>}
        {pages.data && pages.data.length === 0 && (
          <div className="rounded-3xl border bg-background p-10 text-center grid gap-3">
            <p className="text-lg font-semibold">No pages yet</p>
            <p className="text-muted-foreground">Make a birthday surprise, an invitation or a website for your business. It's live in minutes.</p>
            <Button asChild className="justify-self-center rounded-xl"><Link to="/create">Browse products</Link></Button>
          </div>
        )}
        <div className="grid gap-3">
          {pages.data?.map((p) => {
            const prod = getProduct(p.product_id);
            const [label, cls] = STATUS[p.status];
            const n = counts.data?.[p.id] ?? 0;
            return (
              <article key={p.id} className="rounded-2xl border bg-background p-4 md:p-5 grid gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden="true">{prod?.glyph ?? "📄"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold truncate">{p.title || prod?.name}</h2><span className={"text-xs font-semibold px-2 py-0.5 rounded-full " + cls}>{label}</span></div>
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
          {sharing && sp && st && sharing.slug && <ShareKit product={sp} theme={st} content={sharing.published_content ?? sharing.content} url={pageUrlFor(sharing.slug)} slug={sharing.slug} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
