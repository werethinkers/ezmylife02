import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renders AI or user Markdown safely: raw HTML is never rendered, and links only open
 * http(s), mailto, tel or in-site paths.
 */
export function safeHref(href?: string): string | undefined {
  if (!href) return undefined;
  const h = href.trim();
  if (/^(https?:|mailto:|tel:)/i.test(h) || h.startsWith("/") || h.startsWith("#")) return h;
  return undefined;
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-li:my-0.5 prose-pre:whitespace-pre-wrap prose-table:text-xs",
        className,
      )}
    >
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: c }) => {
            const safe = safeHref(href);
            if (!safe) return <span>{c}</span>;
            const external = /^https?:/i.test(safe);
            return (
              <a
                href={safe}
                className="text-primary underline underline-offset-2 hover:text-primary/80"
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {c}
              </a>
            );
          },
          // Wide tables scroll sideways on phones instead of stretching the page.
          table: ({ children: c }) => (
            <div className="overflow-x-auto">
              <table>{c}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default Markdown;
