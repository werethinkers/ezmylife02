import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { Product, Theme } from "../types";
import { themeVars } from "../themes";
import { priceText, waTo, fill } from "../util";
import { resolveImg } from "../parts";
import ConveyorBelt from "./ConveyorBelt";
import type { ConveyorDish, DishTier } from "./ConveyorBelt";

type Item = { category?: string; name: string; price?: string; desc?: string; diet?: string; photo?: string };

/** Menus that get the belt (food you pick one plate at a time). Needs at least 5 items. */
export const BELT_PRODUCTS = new Set(["restaurant-menu", "cafe-menu", "bakery-menu", "cloud-kitchen", "tiffin-service", "street-food", "sweet-shop"]);
export const BELT_MIN = 5;

const priceNum = (p?: string) => { const n = Number(String(p ?? "").replace(/[^\d.]/g, "")); return Number.isFinite(n) && n > 0 ? n : null; };

// A plate drawn in the page's colours for dishes that have no photo yet.
const plateArt = (name: string, theme: Theme, seed: number) => {
  const { ac, ac2, ac3, sf } = theme.c;
  const food = [ac, ac2, ac3][seed % 3];
  const dots = Array.from({ length: 7 }, (_, k) => {
    const a = (k / 7) * Math.PI * 2 + seed; const r = 22 + ((seed * 7 + k * 11) % 14);
    return `<circle cx="${100 + Math.cos(a) * r}" cy="${100 + Math.sin(a) * r}" r="${7 + ((k + seed) % 4) * 2}" fill="${[ac, ac2, ac3][(k + seed) % 3]}" opacity=".85"/>`;
  }).join("");
  const letter = (name.trim()[0] || "•").toUpperCase().replace(/[<&>]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="98" fill="#fff"/><circle cx="100" cy="100" r="98" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="2"/><circle cx="100" cy="100" r="76" fill="${sf}" stroke="rgba(0,0,0,.08)" stroke-width="2"/><circle cx="100" cy="100" r="52" fill="${food}" opacity=".22"/>${dots}<text x="100" y="116" text-anchor="middle" font-family="Georgia,serif" font-size="46" font-weight="700" fill="${theme.c.tx}" opacity=".78">${letter}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
};

export default function MenuBelt({ product, theme, items, whatsapp, vars, cart, onAdd, eyebrow }: {
  product: Product; theme: Theme; items: Item[]; whatsapp?: string; vars: Record<string, unknown>; cart: boolean; onAdd: (index: number) => void; eyebrow?: string;
}) {
  const list = useMemo(() => {
    const idx = items.map((it, i) => ({ it, i })).slice(0, 14);
    const prices = idx.map(({ it }) => priceNum(it.price)).filter((n): n is number => n != null).sort((a, b) => a - b);
    const tierOf = (p: number | null): DishTier => {
      if (p == null || !prices.length) return 3;
      const rank = prices.filter((x) => x < p).length / Math.max(1, prices.length);
      return (Math.min(5, Math.floor(rank * 5) + 1)) as DishTier;
    };
    return idx.map(({ it, i }, k): ConveyorDish => ({
      id: String(i),
      name: it.name,
      price: priceText(it.price) || "Ask",
      tier: tierOf(priceNum(it.price)),
      description: it.desc || undefined,
      details: [it.category, it.diet].filter(Boolean) as string[],
      image: resolveImg(it.photo) || plateArt(it.name, theme, k + it.name.length),
    }));
  }, [items, theme]);

  const style = { ...themeVars(theme), "--t1": theme.c.ac2, "--t2": theme.c.ac, "--t3": theme.c.ac3, "--t4": theme.c.tx, "--t5": theme.c.mu } as CSSProperties;
  const noun = String(product.opts.itemLabel || "dish");
  const add = (d: ConveyorDish) => {
    const i = Number(d.id);
    if (cart) return onAdd(i);
    const link = waTo(whatsapp, fill(product.whatsapp.item, { ...vars, item: d.name }));
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <ConveyorBelt
      items={list}
      eyebrow={eyebrow ?? "On the belt"}
      heading={`Pick ${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`}
      caption="Hover or touch the belt to stop it. Tap a plate to see it."
      autoplay
      interval={3600}
      labels={{ add: cart ? "Add to order" : "Ask on WhatsApp", close: "Close", previous: "Previous plate", next: "Next plate", pause: "Pause belt" }}
      onAdd={add}
      style={style}
      themeStyle={style}
      themeClass={theme.dark ? "dark" : ""}
      className="mn-belt"
    />
  );
}
