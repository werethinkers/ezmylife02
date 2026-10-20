import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

type OAuthResult = {
  data?: { redirect_url?: string; redirect_to?: string; client?: { name?: string; redirect_uris?: string[] }; scope?: string } | null;
  error?: { message: string } | null;
};

// The consent calls go straight to the auth server. The supabase.auth.oauth helper only exists in
// newer supabase-js versions, and the Lovable build (bun.lock) uses an older one, where
// `supabase.auth.oauth` is undefined and this page stayed on its loading spinner forever.
const AUTH_URL = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1`;

async function authCall(id: string, path: string, method: "GET" | "POST", token: string, body?: unknown): Promise<OAuthResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${AUTH_URL}/oauth/authorizations/${encodeURIComponent(id)}${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = (json && (json.msg || json.message || json.error_description || json.error)) || `Request failed (${res.status})`;
      return { data: null, error: { message: String(msg) } };
    }
    return { data: json, error: null };
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === "AbortError";
    return { data: null, error: { message: aborted ? "The sign-in server did not answer. Reload this page, or start the connection again from Claude." : "Could not reach the sign-in server. Check your connection and reload." } };
  } finally {
    clearTimeout(timer);
  }
}

async function accessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

const oauth = {
  getAuthorizationDetails: async (id: string) => {
    const t = await accessToken();
    return t ? authCall(id, "", "GET", t) : { data: null, error: { message: "You are signed out. Sign in and try again." } };
  },
  approveAuthorization: async (id: string) => {
    const t = await accessToken();
    return t ? authCall(id, "/consent", "POST", t, { action: "approve" }) : { data: null, error: { message: "You are signed out. Sign in and try again." } };
  },
  denyAuthorization: async (id: string) => {
    const t = await accessToken();
    return t ? authCall(id, "/consent", "POST", t, { action: "deny" }) : { data: null, error: { message: "You are signed out. Sign in and try again." } };
  },
};

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthResult["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve the full consent URL so we return here after sign-in.
        const next = window.location.pathname + window.location.search;
        try { localStorage.setItem("auth_redirect_to", next); } catch { /* ignore */ }
        window.location.href = "/auth";
        return;
      }
      setUserEmail(sess.session.user.email ?? null);
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data ?? null);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Something went wrong loading this request.");
      }
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const res = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (res.error) { setBusy(false); return setError(res.error.message); }
    const target = res.data?.redirect_url ?? res.data?.redirect_to;
    if (!target) { setBusy(false); return setError("No redirect returned by the authorization server."); }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">Could not load this authorization request</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }
  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  const clientName = details.client?.name ?? "an app";
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-6 border border-border rounded-2xl p-8 bg-card/50 backdrop-blur">
        <div className="text-center space-y-3">
          <img src={logo} alt="EZYOURLIFE" className="h-12 mx-auto" />
          <h1 className="font-display text-2xl font-semibold">Connect {clientName} to EZYOURLIFE</h1>
          {userEmail && <p className="text-sm text-muted-foreground">Signed in as {userEmail}</p>}
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>{clientName}</strong> will be able to call EZYOURLIFE tools as you — manage shortcuts, notes, Meet Nudge contacts, check your credit balance, and prepare apps for the developer store. Nothing goes live without EZYOURLIFE team approval.</p>
          <p className="text-muted-foreground text-xs">This does not bypass EZYOURLIFE permissions or your account policies. Credit-costing actions will deduct from your wallet.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>Cancel</Button>
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
          </Button>
        </div>
      </div>
    </main>
  );
}
