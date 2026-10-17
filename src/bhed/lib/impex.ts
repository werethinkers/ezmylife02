import {
  DEFAULT_STYLE,
  displayTitle,
  kindFromMime,
  stylesEqual,
  type BhedNode,
  type Chart,
  type MediaKind,
  type MediaRef,
  type TabStyle,
} from "./types";
import { makeNode, walk } from "./tree";

export type ImportedMedia = {
  id: string;
  name: string;
  mime: string;
  kind: MediaKind;
  blob: Blob;
};

export type ImportedChart = {
  root: BhedNode;
  media: ImportedMedia[];
};

const MEDIA_LINE = /^\[(image|video|audio|file):\s*(.*?)\]\((data:[^)\s]+)\)$/;
const IMAGE_LINE = /^!\[(.*?)\]\((data:[^)\s]+)\)$/;
const DEPTH_LINE = /^<!--\s*bhed-depth:\s*(\d+)\s*-->$/;
const STYLE_LINE = /^<!--\s*bhed-style:\s*(.*)\s*-->$/;
const COLLAPSED_LINE = /^<!--\s*bhed-collapsed:\s*true\s*-->$/;
const OPEN_LINE = /^<!--\s*bhed-collapsed:\s*false\s*-->$/;
const HEADING_LINE = /^(#{1,6})\s+(.*)$/;

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/\n/g, "\u0026#10;");
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error("A media attachment in this file could not be read");
  return response.blob();
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read media"));
    reader.readAsDataURL(blob);
  });
}

function pushMedia(
  bucket: ImportedMedia[],
  node: BhedNode,
  name: string,
  kind: MediaKind,
  blob: Blob,
) {
  const id = crypto.randomUUID();
  const mime = blob.type || "application/octet-stream";
  const ref: MediaRef = { id, name: name.trim() || "media", mime, kind: kind || kindFromMime(mime, name) };
  node.media.push(ref);
  bucket.push({ ...ref, blob });
}

export async function importMarkdown(text: string, fallbackTitle: string): Promise<ImportedChart> {
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const lines = source.split("\n");
  const media: ImportedMedia[] = [];
  let root: BhedNode | null = null;
  const stack: { level: number; node: BhedNode }[] = [];
  const preamble: string[] = [];

  const current = () => (stack.length ? stack[stack.length - 1]!.node : null);

  const appendBody = (line: string) => {
    const node = current();
    if (!node) {
      preamble.push(line);
      return;
    }
    node.body = node.body ? `${node.body}\n${line}` : line;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? "";
    const line = raw.trimEnd();
    const trimmed = line.trim();
    const heading = HEADING_LINE.exec(trimmed);
    if (heading) {
      let level = heading[1]!.length;
      const title = heading[2] ?? "";
      const depthMark = DEPTH_LINE.exec((lines[i + 1] ?? "").trim());
      if (depthMark) {
        level = Number(depthMark[1]);
        i += 1;
      }
      const node = makeNode({ title, collapsed: true });
      if (!root) {
        root = node;
        stack.push({ level, node });
      } else {
        while (stack.length && stack[stack.length - 1]!.level >= level) stack.pop();
        const parent = stack.length ? stack[stack.length - 1]!.node : root;
        parent.children.push(node);
        stack.push({ level, node });
      }
      continue;
    }

    const styleMark = STYLE_LINE.exec(trimmed);
    if (styleMark && current()) {
      try {
        const parsed = JSON.parse(styleMark[1] ?? "") as Partial<TabStyle>;
        current()!.style = { ...DEFAULT_STYLE, ...parsed };
      } catch {
        appendBody(line);
      }
      continue;
    }
    if (COLLAPSED_LINE.test(trimmed) && current()) {
      current()!.collapsed = true;
      continue;
    }
    if (OPEN_LINE.test(trimmed) && current()) {
      current()!.collapsed = false;
      continue;
    }

    const linked = MEDIA_LINE.exec(trimmed);
    const image = IMAGE_LINE.exec(trimmed);
    if ((linked || image) && current()) {
      const name = linked ? linked[2] ?? "media" : image?.[1] || "image";
      const url = linked ? linked[3]! : image![2]!;
      const kind = (linked ? linked[1] : "image") as MediaKind;
      const blob = await dataUrlToBlob(url);
      pushMedia(media, current()!, name, kind, blob);
      continue;
    }

    if (trimmed.startsWith("<!--") && trimmed.endsWith("-->") && trimmed.includes("bhed-")) continue;
    appendBody(raw);
  }

  if (!root) {
    root = makeNode({ title: fallbackTitle, body: source.trim(), collapsed: false });
  } else if (preamble.some((line) => line.trim())) {
    const lead = preamble.join("\n").trim();
    root.body = lead ? `${lead}${root.body ? `\n${root.body}` : ""}` : root.body;
  }

  const tidy = (node: BhedNode) => {
    node.body = node.body.replace(/^\n+|\n+$/g, "");
    node.children.forEach(tidy);
  };
  tidy(root);
  root.collapsed = false;
  if (!root.title.trim()) root.title = fallbackTitle;
  return { root, media };
}

