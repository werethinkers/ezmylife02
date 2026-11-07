import { useQuery } from "@tanstack/react-query";
import { CATALOG } from "./catalog";
import { fetchProductRows, type ProductRow } from "./api";
import type { Product } from "./types";
import { creditsForInr } from "@/lib/creditRate";

/** price: the internal rupee value (kit limits use it). credits: what people see and pay. */
export interface Listed { product: Product; price: number; credits: number; active: boolean; featured: boolean; sort: number }

/** Catalogue merged with the database: price (credits), active and featured come from ip_products. */
export function useProducts() {
  const q = useQuery({ queryKey: ["ip-products"], queryFn: fetchProductRows, staleTime: 5 * 60 * 1000 });
  const rows = new Map<string, ProductRow>((q.data ?? []).map((r) => [r.id, r]));
  const list: Listed[] = CATALOG.map((p, i) => {
    const r = rows.get(p.id);
    const price = r?.price_inr ?? p.price;
    return { product: p, price, credits: r?.price_credits ?? creditsForInr(price), active: q.data ? !!r?.is_active : true, featured: r?.is_featured ?? !!p.popular, sort: r?.sort ?? i };
  }).filter((l) => l.active).sort((a, b) => a.sort - b.sort);
  return { list, rows, loading: q.isLoading, error: q.error };
}
