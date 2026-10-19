import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Loader2, MessageSquareWarning, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminApprove,
  adminApps,
  adminQueue,
  adminRequestChanges,
  adminSetListed,
  getVersionHtml,
  isAdmin,
  kb,
  when,
  type QueueItem,
} from "@/lib/devApps";
import { ChecksReport, Pill, PreviewPanel, VersionPill } from "./parts";

/*
 * Admin review of developer apps. Approve and publish is one click: it sets the credits per use
 * and the developer share, lists the app in the store and creates its price row
 * (admin_dev_approve in supabase/migrations/20261020010000_developer_apps.sql).
 */

/** What one credit earns at the worst case: the ₹999 kit sold at the 50% influencer commission cap. */
const WORST_CASE_INR_PER_CREDIT = 0.108;

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Review({ item, onDone }: { item: QueueItem; onDone: () => Promise<void> }) {
  const html = useQuery({ queryKey: ["dev-admin-html", item.version_id], queryFn: () => getVersionHtml(item.version_id) });
  const [credits, setCredits] = useState(item.credits != null ? String(item.credits) : "");
  const [share, setShare] = useState(item.share_pct != null ? String(Number(item.share_pct)) : "");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<null | "approve" | "changes" | "reject">(null);

  useEffect(() => {
    setCredits(item.credits != null ? String(item.credits) : "");
    setShare(item.share_pct != null ? String(Number(item.share_pct)) : "");
    setNotes("");
  }, [item.version_id, item.credits, item.share_pct]);

  const c = Number(credits);
  const s = Number(share);
  const valid = credits !== "" && share !== "" && Number.isInteger(c) && c >= 1 && c <= 100 && s >= 0 && s <= 90;
  const perUse = c * WORST_CASE_INR_PER_CREDIT;

  const run = async (kind: NonNullable<typeof busy>, fn: () => Promise<unknown>, ok: string) => {
    setBusy(kind);
    try {
      await fn();
      toast.success(ok);
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-ink bg-card p-5 shadow-block-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold">{item.name}</h2>
            <p className="text-sm text-muted-foreground">
              /tool/{item.tool_id} · version {item.version_no} · {item.developer_email ?? "unknown developer"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.live_version_no ? <Pill tone="bg-sky">Update to live v{item.live_version_no}</Pill> : <Pill tone="bg-lime">New app</Pill>}
            <Pill tone={item.qa_passed ? "bg-teal" : "bg-coral"}>{item.qa_passed ? "Checks passed" : "Checks failed"}</Pill>
          </div>
        </div>
        <p className="mt-3 font-semibold">{item.short_description}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p>
        <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div><dt className="inline font-semibold">Category: </dt><dd className="inline">{item.category ?? "none"}</dd></div>
          <div><dt className="inline font-semibold">Filter types: </dt><dd className="inline">{item.tool_types?.join(", ") || "none"}</dd></div>
          <div><dt className="inline font-semibold">Support: </dt><dd className="inline">{item.support_email ?? "none"}</dd></div>
          <div><dt className="inline font-semibold">Size: </dt><dd className="inline">{kb(item.bytes)} · sent {when(item.submitted_at)}</dd></div>
          {item.release_notes && <div className="sm:col-span-2"><dt className="inline font-semibold">What's new: </dt><dd className="inline">{item.release_notes}</dd></div>}
          <div className="sm:col-span-2 text-xs text-muted-foreground">Content fingerprint {item.html_sha256?.slice(0, 16)}: this exact file is what goes live.</div>
        </dl>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-5">
          <div className="rounded-2xl border-2 border-ink bg-card p-5 shadow-block-sm">
            <h3 className="mb-3 font-display text-base font-bold">Checks report</h3>
            <ChecksReport qa={item.qa} />
          </div>

          <div className="rounded-2xl border-2 border-ink bg-card p-5 shadow-block-sm">
            <h3 className="font-display text-base font-bold">Decide</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="a-credits">Credits per use</Label>
                <Input id="a-credits" type="number" min={1} max={100} step={1} value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="e.g. 2" />
              </div>
              <div>
                <Label htmlFor="a-share">Developer share (%)</Label>
                <Input id="a-share" type="number" min={0} max={90} step={1} value={share} onChange={(e) => setShare(e.target.value)} placeholder="e.g. 30" />
              </div>
            </div>
            {valid && (
              <p className="mt-3 rounded-lg bg-background p-2 text-sm">
                Worst case (₹999 kit, 50% influencer commission): a use earns {inr(perUse)}, of which the developer gets {inr((perUse * s) / 100)} and EzYourLife keeps {inr(perUse - (perUse * s) / 100)}.
              </p>
            )}
            <Button
              className="mt-4 w-full"
              size="lg"
              disabled={!valid || !item.qa_passed || busy !== null}
              onClick={() => void run("approve", () => adminApprove(item.version_id, c, s), `${item.name} is live at /tool/${item.tool_id}. It shows in the store within about 10 minutes.`)}
            >
              {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve and publish
            </Button>

            <div className="mt-6 border-t-2 border-ink/10 pt-4">
              <Label htmlFor="a-notes">Or send it back (the developer sees this)</Label>
              <Textarea id="a-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What needs to change, in plain words." />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="outline" disabled={notes.trim().length < 5 || busy !== null} onClick={() => void run("changes", () => adminRequestChanges(item.version_id, notes), "Sent back with your notes.")}>
                  {busy === "changes" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareWarning className="h-4 w-4" />} Ask for changes
                </Button>
                <Button variant="outline" disabled={notes.trim().length < 5 || busy !== null} onClick={() => void run("reject", () => adminRequestChanges(item.version_id, notes, true), "Not accepted.")}>
                  {busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Don't accept
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <PreviewPanel
            html={html.data?.html ?? null}
            title={item.name}
            fullScreenHref={`/developer/preview/${item.version_id}`}
            emptyText={html.isLoading ? "Loading…" : (html.error as Error)?.message}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminDeveloperApps() {
  const qc = useQueryClient();
  const admin = useQuery({ queryKey: ["dev-is-admin"], queryFn: isAdmin, staleTime: 10 * 60 * 1000 });
  const queue = useQuery({ queryKey: ["dev-admin-queue"], queryFn: adminQueue, enabled: admin.data === true });
  const apps = useQuery({ queryKey: ["dev-admin-apps"], queryFn: adminApps, enabled: admin.data === true });
  const [tab, setTab] = useState<"queue" | "apps">("queue");
  const [selected, setSelected] = useState<string | null>(null);

  const items = useMemo(() => queue.data ?? [], [queue.data]);
  const current = items.find((i) => i.version_id === selected) ?? items[0];

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["dev-admin-queue"] });
    await qc.invalidateQueries({ queryKey: ["dev-admin-apps"] });
    setSelected(null);
  };

  if (admin.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center pt-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </div>
    );
  }
  if (!admin.data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <p className="mx-auto max-w-md px-4 pt-24 text-center font-semibold">Admins only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageSeo title="Developer apps review | Admin" description="Review developer apps." path="/admin/developer-apps" noindex />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Developer apps</h1>
            <p className="mt-1 text-sm text-muted-foreground">Try each app, read its checks, set the price and the developer's share, then approve. Nothing goes live without this page.</p>
          </div>
          <div className="flex rounded-xl border-2 border-ink p-0.5" role="tablist">
            <button role="tab" aria-selected={tab === "queue"} onClick={() => setTab("queue")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === "queue" ? "bg-ink text-background" : ""}`}>
              Waiting ({items.length})
            </button>
            <button role="tab" aria-selected={tab === "apps"} onClick={() => setTab("apps")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === "apps" ? "bg-ink text-background" : ""}`}>
              All apps ({apps.data?.length ?? 0})
            </button>
          </div>
        </div>

        {(queue.error || apps.error) && (
          <p className="mt-4 rounded-xl border-2 border-ink bg-coral/30 p-3 text-sm">{((queue.error || apps.error) as Error).message}</p>
        )}

        {tab === "queue" ? (
          queue.isLoading ? (
            <div className="flex justify-center pt-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : !items.length ? (
            <p className="mt-8 rounded-2xl border-2 border-dashed border-ink/40 p-10 text-center text-muted-foreground">Nothing waiting for review.</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
              <ul className="space-y-2">
                {items.map((i) => (
                  <li key={i.version_id}>
                    <button
                      onClick={() => setSelected(i.version_id)}
                      className={`w-full rounded-xl border-2 border-ink p-3 text-left ${current?.version_id === i.version_id ? "bg-sun shadow-block-sm" : "bg-card"}`}
                    >
                      <p className="font-semibold">{i.name}</p>
                      <p className="text-xs text-muted-foreground">v{i.version_no} · {i.live_version_no ? "update" : "new"} · {when(i.submitted_at)}</p>
                      <p className="truncate text-xs text-muted-foreground">{i.developer_email}</p>
                    </button>
                  </li>
                ))}
              </ul>
              {current && <Review item={current} onDone={refresh} />}
            </div>
          )
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-ink bg-card">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b-2 border-ink text-left">
                <tr>
                  <th className="p-3">App</th>
                  <th className="p-3">Developer</th>
                  <th className="p-3">Store</th>
                  <th className="p-3">Latest version</th>
                  <th className="p-3">Credits / share</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink/10">
                {(apps.data ?? []).map((a) => (
                  <tr key={a.app_id}>
                    <td className="p-3">
                      <p className="font-semibold">{a.name || a.tool_id}</p>
                      <p className="text-xs text-muted-foreground">/tool/{a.tool_id}</p>
                    </td>
                    <td className="p-3">{a.developer_email}</td>
                    <td className="p-3">
                      {a.status === "live" ? <Pill tone="bg-teal">Live v{a.live_version_no}</Pill> : a.status === "unlisted" ? <Pill tone="bg-muted">Taken down</Pill> : <Pill tone="bg-muted">Not live</Pill>}
                    </td>
                    <td className="p-3">{a.latest_status ? <span className="inline-flex items-center gap-2">v{a.latest_version_no} <VersionPill status={a.latest_status} /></span> : null}</td>
                    <td className="p-3">{a.credits != null ? `${a.credits} · ${Number(a.share_pct ?? 0)}%` : ""}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        {a.status === "live" && (
                          <Button asChild size="sm" variant="outline"><Link to={`/tool/${a.tool_id}`} target="_blank">Open <ExternalLink className="h-3.5 w-3.5" /></Link></Button>
                        )}
                        {a.status === "live" && (
                          <Button size="sm" variant="outline" onClick={() => void adminSetListed(a.app_id, false).then(refresh).then(() => toast.success("Taken down from the store.")).catch((e) => toast.error(e.message))}>
                            Take down
                          </Button>
                        )}
                        {a.status === "unlisted" && (
                          <Button size="sm" variant="outline" onClick={() => void adminSetListed(a.app_id, true).then(refresh).then(() => toast.success("Back in the store.")).catch((e) => toast.error(e.message))}>
                            Put back
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
