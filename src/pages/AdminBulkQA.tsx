// QA: run Bulk Mode (client-side) on a single sample image for every Pi7 tool ID.
// Edge-mode tools are skipped (would charge credits) and shown as "skipped (edge)".
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, XCircle, MinusCircle, PlayCircle, Upload } from "lucide-react";
import { BULK_TOOLS, defaultBulkParams } from "@/data/bulkTools";
import { processOne } from "@/lib/bulkClientImageOps";

type Status = "pending" | "running" | "ok" | "fail" | "skipped";
interface Row {
  id: string;
  name: string;
  mode: "client" | "edge";
  status: Status;
  ms?: number;
  error?: string;
  previewUrl?: string;
  outBytes?: number;
}

function makeSampleImage(): Promise<File> {
  // Generate a 320x240 PNG with a gradient + text — enough for every op.
  const c = document.createElement("canvas");
  c.width = 320; c.height = 240;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 320, 240);
  g.addColorStop(0, "#7c3aed"); g.addColorStop(1, "#06b6d4");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 320, 240);
  ctx.fillStyle = "#fff"; ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center"; ctx.fillText("EZYOURLIFE QA", 160, 130);
  return new Promise((res) => c.toBlob((b) => res(new File([b!], "sample.png", { type: "image/png" })), "image/png"));
}

const AdminBulkQA = ({ embedded = false }: { embedded?: boolean } = {}) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState("");
  const [sampleFile, setSampleFile] = useState<File | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) { navigate("/"); return; }
      setAllowed(true);
      setChecking(false);
      const initial: Row[] = Object.values(BULK_TOOLS).map((c) => ({
        id: c.toolId, name: c.toolName, mode: c.mode, status: "pending",
      }));
      initial.sort((a, b) => a.id.localeCompare(b.id));
      setRows(initial);
    })();
  }, [user, authLoading, navigate]);

  const counts = useMemo(() => {
    const o = { ok: 0, fail: 0, skipped: 0, pending: 0, running: 0, total: rows.length };
    for (const r of rows) o[r.status]++;
    return o;
  }, [rows]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.id.includes(q) || r.name.toLowerCase().includes(q));
  }, [rows, filter]);

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((s) => s.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const runAll = async () => {
    if (running) return;
    setRunning(true);
    const sample = sampleFile ?? (await makeSampleImage());
    for (const r of rows) {
      const cfg = BULK_TOOLS[r.id];
      if (!cfg) { updateRow(r.id, { status: "fail", error: "no config" }); continue; }
      if (cfg.mode === "edge") { updateRow(r.id, { status: "skipped", error: "edge mode (charges credits)" }); continue; }
      updateRow(r.id, { status: "running" });
      const t0 = performance.now();
      try {
        const params = defaultBulkParams(cfg);
        const result = await processOne(r.id, sample, params);
        const ms = Math.round(performance.now() - t0);
        if (result) {
          const url = URL.createObjectURL(result.blob);
          updateRow(r.id, { status: "ok", ms, previewUrl: url, outBytes: result.blob.size });
        } else {
          // ops without an image output (e.g. metadata/csv); treat as ok
          updateRow(r.id, { status: "ok", ms, error: "non-image output (csv/aggregated)" });
        }
      } catch (e: any) {
        updateRow(r.id, { status: "fail", error: e?.message || String(e), ms: Math.round(performance.now() - t0) });
      }
      // yield to UI
      await new Promise((r) => setTimeout(r, 0));
    }
    setRunning(false);
  };

  const exportCsv = () => {
    const header = "tool_id,name,mode,status,ms,error";
    const body = rows.map((r) => `"${r.id}","${r.name}",${r.mode},${r.status},${r.ms ?? ""},"${(r.error ?? "").replace(/"/g, "'")}"`).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bulk-qa-${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
  };

  if (checking) return <div className={embedded ? "flex items-center justify-center py-16" : "flex items-center justify-center min-h-screen"}><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!allowed) return null;

  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      {!embedded && <Navbar />}
      <div className={embedded ? "" : "container mx-auto pt-24 pb-16 px-4 max-w-6xl"}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Bulk Mode QA Checklist</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Runs each Pi7 / native tool with a sample image and records success/fail.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={running}>Export CSV</Button>
            <Button onClick={runAll} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
              Run all ({rows.length})
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="py-4 flex flex-wrap gap-4 items-center">
            <Badge variant="default" className="bg-emerald-600">OK {counts.ok}</Badge>
            <Badge variant="destructive">Fail {counts.fail}</Badge>
            <Badge variant="secondary">Skipped {counts.skipped}</Badge>
            <Badge variant="outline">Pending {counts.pending}</Badge>
            <Badge variant="outline">Running {counts.running}</Badge>
            <div className="flex-1" />
            <label className="flex items-center gap-2 text-sm cursor-pointer text-muted-foreground hover:text-foreground">
              <Upload className="h-4 w-4" />
              {sampleFile ? sampleFile.name : "Use custom sample image"}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && setSampleFile(e.target.files[0])} />
            </label>
            <Input placeholder="Filter…" className="w-48" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Tools ({visible.length})</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {visible.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-accent/30 border-b border-border/50 last:border-0">
                <StatusIcon status={r.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium truncate">{r.name}</span>
                    <Badge variant="outline" className="text-[10px]">{r.mode}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.id}{r.ms != null && ` · ${r.ms}ms`}{r.outBytes && ` · ${(r.outBytes / 1024).toFixed(0)}KB`}
                    {r.error && <span className="text-destructive ml-2">{r.error}</span>}
                  </div>
                </div>
                {r.previewUrl && (
                  <a href={r.previewUrl} target="_blank" rel="noreferrer">
                    <img src={r.previewUrl} alt={r.id} className="h-12 w-12 object-cover rounded border border-border" />
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatusIcon = ({ status }: { status: Status }) => {
  if (status === "ok") return <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />;
  if (status === "fail") return <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />;
  if (status === "skipped") return <MinusCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />;
  if (status === "running") return <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />;
  return <div className="h-5 w-5 rounded-full border border-border flex-shrink-0" />;
};

export default AdminBulkQA;
