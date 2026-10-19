import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Laptop, RotateCcw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HostedFrame } from "@/apps/hosted/HostedFrame";
import { CHECK_TEXT, VERSION_TEXT, when, type QaReport, type VersionStatus } from "@/lib/devApps";

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
export function ChecksReport({ qa, stale }: { qa: QaReport | null; stale?: boolean }) {
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
      {qa.duplicates?.length > 0 && (
        <div className="rounded-xl border-2 border-ink bg-sun/30 p-3 text-sm">
          <p className="font-semibold">Similar apps</p>
          <ul className="mt-1 space-y-1">
            {qa.duplicates.map((d) => (
              <li key={d.tool_id} className="flex flex-wrap items-center gap-2">
                <Link to={`/tool/${d.tool_id}`} target="_blank" className="font-semibold underline underline-offset-2">
                  {d.name}
                </Link>
                <span className="text-muted-foreground">
                  {d.source === "store" ? "in the store" : "by another developer"} · {Math.round(d.score * 100)}% of words in common
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Live preview with a phone / desktop switch, restart, and a full-screen link. */
export function PreviewPanel({ html, title, fullScreenHref, emptyText }: { html: string | null; title: string; fullScreenHref?: string; emptyText?: string }) {
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
          <HostedFrame html={html} title={title} device="phone" reloadKey={reloadKey} />
        ) : (
          <div className="h-[640px] max-h-[75vh] overflow-hidden rounded-xl border-2 border-ink">
            <HostedFrame html={html} title={title} device="desktop" reloadKey={reloadKey} />
          </div>
        )
      ) : (
        <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-ink/40 text-center text-sm text-muted-foreground">
          {emptyText ?? "Upload the app file to see it here."}
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        This is the real app, running in the same locked-down frame the store uses. It works here without spending credits.
      </p>
    </div>
  );
}
