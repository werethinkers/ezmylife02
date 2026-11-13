import type { PdfBlock } from "./types";

/*
 * Reads what an app shows on screen and turns it into PDF blocks, for the older apps that
 * have their own page (Invoice Generator's siblings: planners, calculators, content writers).
 * Buttons, icons, file pickers and anything marked data-pdf-skip are left out; filled-in boxes
 * become "Label: value" lines; headings, lists and tables keep their shape.
 */

const SKIP = new Set(["BUTTON", "SCRIPT", "STYLE", "SVG", "svg", "NOSCRIPT", "TEMPLATE", "IFRAME", "VIDEO", "AUDIO", "CANVAS", "LABEL", "OPTION"]);
const BLOCKISH = "div,p,section,article,header,footer,ul,ol,table,h1,h2,h3,h4,h5,h6,input,textarea,select,form,fieldset,img,li,dl,pre,blockquote";

const clean = (s: string) => s.replace(/[ \t\u00a0]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();

function hidden(el: Element): boolean {
  if (el.closest("[data-pdf-skip],[aria-hidden='true'],[hidden]")) return true;
  const st = getComputedStyle(el);
  return st.display === "none" || st.visibility === "hidden";
}

function labelFor(el: Element): string {
  const id = el.getAttribute("id");
  const byFor = id ? el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
  const wrap = el.closest("label");
  const near = el.parentElement?.querySelector("label");
  const text = (byFor ?? wrap ?? near)?.textContent ?? el.getAttribute("aria-label") ?? el.getAttribute("placeholder") ?? "";
  return clean(text).replace(/\s*\*$/, "").replace(/:$/, "");
}

function valueOf(el: Element): string {
  if (el instanceof HTMLSelectElement) return el.selectedOptions[0]?.textContent?.trim() ?? "";
  if (el instanceof HTMLInputElement) {
    if (["button", "submit", "file", "hidden", "range", "color", "search", "password"].includes(el.type)) return "";
    if (el.type === "checkbox" || el.type === "radio") return el.checked ? "Yes" : "";
    return el.value.trim();
  }
  if (el instanceof HTMLTextAreaElement) return el.value.trim();
  // Radix / shadcn select shows its value in a button with role=combobox.
  if (el.getAttribute("role") === "combobox") return clean(el.textContent ?? "");
  return "";
}

/** Inline text of an element, with <strong>/<b> kept as **bold**. */
function inlineText(el: Element): string {
  let out = "";
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent ?? "";
    else if (n instanceof Element) {
      if (SKIP.has(n.tagName) || hidden(n)) return;
      if (n.tagName === "BR") out += "\n";
      else if (n.tagName === "STRONG" || n.tagName === "B") {
        const t = inlineText(n).trim();
        out += t ? ` **${t}** ` : "";
      } else out += inlineText(n) + (getComputedStyle(n).display === "block" ? "\n" : " ");
    }
  });
  return out;
}