const HTML_ENTITIES: Record<string, string> = {
  nbsp: "&#160;",
  mdash: "&#8212;",
  ndash: "&#8211;",
  hellip: "&#8230;",
  rsquo: "&#8217;",
  lsquo: "&#8216;",
  rdquo: "&#8221;",
  ldquo: "&#8220;",
  sbquo: "&#8218;",
  bdquo: "&#8222;",
  bull: "&#8226;",
  middot: "&#183;",
  copy: "&#169;",
  reg: "&#174;",
  trade: "&#8482;",
  euro: "&#8364;",
  pound: "&#163;",
  yen: "&#165;",
  cent: "&#162;",
  deg: "&#176;",
  times: "&#215;",
  divide: "&#247;",
  laquo: "&#171;",
  raquo: "&#187;",
  shy: "&#173;",
};

function relaxXml(source: string): string {
    // eslint-disable-next-line no-control-regex
  let text = source.replace(/^\uFEFF/, "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  text = text.replace(/=\s*"([^"]*)"/g, (_full, value: string) => {
    const lt = "&" + "lt;";
    const gt = "&" + "gt;";
    const fixed = value.replace(/</g, lt).replace(/>/g, gt);
    return `="${fixed}"`;
  });
  text = text.replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (full, name: string) => {
    const key = name.toLowerCase();
    if (key === "amp" || key === "lt" || key === "gt" || key === "quot" || key === "apos") return full;
    return HTML_ENTITIES[key] ?? full;
  });
  const escapedAmp = "&" + "amp;";
  text = text.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/gi, escapedAmp);
  return text;
}

function htmlNoteToText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/(ul|ol|div|h[1-6])>/gi, "\n")
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function readStyle(raw: string): TabStyle | undefined {
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw) as Partial<TabStyle>;
    if (!value || typeof value !== "object") return undefined;
    return { ...DEFAULT_STYLE, ...value };
  } catch {
    return undefined;
  }
}

function dataUrlBlob(value: string): { blob: Blob; mime: string } | null {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(value.trim());
  if (!match) return null;
  const mime = match[1] || "application/octet-stream";
  try {
    if (match[2]) {
      const bin = atob(match[3] || "");
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      return { blob: new Blob([bytes], { type: mime }), mime };
    }
    return { blob: new Blob([decodeURIComponent(match[3] || "")], { type: mime }), mime };
  } catch {
    return null;
  }
}

type Scanned = {
  title: string;
  note: string;
  images: string[];
  style?: TabStyle;
  children: Scanned[];
};

function decodeXml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, n: string) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#x([\da-f]+);/gi, (_, n: string) => {
      const code = Number.parseInt(n, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&");
}

function readAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const match of raw.matchAll(re)) {
    out[match[1]!.toLowerCase()] = decodeXml(match[2] ?? match[3] ?? "");
  }
  return out;
}

