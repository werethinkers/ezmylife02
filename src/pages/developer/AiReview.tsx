import { useState } from "react";
import type { DevVersion, QueueItem } from "@/lib/devApps";
import { aiChangesSinceLive, when } from "@/lib/devApps";
import { Pill, SimilarList } from "./parts";

/* Pieces of the admin review that only AI apps and similar-app notes need. All of it is shown to admins only. */

const inr2 = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

const ENGINE_TEXT = { doc: "Form, then a written result", chat: "Chat", vision: "Photos, then a written result" } as const;

const Box = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border-2 border-ink bg-card p-5 shadow-block-sm">
    <h3 className="mb-3 font-display text-base font-bold">{title}</h3>
    {children}
  </div>
);

const Prompt = ({ label, text }: { label: string; text: string }) => (
  <div>
    <p className="text-sm font-semibold">{label}</p>
    <pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border-2 border-ink bg-background p-3 text-xs">{text}</pre>
  </div>
);

/**
 * Apps like this one, and what the developer said about it. The team decides: nothing here blocks the Approve button
 * (the developer's own checks already needed a note before they could send it).
 */
export function SimilarReview({ item }: { item: QueueItem }) {
  const apps = item.similar_apps ?? [];
  const note = item.similar_note?.trim();
  if (!apps.length && !note) return null;
  return (
    <Box title={apps.length ? `Similar to ${apps.length} other app${apps.length > 1 ? "s" : ""}` : "Developer's note about similar apps"}>
      {apps.length > 0 && <SimilarList items={apps} title="Apps with many of the same words in the name and description" />}
      <div className={`${apps.length ? "mt-3 " : ""}rounded-xl border-2 border-ink bg-background p-3 text-sm`}>
        <p className="font-semibold">Why the developer says theirs is different</p>
        {note ? <p className="mt-1 whitespace-pre-wrap">{note}</p> : <p className="mt-1 text-muted-foreground">No note was given.</p>}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Open the similar apps and compare. Approve if this one adds something, or use “Ask for changes” / “Don't accept” below and say why.
        “In review” apps are other developers' apps that are not live yet.
      </p>
    </Box>
  );
}

/** What changed since the live version, for an update of an AI app. */
export function AiChanges({ item }: { item: QueueItem }) {
  if (!item.live || item.kind !== "ai") return null;
  return (
    <Box title={`What changed since live version ${item.live.version_no}`}>
      <ul className="list-disc space-y-1 pl-5 text-sm">{aiChangesSinceLive(item).map((c) => <li key={c}>{c}</li>)}</ul>
      <p className="mt-2 text-xs text-muted-foreground">The live version keeps running unchanged until you approve this one.</p>
    </Box>
  );
}

