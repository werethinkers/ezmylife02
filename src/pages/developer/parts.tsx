import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Laptop, RotateCcw, Smartphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HostedFrame } from "@/apps/hosted/HostedFrame";
import type { AiTarget } from "@/apps/hosted/aiBridge";
import { PREVIEW_MESSAGE, PREVIEW_RUN_EVENT } from "@/apps/lib/preview";
import { CHECK_TEXT, VERSION_TEXT, imageData, runsLeft, when, type DevImage, type Promo, type QaDuplicate, type QaReport, type VersionStatus } from "@/lib/devApps";

/* Pieces shared by the developer pages and the admin review page. */

export function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold ${tone}`}>{children}</span>;
}

export function VersionPill({ status }: { status: VersionStatus }) {
  const t = VERSION_TEXT[status];
  return <Pill tone={t.tone}>{t.label}</Pill>;
}

export function Section({ step, title, hint, children, aside }: { step?: number; title: string; hint?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-ink bg-card p-5 shadow-block-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            {step && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun text-xs">{step}</span>}
            {title}
          </h2>
          {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** The server checks, as plain rows with a coloured tag each. */
export function ChecksReport({ qa, stale, hideSimilar }: { qa: QaReport | null; stale?: boolean; hideSimilar?: boolean }) {
  if (!qa) {
    return <p className="text-sm text-muted-foreground">{stale ? "Not checked since the last change." : "Not checked yet."}</p>;
  }
  const order = { fail: 0, warn: 1, pass: 2 } as const;
  const rows = [...qa.checks].sort((a, b) => order[a.status] - order[b.status]);
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">
        {qa.passed ? "Ready to send for review." : "Fix the items marked “Must fix”, save, and run the checks again."}
        <span className="ml-2 font-normal text-muted-foreground">Checked {when(qa.ran_at)}</span>
      </p>
      <ul className="divide-y-2 divide-ink/10 rounded-xl border-2 border-ink bg-background">
        {rows.map((c) => (
          <li key={c.id} className="flex items-start gap-3 px-3 py-2.5">
            <Pill tone={CHECK_TEXT[c.status].tone}>{CHECK_TEXT[c.status].label}</Pill>
            <div className="min-w-0 text-sm">
              <p className="font-semibold">{c.label}</p>
              <p className="break-words text-muted-foreground">{c.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      {!hideSimilar && qa.duplicates?.length > 0 && <SimilarList items={qa.duplicates} />}
    </div>
  );
}

/**
 * Apps like this one that are already in the store or in review. Another developer's app that is still in review
 * has no link and no name for developers (only the team sees those).
 */
export function SimilarList({ items, title = "Similar apps" }: { items: QaDuplicate[]; title?: string }) {
  return (
    <div className="rounded-xl border-2 border-ink bg-sun/30 p-3 text-sm">
      <p className="font-semibold">{title}</p>
      <ul className="mt-1 space-y-1.5">
        {items.map((d, i) => (
          <li key={d.tool_id ?? `${d.name}-${i}`}>
            <div className="flex flex-wrap items-center gap-2">
              {d.tool_id ? (
                <Link to={d.path || `/tool/${d.tool_id}`} target="_blank" className="font-semibold underline underline-offset-2">
                  {d.name}
                </Link>
              ) : (
                <span className="font-semibold">{d.name}</span>
              )}
              <span className="text-muted-foreground">
                {d.source === "store" ? "in the store" : d.status === "in review" || !d.tool_id ? "another developer, in review" : "by another developer"} ·{" "}
                {Math.round(d.score * 100)}% of words in common
              </span>
            </div>
            {d.short_description && <p className="text-xs text-muted-foreground">{d.short_description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Test runs left today", refreshed after each run in the preview frame. Admins are not limited. */
export function RunsLeft() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["dev-runs-left"], queryFn: runsLeft, staleTime: 0, retry: false });
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === PREVIEW_MESSAGE) void qc.invalidateQueries({ queryKey: ["dev-runs-left"] });
    };
    const onRun = () => void qc.invalidateQueries({ queryKey: ["dev-runs-left"] });
    window.addEventListener("message", onMessage);
    window.addEventListener(PREVIEW_RUN_EVENT, onRun);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener(PREVIEW_RUN_EVENT, onRun);
    };
  }, [qc]);
  if (!q.data) return null;
  const { left, limit } = q.data;
  const none = left !== null && left <= 0;
  return (
    <Pill tone={none ? "bg-coral" : "bg-teal"}>
      {left === null ? "Test runs: no daily limit" : none ? "No test runs left today" : `${left} of ${limit} test runs left today`}
    </Pill>
  );
}

/**
 * The real app of an AI version, in a frame of its own so it gets a true phone or desktop width. The frame loads the
 * bare embed page (same screens the store uses). Test runs are free and limited each day.
 */
export function AiPreviewFrame({ versionId, title, device, reloadKey = 0 }: { versionId: string; title: string; device: "phone" | "desktop"; reloadKey?: number }) {
  const frame = <iframe key={reloadKey} title={title} src={`/developer/preview/${versionId}/embed`} className="h-full w-full border-0 bg-background" />;
  if (device === "phone") {
    return (
      <div className="flex justify-center">
        <div className="h-[740px] max-h-[80vh] w-full max-w-[390px] overflow-hidden rounded-[28px] border-2 border-ink bg-background shadow-block">{frame}</div>
      </div>
    );
  }
  return <div className="h-full w-full overflow-hidden bg-background">{frame}</div>;
}

/** Phone / desktop switch, restart, runs left. Same look as the preview of file apps. */
export function AiPreviewPanel({ versionId, title, fullScreenHref }: { versionId: string | null; title: string; fullScreenHref?: string }) {
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <div className="rounded-2xl border-2 border-ink bg-card p-4 shadow-block-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base font-bold">Live preview</h2>
        <div className="flex items-center gap-1.5">
          <DeviceSwitch device={device} onChange={setDevice} />
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setReloadKey((k) => k + 1)} aria-label="Restart the app">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          {fullScreenHref && (
            <Button asChild variant="outline" size="sm" className="h-8">
              <a href={fullScreenHref} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Full screen</span>
              </a>
            </Button>
          )}
        </div>
      </div>
      {versionId ? (
        device === "phone" ? (
          <AiPreviewFrame versionId={versionId} title={title} device="phone" reloadKey={reloadKey} />
        ) : (
          <div className="h-[640px] max-h-[75vh] overflow-hidden rounded-xl border-2 border-ink">
            <AiPreviewFrame versionId={versionId} title={title} device="desktop" reloadKey={reloadKey} />
          </div>
        )
      ) : (
        <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-ink/40 text-center text-sm text-muted-foreground">Save the app first to see it here.</div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <RunsLeft />
        <p className="text-xs text-muted-foreground">
          This is the real app on the same screens the store uses. Test runs use the real AI, cost you nothing, and the team can read them at review.
        </p>
      </div>
    </div>
  );
}

function DeviceSwitch({ device, onChange }: { device: "phone" | "desktop"; onChange: (d: "phone" | "desktop") => void }) {
  return (
    <div className="flex rounded-lg border-2 border-ink p-0.5" role="group" aria-label="Preview size">
      {(["phone", "desktop"] as const).map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          aria-pressed={device === d}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${device === d ? "bg-ink text-background" : ""}`}
        >
          {d === "phone" ? <Smartphone className="h-3.5 w-3.5" /> : <Laptop className="h-3.5 w-3.5" />} {d === "phone" ? "Phone" : "Desktop"}
        </button>
      ))}
    </div>
  );
}

