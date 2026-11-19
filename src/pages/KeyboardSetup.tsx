import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { seoFor } from "@/lib/seo/pages";
import { isIosApp } from "@/lib/nativeApp";
import { connectKeyboard, disconnectKeyboard, keyboardStatus, openAppSettings } from "@/lib/ezyKeyboard";
import { Check, Keyboard, Loader2, Mic, Settings } from "lucide-react";

/*
 * /keyboard: set up the EZYOURLIFE keyboard and "Ask EZYOURLIFE" voice on iPhone.
 * Inside the iOS app, "Connect" makes an API key for this iPhone (same keys as /developers/keys)
 * and hands it to the keyboard. In a browser the page explains the feature and points to the app.
 * See docs/ios-keyboard.md.
 */
const API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api/v1`;

async function makeKey(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in again.");
  const r = await fetch(`${API}/keys`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ app: "keyboard", name: "EZYOURLIFE keyboard on iPhone", daily_cap: 50000 }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || !body.key) throw new Error(body.message ?? `Could not connect (${r.status}).`);
  return body.key as string;
}

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex gap-3">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun font-bold">{n}</span>
    <span className="pt-0.5">{children}</span>
  </li>
);

const KeyboardSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const inApp = isIosApp();
  const [status, setStatus] = useState({ available: false, connected: false, shortcuts: 0 });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => setStatus(await keyboardStatus()), []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = async () => {
    setBusy(true);
    try {
      const r = await connectKeyboard(await makeKey());
      toast({ title: "Keyboard connected", description: `${r.shortcuts} shortcuts ready.` });
      await refresh();
    } catch (e) {
      toast({ title: "Could not connect", description: String((e as Error).message), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    await disconnectKeyboard();
    toast({ title: "Keyboard disconnected", description: "Remove the key under API keys to stop it for good." });
    await refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead {...seoFor("/keyboard", "")} />
      <Navbar />
      <main className="container max-w-2xl space-y-8 px-4 py-10">
        <header className="space-y-3">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Your shortcuts and apps in every app on your iPhone</h1>
          <p className="text-lg text-muted-foreground">
            Type <code className="rounded bg-muted px-1">/</code> in WhatsApp, Instagram or Mail and pick a shortcut or an app.
            Or press the Action Button, say what you need, and the result is ready to tap in.
          </p>
        </header>

        <section className="space-y-4 rounded-2xl border-2 border-ink bg-card p-6 shadow-block">
          <div className="flex items-center gap-3">
            <Keyboard className="h-6 w-6" />
            <h2 className="font-display text-xl font-bold">1. Connect your account</h2>
          </div>
          {!inApp ? (
            <p>Open this page in the EZYOURLIFE iPhone app to connect the keyboard.</p>
          ) : !status.available ? (
            <p>Update the EZYOURLIFE app from the App Store to get the keyboard.</p>
          ) : !user ? (
            <p>
              <Link to="/auth" className="underline">Sign in</Link> first. The keyboard uses your shortcuts and pays from your credits.
            </p>
          ) : status.connected ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 font-semibold"><Check className="h-5 w-5" /> Connected, {status.shortcuts} shortcuts</span>
              <Button variant="outline" onClick={disconnect}>Disconnect</Button>
            </div>
          ) : (
            <Button size="lg" onClick={connect} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Connect keyboard and voice
            </Button>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border-2 border-ink bg-card p-6 shadow-block">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6" />
            <h2 className="font-display text-xl font-bold">2. Turn on the keyboard</h2>
          </div>
          <ol className="space-y-3">
            <Step n={1}>Open Settings › Apps › EZYOURLIFE › Keyboards.</Step>
            <Step n={2}>Turn on EZYOURLIFE, then turn on Allow Full Access (needed to reach your shortcuts and apps).</Step>
            <Step n={3}>In any app, hold the globe key and pick EZYOURLIFE. Type <code className="rounded bg-muted px-1">/</code> and a few letters.</Step>
          </ol>
          {inApp && status.available && (
            <Button variant="outline" onClick={() => openAppSettings()}>Open Settings</Button>
          )}
          <p className="text-sm text-muted-foreground">
            The keyboard keeps no record of your typing. It sends only the words after <code>/</code>, to find shortcuts and apps,
            and an app runs only when you tap Run, at its usual price.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border-2 border-ink bg-card p-6 shadow-block">
          <div className="flex items-center gap-3">
            <Mic className="h-6 w-6" />
            <h2 className="font-display text-xl font-bold">3. Use your voice</h2>
          </div>
          <ol className="space-y-3">
            <Step n={1}>Say “Hey Siri, ask EZYOURLIFE”, then what you need, like “proforma invoice for Rahul Traders, 5,000 rupees”.</Step>
            <Step n={2}>For one press: Settings › Action Button › Shortcut › EZYOURLIFE › Ask EZYOURLIFE. Older iPhones: Settings › Accessibility › Touch › Back Tap.</Step>
            <Step n={3}>Siri tells you the app and its price and asks before running it. The result is copied and shows first in the EZYOURLIFE keyboard.</Step>
          </ol>
          <p className="text-sm text-muted-foreground">
            Say a shortcut's name, like “pm”, to copy that shortcut for free. Apple doesn't let keyboards use the microphone, so voice works through Siri.
          </p>
        </section>
      </main>
    </div>
  );
};

export default KeyboardSetup;
