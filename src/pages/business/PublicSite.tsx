/* /b/:slug: a business's own website, made from its items in My Business. Orders and enquiries sent here
   land in the owner's app (website orders wait for the owner to accept them). */

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MapPin, MessageCircle, Minus, Phone, Plus } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchPublicSite, sendSiteOrder, type PublicSite as Site } from "@/business/store";
import { inr } from "@/business/format";
import { waLink } from "@/business/whatsapp";

export default function PublicSitePage() {
  const { slug = "" } = useParams();
  const q = useQuery({ queryKey: ["biz-site", slug], queryFn: () => fetchPublicSite(slug), retry: 1 });
  if (q.isLoading) return <div className="grid min-h-screen place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!q.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <PageSeo title="Page not found | EZYOURLIFE" description="This business page is not live." path={`/b/${slug}`} noindex />
        <div><p className="font-display text-2xl font-bold">This page is not live</p><p className="mt-1 text-muted-foreground">The address may be wrong, or the owner has not put it live yet.</p><Link to="/business" className="mt-4 inline-block font-semibold underline">Make a free page for your business</Link></div>
      </div>
    );
  }
  return <SiteView site={q.data} slug={slug} />;
}

export function SiteView({ site, slug, preview }: { site: Site; slug: string; preview?: boolean }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const items = site.items ?? [];
  const lines = items.filter((i) => cart[i.id] > 0);
  const total = useMemo(() => lines.reduce((a, i) => a + i.price * cart[i.id], 0), [lines, cart]);
  const add = (id: string, d: number) => setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(999, (c[id] ?? 0) + d)) }));
  const ordering = site.take_orders && lines.length > 0;
  const send = async () => {
    if (preview) return void toast("This is a preview. Orders work once your page is live.");
    setBusy(true);
    try {
      const ref = await sendSiteOrder(slug, { kind: ordering ? "order" : "lead", name, phone, note, items: lines.map((i) => ({ id: i.id, qty: cart[i.id] })), due: when ? new Date(when).toISOString() : undefined });
      setDone(ref);
      setCart({});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send. Please call the shop.");
    } finally {
      setBusy(false);
    }
  };
  const tone = `bg-${site.colour || "sun"}`;
  return (
    <div className={cn("bg-background", !preview && "min-h-screen")}>
      {!preview && <PageSeo title={`${site.name}${site.city ? `, ${site.city}` : ""}`} description={(site.about ?? `${site.name}. Order online or send an enquiry.`).slice(0, 160)} path={`/b/${slug}`} />}
      <header className={cn("border-b-2 border-ink", tone)}>
        <div className="mx-auto max-w-4xl px-4 py-10">
          <h1 className="font-display text-3xl font-bold md:text-5xl">{site.name}</h1>
          {site.about && <p className="mt-3 max-w-2xl text-lg">{site.about}</p>}
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
            {(site.address || site.city) && <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-card px-3 py-1"><MapPin className="h-4 w-4" />{[site.address, site.city].filter(Boolean).join(", ")}</span>}
            {site.phone && <a href={`tel:${site.phone}`} className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-card px-3 py-1"><Phone className="h-4 w-4" />{site.phone}</a>}
            {site.phone && <a href={waLink(site.phone, `Hello ${site.name}, I found you online.`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-lime px-3 py-1"><MessageCircle className="h-4 w-4" />WhatsApp</a>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {items.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold">{site.labels?.products ?? "What we offer"}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-card p-4 shadow-block-sm">
                  <div><p className="font-bold">{i.name}</p><p className="text-sm">{inr(i.price)}{i.type === "product" ? ` per ${i.unit}` : ""}</p></div>
                  {site.take_orders && (
                    cart[i.id] ? (
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" onClick={() => add(i.id, -1)} aria-label={`One less ${i.name}`}><Minus /></Button>
                        <span className="w-6 text-center font-bold tabular-nums">{cart[i.id]}</span>
                        <Button size="icon" variant="outline" onClick={() => add(i.id, 1)} aria-label={`One more ${i.name}`}><Plus /></Button>
                      </div>
                    ) : <Button size="sm" variant="outline" onClick={() => add(i.id, 1)}><Plus /> Add</Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="mt-8 rounded-2xl border-2 border-ink bg-card p-5 shadow-block">
          {done ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-10 w-10" />
              <p className="mt-2 font-display text-xl font-bold">Sent! Your reference is {done}</p>
              <p className="mt-1">{site.name} will confirm on WhatsApp or call you soon.</p>
              <Button className="mt-4" variant="outline" onClick={() => setDone(null)}>Send another</Button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void send(); }}>
              <h2 className="font-display text-xl font-bold">{ordering ? `Your order · ${inr(total)}` : "Ask us anything"}</h2>
              {ordering && <ul className="text-sm">{lines.map((i) => <li key={i.id} className="flex justify-between"><span>{i.name} × {cart[i.id]}</span><span>{inr(i.price * cart[i.id])}</span></li>)}</ul>}
              <div className="grid gap-3 sm:grid-cols-2">
                <Input required minLength={2} maxLength={80} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Your name" />
                <Input required inputMode="tel" pattern="[0-9 +-]{10,15}" placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Mobile number" />
              </div>
              {ordering && <label className="block text-sm font-semibold">When do you need it? (optional)<Input type="datetime-local" className="mt-1" value={when} onChange={(e) => setWhen(e.target.value)} /></label>}
              <Textarea maxLength={500} rows={3} placeholder={ordering ? "Anything else: message on the cake, address for delivery" : "What do you need?"} value={note} onChange={(e) => setNote(e.target.value)} aria-label="Note" />
              <Button type="submit" size="lg" disabled={busy}>{busy ? "Sending…" : ordering ? "Place order" : "Send enquiry"}</Button>
              {site.take_orders && !lines.length && items.length > 0 && <p className="text-xs text-muted-foreground">Add items above to order, or just send a question.</p>}
            </form>
          )}
        </section>
        <p className="mt-10 text-center text-xs text-muted-foreground">Made free with <Link to="/business" className="underline">EZYOURLIFE My Business</Link></p>
      </main>
    </div>
  );
}
