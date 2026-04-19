import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ezy_session_id";
const GEO_KEY = "ezy_geo_cache";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

interface Geo { country?: string; city?: string }

async function getGeo(): Promise<Geo> {
  try {
    const cached = sessionStorage.getItem(GEO_KEY);
    if (cached) return JSON.parse(cached);
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return {};
    const data = await res.json();
    const geo: Geo = { country: data.country_name, city: data.city };
    sessionStorage.setItem(GEO_KEY, JSON.stringify(geo));
    return geo;
  } catch {
    return {};
  }
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

    (async () => {
      const geo = await getGeo();
      const { data: { user } } = await supabase.auth.getUser();
      try {
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
          user_id: user?.id ?? null,
        } as never);
      } catch {
        // silent
      }
    })();
  }, [location.pathname, location.search]);
}
