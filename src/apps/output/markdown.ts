import type { PdfBlock } from "./types";

/*
 * AI results are Markdown. This turns them into PDF blocks the templates lay out.
 * Kept small on purpose: headings, paragraphs (line breaks kept, for addresses), lists,
 * tick lists, tables, quotes and rules — what the app instructions ask the AI to write.
 */

const TABLE_ROW = /^\s*\|.*\|\s*$/;
const DIVIDER_CELL = /^:?-{2,}:?$/;

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

/** Markdown → a title (the first "# " heading, if any) and the blocks after it. */
export function markdownToBlocks(md: string): { title?: string; blocks: PdfBlock[] } {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const blocks: PdfBlock[] = [];
  let title: string | undefined;
  let para: string[] = [];
  let list: { t: "ul" | "ol" | "check"; items: string[] } | null = null;
  let table: string[][] | null = null;
  let quote: string[] = [];

  const flushPara = () => {
    if (para.length) blocks.push({ t: "p", text: para.join("\n") });
    para = [];
  };
  const flushList = () => {
    if (list?.items.length) blocks.push(list);
    list = null;
  };
  const flushTable = () => {
    if (table && table.length) {
      const [head, ...rows] = table;
      const width = Math.max(head.length, ...rows.map((r) => r.length));
      const pad = (r: string[]) => [...r, ...Array(Math.max(0, width - r.length)).fill("")];
      const last = rows[rows.length - 1];
      // A last row that starts with "Total" reads as the table's footer.
      const foot = rows.length > 1 && last && /^\**\s*(grand\s+)?total\b/i.test(last[0] ?? "") ? pad(last) : undefined;
      blocks.push({ t: "table", head: pad(head), rows: (foot ? rows.slice(0, -1) : rows).map(pad), foot });
    }
    table = null;
  };
  const flushQuote = () => {
    if (quote.length) blocks.push({ t: "box", label: "", tint: true, blocks: [{ t: "p", text: quote.join("\n") }] });
    quote = [];
  };
  const flushAll = () => {
    flushPara();
    flushList();
    flushTable();
    flushQuote();
  };
  const addItem = (kind: "ul" | "ol" | "check", text: string) => {
    flushPara();
    flushTable();
    flushQuote();
    if (!list || list.t !== kind) {
      flushList();
      list = { t: kind, items: [] };
    }
    list.items.push(text);
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    let m: RegExpMatchArray | null;

    if (TABLE_ROW.test(line)) {
      flushPara();
      flushList();
      flushQuote();
      const c = cells(line);
      if (c.every((x) => DIVIDER_CELL.test(x))) continue;
      (table ??= []).push(c);
      continue;
    }
    flushTable();

    if (!line.trim()) {
      flushPara();
      flushList();
      flushQuote();
      continue;
    }
    if ((m = line.match(/^\s*>\s?(.*)$/))) {
      flushPara();
      flushList();
      quote.push(m[1]);
      continue;
    }
    flushQuote();
    if ((m = line.match(/^(#{1,6})\s+(.*?)\s*#*$/))) {
      flushAll();
      const level = m[1].length;
      const text = m[2].replace(/^\*\*(.*)\*\*$/, "$1");
      if (level === 1 && !title && !blocks.length) title = text;
      else blocks.push({ t: "h", level: level <= 2 ? 2 : 3, text });
    } else if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flushAll();
      blocks.push({ t: "hr" });
    } else if ((m = line.match(/^\s*[-*•]\s+\[( |x|X)\]\s+(.*)$/))) {
      addItem("check", m[2]);
    } else if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) {
      addItem("ul", m[1]);
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      addItem("ol", m[1]);
    } else if (list && /^\s{2,}\S/.test(raw)) {
      // A wrapped line of the last list item.
      list.items[list.items.length - 1] += ` ${line.trim()}`;
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushAll();
  return { title, blocks };
}

/** Markdown with the marks taken out, for a one-line summary. */
export const plainLine = (s: string) =>
  s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\s)\*(?!\s)(.+?)\*/g, "$1$2")
    .replace(/`/g, "")
    .replace(/\[(.+?)\]\([^)]*\)/g, "$1")
    .trim();
