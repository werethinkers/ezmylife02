import { Suspense, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { ENGINES } from "../engines";
import { PreviewContext, setPreviewVersion } from "../lib/preview";
import { specToDef, type AiSpec } from "./specToDef";

/**
 * A developer AI app on the real shared screens (document, chat or vision), the same ones the built-in apps use.
 * With `versionId` it is a test run before approval: nothing is charged, the run is limited and kept for the admin.
 */
export default function AiAppView({
  toolId,
  name,
  category,
  spec,
  versionId,
}: {
  toolId: string;
  name: string;
  category?: string | null;
  spec: AiSpec;
  versionId?: string;
}) {
  const def = useMemo(() => specToDef(spec), [spec]);
  const preview = useMemo(() => (versionId ? { name, category } : null), [versionId, name, category]);

  // Register before the screen's first run; children's effects run first, but runs only happen on a click.
  if (versionId) setPreviewVersion(toolId, versionId);
  useEffect(() => {
    if (versionId) setPreviewVersion(toolId, versionId);
    return () => setPreviewVersion(toolId, null);
  }, [toolId, versionId]);

  if (!def) return <p className="p-8 text-center text-sm text-muted-foreground">This app has no usable definition.</p>;
  const Engine = ENGINES[def.engine];
  if (!Engine) return null;
  return (
    <PreviewContext.Provider value={preview}>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading app" />
          </div>
        }
      >
        <Engine toolId={toolId} def={def} />
      </Suspense>
    </PreviewContext.Provider>
  );
}
