import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { captureRef, getVisitorId } from "@/lib/refTracking";

/**
 * Remembers an influencer's ?ref= code and counts the click once per visitor.
 * Failures are ignored on purpose: tracking must never break the page.
 */
export function useRefCapture() {
  const location = useLocation();
  useEffect(() => {
    const search = location.search || window.location.search;
    if (!search) return;
    let code: string | null = null;
    try {
      code = captureRef(search);
    } catch {
      return;
    }
    if (!code) return;
    // Direct database call (anon may run it). No edge function to deploy.
    (supabase as any)
      .rpc("influencer_record_click", { _code: code, _visitor: getVisitorId() })
      .then(() => undefined, () => undefined);
  }, [location.search]);
}