function scanOutlines(source: string): { title: string; nodes: Scanned[] } {
  const text = relaxXml(source);
  const head = /<title>([^<]*)<\/title>/i.exec(text);
  const root: Scanned = { title: "", note: "", images: [], children: [] };
  const stack: Scanned[] = [root];
  let i = 0;
  while (i < text.length) {
    const lt = text.indexOf("<", i);
    if (lt < 0) break;
    if (/^<\/outline\b/i.test(text.slice(lt, lt + 12))) {
      if (stack.length > 1) stack.pop();
      const gt = text.indexOf(">", lt);
      i = gt < 0 ? text.length : gt + 1;
      continue;
    }
    if (/^<outline\b/i.test(text.slice(lt, lt + 9))) {
      const gt = text.indexOf(">", lt);
      if (gt < 0) break;
      const inside = text.slice(lt + 8, gt).replace(/\/\s*$/, "");
      const self = /\/\s*>$/.test(text.slice(lt, gt + 1));
      const attrs = readAttrs(inside);
      const node: Scanned = {
        title: attrs.text || attrs.title || "",
        note: htmlNoteToText(attrs._note || attrs.note || attrs.description || ""),
        images: [attrs._image, attrs._image2, attrs._image3, attrs._image4, attrs.image].filter(
          (value): value is string => Boolean(value && value.startsWith("data:")),
        ),
        style: readStyle(attrs._bhed || ""),
        children: [],
      };
      const link = attrs.htmlurl || attrs.xmlurl || "";
      if (link && !link.startsWith("data:") && link !== node.note) {
        node.note = [node.note, link].filter(Boolean).join("\n");
      }
      if (!self) {
        const next = text.indexOf("<", gt + 1);
        const loose = (next < 0 ? text.slice(gt + 1) : text.slice(gt + 1, next)).replace(/\s+/g, " ").trim();
        if (!node.title) node.title = decodeXml(loose);
      }
      stack[stack.length - 1]!.children.push(node);
      if (!self) stack.push(node);
      i = gt + 1;
      continue;
    }
    const gt = text.indexOf(">", lt);
    i = gt < 0 ? text.length : gt + 1;
  }
  return { title: decodeXml(head?.[1]?.trim() || ""), nodes: root.children };
}

export function importOpml(text: string, fallbackTitle: string): ImportedChart {
  const scanned = scanOutlines(text);
  if (!scanned.nodes.length) throw new Error("No outline in this OPML file");
  const mediaBag: ImportedMedia[] = [];

  const takeImage = (value: string, title: string): MediaRef | null => {
    const parsed = dataUrlBlob(value);
    if (!parsed) return null;
    const id = crypto.randomUUID();
    const name = title.trim() || "image";
    const kind = kindFromMime(parsed.mime, name);
    mediaBag.push({ id, name, mime: parsed.mime, kind, blob: parsed.blob });
    return { id, name, mime: parsed.mime, kind };
  };

  const toNode = (item: Scanned): BhedNode =>
    makeNode({
      title: item.title,
      body: item.note,
      style: item.style,
      collapsed: false,
      media: item.images.map((image) => takeImage(image, item.title)).filter((ref): ref is MediaRef => Boolean(ref)),
      children: item.children.map((child) => toNode(child)),
    });

  if (scanned.nodes.length === 1) {
    const only = toNode(scanned.nodes[0]!);
    if (!only.title.trim()) only.title = scanned.title || fallbackTitle;
    return { root: only, media: mediaBag };
  }
  return {
    root: makeNode({
      title: scanned.title || fallbackTitle,
      collapsed: false,
      children: scanned.nodes.map((item) => toNode(item)),
    }),
    media: mediaBag,
  };
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const copy = new Uint8Array(data);
  const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readImportText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
    const packed = await textFromZip(bytes);
    if (packed) return packed.replace(/^\uFEFF/, "");
    throw new Error("This file has no mind map inside it");
  }
  let text: string;
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    text = new TextDecoder("utf-16le").decode(bytes);
  } else if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    text = new TextDecoder("utf-16be").decode(bytes);
  } else if (bytes.length >= 4 && bytes[0] === 0x3c && bytes[1] === 0x00) {
    text = new TextDecoder("utf-16le").decode(bytes);
  } else if (bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x3c) {
    text = new TextDecoder("utf-16be").decode(bytes);
  } else {
    text = new TextDecoder("utf-8").decode(bytes);
  }
  return text.replace(/^\uFEFF/, "");
}