/** Live preview with a phone / desktop switch, restart, and a full-screen link. */
export function PreviewPanel({ html, title, fullScreenHref, emptyText, ai }: { html: string | null; title: string; fullScreenHref?: string; emptyText?: string; ai?: AiTarget }) {
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <div className="rounded-2xl border-2 border-ink bg-card p-4 shadow-block-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base font-bold">Live preview</h2>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg border-2 border-ink p-0.5" role="group" aria-label="Preview size">
            <button
              type="button"
              onClick={() => setDevice("phone")}
              aria-pressed={device === "phone"}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${device === "phone" ? "bg-ink text-background" : ""}`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Phone
            </button>
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              aria-pressed={device === "desktop"}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${device === "desktop" ? "bg-ink text-background" : ""}`}
            >
              <Laptop className="h-3.5 w-3.5" /> Desktop
            </button>
          </div>
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setReloadKey((k) => k + 1)} aria-label="Restart the app">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          {fullScreenHref && (
            <Button asChild variant="outline" size="sm" className="h-8">
              <a href={fullScreenHref} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Full screen</span>
              </a>
            </Button>
          )}
        </div>
      </div>
      {html ? (
        device === "phone" ? (
          <HostedFrame html={html} title={title} device="phone" reloadKey={reloadKey} ai={ai} />
        ) : (
          <div className="h-[640px] max-h-[75vh] overflow-hidden rounded-xl border-2 border-ink">
            <HostedFrame html={html} title={title} device="desktop" reloadKey={reloadKey} ai={ai} />
          </div>
        )
      ) : (
        <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-ink/40 text-center text-sm text-muted-foreground">
          {emptyText ?? "Upload the app file to see it here."}
        </div>
      )}
      {ai ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RunsLeft />
          <p className="text-xs text-muted-foreground">
            This is the real app in the store's locked-down frame. Its AI step runs for real here as a free test run; the team reads these runs at review.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          This is the real app, running in the same locked-down frame the store uses. It works here without spending credits.
        </p>
      )}
    </div>
  );
}

