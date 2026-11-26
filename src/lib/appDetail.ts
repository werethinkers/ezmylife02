/*
 * Real, app-specific text for an app's page (/tool/<id>): who it is for, what you fill in,
 * what you get, a worked example and a few questions.
 *
 * Everything here is read from the app's own definition (its form fields, sample values, steps,
 * result list, size rules and official sources), or from its category. Nothing is invented: an
 * app with little data gets a short section, not filler. The calculators' example is the app's own
 * formula run on its own sample figures.
 *
 * Read in two places so a search engine and a visitor see the same words:
 *  - the page written at build time (scripts/prerender-apps.mjs),
 *  - the "About this app" block under the app (src/components/tools/AppAbout.tsx).
 */

export interface DetailSection {
  heading: string;
  /** Plain sentences. */
  paragraphs?: string[];
  /** A short list. */
  items?: string[];
}

export interface AppDetail {
  sections: DetailSection[];
  faqs: [string, string][];
}

interface Loose {
  engine?: string;
  fields?: { key: string; label: string; required?: boolean; type?: string; help?: string }[];
  sample?: unknown;
  youGet?: string[];
  refineChips?: string[];
  suggestions?: string[];
  welcome?: string;
  columns?: { key: string; label: string; required?: boolean }[];
  itemName?: string;
  aiLabel?: string;
  calc?: (v: Record<string, string>) => { results?: { label: string; value: string; main?: boolean }[]; error?: string };
  sources?: { label: string; url: string; checked: string }[];
  note?: string;
  exam?: string;
  items?: { label: string; outW?: number; outH?: number; width?: number; height?: number; minKB?: number; maxKB?: number; background?: string; rules?: string[] }[];
  acceptLabel?: string;
  outputLabel?: string;
  multiple?: boolean;
  promptLabel?: string;
  styles?: string[];
  aspects?: string[];
  ideas?: string[];
  turns?: number;
  voice?: boolean;
}