export function isImportFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (/\.(opml|xml|md|markdown|json|txt|mindz|zip)$/.test(name)) return true;
  const type = file.type.toLowerCase();
  return (
    type.includes("opml") ||
    type === "text/xml" ||
    type === "application/xml" ||
    type === "text/markdown" ||
    type === "application/json"
  );
}

export async function importJson(text: string, files?: Map<string, Blob>): Promise<ImportedChart> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("This JSON file could not be read");
  }
  const record = parsed as { root?: unknown; title?: string };
  const source = record?.root ?? parsed;
  if (!source || typeof source !== "object") throw new Error("This is not a Bhed chart");
  const media: ImportedMedia[] = [];

  const toNode = async (value: unknown): Promise<BhedNode> => {
    const raw = value as {
      title?: string;
      body?: string;
      style?: Partial<TabStyle>;
      collapsed?: boolean;
      media?: { name?: string; mime?: string; kind?: MediaKind; dataUrl?: string; file?: string }[];
      children?: unknown[];
    };
    const node = makeNode({
      title: typeof raw.title === "string" ? raw.title : "",
      body: typeof raw.body === "string" ? raw.body : "",
      style: { ...DEFAULT_STYLE, ...raw.style },
      collapsed: Boolean(raw.collapsed),
    });
    for (const item of raw.media ?? []) {
      let blob: Blob | null = null;
      if (item?.dataUrl) blob = await dataUrlToBlob(item.dataUrl);
      else if (item?.file && files) {
        const wanted = item.file.replace(/\\/g, "/");
        blob =
          files.get(wanted) ??
          [...files.entries()].find(([name]) => name.endsWith("/" + wanted) || name.endsWith(wanted))?.[1] ??
          null;
      }
      if (!blob) continue;
      const name = item.name || "media";
      const kind = item.kind || kindFromMime(item.mime || blob.type, name);
      pushMedia(media, node, name, kind, blob);
    }
    for (const child of raw.children ?? []) node.children.push(await toNode(child));
    return node;
  };

  const root = await toNode(source);
  if (!root.title.trim() && typeof record.title === "string") root.title = record.title;
  root.collapsed = false;
  return { root, media };
}

function escapeBody(body: string): string {
  return body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (
        HEADING_LINE.test(trimmed) ||
        trimmed.startsWith("<!-- bhed-") ||
        MEDIA_LINE.test(trimmed) ||
        IMAGE_LINE.test(trimmed)
      ) {
        return `    ${line}`;
      }
      return line;
    })
    .join("\n");
}

export async function chartToMarkdown(
  chart: Chart,
  getBlob: (id: string) => Promise<Blob | null>,
): Promise<string> {
  const lines: string[] = [];
  const visit = async (node: BhedNode, depth: number) => {
    const level = depth + 1;
    const title = node.title.trim() || "Untitled";
    if (level > 6) {
      lines.push(`###### ${title}`);
      lines.push(`<!-- bhed-depth: ${level} -->`);
    } else {
      lines.push(`${"#".repeat(level)} ${title}`);
    }
    if (!stylesEqual(node.style, DEFAULT_STYLE)) {
      lines.push(`<!-- bhed-style: ${JSON.stringify(node.style)} -->`);
    }
    if (node.collapsed) lines.push("<!-- bhed-collapsed: true -->");
    else if (depth > 0) lines.push("<!-- bhed-collapsed: false -->");
    if (node.body.trim()) {
      lines.push("");
      lines.push(escapeBody(node.body.trim()));
    }
    for (const item of node.media) {
      const blob = await getBlob(item.id);
      if (!blob) continue;
      const url = await blobToDataUrl(blob);
      lines.push("");
      if (item.kind === "image") lines.push(`![${item.name}](${url})`);
      else lines.push(`[${item.kind}: ${item.name}](${url})`);
    }
    for (const child of node.children) {
      lines.push("");
      await visit(child, depth + 1);
    }
  };
  await visit(chart.root, 0);
  return lines.join("\n").trim() + "\n";
}

