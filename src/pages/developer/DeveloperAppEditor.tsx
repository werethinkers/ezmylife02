import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, FileUp, Loader2, Send, ShieldCheck, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_HTML_BYTES,
  getApp,
  getVersionHtml,
  kb,
  listCategories,
  runChecks,
  saveDraft,
  sourceText,
  submitVersion,
  uploadHtml,
  when,
  withdrawVersion,
  type DevVersion,
  type Listing,
} from "@/lib/devApps";
import { ChecksReport, Pill, PreviewPanel, Section, VersionPill } from "./parts";

const selectClass =
  "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const emptyForm = { name: "", short_description: "", description: "", category: "", types: "", support_email: "", release_notes: "" };

const formFrom = (v: DevVersion | undefined) =>
  v
    ? {
        name: v.name ?? "",
        short_description: v.short_description ?? "",
        description: v.description ?? "",
        category: v.category ?? "",
        types: (v.tool_types ?? []).join(", "),
        support_email: v.support_email ?? "",
        release_notes: v.release_notes ?? "",
      }
    : emptyForm;

export default function DeveloperAppEditor() {
  const { appId } = useParams<{ appId: string }>();
  const qc = useQueryClient();
  const data = useQuery({ queryKey: ["dev-app", appId], queryFn: () => getApp(appId!), enabled: !!appId });
  const categories = useQuery({ queryKey: ["dev-categories"], queryFn: listCategories, staleTime: 30 * 60 * 1000 });
  const app = data.data?.app;
  const versions = data.data?.versions ?? [];
  const latest = versions[0];
  const html = useQuery({
    queryKey: ["dev-html", latest?.id, latest?.updated_at],
    queryFn: () => getVersionHtml(latest!.id),
    enabled: !!latest,
  });

  const [form, setForm] = useState(emptyForm);
  const [paste, setPaste] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "file" | "listing" | "checks" | "submit" | "withdraw">(null);
  const [progress, setProgress] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load the form whenever a different version (or a fresh save) arrives.
  useEffect(() => setForm(formFrom(latest)), [latest?.id, latest?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["dev-app", appId] });
    await qc.invalidateQueries({ queryKey: ["dev-apps"] });
  };

  const act = async (kind: NonNullable<typeof busy>, fn: () => Promise<unknown>, ok: string) => {
    setBusy(kind);
    try {
      await fn();
      await refresh();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  if (data.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center pt-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </div>
    );
  }
  if (!app || !latest) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-md px-4 pt-24 text-center">
          <p className="font-display text-xl font-bold">App not found</p>
          <p className="mt-2 text-sm text-muted-foreground">{(data.error as Error)?.message ?? "It may belong to another account."}</p>
          <Button asChild className="mt-5" variant="outline"><Link to="/developer">Back to your apps</Link></Button>
        </div>
      </div>
    );
  }

  const locked = latest.status === "submitted";
  const startsNext = ["approved", "rejected", "superseded"].includes(latest.status);
  const editable = latest.status === "draft" || latest.status === "changes_requested";
  const nextNo = startsNext ? latest.version_no + 1 : latest.version_no;
  const htmlText = html.data?.html ?? "";
  const hasFile = htmlText.trim().length > 0;
  const listingDirty = JSON.stringify(form) !== JSON.stringify(formFrom(latest));

  const listing = (): Listing => ({
    name: form.name,
    short_description: form.short_description,
    description: form.description,
    category: form.category,
    tool_types: form.types.split(",").map((t) => t.trim()).filter(Boolean),
    support_email: form.support_email,
    release_notes: form.release_notes,
  });

  const saveHtml = async (text: string, fileName?: string) => {
    const bytes = new Blob([text]).size;
    if (bytes > MAX_HTML_BYTES) return toast.error(`The file is ${kb(bytes)}. The limit is 10 MB.`);
    await act(
      "file",
      () =>
        uploadHtml(app.id, text, {
          fileName,
          onProgress: (done, total) => setProgress(total > 1 ? `Sending part ${Math.min(done + 1, total)} of ${total}…` : null),
        }),
      startsNext ? `Saved as version ${nextNo}. Run the checks next.` : "App file saved. Run the checks next.",
    );
    setProgress(null);
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (fileRef.current) fileRef.current.value = "";
    if (f.size > MAX_HTML_BYTES) return toast.error(`The file is ${kb(f.size)}. The limit is 10 MB.`);
    await saveHtml(await f.text(), f.name);
  };

  const reviewNotes = latest.review_notes && (latest.status === "changes_requested" || latest.status === "draft" || latest.status === "rejected") ? latest.review_notes : null;

  return (
    <div className="min-h-screen bg-background">
      <PageSeo title={`${latest.name || app.tool_id} | Developer apps`} description="Edit, check and send your app." path={`/developer/apps/${app.id}`} noindex />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6">
        <Link to="/developer" className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-2 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Your apps
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold">{latest.name || "Untitled app"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">ezyourlife.com/tool/{app.tool_id} · version {latest.version_no}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <VersionPill status={latest.status} />
            {app.status === "live" && (
              <Button asChild variant="outline" size="sm">
                <a href={`/tool/${app.tool_id}`} target="_blank" rel="noreferrer">
                  Open live app <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            {app.status === "unlisted" && <Pill tone="bg-muted">Taken down by the team</Pill>}
          </div>
        </div>

        {locked && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-ink bg-sun/50 p-3 text-sm">
            <p>Version {latest.version_no} is waiting for review since {when(latest.submitted_at)}. It can't be changed while it waits.</p>
            <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void act("withdraw", () => withdrawVersion(latest.id), "Withdrawn. You can edit it again.")}>
              <Undo2 className="h-3.5 w-3.5" /> Withdraw to edit
            </Button>
          </div>
        )}
        {reviewNotes && (
          <div className="mt-4 rounded-xl border-2 border-ink bg-coral/30 p-3 text-sm">
            <p className="font-semibold">{latest.status === "rejected" ? "Our team did not accept this version" : "Our team asked for changes"}</p>
            <p className="mt-1 whitespace-pre-wrap">{reviewNotes}</p>
          </div>
        )}
        {startsNext && latest.status === "approved" && (
          <p className="mt-4 rounded-xl border-2 border-ink bg-teal/30 p-3 text-sm">
            Version {latest.version_no} is live. Any change you save starts version {nextNo}; the live app stays exactly as it is until that version is approved.
          </p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="space-y-6">
            <Section
              step={1}
              title="App file"
              hint="One HTML file with its CSS and JavaScript inside, up to 10 MB. Built with React, Vue or Svelte? Build it as a single file first, or ask Claude to adapt and send it."
              aside={hasFile ? <span className="text-right text-xs text-muted-foreground">Saved: {kb(new Blob([htmlText]).size)}{latest.source ? <><br />{sourceText(latest.source)}</> : null}</span> : null}
            >
              <div className="flex flex-wrap gap-2">
                <input ref={fileRef} type="file" accept=".html,.htm,text/html" className="sr-only" id="dev-file" onChange={(e) => void onFile(e.target.files?.[0])} disabled={locked || busy !== null} />
                <Button type="button" onClick={() => fileRef.current?.click()} disabled={locked || busy !== null}>
                  {busy === "file" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                  {busy === "file" && progress ? progress : hasFile ? "Replace file" : "Upload HTML file"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setPaste(paste === null ? htmlText : null)} disabled={locked}>
                  {paste === null ? "Paste or edit HTML" : "Close editor"}
                </Button>
              </div>
              {paste !== null && (
                <div className="mt-3 space-y-2">
                  <Textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={12} className="font-mono text-xs" spellCheck={false} aria-label="App HTML" />
                  <Button type="button" onClick={() => void saveHtml(paste)} disabled={locked || busy !== null || !paste.trim()}>
                    Save HTML
                  </Button>
                </div>
              )}
            </Section>

            <Section step={2} title="Store listing" hint="What people see in the store. Our team may edit wording before it goes live.">
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act("listing", () => saveDraft(app.id, null, listing()), startsNext ? `Saved as version ${nextNo}.` : "Listing saved.");
                }}
              >
                <div className="sm:col-span-2">
                  <Label htmlFor="l-name">App name</Label>
                  <Input id="l-name" value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={locked} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="l-short">One line: what it does</Label>
                  <Input id="l-short" value={form.short_description} maxLength={160} onChange={(e) => setForm({ ...form, short_description: e.target.value })} disabled={locked} placeholder="Split a restaurant bill and tip between friends in seconds." />
                  <p className="mt-1 text-xs text-muted-foreground">{form.short_description.length}/160 · at least 20</p>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="l-desc">Full description</Label>
                  <Textarea id="l-desc" value={form.description} maxLength={4000} rows={4} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={locked} placeholder="What you give, what you get, and who it's for." />
                </div>
                <div>
                  <Label htmlFor="l-cat">Category</Label>
                  <select id="l-cat" className={selectClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={locked}>
                    <option value="">Pick a category</option>
                    {(categories.data ?? []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="l-types">Filter types (comma separated)</Label>
                  <Input id="l-types" value={form.types} onChange={(e) => setForm({ ...form, types: e.target.value })} disabled={locked} placeholder="Calculator, Money" />
                </div>
                <div>
                  <Label htmlFor="l-email">Support email</Label>
                  <Input id="l-email" type="email" value={form.support_email} onChange={(e) => setForm({ ...form, support_email: e.target.value })} disabled={locked} />
                </div>
                {(latest.version_no > 1 || startsNext) && (
                  <div>
                    <Label htmlFor="l-notes">What's new in this version</Label>
                    <Input id="l-notes" value={form.release_notes} maxLength={1000} onChange={(e) => setForm({ ...form, release_notes: e.target.value })} disabled={locked} />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={locked || busy !== null || !listingDirty}>
                    {busy === "listing" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {listingDirty ? "Save listing" : "Listing saved"}
                  </Button>
                </div>
              </form>
            </Section>

            <Section
              step={3}
              title="Checks"
              hint="They run on EzYourLife's server: keys and passwords, AI calls, payments, size, phone fit, outside addresses, listing and similar apps."
              aside={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void act("checks", () => runChecks(latest.id), "Checks finished.")}
                  disabled={busy !== null || !(editable || locked) || !hasFile || listingDirty}
                >
                  {busy === "checks" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Run checks
                </Button>
              }
            >
              {listingDirty && <p className="mb-2 text-sm text-muted-foreground">Save the listing first.</p>}
              {startsNext ? (
                <p className="text-sm text-muted-foreground">Save a change to start version {nextNo}, then run the checks on it.</p>
              ) : (
                <ChecksReport qa={latest.qa} stale={latest.updated_at !== latest.created_at} />
              )}
            </Section>

            <Section step={4} title="Send for review" hint="Our team tries the app, sets the credits per use and your share, then approves. One click puts it live.">
              <Button
                type="button"
                onClick={() => void act("submit", () => submitVersion(latest.id), "Sent for review.")}
                disabled={busy !== null || !editable || !latest.qa_passed || listingDirty}
              >
                {busy === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send version {latest.version_no} for review
              </Button>
              {!latest.qa_passed && editable && <p className="mt-2 text-sm text-muted-foreground">Run the checks and fix anything marked “Must fix” first.</p>}
              {app.credits != null && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Set by the team: {app.credits} credit{app.credits === 1 ? "" : "s"} per use, your share {Number(app.share_pct ?? 0)}%.
                </p>
              )}
            </Section>

            <Section title="Versions">
              <ul className="divide-y-2 divide-ink/10 text-sm">
                {versions.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="font-semibold">Version {v.version_no}</span>
                    <span className="text-muted-foreground">
                      {v.submitted_at ? `sent ${when(v.submitted_at)}` : `saved ${when(v.updated_at)}`}
                      {v.reviewed_at ? ` · decided ${when(v.reviewed_at)}` : ""}
                      {v.source ? ` · ${sourceText(v.source)}` : ""}
                    </span>
                    <VersionPill status={v.status} />
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <PreviewPanel
              html={hasFile ? htmlText : null}
              title={latest.name || app.tool_id}
              fullScreenHref={hasFile ? `/developer/preview/${latest.id}` : undefined}
              emptyText={html.isLoading ? "Loading…" : undefined}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
