import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, CheckCircle2, Circle, Layers, Plus, Search, Sparkles, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AppIcon } from "@/components/store/AppIcon";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { WorkspaceCard } from "@/apps/shell/WorkspaceCard";
import { useWorkContext, type WorkClient } from "@/apps/lib/context";
import { useAppStore, uid } from "@/apps/lib/store";
import { ROLES, CONTEXT_AWARE, type RoleTemplate } from "@/apps/workflows";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  name: string;
  role: string;
  tools: string[];
  done: string[];
  client?: WorkClient;
}

const STOP = new Set(["i", "a", "an", "the", "to", "for", "and", "of", "my", "me", "want", "need", "make", "create", "get", "with", "in", "on", "help", "how", "do", "is", "it", "app", "tool"]);

/** Score catalog apps against a free-text goal (cheap, runs in the browser). */
function matchGoal(goal: string, catalog: CatalogTool[]) {
  const words = goal.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
  if (!words.length) return [];
  return catalog
    .filter((t) => t.is_live)
    .map((t) => {
      const hay = `${t.name} ${t.description} ${t.category}`.toLowerCase();
      const score = words.reduce((s, w) => s + (t.name.toLowerCase().includes(w) ? 3 : hay.includes(w) ? 1 : hay.includes(w.slice(0, -1)) ? 0.5 : 0), 0);
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

export default function Workspace() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { data: catalog = [] } = useToolsCatalog();
  const { ctx, merge } = useWorkContext();
  const saved = useAppStore<{ sessions: Session[]; savedAt?: number }>("_workspaces", { sessions: [] });
  const sessions = saved.data.sessions ?? [];
  const active = ctx.session ? sessions.find((s) => s.id === ctx.session!.id) ?? ctx.session : null;
  const [goal, setGoal] = useState("");
  const [client, setClient] = useState<WorkClient>(ctx.client ?? {});
  const [engagement, setEngagement] = useState(ctx.engagement ?? {});
  const [money, setMoney] = useState({ rev: ctx.money?.monthlyRevenue ? String(ctx.money.monthlyRevenue) : "", exp: ctx.money?.monthlyExpenses ? String(ctx.money.monthlyExpenses) : "" });

  useEffect(() => setClient(ctx.client ?? {}), [ctx.client]);
  useEffect(() => setEngagement(ctx.engagement ?? {}), [ctx.engagement]);
  useEffect(() => setMoney({ rev: ctx.money?.monthlyRevenue ? String(ctx.money.monthlyRevenue) : "", exp: ctx.money?.monthlyExpenses ? String(ctx.money.monthlyExpenses) : "" }), [ctx.money]);

  const role: RoleTemplate | undefined = ROLES.find((r) => r.id === (active?.role ?? params.get("role")));
  const byId = useMemo(() => new Map(catalog.map((t) => [t.id, t])), [catalog]);
  const goalMatches = useMemo(() => matchGoal(goal, catalog), [goal, catalog]);

  const saveSessions = (list: Session[]) => saved.update({ sessions: list });

  const start = (r: RoleTemplate | null, tools: string[], name: string) => {
    const s: Session = { id: uid(), name, role: r?.id ?? "custom", tools: tools.filter((id) => byId.get(id)?.is_live !== false), done: [], client: ctx.client };
    saveSessions([s, ...sessions].slice(0, 20));
    merge({ session: { id: s.id, name: s.name, role: s.role, tools: s.tools, done: [] } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activate = (s: Session) => {
    merge({ session: { id: s.id, name: s.name, role: s.role, tools: s.tools, done: s.done }, ...(s.client ? { client: s.client } : {}) });
  };

  const saveDetails = () => {
    merge({
      client,
      engagement,
      money: { monthlyRevenue: parseFloat(money.rev) || undefined, monthlyExpenses: parseFloat(money.exp) || undefined },
    });
    if (active) saveSessions(sessions.map((s) => (s.id === active.id ? { ...s, client } : s)));
    toast.success("Saved — your apps will use these details");
  };

  const saveClient = () => {
    if (!client.name?.trim()) return toast.error("Enter the client's name first.");
    const list = [client, ...(ctx.clients ?? []).filter((c) => c.name !== client.name)].slice(0, 50);
    merge({ clients: list, client });
    toast.success(`${client.name} saved to your client list`);
  };

  const logGap = async () => {
    if (!user?.email || !goal.trim()) return;
    const { error } = await supabase.functions.invoke("submit-tool-request", {
      body: { name: user.user_metadata?.full_name ?? user.email.split("@")[0], email: user.email, description: `Workspace goal with no good match: ${goal.trim()}`, source: "workspace-builder" },
    });
    if (error) toast.error("Couldn't send the request — try again.");
    else toast.success("Thanks — we've logged this as a request for a new app.");
  };

  const done = new Set(active?.done ?? []);
  const steps = active ? active.tools : [];
  const next = steps.find((id) => !done.has(id));
  const pct = steps.length ? Math.round((done.size / steps.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10">
      <SEOHead title="Workspace — your apps, connected | EZYOURLIFE" description="Pick what you do and EZYOURLIFE lines up the right apps and carries your business and client details between them." path="/workspace" />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
        <header className="max-w-3xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Layers className="h-4 w-4" /> Workspace</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">Enter your details once. Every app uses them.</h1>
          <p className="mt-2 text-muted-foreground">Pick what you do — we line up the apps in order and carry your business, client and numbers from one to the next, so you only add what's new.</p>
        </header>

        {active && (
          <section className="mt-8 rounded-3xl border border-primary/30 bg-card p-4 shadow-sm md:p-6" aria-labelledby="ws-active">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Open workspace</p>
                <h2 id="ws-active" className="text-xl font-bold">{active.name}</h2>
                {ctx.client?.name && <p className="text-sm text-muted-foreground">Client: {ctx.client.name}{ctx.client.gstin ? ` · ${ctx.client.gstin}` : ""}</p>}
              </div>
              <div className="flex gap-2">
                {next && <Button className="gap-1.5" onClick={() => navigate(`/tool/${next}`)}>{done.size ? "Continue" : "Start"} <ArrowRight className="h-4 w-4" /></Button>}
                <Button variant="ghost" onClick={() => merge({ session: undefined })}>Close</Button>
              </div>
            </div>
            <Progress value={pct} className="mt-4 h-2" />
            <p className="mt-1 text-xs text-muted-foreground">{done.size} of {steps.length} done</p>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
              {steps.map((id, i) => {
                const t = byId.get(id);
                if (!t) return null;
                const why = role?.steps.find((s) => s.toolId === id)?.why ?? t.description;
                const isDone = done.has(id);
                return (
                  <li key={id} className={cn("flex items-center gap-3 rounded-2xl border p-3", isDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60")}>
                    <button
                      type="button"
                      aria-label={isDone ? `Mark ${t.name} not done` : `Mark ${t.name} done`}
                      onClick={() => {
                        const d = isDone ? active.done.filter((x) => x !== id) : [...active.done, id];
                        saveSessions(sessions.map((s) => (s.id === active.id ? { ...s, done: d } : s)));
                        merge({ session: { ...ctx.session!, done: d } });
                      }}
                    >
                      {isDone ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <AppIcon toolId={id} category={t.category} name={t.name} size="sm" className="h-10 w-10" />
                    <Link to={`/tool/${id}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{i + 1}. {t.name}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{why}</p>
                    </Link>
                    {CONTEXT_AWARE.has(id) && <span className="hidden shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary sm:inline">pre-filled</span>}
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {!active && (
        <>{/* Pick a workflow (first, when no workspace is open) */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">{active ? "Start another workspace" : "1. What do you do?"}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {ROLES.map((r) => (
              <button key={r.id} type="button" onClick={() => start(r, r.steps.map((s) => s.toolId), r.label)} className={cn("group flex flex-col items-start rounded-2xl border bg-card p-3 text-left transition-colors hover:border-primary/60", params.get("role") === r.id && !active ? "border-primary ring-2 ring-primary/30" : "border-border/60")}>
                <span className="text-2xl" aria-hidden>{r.emoji}</span>
                <span className="mt-1 text-sm font-semibold group-hover:text-primary">{r.label}</span>
                <span className="mt-1 line-clamp-3 text-[11px] text-muted-foreground">{r.goal}</span>
                <span className="mt-2 text-[11px] font-medium text-primary">{r.steps.length} apps →</span>
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-border/60 bg-card p-4">
            <Label htmlFor="ws-goal" className="text-sm font-medium">Or describe your goal</Label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="ws-goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. hire a delivery boy and pay salary; reply to GST notice; make Diwali offers" className="pl-9" />
            </div>
            {goal.trim().length > 2 && (
              goalMatches.length ? (
                <div className="mt-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {goalMatches.map(({ t }) => (
                      <Link key={t.id} to={`/tool/${t.id}`} className="flex items-center gap-2 rounded-xl border border-border/60 p-2 hover:border-primary/50">
                        <AppIcon toolId={t.id} category={t.category} name={t.name} size="sm" className="h-9 w-9" />
                        <span className="min-w-0"><span className="block truncate text-sm font-medium">{t.name}</span><span className="block truncate text-[11px] text-muted-foreground">{t.description}</span></span>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="gap-1.5" onClick={() => start(null, goalMatches.slice(0, 6).map((m) => m.t.id), goal.trim().slice(0, 60))}><Plus className="h-3.5 w-3.5" /> Make this my workspace</Button>
                    {user && <Button size="sm" variant="ghost" onClick={logGap}>Not what I need — request an app</Button>}
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  No app matches that yet.
                  {user ? <Button size="sm" variant="outline" className="gap-1.5" onClick={logGap}><Sparkles className="h-3.5 w-3.5" /> Request it (we review requests every week)</Button> : <Link to="/auth" className="text-primary hover:underline">Sign in to request it</Link>}
                </div>
              )
            )}
          </div>
        </section>

        </>)}
        {/* Shared details */}
        <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">{active ? "Your business" : "2. About your business"}</h2>
            <WorkspaceCard />
            <p className="text-xs text-muted-foreground">Used as "From" on invoices, POs, letters and contracts.</p>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">{active ? "" : "3. "}Who you're working for {role && !role.usesClient && <span className="text-sm font-normal text-muted-foreground">(optional)</span>}</h2>
            <form className="rounded-2xl border border-border/60 bg-card p-4" onSubmit={(e) => { e.preventDefault(); saveDetails(); }}>
              {(ctx.clients ?? []).length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Your clients:</span>
                  {(ctx.clients ?? []).map((c) => (
                    <span key={c.name} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs", c.name === ctx.client?.name ? "border-primary bg-primary/10" : "border-border")}>
                      <button type="button" onClick={() => { merge({ client: c }); toast.success(`Switched to ${c.name}`); }}>{c.name}</button>
                      <button type="button" aria-label={`Remove ${c.name}`} onClick={() => merge({ clients: (ctx.clients ?? []).filter((x) => x.name !== c.name) })}><Trash2 className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {([["name", "Client / customer name"], ["gstin", "Client GSTIN"], ["state", "State"], ["address", "Address"], ["email", "Email"], ["phone", "Phone"]] as [keyof WorkClient, string][]).map(([k, l]) => (
                  <div key={k} className={cn("space-y-1", k === "address" && "sm:col-span-3")}>
                    <Label htmlFor={`cl-${k}`} className="text-xs">{l}</Label>
                    <Input id={`cl-${k}`} value={client[k] ?? ""} onChange={(e) => setClient({ ...client, [k]: e.target.value })} />
                  </div>
                ))}
                <div className="space-y-1 sm:col-span-2"><Label htmlFor="en-svc" className="text-xs">Service / engagement</Label><Input id="en-svc" value={engagement.service ?? ""} onChange={(e) => setEngagement({ ...engagement, service: e.target.value })} placeholder="Monthly GST filing & bookkeeping" /></div>
                <div className="space-y-1"><Label htmlFor="en-fee" className="text-xs">Fee (₹)</Label><Input id="en-fee" type="number" value={engagement.fee ?? ""} onChange={(e) => setEngagement({ ...engagement, fee: e.target.value })} /></div>
                {(!role || role.usesMoney) && (
                  <>
                    <div className="space-y-1"><Label htmlFor="mo-rev" className="text-xs">This month's sales (₹)</Label><Input id="mo-rev" type="number" value={money.rev} onChange={(e) => setMoney({ ...money, rev: e.target.value })} /></div>
                    <div className="space-y-1"><Label htmlFor="mo-exp" className="text-xs">This month's costs (₹)</Label><Input id="mo-exp" type="number" value={money.exp} onChange={(e) => setMoney({ ...money, exp: e.target.value })} /></div>
                  </>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="submit" className="gap-1.5"><Check className="h-4 w-4" /> Use these details</Button>
                <Button type="button" variant="outline" className="gap-1.5" onClick={saveClient}><UserRound className="h-4 w-4" /> Save to client list</Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Apps also update these as you work — e.g. an invoice's total flows into the Tax Estimator. {user ? "Saved to your account." : "Saved in this browser — sign in to keep it on every device."}</p>
            </form>
          </div>
        </section>

        {active && (
          <>        {/* Pick a workflow */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">{active ? "Start another workspace" : "1. What do you do?"}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {ROLES.map((r) => (
              <button key={r.id} type="button" onClick={() => start(r, r.steps.map((s) => s.toolId), r.label)} className={cn("group flex flex-col items-start rounded-2xl border bg-card p-3 text-left transition-colors hover:border-primary/60", params.get("role") === r.id && !active ? "border-primary ring-2 ring-primary/30" : "border-border/60")}>
                <span className="text-2xl" aria-hidden>{r.emoji}</span>
                <span className="mt-1 text-sm font-semibold group-hover:text-primary">{r.label}</span>
                <span className="mt-1 line-clamp-3 text-[11px] text-muted-foreground">{r.goal}</span>
                <span className="mt-2 text-[11px] font-medium text-primary">{r.steps.length} apps →</span>
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-border/60 bg-card p-4">
            <Label htmlFor="ws-goal" className="text-sm font-medium">Or describe your goal</Label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="ws-goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. hire a delivery boy and pay salary; reply to GST notice; make Diwali offers" className="pl-9" />
            </div>
            {goal.trim().length > 2 && (
              goalMatches.length ? (
                <div className="mt-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {goalMatches.map(({ t }) => (
                      <Link key={t.id} to={`/tool/${t.id}`} className="flex items-center gap-2 rounded-xl border border-border/60 p-2 hover:border-primary/50">
                        <AppIcon toolId={t.id} category={t.category} name={t.name} size="sm" className="h-9 w-9" />
                        <span className="min-w-0"><span className="block truncate text-sm font-medium">{t.name}</span><span className="block truncate text-[11px] text-muted-foreground">{t.description}</span></span>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="gap-1.5" onClick={() => start(null, goalMatches.slice(0, 6).map((m) => m.t.id), goal.trim().slice(0, 60))}><Plus className="h-3.5 w-3.5" /> Make this my workspace</Button>
                    {user && <Button size="sm" variant="ghost" onClick={logGap}>Not what I need — request an app</Button>}
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  No app matches that yet.
                  {user ? <Button size="sm" variant="outline" className="gap-1.5" onClick={logGap}><Sparkles className="h-3.5 w-3.5" /> Request it (we review requests every week)</Button> : <Link to="/auth" className="text-primary hover:underline">Sign in to request it</Link>}
                </div>
              )
            )}
          </div>
        </section>

          </>
        )}
        {sessions.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Your workspaces</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => (
                <li key={s.id} className={cn("flex items-center gap-2 rounded-2xl border bg-card p-3", s.id === active?.id ? "border-primary/50" : "border-border/60")}>
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => activate(s)}>
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s.client?.name ? `${s.client.name} · ` : ""}{s.done.length}/{s.tools.length} done</p>
                  </button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Delete ${s.name}`} onClick={() => { saveSessions(sessions.filter((x) => x.id !== s.id)); if (s.id === active?.id) merge({ session: undefined }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
