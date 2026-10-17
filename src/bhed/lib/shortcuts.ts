import pairs from "./shortcuts.json";

export type Shortcut = { key: string; phrase: string };

const SHORTCUTS: Shortcut[] = (pairs as [string, string][]).map(([key, phrase]) => ({ key, phrase }));

export function phraseFor(item: Shortcut, now = new Date()): string {
  const key = item.key.toLowerCase();
  if (key === "date") return now.toLocaleDateString("en-IN");
  if (key === "time") {
    return now.toLocaleString("en-IN", { hour: "numeric", minute: "2-digit" });
  }
  if (key === "day") return now.toLocaleDateString("en-IN", { weekday: "long" });
  return item.phrase;
}

export function matchShortcuts(query: string, limit = 8): Shortcut[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const ranked: { item: Shortcut; rank: number }[] = [];
  for (const item of SHORTCUTS) {
    const key = item.key.toLowerCase();
    const phrase = item.phrase.toLowerCase();
    let rank = 4;
    if (key === q) rank = 0;
    else if (key.startsWith(q) || key.endsWith(q)) rank = 1;
    else if (key.includes(q)) rank = 3;
    else if (phrase.includes(q)) rank = 4;
    else continue;
    ranked.push({ item, rank });
  }
  ranked.sort((a, b) => a.rank - b.rank || a.item.key.length - b.item.key.length);
  return ranked.slice(0, limit).map((entry) => entry.item);
}
