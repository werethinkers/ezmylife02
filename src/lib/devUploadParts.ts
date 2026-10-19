/*
 * Splitting an app file for upload (dev_begin_upload → dev_upload_part … → dev_finish_upload).
 * No imports, so the browser, the connector bundle and the upload script all use the same rules.
 */

/** Largest app file, in UTF-8 bytes. Matches the database limit. */
export const MAX_APP_BYTES = 10_000_000;

/** 300,000 UTF-16 units is at most 900,000 UTF-8 bytes, under the 1 MB per-part limit. */
export const PART_UNITS = 300_000;

export const MAX_PARTS = 40;

/** UTF-8 size of a string, the same number Postgres reports with octet_length(). */
export const utf8Bytes = (text: string) => new TextEncoder().encode(text).length;

/** Splits text into parts without cutting an emoji or other surrogate pair in half. */
export function splitParts(text: string, units = PART_UNITS): string[] {
  const parts: string[] = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + units, text.length);
    if (end < text.length) {
      const c = text.charCodeAt(end - 1);
      if (c >= 0xd800 && c <= 0xdbff) end -= 1;
    }
    parts.push(text.slice(i, end));
    i = end;
  }
  return parts.length ? parts : [""];
}

/** A quick look at whether a text is an HTML page at all. */
export const looksLikeHtml = (text: string) => /<(html|body|div|main|script|form|section|canvas|button)\b/i.test(text);