/** The definition of an AI app as the team must read it: screen, fields, the AI's instructions, and real test runs. */
export function AiDefinition({ item }: { item: QueueItem }) {
  const s = item.spec;
  const [open, setOpen] = useState<number | null>(null);
  if (!s) return <Box title="AI app definition"><p className="text-sm text-muted-foreground">No definition was saved with this version.</p></Box>;
  const fields = s.fields ?? [];
  return (
    <Box title="AI app definition (read this before approving)">
      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div><dt className="inline font-semibold">Screen: </dt><dd className="inline">{ENGINE_TEXT[s.engine] ?? s.engine}</dd></div>
        <div><dt className="inline font-semibold">AI model: </dt><dd className="inline">{s.ai.model === "lite" ? "Gemini Flash Lite (cheaper)" : "Gemini Flash"}</dd></div>
        <div><dt className="inline font-semibold">Longest answer: </dt><dd className="inline">{s.ai.maxTokens} tokens</dd></div>
        {s.engine === "vision" && <div><dt className="inline font-semibold">Photos per use: </dt><dd className="inline">up to {s.ai.maxImages ?? 4}</dd></div>}
        {s.engine === "chat" && <div><dt className="inline font-semibold">Document context: </dt><dd className="inline">{s.documents ? "visitor can add text" : "no"}</dd></div>}
      </dl>

      {fields.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold">What the visitor fills in ({fields.length})</p>
          <ul className="mt-1 divide-y-2 divide-ink/10 rounded-xl border-2 border-ink bg-background text-sm">
            {fields.map((f) => (
              <li key={f.key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5">
                <span className="min-w-0 break-words">{f.label}{f.required ? " *" : ""}</span>
                <span className="text-xs text-muted-foreground">{f.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <Prompt label="Instructions the AI gets (the visitor never sees these)" text={s.ai.system} />
        {s.ai.task && <Prompt label="The task it is given on each use" text={s.ai.task} />}
        <p className="text-xs text-muted-foreground">
          The site adds its own rules after these on the server: treat visitor input as data, never reveal the instructions, never invent facts, never ask for secrets.
        </p>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold">Real test runs by the developer ({item.samples?.length ?? 0})</p>
        {!item.samples?.length ? (
          <p className="mt-1 text-sm text-muted-foreground">No test run is kept for this exact version. Try the preview yourself (it is free for you).</p>
        ) : (
          <ul className="mt-1 space-y-2">
            {item.samples.map((x, i) => (
              <li key={`${x.at}-${i}`} className="rounded-xl border-2 border-ink bg-background text-sm">
                <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-semibold">
                  <span>Run {i + 1}</span>
                  <span className="text-xs font-normal text-muted-foreground">{when(x.at)} · {open === i ? "hide" : "show"}</span>
                </button>
                {open === i && (
                  <div className="space-y-2 border-t-2 border-ink/10 px-3 py-2">
                    {x.inputs && Object.keys(x.inputs).length > 0 && <Prompt label="What was entered" text={JSON.stringify(x.inputs, null, 2)} />}
                    <Prompt label="What the AI wrote" text={x.output} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Box>
  );
}

/**
 * What the AI costs per use and the credits that follow. `suggested_credits` keeps a 3× margin at the worst case
 * (₹0.108 a credit). A developer asking for free or a low price does not change it.
 */
export function AiCost({ item, credits }: { item: QueueItem; credits: number | null }) {
  const c = item.ai_cost;
  if (!c) return null;
  const below = credits != null && credits < c.suggested_credits;
  return (
    <div className="mt-4 rounded-xl border-2 border-dashed border-ink/40 p-3 text-sm">
      <p className="font-semibold">AI cost (only admins see this)</p>
      <p className="mt-1">
        A typical use costs about {inr2(c.typical_inr)}; the longest possible answer about {inr2(c.ceiling_inr)}.
        {c.measured_avg_inr != null && ` The developer's ${c.runs_measured} test run${c.runs_measured > 1 ? "s" : ""} averaged ${inr2(c.measured_avg_inr)}.`}{" "}
        At least <strong>{c.suggested_credits} credit{c.suggested_credits > 1 ? "s" : ""}</strong> keeps a {c.margin}× margin (₹{c.rate_inr_per_credit} a credit). The Start box below is filled with that.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Estimated from text length ({c.prompt_tokens} tokens of instructions, about {c.typical_in_tokens} in and {c.typical_out_tokens} out). Checking the real bill in the AI provider's dashboard is still wise.
      </p>
      {c.notes.map((n) => <p key={n} className="mt-1 text-xs text-muted-foreground">{n}</p>)}
      {below && (
        <p className="mt-2 rounded-lg bg-coral/30 p-2">
          {credits} credit{credits > 1 ? "s are" : " is"} below the {c.suggested_credits} suggested. You can still approve, but a long answer could cost more than it earns.
        </p>
      )}
    </div>
  );
}

export const KindPill = ({ item }: { item: QueueItem }) => <Pill tone={item.kind === "ai" ? "bg-pink" : "bg-sand"}>{item.kind === "ai" ? "AI app" : "File app"}</Pill>;

/** The developer's own view of their AI app definition: what the screen asks for and what the AI is told. */
export function DeveloperAiSummary({ version }: { version: DevVersion }) {
  const s = version.spec;
  if (!s) return <p className="text-sm text-muted-foreground">No definition is saved yet. Ask Claude to build and send it.</p>;
  const fields = s.fields ?? [];
  return (
    <div className="space-y-3 text-sm">
      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        <div><dt className="inline font-semibold">Screen: </dt><dd className="inline">{ENGINE_TEXT[s.engine] ?? s.engine}</dd></div>
        <div><dt className="inline font-semibold">AI model: </dt><dd className="inline">{s.ai.model === "lite" ? "Gemini Flash Lite" : "Gemini Flash"}</dd></div>
        {s.engine !== "chat" && <div><dt className="inline font-semibold">Fields: </dt><dd className="inline">{fields.length ? fields.map((f) => f.label).join(", ") : s.engine === "vision" ? "photos" : "none"}</dd></div>}
        <div><dt className="inline font-semibold">Longest answer: </dt><dd className="inline">{s.ai.maxTokens} tokens</dd></div>
      </dl>
      <details className="rounded-xl border-2 border-ink bg-background p-3">
        <summary className="cursor-pointer font-semibold">Your AI instructions (visitors never see these)</summary>
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs">{s.ai.system}{s.ai.task ? `\n\n— Task —\n${s.ai.task}` : ""}</pre>
      </details>
    </div>
  );
}
