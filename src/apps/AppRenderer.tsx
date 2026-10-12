import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { APPS } from "./registry";

const DocApp = lazy(() => import("./engines/DocApp"));
const TrackerApp = lazy(() => import("./engines/TrackerApp"));
const ChatApp = lazy(() => import("./engines/ChatApp"));
const VisionApp = lazy(() => import("./engines/VisionApp"));
const ImageGenApp = lazy(() => import("./engines/ImageGenApp"));
const CalcApp = lazy(() => import("./engines/CalcApp"));
const ConvertApp = lazy(() => import("./engines/ConvertApp"));
const PresetApp = lazy(() => import("./engines/PresetApp"));

const Loading = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading app" />
  </div>
);

/** Renders any app built on the shared engines. */
export default function AppRenderer({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  if (!def) return null;
  return (
    <Suspense fallback={<Loading />}>
      {def.engine === "doc" ? (
        <DocApp toolId={toolId} def={def} />
      ) : def.engine === "tracker" ? (
        <TrackerApp toolId={toolId} def={def} />
      ) : def.engine === "chat" ? (
        <ChatApp toolId={toolId} def={def} />
      ) : def.engine === "vision" ? (
        <VisionApp toolId={toolId} def={def} />
      ) : def.engine === "image" ? (
        <ImageGenApp toolId={toolId} def={def} />
      ) : def.engine === "calc" ? (
        <CalcApp toolId={toolId} def={def} />
      ) : def.engine === "convert" ? (
        <ConvertApp toolId={toolId} def={def} />
      ) : def.engine === "preset" ? (
        <PresetApp toolId={toolId} def={def} />
      ) : (
        <def.component toolId={toolId} />
      )}
    </Suspense>
  );
}
