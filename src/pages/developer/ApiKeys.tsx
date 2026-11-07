import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Copy, KeyRound, Loader2, Trash2, Laptop } from "lucide-react";

// API keys for the public Ezyourlife API (supabase/functions/api), and the "Connect EzMe" step:
// /developers/keys?app=ezme&redirect=ezme://ezyourlife-connected makes a key for the Mac app and hands it back.
const API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api/v1`;
const ALLOWED_REDIRECTS = /^ezme:\/\/[a-z0-9/_-]*$/i;

interface KeyRow { id: string; name: string; app: string | null; prefix: string; daily_cap: number; created_at: string; last_used_at: string | null }

async function call(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in again.");
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || body.ok === false) throw new Error(body.message ?? `Request failed (${r.status})`);
  return body;
}

const ApiKeys = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const app = params.get("app");
  const redirect = params.get("redirect") ?? "";
  const connecting = app === "ezme" && ALLOWED_REDIRECTS.test(redirect);

  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("My app");
  const [cap, setCap] = useState("500");
  const [fresh, setFresh] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await call("/keys");
      setKeys(r.keys ?? []);
    } catch (e) {
      toast({ title: "Could not load your keys", description: String((e as Error).message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const connectEzMe = async () => {
    setBusy(true);
    try {
      const r = await call("/keys", { method: "POST", body: JSON.stringify({ app: "ezme", name: "EzMe on my Mac", daily_cap: 2000 }) });
      const sep = redirect.includes("?") ? "&" : "?";
      window.location.href = `${redirect}${sep}key=${encodeURIComponent(r.key)}`;
    } catch (e) {
      toast({ title: "Could not connect EzMe", description: String((e as Error).message), variant: "destructive" });
      setBusy(false);
    }
  };

  const createKey = async () => {
    setBusy(true);
    try {
      const r = await call("/keys", { method: "POST", body: JSON.stringify({ name, daily_cap: Number(cap) || 500 }) });
      setFresh(r.key);
      await load();
    } catch (e) {
      toast({ title: "Could not make the key", description: String((e as Error).message), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      await call(`/keys/${id}`, { method: "DELETE" });
      setKeys((k) => k.filter((x) => x.id !== id));
    } catch (e) {
      toast({ title: "Could not remove the key", description: String((e as Error).message), variant: "destructive" });
    }
  };

  const example = useMemo(
    () => `curl -X POST ${API}/apps/tool-14/run \\\n  -H "Authorization: Bearer ${fresh ?? "ezy_live_…"}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"inputs": {"Business": "Sharma Furniture", "Customer": "Rakesh Traders", "Context": "Sent a quotation for 40 chairs last week", "Channel": "WhatsApp"}}'`,
    [fresh],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-3xl py-10 space-y-8">
        {connecting && (
          <section className="rounded-2xl border-2 border-ink bg-sun p-6 shadow-block space-y-4">
            <div className="flex items-center gap-3">
              <Laptop className="h-6 w-6" />
              <h1 className="font-display text-2xl font-bold">Connect EzMe to your account</h1>
            </div>
            <p>
              EzMe on your Mac will use your Ezyourlife apps, PromptMaster and shortcuts, and pay from the same credits you use here.
              Credits are used only when an app gives a result. You can remove this connection below at any time.
            </p>
            <Button size="lg" onClick={connectEzMe} disabled={busy || !user}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Connect EzMe
            </Button>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="font-display text-3xl font-bold">API keys</h2>
          <p className="text-muted-foreground">
            Use Ezyourlife apps from your own app or website. Each run uses your credits at the same price as on this site, and a failed run costs nothing.
          </p>
        </section>

        <section className="rounded-2xl border-2 border-ink bg-card p-6 shadow-block space-y-4">
          <h3 className="font-display text-xl font-bold">Make a key</h3>
          <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] items-end">
            <label className="text-sm font-semibold space-y-1">
              <span>Name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </label>
            <label className="text-sm font-semibold space-y-1">
              <span>Daily limit (credits)</span>
              <Input value={cap} onChange={(e) => setCap(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
            </label>
            <Button onClick={createKey} disabled={busy}>
              <KeyRound className="h-4 w-4" /> Make key
            </Button>
          </div>
          {fresh && (
            <div className="rounded-xl border-2 border-ink bg-lime p-4 space-y-2">
              <p className="font-semibold">Copy your key now. It is shown only once.</p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 break-all rounded-lg border-2 border-ink bg-card px-3 py-2 text-sm">{fresh}</code>
                <Button variant="outline" size="icon" aria-label="Copy key" onClick={() => navigator.clipboard.writeText(fresh)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border-2 border-ink bg-card p-6 shadow-block space-y-3">
          <h3 className="font-display text-xl font-bold">Your keys and connected apps</h3>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : keys.length === 0 ? (
            <p className="text-muted-foreground">No keys yet.</p>
          ) : (
            <ul className="divide-y-2 divide-sand">
              {keys.map((k) => (
                <li key={k.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{k.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {k.prefix}… · up to {k.daily_cap} credits a day · {k.last_used_at ? `last used ${new Date(k.last_used_at).toLocaleDateString()}` : "not used yet"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => revoke(k.id)}>
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border-2 border-ink bg-card p-6 shadow-block space-y-3">
          <h3 className="font-display text-xl font-bold">Try it</h3>
          <p className="text-sm text-muted-foreground">
            List apps with <code>GET {API}/apps?q=invoice</code>, see an app's boxes with <code>GET /apps/&lt;id&gt;</code>, and run it like this:
          </p>
          <pre className="overflow-x-auto rounded-xl border-2 border-ink bg-sand p-4 text-xs">{example}</pre>
          <p className="text-sm text-muted-foreground">
            Also: <code>POST /prompt/improve</code>, <code>POST /prompt/brainstorm</code>, <code>GET /cards</code>, <code>GET|PUT /shortcuts</code>,{" "}
            <code>GET /wallet</code> and <code>POST /wallet/topup</code>.
          </p>
        </section>
      </main>
    </div>
  );
};

export default ApiKeys;
