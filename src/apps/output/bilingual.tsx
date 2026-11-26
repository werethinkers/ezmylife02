import { useMemo } from "react";
import { Markdown } from "@/components/common/Markdown";

/*
 * A result can ask for English plus Hindi or Hinglish "in the same run" — the prompt is told to
 * write those sections with an "### English" sub-heading followed by one other-language
 * sub-heading, inside the same "## Section". This finds exactly that shape and renders the two
 * side by side (stacked with a language badge on narrow screens); everything else renders as
 * plain Markdown exactly as before. A section that isn't in that shape is untouched, so this is a
 * safe drop-in for the normal Markdown view on any result, bilingual or not.
 */

interface LangBlock {
  label: string;
  text: string;
}

type Chunk = { plain: string } | { heading: string; langs: LangBlock[] };

function splitSubsections(bodyLines: string[]): LangBlock[] {
  const subs: LangBlock[] = [];
  let current: { label: string; lines: string[] } | null = null;
  for (const line of bodyLines) {
    const m = line.match(/^###\s+(.*)$/);
    if (m) {
      if (current) subs.push({ label: current.label, text: current.lines.join("\n").trim() });
      current = { label: m[1].replace(/\*\*/g, "").trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else if (line.trim()) {
      return []; // real content before any ### — not the bilingual shape
    }
  }
  if (current) subs.push({ label: current.label, text: current.lines.join("\n").trim() });
  return subs;
}

function parseBilingual(markdown: string): Chunk[] {
  const lines = markdown.split("\n");
  const chunks: Chunk[] = [];
  let plainBuf: string[] = [];
  const flushPlain = () => {
    if (plainBuf.length) chunks.push({ plain: plainBuf.join("\n") });
    plainBuf = [];
  };
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^##\s+(.*)$/);
    if (!m) {
      plainBuf.push(lines[i]);
      i++;
      continue;
    }
    const heading = m[1].replace(/\*\*/g, "").trim();
    let j = i + 1;
    const body: string[] = [];
    while (j < lines.length && !/^##\s+/.test(lines[j])) {
      body.push(lines[j]);
      j++;
    }
    const langs = splitSubsections(body);
    if (langs.length === 2 && langs.every((l) => l.text)) {
      flushPlain();
      chunks.push({ heading, langs });
    } else {
      plainBuf.push(lines[i], ...body);
    }
    i = j;
  }
  flushPlain();
  return chunks;
}

function LangCard({ lang }: { lang: LangBlock }) {
  return (
    <div className="rounded-xl border border-black/10 bg-sand/30 p-3 dark:border-white/10 dark:bg-white/5">
      <span className="mb-1.5 inline-block rounded-full border border-black/15 bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide dark:border-white/15">
        {lang.label}
      </span>
      <Markdown className="prose-p:my-1.5 prose-headings:mt-2">{lang.text}</Markdown>
    </div>
  );
}

/** Drop-in replacement for <Markdown>{text}</Markdown> that also renders bilingual sections side by side. */
export function BilingualMarkdown({ text }: { text: string }) {
  const chunks = useMemo(() => parseBilingual(text), [text]);
  if (!chunks.some((c) => "langs" in c)) return <Markdown>{text}</Markdown>;
  return (
    <>
      {chunks.map((c, i) =>
        "langs" in c ? (
          <div key={i} className="my-4">
            <h2 className="mb-2 mt-4 text-[15px] font-bold">{c.heading}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {c.langs.map((l, j) => (
                <LangCard key={j} lang={l} />
              ))}
            </div>
          </div>
        ) : (
          <Markdown key={i}>{c.plain}</Markdown>
        ),
      )}
    </>
  );
}
