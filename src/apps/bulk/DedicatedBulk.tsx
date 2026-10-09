import { useLocation } from "react-router-dom";
import { BulkButton } from "./BulkButton";

// Apps with their own pages (not /tool/…) get the same Bulk mode button, floating bottom-left.
const ROUTES: Record<string, string> = {
  "/notebook": "speedy-notebook",
  "/promptmaster": "promptmaster-ai",
  "/tools/productvision-360": "productvision-360",
  "/virasat": "virasat",
  "/startup-analyser": "startup-analyser",
  "/meet-nudge": "meet-nudge",
  "/google-business": "google-business-kit",
};

export default function DedicatedBulk() {
  const { pathname } = useLocation();
  const toolId = ROUTES[pathname.replace(/\/$/, "")];
  if (!toolId) return null;
  return (
    <div className="fixed bottom-4 left-4 z-40 rounded-xl bg-background/90 shadow-lg backdrop-blur">
      <BulkButton toolId={toolId} size="default" className="h-10" />
    </div>
  );
}
