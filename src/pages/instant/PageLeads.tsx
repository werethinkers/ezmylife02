import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Phone } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/instant/catalog";
import { getMyPage, leadsFor, setLeadStatus, type LeadRow } from "@/instant/api";
import { fmtPhone, telHref, waTo } from "@/instant/util";

const STATUSES: LeadRow["status"][] = ["new", "contacted", "converted", "closed"];

export default function PageLeads() {
  const { pageId = "" } = useParams();
  const qc = useQueryClient();
  const page = useQuery({ queryKey: ["ip-page", pageId], queryFn: () => getMyPage(pageId) });
  const leads = useQuery({ queryKey: ["ip-leads", pageId], queryFn: () => leadsFor(pageId) });
  const prod = page.data ? getProduct(page.data.product_id) : undefined;
  const c = page.data?.published_content ?? page.data?.content ?? {};
  const owner = String(c.name || c.hosts || page.data?.title || "");

  const change = async (id: string, s: LeadRow["status"]) => { await setLeadStatus(id, s); qc.invalidateQueries({ queryKey: ["ip-leads", pageId] }); qc.invalidateQueries({ queryKey: ["ip-lead-counts"] }); };
  const exportCsv = () => {
    const rows = [["Date", "Type", "Name", "Phone", "Message", "Details", "Status"], ...(leads.data ?? []).map((l) => [new Date(l.created_at).toLocaleString("en-IN"), l.kind, l.name, "+91" + l.phone, l.message ?? "", JSON.stringify(l.context), l.status])];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const u = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" })); const a = document.createElement("a"); a.href = u; a.download = `${page.data?.slug ?? "leads"}-leads.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000);
  };
  const replyText = (l: LeadRow) => l.kind === "rsvp" ? `Hi ${l.name.split(" ")[0]}, thank you for your RSVP for ${owner}! Looking forward to seeing you.` : `Hi ${l.name.split(" ")[0]}, this is ${owner}. Thanks for your enquiry${l.context?.offer ? ` about our ${String(l.context.offer).toLowerCase()}` : ""}. When is a good time to talk?`;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl pb-24">
        <Link to="/my-pages" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4"><ArrowLeft className="h-4 w-4" /> My websites and cards</Link>
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold">{prod?.family === "event" ? "RSVPs" : "Leads"}</h1>
            <p className="text-muted-foreground">{page.data?.title} · {leads.data?.length ?? 0} total</p>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={exportCsv} disabled={!leads.data?.length}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
        </div>
        {leads.data?.length === 0 && <div className="rounded-3xl border bg-background p-10 text-center text-muted-foreground">Nothing yet. Share your page and QR code, and enquiries will appear here.</div>}
        <div className="grid gap-3">
          {leads.data?.map((l) => (
            <article key={l.id} className="rounded-2xl border bg-background p-4 grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{l.name} <span className="text-xs font-medium text-muted-foreground uppercase ml-1">{l.kind}</span></p>
                  <p className="text-sm tabular-nums">{fmtPhone(l.phone)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>
                </div>
                <select value={l.status} onChange={(e) => change(l.id, e.target.value as LeadRow["status"])} className="h-9 rounded-lg border bg-background px-2 text-sm capitalize" aria-label="Status">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {(l.message || Object.keys(l.context ?? {}).length > 0) && (
                <div className="text-sm rounded-xl bg-muted/40 p-3 grid gap-1">
                  {l.message && <p>{l.message}</p>}
                  {Object.entries(l.context ?? {}).filter(([, v]) => typeof v !== "object").map(([k, v]) => <p key={k} className="text-muted-foreground"><span className="capitalize">{k}</span>: {String(v)}</p>)}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" asChild className="bg-[#25D366] text-[#06260F] hover:bg-[#3BE277]"><a href={waTo(l.phone, replyText(l))} target="_blank" rel="noopener noreferrer" onClick={() => l.status === "new" && change(l.id, "contacted")}>WhatsApp</a></Button>
                <Button size="sm" variant="outline" asChild><a href={telHref(l.phone)} onClick={() => l.status === "new" && change(l.id, "contacted")}><Phone className="h-4 w-4 mr-1.5" /> Call</a></Button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
