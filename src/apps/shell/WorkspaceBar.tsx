import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useWorkContext } from "../lib/context";
import { useAppStore } from "../lib/store";

/**
 * Shown above an app that belongs to the open workspace: where you are in the workflow,
 * the client in use, and one tap to the next app.
 */
export function WorkspaceBar({ toolId }: { toolId: string }) {
  const navigate = useNavigate();
  const { ctx, merge } = useWorkContext();
  const saved = useAppStore<{ sessions: { id: string; done: string[] }[]; savedAt?: number }>("_workspaces", { sessions: [] });
  const { data: catalog = [] } = useToolsCatalog();
  const s = ctx.session;
  if (!s || !s.tools.includes(toolId)) return null;
  const i = s.tools.indexOf(toolId);
  const prev = s.tools[i - 1];
  const next = s.tools[i + 1];
  const name = (id: string) => catalog.find((t) => t.id === id)?.name ?? "next app";
  const isDone = s.done.includes(toolId);

  const markDone = () => {
    const done = isDone ? s.done : [...s.done, toolId];
    merge({ session: { ...s, done } });
    saved.update((d) => ({ sessions: (d.sessions ?? []).map((x) => (x.id === s.id ? { ...x, done } : x)) }));
    if (next) navigate(`/tool/${next}`);
    else navigate("/workspace");
  };

  return (
    <div className="border-b border-primary/20 bg-primary/5">
      <div className="container mx-auto flex flex-wrap items-center gap-2 px-4 py-2 text-xs">
        <Layers className="h-3.5 w-3.5 text-primary" />
        <Link to="/workspace" className="font-semibold hover:underline">{s.name}</Link>
        <span className="text-muted-foreground">· step {i + 1} of {s.tools.length}{ctx.client?.name ? ` · ${ctx.client.name}` : ""}</span>
        <div className="ml-auto flex items-center gap-1">
          {prev && (
            <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => navigate(`/tool/${prev}`)} aria-label={`Back to ${name(prev)}`}>
              <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Back</span>
            </Button>
          )}
          <Button size="sm" className="h-7 gap-1 px-2.5 text-xs" onClick={markDone}>
            <Check className="h-3.5 w-3.5" /> {next ? <>Done · next: <span className="max-w-[9rem] truncate">{name(next)}</span> <ArrowRight className="h-3.5 w-3.5" /></> : "Finish workspace"}
          </Button>
        </div>
      </div>
    </div>
  );
}
