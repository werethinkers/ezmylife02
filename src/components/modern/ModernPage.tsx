import { useEffect, type ReactNode } from "react";
import type { SectionId } from "@/components/brand/nav";
import { cn } from "@/lib/utils";
import { ModernHeader } from "./ModernHeader";
import { ModernFooter } from "./ModernFooter";
import { useModernTheme } from "./theme";

const PAGE_BG = { light: "#F7F6F2", dark: "#0F1115" } as const;

/**
 * A page in the modern look: header, content and footer inside the `.ez-modern` scope (tokens and
 * fonts in src/index.css), light or dark as the visitor chose. While it is on screen it also tints
 * the browser bar and the page behind the scroll edge to match, and puts them back when it leaves.
 * A new modern page also needs its path in MODERN_PATHS (./theme.ts) so the phone tab bar matches.
 * `chrome={false}` drops the header and footer (a focused page like sign in/up draws its own).
 */
export function ModernPage({
  section,
  children,
  className,
  chrome = true,
}: {
  section?: SectionId | null;
  children: ReactNode;
  className?: string;
  chrome?: boolean;
}) {
  const { dark } = useModernTheme();

  useEffect(() => {
    const root = document.documentElement;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const before = { bg: root.style.backgroundColor, scheme: root.style.colorScheme, themeColor: meta?.content };
    const bg = dark ? PAGE_BG.dark : PAGE_BG.light;
    root.style.backgroundColor = bg;
    root.style.colorScheme = dark ? "dark" : "light";
    if (meta) meta.content = bg;
    return () => {
      root.style.backgroundColor = before.bg;
      root.style.colorScheme = before.scheme;
      if (meta && before.themeColor != null) meta.content = before.themeColor;
    };
  }, [dark]);

  return (
    <div className={cn("ez-modern min-h-screen antialiased transition-colors duration-200", dark && "dark", className)}>
      {chrome && <ModernHeader section={section} />}
      {children}
      {chrome && <ModernFooter />}
    </div>
  );
}