const OPML_IMAGE_MAX = 700_000;

async function opmlNode(
  node: BhedNode,
  pad: string,
  getBlob: (id: string) => Promise<Blob | null>,
): Promise<string> {
  const note = node.body.trim();
  const title = xmlEscape(node.title.trim() || "Untitled");
  const attrs = [`text="${title}"`];
  if (note) {
    const escaped = xmlEscape(note);
    attrs.push(`_note="${escaped}"`, `note="${escaped}"`);
  }
  if (!stylesEqual(node.style, DEFAULT_STYLE)) {
    attrs.push(`_bhed="${xmlEscape(JSON.stringify(node.style))}"`);
  }
  let images = 0;
  for (const item of node.media) {
    if (images >= 4) break;
    if (item.kind !== "image" && item.kind !== "video") continue;
    const blob = await getBlob(item.id);
    if (!blob || blob.size > OPML_IMAGE_MAX) continue;
    const url = await blobToDataUrl(blob);
    attrs.push(`${images === 0 ? "_image" : `_image${images + 1}`}="${xmlEscape(url)}"`);
    images += 1;
  }
  if (!node.children.length) return `${pad}<outline ${attrs.join(" ")}/>`;
  const inner = (
    await Promise.all(node.children.map((child) => opmlNode(child, `${pad}  `, getBlob)))
  ).join("\n");
  return `${pad}<outline ${attrs.join(" ")}>\n${inner}\n${pad}</outline>`;
}

export async function chartToOpml(
  chart: Chart,
  getBlob: (id: string) => Promise<Blob | null>,
): Promise<string> {
  const title = xmlEscape(displayTitle(chart.root.title));
  const body = await opmlNode(chart.root, "", getBlob);
  return `<?xml version="1.0" encoding="utf-8"?>\n<opml version="2.0">\n<head>\n<title>${title}</title>\n</head>\n<body>\n${body}\n</body>\n</opml>\n`;
}

type ExportNode = {
  title: string;
  body: string;
  style: TabStyle;
  collapsed: boolean;
  media: { name: string; mime: string; kind: MediaKind; dataUrl: string }[];
  children: ExportNode[];
};

async function exportNode(node: BhedNode, getBlob: (id: string) => Promise<Blob | null>): Promise<ExportNode> {
  const media = [];
  for (const item of node.media) {
    const blob = await getBlob(item.id);
    if (!blob) continue;
    media.push({
      name: item.name,
      mime: item.mime || blob.type,
      kind: item.kind,
      dataUrl: await blobToDataUrl(blob),
    });
  }
  const children: ExportNode[] = [];
  for (const child of node.children) children.push(await exportNode(child, getBlob));
  return {
    title: node.title,
    body: node.body,
    style: node.style,
    collapsed: node.collapsed,
    media,
    children,
  };
}

export async function chartToJson(
  chart: Chart,
  getBlob: (id: string) => Promise<Blob | null>,
): Promise<string> {
  const payload = {
    format: "bhed-prabhed",
    version: 1,
    exportedAt: new Date().toISOString(),
    title: chart.root.title,
    root: await exportNode(chart.root, getBlob),
  };
  return JSON.stringify(payload, null, 2);
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (~crc) >>> 0;
}

function bytesOf(data: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(new ArrayBuffer(data.byteLength));
  copy.set(data);
  return copy;
}

export function zipStore(files: { name: string; data: Uint8Array }[]): Blob {
  const locals: BlobPart[] = [];
  const central: BlobPart[] = [];
  let offset = 0;
  const encoder = new TextEncoder();
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = bytesOf(file.data);
    const nameBytes = new Uint8Array(name.byteLength);
    nameBytes.set(name);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(8, 0, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, data.length, true);
    cen.setUint32(24, data.length, true);
    cen.setUint16(28, nameBytes.length, true);
    cen.setUint32(42, offset, true);
    locals.push(new Uint8Array(local.buffer), nameBytes, data);
    central.push(new Uint8Array(cen.buffer), nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const centralSize = central.reduce((sum, part) => sum + (part instanceof Uint8Array ? part.byteLength : 0), 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...locals, ...central, new Uint8Array(end.buffer)], { type: "application/zip" });
}

