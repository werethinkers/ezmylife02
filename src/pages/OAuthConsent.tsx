import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

// Typed shim for the beta supabase.auth.oauth namespace.
type OAuthResult = {
  data?: { redirect_url?: string; redirect_to?: string; client?: { name?: string; redirect_uris?: string[] }; scope?: string } | null;
  error?: { message: string } | null;
};
type OAuthNs = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthNs }).oauth;

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
          <p><strong>{clientName}</strong> will be able to call EZYOURLIFE tools as you — manage shortcuts, notes, Meet Nudge contacts, and check your credit balance.</p>
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