/** One screenshot, loaded on its own so the page does not wait for all of them. */
export function Shot({ image, onRemove, className }: { image: DevImage; onRemove?: () => void; className?: string }) {
  const q = useQuery({ queryKey: ["dev-image", image.id], queryFn: () => imageData(image.id), staleTime: Infinity });
  return (
    <figure className={`relative overflow-hidden rounded-xl border-2 border-ink bg-background ${className ?? ""}`}>
      {q.data ? (
        <img src={q.data} alt={image.caption || `Screenshot ${image.position}`} className="aspect-[4/3] w-full object-cover object-top" loading="lazy" />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center text-xs text-muted-foreground">{q.isError ? "Could not load" : "Loading…"}</div>
      )}
      {(image.caption || onRemove) && (
        <figcaption className="flex items-center justify-between gap-2 border-t-2 border-ink px-2 py-1 text-xs">
          <span className="min-w-0 truncate">{image.caption || `Screenshot ${image.position}`}</span>
          {onRemove && (
            <button type="button" onClick={onRemove} className="shrink-0 rounded p-1 hover:bg-coral/30" aria-label={`Remove screenshot ${image.position}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </figcaption>
      )}
    </figure>
  );
}

/** The promo page text as visitors will see it (headline, highlights, steps, questions), with the screenshots. */
export function PromoSummary({ promo, images }: { promo: Promo | null | undefined; images: DevImage[] | undefined }) {
  if (!promo) return <p className="text-sm text-muted-foreground">No promo page text yet.</p>;
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="font-display text-lg font-bold">{promo.headline}</p>
        <p className="text-muted-foreground">{promo.tagline}</p>
        {promo.audience && <p className="mt-1 text-xs font-semibold">For: {promo.audience}</p>}
      </div>
      {(images?.length ?? 0) > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images!.map((i) => <Shot key={i.id} image={i} />)}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="font-semibold">Highlights</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">{promo.highlights.map((h) => <li key={h.title}><strong>{h.title}</strong>{h.body ? ` — ${h.body}` : ""}</li>)}</ul>
        </div>
        <div>
          <p className="font-semibold">How it works</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5">{promo.steps.map((s) => <li key={s.title}><strong>{s.title}</strong>{s.body ? ` — ${s.body}` : ""}</li>)}</ol>
        </div>
      </div>
      {(promo.faq?.length ?? 0) > 0 && (
        <div>
          <p className="font-semibold">Questions</p>
          <ul className="mt-1 space-y-1">{promo.faq!.map((f) => <li key={f.q}><strong>{f.q}</strong> {f.a}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