type BundleNode = {
  title: string;
  body: string;
  style: TabStyle;
  collapsed: boolean;
  media: { name: string; mime: string; kind: MediaKind; file: string }[];
  children: BundleNode[];
};

async function bundleNode(
  node: BhedNode,
  files: { name: string; data: Uint8Array }[],
  getBlob: (id: string) => Promise<Blob | null>,
): Promise<BundleNode> {
  const media: { name: string; mime: string; kind: MediaKind; file: string }[] = [];
  for (const item of node.media) {
    const blob = await getBlob(item.id);
    if (!blob) continue;
    // eslint-disable-next-line no-useless-escape
    const safe = (item.name || "file").replace(/[^\w.\-]+/g, "_").slice(0, 48) || "file";
    const path = `media/${item.id}-${safe}`;
    files.push({ name: path, data: new Uint8Array(await blob.arrayBuffer()) });
    media.push({ name: item.name, mime: item.mime || blob.type || "application/octet-stream", kind: item.kind, file: path });
  }
  const children = [];
  for (const child of node.children) children.push(await bundleNode(child, files, getBlob));
  return {
    title: node.title,
    body: node.body,
    style: node.style,
    collapsed: node.collapsed,
    media,
    children,
  };
}

export async function chartToZip(
  chart: Chart,
  getBlob: (id: string) => Promise<Blob | null>,
): Promise<{ blob: Blob; files: number }> {
  const packed: { name: string; data: Uint8Array }[] = [];
  const root = await bundleNode(chart.root, packed, getBlob);
  const payload = {
    format: "bhed-prabhed",
    version: 2,
    exportedAt: new Date().toISOString(),
    title: chart.root.title,
    root,
  };
  packed.unshift({ name: "chart.json", data: new TextEncoder().encode(JSON.stringify(payload)) });
  return { blob: zipStore(packed), files: packed.length - 1 };
}

export type ZipEntry = { name: string; data: Uint8Array };

export async function unzip(bytes: Uint8Array): Promise<ZipEntry[]> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries: ZipEntry[] = [];
  let offset = 0;
  while (offset + 30 < bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const flag = view.getUint16(offset + 6, true);
    const method = view.getUint16(offset + 8, true);
    let size = view.getUint32(offset + 18, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const name = new TextDecoder().decode(bytes.subarray(nameStart, nameStart + nameLen));
    const dataStart = nameStart + nameLen + extraLen;
    if ((flag & 8) !== 0 && size === 0) {
      let cursor = dataStart;
      while (cursor + 3 < bytes.length) {
        if (bytes[cursor] === 0x50 && bytes[cursor + 1] === 0x4b) break;
        cursor += 1;
      }
      size = Math.max(0, cursor - dataStart);
    }
    const compressed = bytes.subarray(dataStart, dataStart + size);
    if (!name.endsWith("/") && !name.toLowerCase().includes("__macosx") && (method === 0 || method === 8)) {
      try {
        const raw = method === 8 ? await inflateRaw(compressed) : compressed;
        entries.push({ name: name.replace(/\\/g, "/"), data: bytesOf(raw) });
      } catch {
        /* skip a file this browser cannot unpack */
      }
    }
    offset = dataStart + size;
    if ((flag & 8) !== 0) offset += view.getUint32(offset, true) === 0x08074b50 ? 16 : 12;
  }
  return entries;
}

async function textFromZip(bytes: Uint8Array): Promise<string | null> {
  const entries = await unzip(bytes);
  const texts = entries
    .filter((entry) => /\.(opml|xml|md|markdown|json|txt)$/i.test(entry.name))
    .map((entry) => ({ name: entry.name.toLowerCase(), text: new TextDecoder("utf-8").decode(entry.data) }));
  const outline = texts.find((item) => item.text.toLowerCase().includes("<outline"));
  return (outline ?? texts[0])?.text ?? null;
}

export function fileBase(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "bhed-prabhed";
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function countNodes(root: BhedNode): number {
  let count = 0;
  walk(root, () => {
    count += 1;
  });
  return count;
}
