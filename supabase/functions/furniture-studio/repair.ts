// Reads the furniture spec the model returns, repairing answers that were cut off.
import { parseJson } from "../_shared/llm.ts";

/** Parses the spec JSON; repairs an answer that was cut off or has trailing commas. Null if unusable. */
export function readSpec(text: string): Record<string, unknown> | null {
  const ok = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) && "parts" in v ? (v as Record<string, unknown>) : null);
  try {
    return ok(parseJson(text));
  } catch {
    /* try to repair below */
  }
  try {
    return ok(JSON.parse(repairJson(text)));
  } catch {
    return null;
  }
}

/** Cuts a truncated JSON text back to its last complete value and closes every open bracket. */
export function repairJson(text: string): string {
  const src = text.replace(/```(?:json)?/g, "");
  const start = src.indexOf("{");
  if (start < 0) return src;
  const stack: string[] = [];
  let inStr = false, esc = false;
  let safeEnd = -1;
  let safeStack: string[] = [];
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") stack.push(c === "{" ? "}" : "]");
    else if (c === "}" || c === "]") {
      stack.pop();
      safeEnd = i + 1;
      safeStack = [...stack];
      if (!stack.length) break;
    } else if (c === ",") {
      safeEnd = i;
      safeStack = [...stack];
    }
  }
  if (safeEnd < 0) return src;
  const body = src.slice(start, safeEnd) + safeStack.reverse().join("");
  return body.replace(/,(\s*[}\]])/g, "$1");
}
