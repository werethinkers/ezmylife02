import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Lock, Play, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToolPricing } from "@/hooks/useToolPricing";
import { runWithCredits } from "@/lib/credits";
import { emitCreditPrompt } from "@/lib/creditPrompt";
import { getHostedApp } from "@/lib/devApps";
import { HostedFrame } from "./HostedFrame";

/*
 * A published developer app on /tool/<id>.
 *
 * The app runs in HostedFrame (sandboxed, no access to the visitor's account). Clicks inside a
 * frame never reach this page, so UsageGate's "first input starts a use" cannot work here.
 * Instead the visitor presses Start, which charges through the same path as UsageGate
 * (runWithCredits → tool-charge → start_tool_run, priced from tool_pricing), with the same
 * 30-minute use window and the same session key, so one charge covers 30 minutes either way.
 *
 * An app with an AI step is different: it opens free (no Start) and charges per AI result, on the server, when
 * the page's call to window.ezyourlife.ai succeeds (see ./aiBridge.ts and the dev-app-run function). The price is
 * the one the team set at approval. A page that cannot get a result (no credits, signed out) keeps its own fallback.
 */

const USE_WINDOW_MS = 30 * 60 * 1000;
const sessionKeyFor = (id: string) => `ez.use.${id}`;
const stillPaid = (id: string) => {
  try {
    return Date.now() - Number(sessionStorage.getItem(sessionKeyFor(id)) || 0) < USE_WINDOW_MS;
  } catch {
    return false;
  }
};

export default function HostedApp({ toolId }: { toolId: string }) {
  const { user } = useAuth();
  const { creditCost } = useToolPricing(toolId);
  const app = useQuery({ queryKey: ["hosted-app", toolId], queryFn: () => getHostedApp(toolId), staleTime: 5 * 60 * 1000 });
  const [state, setState] = useState<"idle" | "charging" | "open" | "blocked">(() => (stillPaid(toolId) ? "open" : "idle"));
  const [reason, setReason] = useState<"login" | "credits" | "error">("credits");
  const busy = useRef(false);

  useEffect(() => setState(stillPaid(toolId) ? "open" : "idle"), [toolId]);

  const start = useCallback(async () => {
    if (busy.current) return;
    if (stillPaid(toolId)) return setState("open");
    if (!user) {
      setReason("login");
      setState("blocked");
      emitCreditPrompt({ kind: "login" });
      return;
    }
    busy.current = true;
    setState("charging");
    try {
      const { charged } = await runWithCredits(toolId, async () => undefined, {
        onInsufficient: (required, balance) => emitCreditPrompt({ kind: "buy", required, balance }),
      });
      try {
        sessionStorage.setItem(sessionKeyFor(toolId), String(Date.now()));
      } catch {
        /* ignore */
      }
      emitCreditPrompt({ kind: "charged" });
      if (charged > 0) toast.success(`${charged} credit${charged === 1 ? "" : "s"} used. Use this app freely for the next 30 minutes.`);
      setState("open");
    } catch (e) {
      setReason(e instanceof Error && e.message === "insufficient_credits" ? "credits" : "error");
      setState("blocked");
    } finally {
      busy.current = false;
    }
  }, [toolId, user]);

  if (app.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading app" />
      </div>
    );
  }

  if (!app.data) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-xl font-bold">This app is not available right now</p>
        <p className="mt-2 text-sm text-muted-foreground">It may have been taken down for an update. Browse the other apps meanwhile.</p>
        <Button className="mt-5" variant="outline" onClick={() => (window.location.href = "/ai-apps")}>See all apps</Button>
      </div>
    );
  }

  if (app.data.has_ai) {
    return (
      <div className="flex h-full min-h-[600px] flex-col">
        <p className="shrink-0 border-b-2 border-ink/10 bg-card px-3 py-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
          Free to open. The AI part uses {creditCost} credit{creditCost === 1 ? "" : "s"} per result, taken only when a result is made.
        </p>
        <HostedFrame html={app.data.html} title={app.data.name} className="min-h-0 flex-1" ai={{ toolId }} />
      </div>
    );
  }

  if (state === "open") {
    return <HostedFrame html={app.data.html} title={app.data.name} className="h-full min-h-[600px]" />;
  }

  return (
    <div className="flex h-full min-h-[480px] items-start justify-center bg-background px-4 pt-16">
      <div className="w-full max-w-sm rounded-2xl border-2 border-ink bg-card p-6 text-center shadow-block">
        {state === "charging" ? (
          <p className="flex items-center justify-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Starting your session…
          </p>
        ) : state === "blocked" ? (
          <>
            <Lock className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-2 font-semibold">
              {reason === "login" ? "Sign in to use this app" : reason === "credits" ? `This app uses ${creditCost} credit${creditCost === 1 ? "" : "s"} per use` : "Couldn't start the app"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {reason === "login" ? "It's free to sign up and you get 100 free credits." : reason === "credits" ? "Top up to continue. One charge covers 30 minutes of use." : "Please try again."}
            </p>
            <Button className="mt-4" onClick={() => (reason === "login" ? emitCreditPrompt({ kind: "login" }) : void start())}>
              {reason === "login" ? "Sign in" : "Try again"}
            </Button>
          </>
        ) : (
          <>
            <p className="font-display text-lg font-bold">{app.data.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {creditCost} credit{creditCost === 1 ? "" : "s"} per use. One use lasts 30 minutes.
            </p>
            <Button className="mt-4 w-full" onClick={() => void start()}>
              <Play className="h-4 w-4" /> Start
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Made by an EzYourLife developer, checked by our team. It cannot see your account.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
