import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, ExternalLink, Download, Search, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const SITE_RESOURCE = "https://ezyourlife.com/";

interface GscRow {
  url: string;
  coverage_state: string | null;
  indexing_state: string | null;
  page_fetch_state: string | null;
  robots_state: string | null;
  last_crawl_time: string | null;
  last_checked_at: string | null;
}

type Filter = "all" | "indexed" | "not_indexed" | "errors" | "unchecked";

const gscDeepLink = (url: string) =>
  `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(SITE_RESOURCE)}&id=${encodeURIComponent(url)}`;

const verdict = (r: GscRow): "indexed" | "not_indexed" | "errors" | "unchecked" => {
  if (!r.last_checked_at) return "unchecked";
  if (r.page_fetch_state && r.page_fetch_state !== "SUCCESSFUL") return "errors";
  const cs = (r.coverage_state || "").toLowerCase();
  if (cs.startsWith("submitted and indexed") || cs === "indexed, not submitted in sitemap") return "indexed";
  if (cs.includes("error") || cs.includes("excluded")) return "errors";
  return "not_indexed";
};

export const AdminSeoIndexing = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["gsc-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gsc_url_status")
        .select("*")
        .order("last_checked_at", { ascending: true, nullsFirst: true })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as GscRow[];
    },
  });

  const stats = useMemo(() => {
    const s = { total: rows.length, indexed: 0, not_indexed: 0, errors: 0, unchecked: 0 };
    rows.forEach((r) => { s[verdict(r)] += 1; });
    return s;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && verdict(r) !== filter) return false;
      if (q && !r.url.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, filter, search]);

  const toggleSel = (url: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(url)) n.delete(url); else n.add(url);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.slice(0, 50).map((r) => r.url)));
  };

  const syncSitemap = async () => {
    setBusy(true);
    try {
      const resp = await fetch("/sitemap.xml", { cache: "no-cache" });
      const xml = await resp.text();
      const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].trim());
      if (!urls.length) throw new Error("No URLs found in sitemap.xml");
      const existing = new Set(rows.map((r) => r.url));
      const missing = urls.filter((u) => !existing.has(u));
      if (missing.length) {
        const { error } = await supabase
          .from("gsc_url_status")
          .insert(missing.map((url) => ({ url })));
        if (error) throw error;
      }
      toast({ title: "Sitemap synced", description: `${urls.length} URLs in sitemap · ${missing.length} new added` });
      qc.invalidateQueries({ queryKey: ["gsc-status"] });
    } catch (e) {
      toast({ title: "Sync failed", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const inspectUrls = async (urls: string[]) => {
    if (!urls.length) { toast({ title: "Select URLs first" }); return; }
    if (urls.length > 50) urls = urls.slice(0, 50);
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("gsc-inspect-urls", { body: { urls } });
      if (error) throw error;
      const oks = (data?.results ?? []).filter((r: any) => r.ok).length;
      toast({ title: "Inspection complete", description: `${oks}/${urls.length} successful` });
      qc.invalidateQueries({ queryKey: ["gsc-status"] });
      setSelected(new Set());
    } catch (e) {
      toast({ title: "Inspection failed", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const inspectOldest = () => {
    const targets = [...rows]
      .sort((a, b) => {
        const ta = a.last_checked_at ? new Date(a.last_checked_at).getTime() : 0;
        const tb = b.last_checked_at ? new Date(b.last_checked_at).getTime() : 0;
        return ta - tb;
      })
      .slice(0, 25)
      .map((r) => r.url);
    inspectUrls(targets);
  };

  const exportCsv = () => {
    const header = "url,verdict,coverage_state,indexing_state,page_fetch_state,last_crawl_time,last_checked_at\n";
    const body = rows
      .map((r) => [r.url, verdict(r), r.coverage_state ?? "", r.indexing_state ?? "", r.page_fetch_state ?? "", r.last_crawl_time ?? "", r.last_checked_at ?? ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gsc-status-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <StatCard label="Tracked URLs" value={stats.total} />
        <StatCard label="Indexed" value={stats.indexed} tone="success" />
        <StatCard label="Not indexed" value={stats.not_indexed} tone="warning" />
        <StatCard label="Errors" value={stats.errors} tone="danger" />
        <StatCard label="Unchecked" value={stats.unchecked} tone="muted" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google Search Console — indexing tracker</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tracks every URL in <code>/sitemap.xml</code>. Google has no public "force index" API for web pages — use
            "Open in GSC" to request indexing manually (one click, prefilled).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={syncSitemap} disabled={busy} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Sync sitemap → DB
            </Button>
            <Button onClick={inspectOldest} disabled={busy || rows.length === 0} variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" /> Inspect 25 oldest
            </Button>
            <Button onClick={() => inspectUrls([...selected])} disabled={busy || selected.size === 0} size="sm">
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Inspect selected ({selected.size})
            </Button>
            <Button onClick={exportCsv} variant="outline" size="sm" disabled={!rows.length}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {(["all", "indexed", "not_indexed", "errors", "unchecked"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs border transition ${
                  filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted/60"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter URLs…" className="pl-9 h-8" />
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading…</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="p-2 w-8">
                      <Checkbox checked={selected.size > 0 && selected.size === Math.min(filtered.length, 50)} onCheckedChange={toggleAll} />
                    </th>
                    <th className="p-2 text-left">URL</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Last crawl</th>
                    <th className="p-2 text-left">Last checked</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.slice(0, 500).map((r) => {
                    const v = verdict(r);
                    return (
                      <tr key={r.url} className="hover:bg-muted/30">
                        <td className="p-2"><Checkbox checked={selected.has(r.url)} onCheckedChange={() => toggleSel(r.url)} /></td>
                        <td className="p-2 max-w-[400px] truncate"><a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{r.url.replace(SITE_RESOURCE.slice(0, -1), "")}</a></td>
                        <td className="p-2"><VerdictBadge v={v} coverage={r.coverage_state} /></td>
                        <td className="p-2 text-xs text-muted-foreground">{r.last_crawl_time ? format(new Date(r.last_crawl_time), "MMM d, yyyy") : "—"}</td>
                        <td className="p-2 text-xs text-muted-foreground">{r.last_checked_at ? format(new Date(r.last_checked_at), "MMM d, HH:mm") : "—"}</td>
                        <td className="p-2 text-right">
                          <a
                            href={gscDeepLink(r.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Open in GSC <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                  {!filtered.length && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No URLs. Click "Sync sitemap → DB" to populate.</td></tr>
                  )}
                </tbody>
              </table>
              {filtered.length > 500 && (
                <p className="text-xs text-center text-muted-foreground py-2 border-t">Showing first 500 of {filtered.length}. Filter to narrow.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "warning" | "danger" | "muted" }) => {
  const colors = {
    default: "",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-rose-600 dark:text-rose-400",
    muted: "text-muted-foreground",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold mt-1 ${colors[tone]}`}>{value}</p>
      </CardContent>
    </Card>
  );
};

const VerdictBadge = ({ v, coverage }: { v: ReturnType<typeof verdict>; coverage: string | null }) => {
  if (v === "indexed") return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Indexed</Badge>;
  if (v === "errors") return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />{coverage || "Error"}</Badge>;
  if (v === "unchecked") return <Badge variant="outline">Unchecked</Badge>;
  return <Badge variant="outline" className="border-amber-500/40 text-amber-600"><AlertCircle className="h-3 w-3 mr-1" />{coverage || "Not indexed"}</Badge>;
};

export default AdminSeoIndexing;
