import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Copy, Loader2, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApp, isAdmin, listMyApps, slugify } from "@/lib/devApps";
import { Pill, VersionPill } from "./parts";

const STEPS = [
  { n: 1, title: "Send", text: "Claude turns your app into an EzYourLife app and sends it: a one-file app, or a definition that runs on our AI." },
  { n: 2, title: "Check", text: "Our server checks it for secrets, size, similar apps and a full listing." },
  { n: 3, title: "Preview", text: "Try the real app on a phone or desktop screen, as it will look on the site." },
  { n: 4, title: "Send", text: "Our team sets the price and approves. One click puts it live." },
];

const connectorUrl = `${import.meta.env.VITE_SUPABASE_URL ?? ""}/functions/v1/mcp`;

export default function DeveloperHome() {
  const navigate = useNavigate();
  const apps = useQuery({ queryKey: ["dev-apps"], queryFn: listMyApps });
  const admin = useQuery({ queryKey: ["dev-is-admin"], queryFn: isAdmin, staleTime: 10 * 60 * 1000 });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const address = slugTouched ? slug : slugify(name);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await createApp(address, name);
      navigate(`/developer/apps/${r.app_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageSeo title="Developer apps | EZYOURLIFE" description="Publish your web app in the EzYourLife store." path="/developer" noindex />
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Developer apps</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Bring a web app you have built. Test it here, send it for review, and it goes live in the EzYourLife store once our team approves it.
            </p>
          </div>
          {admin.data && (
            <Button asChild variant="outline">
              <Link to="/admin/developer-apps">
                Review queue <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        <ol className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-xl border-2 border-ink bg-card p-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-sun text-xs font-bold">{s.n}</span>
              <p className="mt-2 font-semibold">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-labelledby="my-apps">
            <h2 id="my-apps" className="font-display text-lg font-bold">Your apps</h2>
            {apps.isLoading ? (
              <div className="mt-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : apps.error ? (
              <p className="mt-3 rounded-xl border-2 border-ink bg-coral/30 p-3 text-sm">{(apps.error as Error).message}</p>
            ) : !apps.data?.length ? (
              <p className="mt-3 rounded-xl border-2 border-dashed border-ink/40 p-6 text-center text-sm text-muted-foreground">
                No apps yet. Start one on the right, or ask Claude to put your app on EzYourLife.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {apps.data.map(({ app, latest, live }) => (
                  <li key={app.id}>
                    <Link
                      to={`/developer/apps/${app.id}`}
                      className="block rounded-2xl border-2 border-ink bg-card p-4 shadow-block-sm transition-transform hover:-translate-y-0.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold">{latest?.name || app.tool_id}</p>
                        <div className="flex flex-wrap gap-1.5">
                          <Pill tone={app.kind === "ai" ? "bg-pink" : "bg-sand"}>{app.kind === "ai" ? "AI app" : "File app"}</Pill>
                          {app.status === "live" && live && <Pill tone="bg-teal">Live · v{live.version_no}</Pill>}
                          {app.status === "unlisted" && <Pill tone="bg-muted">Taken down</Pill>}
                          {latest && latest.id !== app.live_version_id && <VersionPill status={latest.status} />}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">ezyourlife.com/tool/{app.tool_id}</p>
                      {latest?.status === "changes_requested" && latest.review_notes && (
                        <p className="mt-2 rounded-lg bg-coral/25 px-2 py-1 text-sm">Our team asked: {latest.review_notes}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="space-y-6">
            <form onSubmit={create} className="rounded-2xl border-2 border-ink bg-card p-5 shadow-block-sm">
              <h2 className="flex items-center gap-2 font-display text-base font-bold"><Plus className="h-4 w-4" /> New app</h2>
              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="dev-name">App name</Label>
                  <Input id="dev-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tip Splitter" maxLength={60} required minLength={3} />
                </div>
                <div>
                  <Label htmlFor="dev-slug">Web address</Label>
                  <div className="mt-1 flex items-center rounded-md border border-input bg-background pl-3 text-sm">
                    <span className="shrink-0 text-muted-foreground">/tool/dev-</span>
                    <input
                      id="dev-slug"
                      className="h-10 min-w-0 flex-1 bg-transparent pr-3 outline-none"
                      value={address}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlug(slugify(e.target.value));
                      }}
                      placeholder="tip-splitter"
                      required
                      minLength={3}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Letters, numbers and dashes. It can't be changed later.</p>
                </div>
                <Button type="submit" className="w-full" disabled={busy || name.trim().length < 3 || address.length < 3}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create app"}
                </Button>
              </div>
            </form>

            <div className="rounded-2xl border-2 border-ink bg-sky/40 p-5">
              <h2 className="font-display text-base font-bold">Work with Claude</h2>
              <p className="mt-2 text-sm">
                Add the EzYourLife connector in Claude, sign in, and say “Put my app on EzYourLife”. Send it your project in any form (an AI Studio export, a React project, or an app you built in Claude). Claude checks for similar apps, converts it to these rules, fills the listing, tests it and runs the checks. You still try it and send it for review.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg border-2 border-ink bg-card px-2 py-1.5">
                <code className="min-w-0 flex-1 truncate text-xs">{connectorUrl}</code>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 shrink-0"
                  aria-label="Copy connector address"
                  onClick={() => {
                    void navigator.clipboard?.writeText(connectorUrl);
                    toast.success("Connector address copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-ink bg-card p-5 text-sm">
              <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> House rules</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>A one-file app (up to 10 MB), or an AI app defined by its screen and instructions.</li>
                <li>No API keys, servers, own logins, own wallets or free trials. Use our AI and our credits.</li>
                <li>Similar to an app we already have? Tell us how yours is different.</li>
                <li>Apps run in a locked frame and cannot see users' accounts.</li>
                <li>Our team sets the credits per use and your share.</li>
                <li>A live app only changes when a new version is approved.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
