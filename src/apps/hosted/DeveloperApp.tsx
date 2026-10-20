import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAiApp, getDevAppKind } from "@/lib/devApps";
import AiAppView from "../ai/AiAppView";
import HostedApp from "./HostedApp";

/*
 * A published developer app on /tool/<id>. Two kinds:
 *   hosted → a file in a locked-down frame (HostedApp)
 *   ai     → a definition run on EzYourLife's own screens and AI (AiAppView); the visitor is charged per run
 */
export default function DeveloperApp({ toolId }: { toolId: string }) {
  const kind = useQuery({ queryKey: ["dev-app-kind", toolId], queryFn: () => getDevAppKind(toolId), staleTime: 5 * 60 * 1000 });
  if (kind.isLoading) return <Spinner />;
  if (kind.data === "ai") return <AiApp toolId={toolId} />;
  return <HostedApp toolId={toolId} />;
}

function Spinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading app" />
    </div>
  );
}

function AiApp({ toolId }: { toolId: string }) {
  const app = useQuery({ queryKey: ["ai-app", toolId], queryFn: () => getAiApp(toolId), staleTime: 5 * 60 * 1000 });
  if (app.isLoading) return <Spinner />;
  if (!app.data) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-xl font-bold">This app is not available right now</p>
        <p className="mt-2 text-sm text-muted-foreground">It may have been taken down for an update. Browse the other apps meanwhile.</p>
        <Button className="mt-5" variant="outline" onClick={() => (window.location.href = "/ai-apps")}>
          See all apps
        </Button>
      </div>
    );
  }
  // The page around this scrolls on its own so the shared screen keeps its normal length.
  return (
    <div className="h-full overflow-auto pb-24 md:pb-8">
      <AiAppView toolId={toolId} name={app.data.name} spec={app.data.spec} />
    </div>
  );
}
