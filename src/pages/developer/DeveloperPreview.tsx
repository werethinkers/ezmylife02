import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Laptop, Loader2, RotateCcw, Smartphone } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { HostedFrame } from "@/apps/hosted/HostedFrame";
import { getVersionHtml } from "@/lib/devApps";
import { AiPreviewFrame, RunsLeft, VersionPill } from "./parts";

/* Full-screen preview of one version. Only its developer and admins can open it (row-level security). */
export default function DeveloperPreview() {
  const { versionId } = useParams<{ versionId: string }>();
  const v = useQuery({ queryKey: ["dev-preview", versionId], queryFn: () => getVersionHtml(versionId!), enabled: !!versionId });
  const [device, setDevice] = useState<"phone" | "desktop">("desktop");
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="flex h-screen flex-col bg-background">
      <PageSeo title="Preview | Developer apps" description="App preview" path={`/developer/preview/${versionId}`} noindex />
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-card px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-8">
            <Link to={v.data ? `/developer/apps/${v.data.app_id}` : "/developer"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{v.data?.name || "Preview"}</p>
            <p className="text-xs text-muted-foreground">{v.data ? `Version ${v.data.version_no} · ${v.data.kind === "ai" ? "test runs are free" : "preview, no credits used"}` : ""}</p>
          </div>
          {v.data && <VersionPill status={v.data.status} />}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {v.data?.kind === "ai" && <RunsLeft />}
          <Button size="sm" variant={device === "phone" ? "default" : "outline"} className="h-8" onClick={() => setDevice("phone")} aria-pressed={device === "phone"}>
            <Smartphone className="h-3.5 w-3.5" /> Phone
          </Button>
          <Button size="sm" variant={device === "desktop" ? "default" : "outline"} className="h-8" onClick={() => setDevice("desktop")} aria-pressed={device === "desktop"}>
            <Laptop className="h-3.5 w-3.5" /> Desktop
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => setReloadKey((k) => k + 1)} aria-label="Restart the app">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>
      <div className={`min-h-0 flex-1 ${device === "phone" ? "overflow-auto py-6" : ""}`}>
        {v.isLoading ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : v.error || !v.data ? (
          <p className="mx-auto max-w-md px-4 pt-20 text-center text-sm text-muted-foreground">{(v.error as Error)?.message ?? "Preview not found."}</p>
        ) : v.data.kind === "ai" ? (
          v.data.spec ? (
            device === "phone" ? (
              <AiPreviewFrame versionId={versionId!} title={v.data.name} device="phone" reloadKey={reloadKey} />
            ) : (
              <AiPreviewFrame versionId={versionId!} title={v.data.name} device="desktop" reloadKey={reloadKey} />
            )
          ) : (
            <p className="mx-auto max-w-md px-4 pt-20 text-center text-sm text-muted-foreground">This version has no AI definition yet.</p>
          )
        ) : !v.data.html.trim() ? (
          <p className="mx-auto max-w-md px-4 pt-20 text-center text-sm text-muted-foreground">This version has no app file yet.</p>
        ) : (
          <HostedFrame html={v.data.html} title={v.data.name} device={device} reloadKey={reloadKey} />
        )}
      </div>
    </div>
  );
}
