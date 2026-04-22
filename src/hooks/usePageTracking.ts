import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ezy_session_id";
const GEO_KEY = "ezy_geo_cache_v2";
const GEO_TTL_MS = 24 * 60 * 60 * 1000; // 24h cache

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

interface Geo { country?: string; city?: string; ts?: number }

function readGeoCache(): Geo | null {
  try {
    const raw = localStorage.getItem(GEO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Geo;
    if (!parsed.ts || Date.now() - parsed.ts > GEO_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function fetchGeoBackground(): Promise<Geo> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return {};
    const data = await res.json();
    const geo: Geo = { country: data.country_name, city: data.city, ts: Date.now() };
    try { localStorage.setItem(GEO_KEY, JSON.stringify(geo)); } catch { /* ignore */ }
    return geo;
  } catch {
    return {};
  }
}

function extractToolId(pathname: string): string | null {
  const match = pathname.match(/^\/tool(?:-preview)?\/([^/?#]+)/);
  return match ? match[1] : null;
}

export function usePageTracking() {
  const location = useLocation();
  const lastPath = useRef<string>("");

  useEffect(() => {
    const path = location.pathname + location.search;
    if (path === lastPath.current) return;
    lastPath.current = path;

    const params = new URLSearchParams(location.search);
    const sessionId = getSessionId();
    const cachedGeo = readGeoCache();
    const toolId = extractToolId(location.pathname);

    // Fire-and-forget — don't block navigation/render on geo or DB call
    const idleInsert = () => {
      const insertNow = async (geo: Geo) => {
        try {
          // Don't fetch the user — read from current session synchronously instead
          const { data: { session } } = await supabase.auth.getSession();
          await supabase.from("page_views").insert({
            path: location.pathname,
            referrer: document.referrer || null,
            utm_source: params.get("utm_source"),
            utm_medium: params.get("utm_medium"),
            utm_campaign: params.get("utm_campaign"),
            country: geo.country ?? null,
            city: geo.city ?? null,
            user_agent: navigator.userAgent.slice(0, 500),
            session_id: sessionId,
            user_id: session?.user?.id ?? null,
            tool_id: toolId,
          } as never);
        } catch {
          // silent
        }
      };

      if (cachedGeo) {
        insertNow(cachedGeo);
      } else {
        // Insert immediately without geo, then refresh cache for future inserts
        insertNow({});
        fetchGeoBackground();
      }
    };

    // Defer until browser is idle so it never blocks first paint / interactions
    if (typeof (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback === "function") {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(idleInsert);
    } else {
      setTimeout(idleInsert, 0);
    }
  }, [location.pathname, location.search]);
}
