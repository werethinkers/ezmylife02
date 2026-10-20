import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import AiAppView from "@/apps/ai/AiAppView";
import { PREVIEW_MESSAGE, PREVIEW_RUN_EVENT } from "@/apps/lib/preview";
import { getVersionHtml } from "@/lib/devApps";

/*
 * The bare app of one AI version, with nothing around it: no header, no tab bar, no assistant.
 * The developer and admin preview pages show it inside a frame so it gets a real phone-width (or desktop-width)
 * screen and looks exactly as it will on the site. Row-level security decides who can open the version.
 */
export default function DeveloperPreviewEmbed() {
  const { versionId } = useParams<{ versionId: string }>();
  const v = useQuery({ queryKey: ["dev-preview", versionId], queryFn: () => getVersionHtml(versionId!), enabled: !!versionId });

  useEffect(() => {
    const tell = () => window.parent !== window && window.parent.postMessage({ type: PREVIEW_MESSAGE }, window.location.origin);
    window.addEventListener(PREVIEW_RUN_EVENT, tell);
    return () => window.removeEventListener(PREVIEW_RUN_EVENT, tell);
  }, []);

  const d = v.data;
  return (
    <div className="h-screen overflow-auto bg-background">
      <PageSeo title="Preview | Developer apps" description="App preview" path={`/developer/preview/${versionId}/embed`} noindex />
      {v.isLoading ? (
        <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" /></div>
      ) : v.error || !d ? (
        <p className="mx-auto max-w-md px-4 pt-20 text-center text-sm text-muted-foreground">{(v.error as Error)?.message ?? "Preview not found."}</p>
      ) : d.kind !== "ai" || !d.spec ? (
        <p className="mx-auto max-w-md px-4 pt-20 text-center text-sm text-muted-foreground">This version has no AI definition yet.</p>
      ) : (
        <AiAppView toolId={d.tool_id} name={d.name} category={d.category} spec={d.spec} versionId={versionId} />
      )}
    </div>
  );
}
