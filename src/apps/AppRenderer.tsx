import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { APPS } from "./registry";
import { ENGINES } from "./engines";

const Loading = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading app" />
  </div>
);

/** Renders any app built on the shared engines. */
export default function AppRenderer({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  if (!def) return null;
  if (def.engine === "custom") {
    return (
      <Suspense fallback={<Loading />}>
        <def.component toolId={toolId} />
      </Suspense>
    );
  }
  const Engine = ENGINES[def.engine];
  if (!Engine) return null;
  return (
    <Suspense fallback={<Loading />}>
      <Engine toolId={toolId} def={def} />
    </Suspense>
  );
}
