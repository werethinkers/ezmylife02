import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ezy_session_id";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function extractToolId(pathname: string): string | null {
  const match = pathname.match(/^\/tool(?:-preview)?\/([^/?#]+)/);
  return match ? match[1] : null;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-pageview`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function logView(payload: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch(FN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    const j = await res.json().catch(() => ({}));
    return (j?.id as string) ?? null;
  } catch {
    return null;
  }
}

function sendBeacon(updateId: string, ms: number) {
  try {
    const body = JSON.stringify({ update_id: updateId, time_on_page_ms: ms });
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(`${FN_URL}?apikey=${ANON}`, blob);
    } else {
      fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
        body,
        keepalive: true,
      });
    }
  } catch {
    // ignore
  }
}

export function usePageTracking() {
  const location = useLocation();
  const lastPath = useRef<string>("");
  const currentViewId = useRef<string | null>(null);
  const enteredAt = useRef<number>(Date.now());

  useEffect(() => {
    const path = location.pathname + location.search;
    if (path === lastPath.current) return;

    // Flush previous view's time-on-page
    if (currentViewId.current) {
      sendBeacon(currentViewId.current, Date.now() - enteredAt.current);
    }

    lastPath.current = path;
    enteredAt.current = Date.now();

    const params = new URLSearchParams(location.search);
    const sessionId = getSessionId();
    const toolId = extractToolId(location.pathname);

    const fire = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const id = await logView({
        path: location.pathname,
        referrer: document.referrer || null,
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
        user_agent: navigator.userAgent.slice(0, 500),
        session_id: sessionId,
        user_id: session?.user?.id ?? null,
        tool_id: toolId,
      });
      currentViewId.current = id;
    };

    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
    if (typeof ric === "function") ric(fire);
    else setTimeout(fire, 0);
  }, [location.pathname, location.search]);

  // Flush on tab close / hide
  useEffect(() => {
    const flush = () => {
      if (currentViewId.current) {
        sendBeacon(currentViewId.current, Date.now() - enteredAt.current);
      }
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    return () => window.removeEventListener("beforeunload", flush);
  }, []);
}
