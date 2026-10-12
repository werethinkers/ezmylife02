/**
 * Filter tags are the `tool_types` of an app ("Document Tools", "Writing Tools", …). They are typed
 * by hand in admin over time, so "ai", "AI" and "Ai" must count as one tag. The key is the
 * lower-case form; the label shown is the spelling used most.
 */
export const tagKey = (tag: string): string => tag.trim().toLowerCase();

export interface TagCount {
  key: string;
  label: string;
  count: number;
}

export function tagCounts(tools: { tool_types?: string[] | null }[]): TagCount[] {
  const byKey = new Map<string, { spellings: Map<string, number>; count: number }>();
  for (const t of tools) {
    const seen = new Set<string>();
    for (const raw of t.tool_types ?? []) {
      const label = raw.trim();
      const key = tagKey(label);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const e = byKey.get(key) ?? { spellings: new Map(), count: 0 };
      e.count += 1;
      e.spellings.set(label, (e.spellings.get(label) ?? 0) + 1);
      byKey.set(key, e);
    }
  }
  return [...byKey.entries()]
    .map(([key, e]) => ({
      key,
      label: [...e.spellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
      count: e.count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export const hasTag = (t: { tool_types?: string[] | null }, key: string): boolean =>
  (t.tool_types ?? []).some((x) => tagKey(x) === key);
