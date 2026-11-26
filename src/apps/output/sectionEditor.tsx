import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

/*
 * A non-technical "Edit" view for an AI result: one plain-text box per section, instead of one
 * big box of raw Markdown. Headings become section labels (not editable text); **bold**, `code`
 * and bullet dashes are hidden while editing; tables become one easy-to-read "Label: value · ..."
 * line per row instead of a pipe-and-dash grid. Converting back to Markdown is intentionally a
 * little lossy (inline emphasis inside an edited section isn't reconstructed) — the trade a
 * shop owner who has never seen Markdown is making for not having to see "##" or "**" at all.
 */

interface Section {
  heading: string;
  level: number;
  plain: string;
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isDividerRow = (line: string) => /^\s*\|?[\s:-]+\|?([\s|:-]*)$/.test(line) && /-/.test(line);

/** A Markdown table block → one "Col: value · Col: value" line per row. */
function softenTables(body: string): string {
  const lines = body.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    if (isTableRow(lines[i])) {
      const head = cells(lines[i]);
      i++;
      if (i < lines.length && isDividerRow(lines[i])) i++;
      while (i < lines.length && isTableRow(lines[i])) {
        const row = cells(lines[i]);
        out.push(head.map((h, j) => `${h}: ${row[j] ?? ""}`).join(" · "));
        i++;
      }
      out.push("");
      continue;
    }
    out.push(lines[i]);
    i++;
  }
  return out.join("\n");
}

/** Hides inline Markdown marks and turns "- item" / "* item" bullets into a plain "• item". */
function softenInline(body: string): string {
  return body
    .split("\n")
    .map((line) =>
      line
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/__(.+?)__/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/^(\s*)[-*]\s+/, "$1• "),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const softenBody = (body: string) => softenInline(softenTables(body));

/** One "Label: value · Label: value" line → its parts, or null if it doesn't look like one. */
function parseRow(line: string): { labels: string[]; values: string[] } | null {
  const parts = line.split(" · ");
  if (parts.length < 2) return null;
  const labels: string[] = [];
  const values: string[] = [];
  for (const p of parts) {
    const m = p.match(/^(.+?):\s(.*)$/);
    if (!m) return null;
    labels.push(m[1].trim());
    values.push(m[2].trim());
  }
  return { labels, values };
}

/** The inverse of softenBody: plain text (possibly edited) → Markdown, rebuilding any block of
 *  "Label: value · …" lines back into a table from the row contents alone. */
function hardenBody(plain: string): string {
  const lines = plain.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const first = parseRow(lines[i]);
    if (first) {
      const header = first.labels;
      const rows = [first.values];
      let j = i + 1;
      while (j < lines.length) {
        const r = parseRow(lines[j]);
        if (!r || r.labels.length !== header.length) break;
        rows.push(r.values);
        j++;
      }
      out.push(`| ${header.join(" | ")} |`);
      out.push(`| ${header.map(() => "---").join(" | ")} |`);
      for (const row of rows) out.push(`| ${row.join(" | ")} |`);
      i = j;
      continue;
    }
    out.push(lines[i].replace(/^(\s*)•\s+/, "$1- "));
    i++;
  }
  return out.join("\n");
}

/** Markdown → a page title (the first "# " line) and its ##/### sections, each softened for plain editing. */
function parse(markdown: string): { title: string; sections: Section[] } {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  let title = "";
  if (/^#\s+/.test(lines[0] ?? "")) {
    title = lines[0].replace(/^#\s+/, "").trim();
    i = 1;
  }
  const raw: { heading: string; level: number; body: string[] }[] = [];
  let current: { heading: string; level: number; body: string[] } = { heading: "", level: 2, body: [] };
  for (; i < lines.length; i++) {
    const m = lines[i].match(/^(#{2,3})\s+(.*)$/);
    if (m) {
      raw.push(current);
      current = { heading: m[2].trim(), level: m[1].length, body: [] };
    } else {
      current.body.push(lines[i]);
    }
  }
  raw.push(current);
  const sections = raw.filter((s) => s.heading || s.body.some((l) => l.trim())).map((s) => ({ heading: s.heading, level: s.level, plain: softenBody(s.body.join("\n")) }));
  return { title, sections };
}

function serialize(title: string, sections: Section[]): string {
  const head = title ? `# ${title}\n\n` : "";
  const body = sections.map((s) => (s.heading ? `${"#".repeat(s.level)} ${s.heading}\n${hardenBody(s.plain)}` : hardenBody(s.plain))).join("\n\n");
  return `${head}${body}\n`.replace(/\n{3,}/g, "\n\n");
}

/** A plain-text, section-by-section stand-in for editing raw Markdown in a textarea. */
export function SectionEditor({ text, onChange }: { text: string; onChange: (t: string) => void }) {
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  // Tracks the last Markdown WE produced, so re-parsing on every keystroke's own round trip
  // doesn't fight the person mid-edit; an outside change (a refine, loading a different result) does reparse.
  const lastEmitted = useRef<string | null>(null);

  useEffect(() => {
    if (text === lastEmitted.current) return;
    const parsed = parse(text);
    setTitle(parsed.title);
    setSections(parsed.sections);
    lastEmitted.current = text;
  }, [text]);

  const updateSection = (i: number, plain: string) => {
    const next = sections.map((s, j) => (j === i ? { ...s, plain } : s));
    setSections(next);
    const md = serialize(title, next);
    lastEmitted.current = md;
    onChange(md);
  };

  if (!sections.length) {
    return <Textarea value={text} onChange={(e) => onChange(e.target.value)} rows={12} aria-label="Edit result" />;
  }

  return (
    <div className="space-y-4">
      {sections.map((s, i) => (
        <div key={i} className="space-y-1.5">
          {s.heading && <p className="text-sm font-bold">{s.heading}</p>}
          <Textarea
            value={s.plain}
            onChange={(e) => updateSection(i, e.target.value)}
            rows={Math.max(2, Math.min(16, s.plain.split("\n").length + 1))}
            className="resize-y text-sm leading-relaxed"
            aria-label={s.heading || "Edit this part"}
          />
        </div>
      ))}
    </div>
  );
}
