import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CATALOG, CATEGORIES } from "@/instant/catalog";
import { fetchProductRows, updateProductRow, type ProductRow } from "@/instant/api";

/** Admin: price, availability and featuring for every Instant Digital Product. */
export default function AdminInstant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>({});
  useEffect(() => { if (user) supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setAllowed(!!data)); }, [user]);
  const rows = useQuery({ queryKey: ["ip-products-admin"], queryFn: fetchProductRows, enabled: !!allowed });
  const byId = useMemo(() => new Map((rows.data ?? []).map((r) => [r.id, r])), [rows.data]);

  const save = async (id: string, patch: Partial<ProductRow>) => {
    try { await updateProductRow(id, patch); toast({ title: "Saved" }); qc.invalidateQueries({ queryKey: ["ip-products-admin"] }); qc.invalidateQueries({ queryKey: ["ip-products"] }); }
    catch (e) { toast({ title: "Couldn't save", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  if (allowed === false) return <div className="min-h-screen grid place-items-center"><p>Admins only.</p></div>;
  const s = q.trim().toLowerCase();
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl pb-24">
        <h1 className="font-display text-3xl font-bold">Instant products</h1>
        <p className="text-muted-foreground mb-4">{CATALOG.length} products. Prices are in rupees and apply to new orders immediately.</p>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="max-w-sm mb-6" aria-label="Search products" />
        {CATEGORIES.map((cat) => {
          const items = CATALOG.filter((p) => p.category === cat.id && (!s || p.name.toLowerCase().includes(s)));
          if (!items.length) return null;
          return (
            <section key={cat.id} className="mb-8">
              <h2 className="font-semibold text-lg mb-2">{cat.name}</h2>
              <div className="rounded-2xl border bg-background divide-y">
                {items.map((p) => {
                  const r = byId.get(p.id);
                  return (
                    <div key={p.id} className="flex flex-wrap items-center gap-3 p-3">
                      <span className="text-2xl w-8" aria-hidden="true">{p.glyph}</span>
                      <Link to={`/create/${p.id}`} className="font-medium flex-1 min-w-[160px] hover:underline">{p.name}</Link>
                      {!r ? <span className="text-sm text-amber-700">Not in database yet</span> : <>
                        <label className="flex items-center gap-1 text-sm">₹<Input className="w-24 h-9" inputMode="numeric" value={prices[p.id] ?? String(r.price_inr)} onChange={(e) => setPrices({ ...prices, [p.id]: e.target.value.replace(/\D/g, "") })} aria-label={`${p.name} price`} /></label>
                        <Button size="sm" variant="outline" disabled={prices[p.id] == null || Number(prices[p.id]) === r.price_inr} onClick={() => save(p.id, { price_inr: Number(prices[p.id] || 0) })}>Save price</Button>
                        <label className="flex items-center gap-2 text-sm">Featured <Switch checked={r.is_featured} onCheckedChange={(v) => save(p.id, { is_featured: v })} /></label>
                        <label className="flex items-center gap-2 text-sm">Active <Switch checked={r.is_active} onCheckedChange={(v) => save(p.id, { is_active: v })} /></label>
                      </>}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