const clip = (s: string, n: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n - 1).replace(/[\s,;:—–-]+\S*$/, "") + "…";
};
const list = (xs: string[]) => (xs.length < 3 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const dot = (s: string) => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
/** Lowercases a field label for mid-sentence use, but keeps an all-caps acronym (GSTIN, PAN…) as-is. */
const lowerLabel = (s: string) => s.replace(/\S+/g, (w) => (/^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase()));

function labelled(fields: NonNullable<Loose["fields"]>, sample: Record<string, string>) {
  const out: string[] = [];
  for (const f of fields) {
    const v = sample[f.key];
    if (typeof v !== "string" || !v.trim()) continue;
    out.push(`${f.label}: ${clip(v, 130)}`);
    if (out.length === 5) break;
  }
  return out;
}

export function appDetail(app: { name: string; description?: string; category: string }, def: unknown, ctx: { categoryLine: string; give: string; get: string; goalName: string }): AppDetail {
  const d = (def ?? {}) as Loose;
  const sections: DetailSection[] = [];
  const name = app.name;
  const faqs: [string, string][] = [];

  // Who it is for: the category's own line, plus the exam or form for the exam-photo apps.
  const who: string[] = [];
  if (ctx.categoryLine) who.push(`${name} is in ${app.category} (${ctx.goalName}). ${dot(ctx.categoryLine)}`);
  if (d.engine === "preset" && d.exam) who.push(`It is for people filling in the ${d.exam} application, where the photo and signature files must meet exact size rules.`);
  if (who.length) sections.push({ heading: `Who ${name} is for`, paragraphs: who });

  // What you fill in.
  const fields = (d.fields ?? []).filter((f) => f.label);
  if (fields.length) {
    const required = fields.filter((f) => f.required).map((f) => f.label);
    const shown = fields.slice(0, 10).map((f) => f.label + (f.required ? " (needed)" : ""));
    const more = fields.length > 10 ? [`and ${fields.length - 10} more`] : [];
    sections.push({
      heading: "What you fill in",
      paragraphs: [`${name} asks for ${fields.length} ${fields.length === 1 ? "detail" : "details"}${required.length ? `, ${required.length} of them needed` : ""}.`],
      items: [...shown, ...more],
    });
    faqs.push([`What do I need to use ${name}?`, `${name} asks for ${list(fields.slice(0, 4).map((f) => lowerLabel(f.label)))}${fields.length > 4 ? " and a few more details" : ""}. You do not need an account to look around; sign in when you are ready to use it.`]);
  }
  if (d.engine === "tracker" && d.columns?.length) {
    sections.push({
      heading: "What you track",
      paragraphs: [`Add one row per ${d.itemName ?? "entry"}. Each row holds:`],
      items: d.columns.map((c) => c.label + (c.required ? " (needed)" : "")),
    });
  }
  if (d.engine === "convert") {
    sections.push({
      heading: "What goes in and what comes out",
      paragraphs: [`Add ${d.acceptLabel ?? "your files"}${d.multiple ? ", as many as you need," : ""} and download ${d.outputLabel ?? "the result"}.`],
    });
  }
  if (d.engine === "image" && (d.styles?.length || d.aspects?.length)) {
    sections.push({
      heading: "Choices you get",
      items: [
        ...(d.styles?.length ? [`Styles: ${list(d.styles)}`] : []),
        ...(d.aspects?.length ? [`Shapes: ${list(d.aspects)}`] : []),
      ],
    });
  }
  if (d.engine === "chat" && d.suggestions?.length) {
    sections.push({ heading: "Things to ask", paragraphs: d.welcome ? [dot(d.welcome)] : undefined, items: d.suggestions.map((s) => clip(s, 90)) });
  }
  if (d.engine === "coach") {
    sections.push({
      heading: "How the session runs",
      paragraphs: [`It is a back-and-forth conversation${d.turns ? ` of up to ${d.turns} turns` : ""}${d.voice ? ", and you can answer by voice or by typing" : ""}.`],
    });
  }
  if (d.engine === "interview" && d.voice) {
    sections.push({ heading: "How you answer", paragraphs: ["You can answer the questions by voice or by typing."] });
  }

  // What you get.
  if (d.youGet?.length) {
    sections.push({ heading: `What ${name} gives you`, items: d.youGet.map((s) => dot(s).replace(/\.$/, "")) });
  } else if (ctx.get) {
    sections.push({ heading: `What ${name} gives you`, paragraphs: [`${name} gives you ${ctx.get}, from ${ctx.give}.`] });
  }
  if (d.refineChips?.length) {
    sections.push({ heading: "Change it after it is made", paragraphs: [`Once the result is ready you can ask for changes such as: ${list(d.refineChips.map((c) => `"${c}"`))}.`] });
  }

  // A worked example, from the app's own sample.
  const sample = d.sample;
  if (d.engine === "calc" && d.calc && sample && !Array.isArray(sample)) {
    try {
      const r = d.calc(sample as Record<string, string>);
      const inputs = labelled(fields, sample as Record<string, string>);
      if (r.results?.length && !r.error) {
        sections.push({
          heading: "A worked example",
          paragraphs: [`With ${inputs.length ? list(inputs.map((s) => s.replace(": ", " ")).slice(0, 4)) : "the sample figures"}, ${name} shows:`],
          items: r.results.slice(0, 6).map((x) => `${x.label}: ${x.value}`),
        });
      }
    } catch {
      /* no example if the formula does not run on its sample */
    }
  } else if (sample && !Array.isArray(sample) && typeof sample === "object" && fields.length) {
    const ex = labelled(fields, sample as Record<string, string>);
    if (ex.length) sections.push({ heading: "An example of what to enter", items: ex });
  } else if (Array.isArray(sample) && d.columns?.length && sample[0]) {
    const row = sample[0] as Record<string, string>;
    const ex = d.columns.filter((c) => row[c.key]).slice(0, 5).map((c) => `${c.label}: ${clip(String(row[c.key]), 60)}`);
    if (ex.length) sections.push({ heading: "An example row", items: ex });
  }
  if (d.engine === "image" && d.ideas?.length) sections.push({ heading: "Ideas to start with", items: d.ideas.map((s) => clip(s, 110)) });

  // Exam and form photo rules, from the official pages.
  if (d.engine === "preset" && d.items?.length) {
    const rows = d.items.map((it) => {
      const size = it.outW && it.outH ? `${it.outW} × ${it.outH} pixels` : it.width && it.height ? `${it.width} × ${it.height} pixels` : "";
      const kb = it.minKB || it.maxKB ? `${it.minKB ? `${it.minKB} KB to ` : "up to "}${it.maxKB ?? ""} KB`.replace(/ to $/, "") : "";
      return `${it.label}: ${[size, kb, it.background].filter(Boolean).join(", ")}`;
    });
    sections.push({ heading: "The size rules it follows", items: rows, paragraphs: d.note ? [dot(d.note)] : undefined });
  }
  if (d.sources?.length) {
    sections.push({ heading: "Where the rules and figures come from", items: d.sources.map((s) => `${s.label} (checked ${s.checked})`) });
  }

  faqs.push([`How much does ${name} cost?`, "You pay in credits, and only when the app gives you a result. New accounts start with 100 free credits, and credit packs start at ₹10."]);
  faqs.push([`Do I need to install anything to use ${name}?`, `No. ${name} opens in your browser on a phone or a computer.`]);
  if (ctx.get) faqs.push([`What do I get from ${name}?`, `You give ${ctx.give} and get ${ctx.get}.`]);

  // Keep the page honest about short data: drop empty sections.
  return { sections: sections.filter((s) => s.paragraphs?.length || s.items?.length), faqs };
}
