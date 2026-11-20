import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { CollapsibleCard } from "@/components/admin/CollapsibleCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Database, HardDrive, Github, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GITHUB_HINT_URL = "https://github.com/";

export default function DataExport() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [includeStorage, setIncludeStorage] = useState(true);

  const runExport = async (withStorage: boolean) => {
    setBusy(true);
    setProgress(0);
    setStatus("Preparing…");
    try {
      const zip = new JSZip();
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

      // 1. Tables
      setStatus("Exporting database tables…");
      setProgress(5);
      const { data: tableRes, error: tErr } = await supabase.functions.invoke("admin-export-all", {
        body: { mode: "tables" },
      });
      if (tErr) throw tErr;
      const tablesFolder = zip.folder("database")!;
      tablesFolder.file("_manifest.json", JSON.stringify({
        exported_at: tableRes.exported_at,
        table_counts: Object.fromEntries(Object.entries(tableRes.tables).map(([k, v]: any) => [k, v.length])),
        errors: tableRes.errors,
      }, null, 2));
      for (const [name, rows] of Object.entries(tableRes.tables as Record<string, any[]>)) {
        tablesFolder.file(`${name}.json`, JSON.stringify(rows, null, 2));
      }
      setProgress(30);

      // 2. Storage
      if (withStorage) {
        setStatus("Listing storage files…");
        const { data: manRes, error: mErr } = await supabase.functions.invoke("admin-export-all", {
          body: { mode: "manifest" },
        });
        if (mErr) throw mErr;
        const files: any[] = manRes.files ?? [];
        const storageFolder = zip.folder("storage")!;
        storageFolder.file("_manifest.json", JSON.stringify(files.map(f => ({
          bucket: f.bucket, path: f.path, size: f.size, mime: f.mime,
        })), null, 2));

        let done = 0;
        const total = files.length || 1;
        // Download in parallel with concurrency cap
        const CONCURRENCY = 6;
        let idx = 0;
        await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
          while (idx < files.length) {
            const i = idx++;
            const f = files[i];
            if (!f.url) { done++; continue; }
            try {
              const res = await fetch(f.url);
              if (res.ok) {
                const blob = await res.blob();
                storageFolder.folder(f.bucket)!.file(f.path, blob);
              }
            } catch { /* skip */ }
            done++;
            const pct = 30 + Math.floor((done / total) * 60);
            setProgress(pct);
            setStatus(`Downloading storage files… ${done}/${total}`);
          }
        }));
      }

      // 3. README
      zip.file("README.txt",
`EZYOURLIFE Full Export
Generated: ${new Date().toISOString()}

Contents:
- /database/*.json     One file per Supabase table.
- /database/_manifest.json   Row counts and any per-table errors.
${withStorage ? "- /storage/<bucket>/...  All files from public/private storage buckets.\n- /storage/_manifest.json  File index with bucket, path, size, mime.\n" : ""}
NOTE on source code:
The app's source code (React/TypeScript files) is NOT included here because the
deployed browser app cannot read its own source. To download the full source code:
  1. Open the ezmylife02 repository on GitHub
  2. Click "Code" → "Download ZIP"

Keep this archive secure — it contains personal user data and credentials.
`);

      setStatus("Zipping…");
      setProgress(95);
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      saveAs(blob, `ezyourlife-export-${stamp}.zip`);
      setProgress(100);
      setStatus("Done");
      toast.success("Export downloaded");
    } catch (e: any) {
      console.error(e);
      toast.error(`Export failed: ${e.message ?? e}`);
    } finally {
      setBusy(false);
      setTimeout(() => { setProgress(0); setStatus(""); }, 3000);
    }
  };

  return (
    <div className="space-y-4">
      <CollapsibleCard title={<><Download className="h-5 w-5 text-primary" /> One-tap full export</>} size="lg" contentClassName="space-y-4">
        <p className="text-sm text-muted-foreground">
          Download every database table plus all storage bucket files as a single ZIP.
          Source code is downloaded separately from GitHub.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <Button
            size="lg"
            disabled={busy}
            onClick={() => runExport(true)}
            className="h-auto py-4 flex-col gap-1"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <HardDrive className="h-5 w-5" />}
            <span>Download Everything</span>
            <span className="text-xs opacity-80">Tables + Storage files</span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            disabled={busy}
            onClick={() => runExport(false)}
            className="h-auto py-4 flex-col gap-1"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5" />}
            <span>Database Only</span>
            <span className="text-xs opacity-70">Fast · JSON dump</span>
          </Button>
        </div>

        {busy && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">{status}</p>
          </div>
        )}
      </CollapsibleCard>

      <CollapsibleCard title={<><Github className="h-4 w-4" /> Source code</>} contentClassName="space-y-2 text-sm text-muted-foreground">
        <p>
          The deployed website can't ship its own source code. To download the React/TypeScript
          codebase:
        </p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Open the <strong>ezmylife02</strong> repository on GitHub</li>
          <li>Click <strong>Code → Download ZIP</strong></li>
        </ol>
        <Button variant="outline" size="sm" asChild className="mt-2">
          <a href={GITHUB_HINT_URL} target="_blank" rel="noreferrer">
            <Github className="h-4 w-4 mr-2" /> Open GitHub
          </a>
        </Button>
      </CollapsibleCard>
    </div>
  );
}
