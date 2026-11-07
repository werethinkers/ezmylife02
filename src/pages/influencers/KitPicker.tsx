import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/instant/useProducts";
import { creditsForInr } from "@/lib/creditRate";
import { ProductRenderer } from "@/instant/renderers";
import { pageUrlFor } from "@/instant/util";
import { KIT, kitCardChoices, kitSiteChoices, resolvePick, type KitPicks } from "@/data/kit";

const rpc = (name: string, args: Record<string, unknown> = {}) =>
  (supabase as any).rpc(name, args) as Promise<{ data: any; error: { message: string } | null }>;

/**
 * Lets the influencer choose which website design and which visiting-card design
 * their audience is shown on /kit, from the designs inside the kit's price range.
 * Nothing chosen means the defaults. Buyers can still pick any design after paying.
 */
export default function KitPicker() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { list } = useProducts();
  const priceOf = (p: { id: string; price: number }) => list.find((l) => l.product.id === p.id)?.price ?? p.price;

  const saved = useQuery({
    queryKey: ["influencer-kit-picks"],
    queryFn: async () => {
      const { data, error } = await rpc("influencer_my_kit_picks");
      if (error) throw new Error(error.message);
      return (data ?? {}) as KitPicks;
    },
  });

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<KitPicks | null>(null);
  const cur: KitPicks = draft ?? saved.data ?? {};
  const site = resolvePick("site", cur);
  const card = resolvePick("card", cur);
  const sites = kitSiteChoices(priceOf);
  const cards = kitCardChoices(priceOf);
  const edit = (patch: KitPicks) => setDraft({ ...cur, ...patch });

  const save = async (next: KitPicks) => {
    setBusy(true);
    try {
      const { error } = await rpc("influencer_update_kit_picks", {
        _site_product: next.site_product ?? "", _site_theme: next.site_theme ?? "",
        _card_product: next.card_product ?? "", _card_theme: next.card_theme ?? "",
      });
      if (error) throw new Error(error.message);
      setDraft(null);
      await qc.invalidateQueries({ queryKey: ["influencer-kit-picks"] });
      toast({ title: "Saved", description: "Your link now shows these designs." });
    } catch (e) {
      toast({ title: "Not saved", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const chosen = (k: "site" | "card") => {
    const mine = k === "site" ? saved.data?.site_product : saved.data?.card_product;
    return mine ? resolvePick(k, saved.data) : null;
  };
  const summary = (k: "site" | "card") => {
    const c = chosen(k);
    return c ? `${c.product.name} · ${c.theme.name}` : "default";
  };

  const Group = ({ kind, title, hint, items, pick }: {
    kind: "site" | "card"; title: string; hint: string;
    items: ReturnType<typeof kitSiteChoices>; pick: ReturnType<typeof resolvePick>;
  }) => (
    <div className="space-y-2">
      <div>
        <div className="font-bold">{title}</div>
        <p className="text-xs text-neutral-600">{hint}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((p) => {
          const on = p.id === pick.product.id;
          return (
            <button key={p.id} type="button" aria-pressed={on}
                    onClick={() => edit(kind === "site" ? { site_product: p.id, site_theme: p.themes[0].id } : { card_product: p.id, card_theme: p.themes[0].id })}
                    className={`border-2 border-[#121212] px-2.5 py-1.5 text-sm font-semibold ${on ? "bg-[#121212] text-white" : "bg-white"}`}>
              {p.glyph} {p.name} <span className="opacity-70">{creditsForInr(priceOf(p))} cr</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <span className="text-xs font-bold self-center">Design:</span>
        {pick.product.themes.map((t) => {
          const on = t.id === pick.theme.id;
          return (
            <button key={t.id} type="button" aria-pressed={on}
                    onClick={() => edit(kind === "site" ? { site_theme: t.id, site_product: pick.product.id } : { card_theme: t.id, card_product: pick.product.id })}
                    className={`flex items-center gap-1.5 border-2 border-[#121212] px-2 py-1 text-xs font-semibold ${on ? "bg-[#FFC800]" : "bg-white"}`}>
              <span className="h-3.5 w-3.5 border border-[#121212]" style={{ background: t.c.ac }} /> {t.name}
            </button>
          );
        })}
      </div>
      <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-[1.6rem] border-[6px] border-[#121212] bg-[#121212]">
        <div className="ip-frame relative h-[320px] overflow-hidden" style={{ transform: "translateZ(0)", ["--ip-vh" as string]: "320px", background: pick.theme.c.bg }}>
          <div className="h-full overflow-y-auto overflow-x-hidden">
            <ProductRenderer product={pick.product} theme={pick.theme} content={pick.product.sample} mode="preview" pageUrl={pageUrlFor()} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="border-2 border-[#121212] bg-white shadow-[4px_4px_0_#121212]">
      <button onClick={() => setOpen(!open)} className="w-full text-left p-4">
        <div className="font-bold text-lg">{open ? "▾" : "▸"} Website and card your audience sees</div>
        <div className="text-sm text-neutral-700">Website: {summary("site")} · Card: {summary("card")}</div>
      </button>
      {open && (
        <div className="border-t-2 border-[#121212] p-4 space-y-5">
          <p className="text-sm">
            Pick the website and visiting-card designs that suit your people. They are shown on your link and
            opened first when someone buys. The price stays {"₹"}{KIT.inr}, and the buyer can still choose any other design.
            Only designs up to {creditsForInr(KIT.siteMaxInr)} credits (websites) and {creditsForInr(KIT.cardMaxInr)} credits (cards) are listed, so the offer
            always stays inside the kit.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <Group kind="site" title="Website" hint="Shop, service or studio designs." items={sites} pick={site} />
            <Group kind="card" title="Visiting card" hint="Card and profile designs." items={cards} pick={card} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="border-2 border-[#121212]" disabled={busy || !draft} onClick={() => save(cur)}>Save my choice</Button>
            <Button variant="outline" className="border-2 border-[#121212]" disabled={busy}
                    onClick={() => save({})}>Use the defaults</Button>
            {draft && <Button variant="ghost" disabled={busy} onClick={() => setDraft(null)}>Undo changes</Button>}
          </div>
        </div>
      )}
    </section>
  );
}