export function blocksFromElement(root: Element): { title?: string; blocks: PdfBlock[] } {
  const blocks: PdfBlock[] = [];
  let title: string | undefined;
  const kv: [string, string][] = [];
  const flushKv = () => {
    if (kv.length) blocks.push({ t: "table", head: ["", ""], rows: kv.splice(0).map(([k, v]) => [`**${k}**`, v]) });
  };

  const walk = (el: Element) => {
    if (SKIP.has(el.tagName) || hidden(el)) return;
    const tag = el.tagName;

    const v = valueOf(el);
    if (v || ["INPUT", "TEXTAREA", "SELECT"].includes(tag) || el.getAttribute("role") === "combobox") {
      if (v) {
        const label = labelFor(el) || "Value";
        if (v.includes("\n") || v.length > 160) {
          flushKv();
          blocks.push({ t: "h", level: 3, text: label }, { t: "p", text: v });
        } else kv.push([label, v]);
      }
      return;
    }

    if (/^H[1-6]$/.test(tag)) {
      const text = clean(el.textContent ?? "");
      if (!text) return;
      flushKv();
      if (!title && !blocks.length && tag <= "H2") title = text;
      else blocks.push({ t: "h", level: tag <= "H2" ? 2 : 3, text });
      return;
    }
    if (tag === "TABLE") {
      flushKv();
      const rows = Array.from(el.querySelectorAll("tr")).map((r) => Array.from(r.querySelectorAll("th,td")).map((c) => clean(c.textContent ?? "")));
      const [head, ...body] = rows.filter((r) => r.some(Boolean));
      if (head) blocks.push({ t: "table", head, rows: body });
      return;
    }
    if (tag === "UL" || tag === "OL") {
      flushKv();
      const items = Array.from(el.children)
        .filter((li) => li.tagName === "LI" && !hidden(li))
        .map((li) => clean(inlineText(li)))
        .filter(Boolean);
      if (items.length) blocks.push({ t: tag === "OL" ? "ol" : "ul", items });
      return;
    }
    if (tag === "PRE") {
      flushKv();
      const text = (el.textContent ?? "").trim();
      if (text) blocks.push({ t: "p", text });
      return;
    }

    // A leaf block (only inline content inside): one paragraph.
    const hasBlockChild = Array.from(el.children).some((c) => !SKIP.has(c.tagName) && !hidden(c) && (c.matches(BLOCKISH) || c.querySelector(BLOCKISH)));
    if (!hasBlockChild) {
      const text = clean(inlineText(el)).replace(/ \*\* /g, " ").replace(/\s+\*\*\s*$/, "");
      if (text && !/^(copy|copied|download|share|generate|clear|reset|delete|remove|edit|save)$/i.test(text)) {
        flushKv();
        blocks.push({ t: "p", text });
      }
      return;
    }
    el.childNodes.forEach((n) => {
      if (n instanceof Element) walk(n);
      else if (n.nodeType === Node.TEXT_NODE && clean(n.textContent ?? "")) {
        flushKv();
        blocks.push({ t: "p", text: clean(n.textContent ?? "") });
      }
    });
  };

  walk(root);
  flushKv();
  // Two short paragraphs in a row that read as "Label" then "value" (stat cards) become one line.
  const merged: PdfBlock[] = [];
  for (const b of blocks) {
    const prev = merged[merged.length - 1];
    if (b.t === "p" && prev?.t === "p" && prev.text.length <= 32 && !/[.!?:]$/.test(prev.text) && b.text.length <= 40 && /[\d₹%]/.test(b.text)) {
      merged[merged.length - 1] = { t: "p", text: `**${prev.text}:** ${b.text}` };
    } else merged.push(b);
  }
  return { title, blocks: merged };
}

/** PDF blocks back to Markdown, for Copy, Word and WhatsApp. */
export function blocksToMarkdown(title: string | undefined, blocks: PdfBlock[]): string {
  const out: string[] = [];
  if (title) out.push(`# ${title}`);
  for (const b of blocks) {
    switch (b.t) {
      case "h":
        out.push(`${b.level === 2 ? "##" : "###"} ${b.text}`);
        break;
      case "p":
      case "note":
        out.push(b.text);
        break;
      case "ul":
      case "check":
        out.push(b.items.map((i) => `- ${i}`).join("\n"));
        break;
      case "ol":
        out.push(b.items.map((i, n) => `${n + 1}. ${i}`).join("\n"));
        break;
      case "table": {
        const isKv = b.head.every((h) => !h);
        if (isKv) out.push(b.rows.map((r) => `${r[0]}: ${r.slice(1).join(" ")}`).join("\n"));
        else
          out.push(
            [`| ${b.head.join(" | ")} |`, `| ${b.head.map(() => "---").join(" | ")} |`, ...b.rows.map((r) => `| ${r.join(" | ")} |`), ...(b.foot ? [`| ${b.foot.join(" | ")} |`] : [])].join("\n"),
          );
        break;
      }
      case "kv":
        out.push(b.rows.map(([k, v]) => `**${k}:** ${v}`).join("\n"));
        break;
      case "tiles":
        out.push(b.items.map((t) => `**${t.label}:** ${t.value}`).join("\n"));
        break;
      case "box":
        if (b.label) out.push(`**${b.label}**`);
        out.push(blocksToMarkdown(undefined, b.blocks));
        break;
      case "split":
        out.push(b.parts.map((p) => `${p.label}: ${p.value.toLocaleString("en-IN")}`).join(" · "));
        break;
      case "sign":
        out.push(b.lines.map((l) => `\n______________________\n${l}`).join("\n"));
        break;
      case "hr":
        out.push("---");
        break;
      case "img":
      case "break":
        break;
    }
  }
  return out.join("\n\n");
}
