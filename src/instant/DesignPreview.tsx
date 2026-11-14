import { useState } from "react";
import { Laptop, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import type { Content, Product, Theme } from "./types";
import { ProductRenderer } from "./renderers";
import { pageUrlFor } from "./util";

const STYLE_LABEL: Record<Theme["s"], string> = {
  bold: "Bold type", photo: "Full photo", split: "Split screen", editorial: "Editorial", soft: "Soft & rounded", minimal: "Minimal", prime: "Our best layout",
};
export const styleLabel = (t: Theme) => STYLE_LABEL[t.s];

/** A round swatch that previews a design's colours. */
export function Swatch({ t, className }: { t: Theme; className?: string }) {
  return <span className={cn("block shrink-0 rounded-full border-2 border-ink", className)} style={{ background: `conic-gradient(${t.c.bg} 0 50%, ${t.c.ac} 50% 75%, ${t.c.ac2} 75%)` }} aria-hidden="true" />;
}

/** The row of designs to pick from. Scrolls sideways on phones, wraps on wide screens. */
export function DesignRail({ product, value, onChange, dark }: { product: Product; value: string; onChange: (id: string) => void; dark?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Designs" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:flex-wrap md:overflow-visible">
      {product.themes.map((t, i) => {
        const on = t.id === value;
        return (
          <button key={t.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(t.id)} title={`${t.name} · ${styleLabel(t)}`}
            className={cn("flex shrink-0 items-center gap-2 rounded-full border-2 py-1 pl-1 pr-3 text-left text-sm font-semibold transition-colors",
              on ? "border-ink bg-sun text-ink" : dark ? "border-white/25 bg-white/5 hover:border-white/70" : "border-ink/30 bg-card hover:border-ink")}>
            <Swatch t={t} className="h-7 w-7" />
            <span className="leading-tight"><span className="block">{t.name}</span><span className={cn("block text-[11px] font-medium", on ? "text-ink/70" : "opacity-70")}>{i + 1}/{product.themes.length} · {styleLabel(t)}</span></span>
          </button>
        );
      })}
    </div>
  );
}

/** A live sample inside a phone or a laptop frame. The frame's transform keeps the page's fixed bars inside it. */
export function DeviceFrame({ product, theme, content, device, height, slug }: { product: Product; theme: Theme; content?: Content; device: "phone" | "laptop"; height: number; slug?: string }) {
  const page = <ProductRenderer product={product} theme={theme} content={content ?? product.sample} mode="preview" pageUrl={pageUrlFor(slug)} />;
  if (device === "laptop") {
    return (
      <div className="overflow-hidden rounded-2xl border-[3px] border-ink bg-ink shadow-block">
        <div className="flex items-center gap-2 px-3 py-2" aria-hidden="true">
          <i className="h-3 w-3 rounded-full bg-[#FF5F57]" /><i className="h-3 w-3 rounded-full bg-[#FEBC2E]" /><i className="h-3 w-3 rounded-full bg-[#28C840]" />
          <span className="ml-3 flex-1 truncate rounded-md bg-white/10 px-3 py-1 text-xs text-white/70">ezyourlife.com/p/{slug ?? "your-page"}</span>
        </div>
        <div className="ip-frame relative overflow-hidden" style={{ height, transform: "translateZ(0)", ["--ip-vh" as string]: `${height}px`, background: theme.c.bg }}>
          <div className="h-full overflow-y-auto overflow-x-hidden">{page}</div>
        </div>
      </div>
    );
  }
  return (
    <PhoneMockup className="max-w-[360px]" screenBg={theme.c.bg} screenFg={theme.c.tx} height={height}>
      <div className="h-full overflow-y-auto overflow-x-hidden">{page}</div>
    </PhoneMockup>
  );
}

/** Phone / laptop switch. Laptop is offered on wide screens only. */
export function DeviceToggle({ value, onChange, dark }: { value: "phone" | "laptop"; onChange: (d: "phone" | "laptop") => void; dark?: boolean }) {
  const item = (d: "phone" | "laptop", label: string, Icon: typeof Laptop) => (
    <button type="button" onClick={() => onChange(d)} aria-pressed={value === d}
      className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", value === d ? "bg-sun text-ink" : dark ? "text-white/80 hover:text-white" : "text-ink/70 hover:text-ink")}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
  return (
    <div className={cn("hidden w-fit items-center gap-1 rounded-full border-2 p-1 md:flex", dark ? "border-white/25" : "border-ink/30")} role="group" aria-label="Preview size">
      {item("phone", "Phone", Smartphone)}{item("laptop", "Laptop", Laptop)}
    </div>
  );
}

export function useDesign(product: Product, initial?: string) {
  const [id, setId] = useState(initial && product.themes.some((t) => t.id === initial) ? initial : product.themes[0].id);
  const theme = product.themes.find((t) => t.id === id) ?? product.themes[0];
  return { theme, setId };
}
