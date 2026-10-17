export type MediaKind = "image" | "video" | "audio" | "file";

export type TabTone = "ink" | "accent" | "quiet";
export type TabMark = "none" | "wash" | "rule";
export type TabSize = "sm" | "md" | "lg";
export type TabAlign = "start" | "center";
export type TabWeight = "regular" | "medium" | "bold";

export type TabStyle = {
  weight: TabWeight;
  italic: boolean;
  underline: boolean;
  align: TabAlign;
  tone: TabTone;
  mark: TabMark;
  size: TabSize;
};

export type MediaRef = {
  id: string;
  name: string;
  mime: string;
  kind: MediaKind;
};

export type BhedNode = {
  id: string;
  title: string;
  body: string;
  style: TabStyle;
  collapsed: boolean;
  media: MediaRef[];
  children: BhedNode[];
};

export type Chart = {
  id: string;
  title: string;
  root: BhedNode;
  createdAt: number;
  updatedAt: number;
};

export type MapStyle = "radial" | "cascade" | "ledger" | "icicle";
export type ViewMode = "table" | "map";

export type NodePatch = {
  title?: string;
  body?: string;
  collapsed?: boolean;
  style?: Partial<TabStyle>;
};

export const DEFAULT_STYLE: TabStyle = {
  weight: "medium",
  italic: false,
  underline: false,
  align: "start",
  tone: "ink",
  mark: "none",
  size: "md",
};

export const MAP_STYLES: { id: MapStyle; label: string; hint: string }[] = [
  { id: "cascade", label: "Cascade", hint: "Left to right" },
  { id: "ledger", label: "Ledger", hint: "Top to bottom" },
  { id: "radial", label: "Radial", hint: "Around a center" },
  { id: "icicle", label: "Bands", hint: "One row per depth" },
];

export function isMapStyle(value: unknown): value is MapStyle {
  return value === "radial" || value === "cascade" || value === "ledger" || value === "icicle";
}

export function depthLabel(depth: number): string {
  if (depth <= 0) return "विषय";
  if (depth === 1) return "भेद";
  return "प्रभेद";
}

export function displayTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed || "Untitled";
}

export function excerpt(body: string, max = 120): string {
  const plain = body
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return "";
  if (plain.length <= max) return plain;
  return plain.slice(0, max).trimEnd() + "…";
}

export function stylesEqual(a: TabStyle, b: TabStyle): boolean {
  return (
    a.weight === b.weight &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.align === b.align &&
    a.tone === b.tone &&
    a.mark === b.mark &&
    a.size === b.size
  );
}

export function kindFromMime(mime: string, name: string): MediaKind {
  const type = mime.toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "bmp"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "ogv", "m4v"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) return "audio";
  return "file";
}

export function coverOf(node: BhedNode): MediaRef | null {
  return node.media.find((item) => item.kind === "image" || item.kind === "video") ?? null;
}
