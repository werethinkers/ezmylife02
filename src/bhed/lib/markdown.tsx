import type { ReactNode } from "react";

function inline(text: string, keyPrefix: string): ReactNode[] {
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\(https?:[^)\s]+\))/g;
  const out: ReactNode[] = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(re)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyPrefix}-${index++}`;
    if (token.startsWith("**")) out.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`")) {
      out.push(
        <code key={key} className="rounded bg-paper-3 px-1 py-0.5 text-sm">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[")) {
      const link = /\[([^\]]+)\]\((https?:[^)\s]+)\)/.exec(token);
      if (link) {
        out.push(
          <a
            key={key}
            href={link[2]}
            className="underline decoration-line-strong underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            {link[1]}
          </a>,
        );
      }
    } else out.push(<em key={key}>{token.slice(1, -1)}</em>);
    last = start + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="space-y-2 text-sm leading-relaxed text-pretty">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((line, index, all) => line.length || all.length === 1);
        const list = lines.length > 0 && lines.every((line) => /^\s*[-*]\s+/.test(line));
        const quote = lines.length > 0 && lines.every((line) => /^\s*>\s?/.test(line));
        if (list) {
          return (
            <ul key={blockIndex} className="list-disc space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{inline(line.replace(/^\s*[-*]\s+/, ""), `${blockIndex}-${lineIndex}`)}</li>
              ))}
            </ul>
          );
        }
        if (quote) {
          return (
            <blockquote key={blockIndex} className="border-l-2 border-accent pl-3 text-quiet">
              {lines.map((line, lineIndex) => (
                <p key={lineIndex}>{inline(line.replace(/^\s*>\s?/, ""), `${blockIndex}-q-${lineIndex}`)}</p>
              ))}
            </blockquote>
          );
        }
        return (
          <p key={blockIndex}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && <br />}
                {inline(line, `${blockIndex}-p-${lineIndex}`)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
