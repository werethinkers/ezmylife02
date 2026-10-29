import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listShops, saveShop, shopStats, uploadDataUrl, type ShopRow, type ShopStat } from "@/instant/api";
import { shrinkImage } from "@/instant/media";
import { slugify } from "@/instant/util";

/*
 * Admin: shops for the Diwali gift-box QR. Each shop gets a QR that opens the Diwali card builder with the
 * shop attached (?shop=<slug>). Cards made from it show the shop's name, logo and next-visit coupon, and the
 * person who signs up is linked to the shop. Tables and functions: supabase/migrations/20261028120000_diwali_indore.sql.
 */

const SITE = "https://ezyourlife.com";
export const shopQrLink = (slug: string) => `${SITE}/create/diwali?shop=${slug}&design=rajwada&src=shop-qr`;

const EMPTY = { slug: "", name: "", city: "Indore", coupon_text: "", coupon_code: "", whatsapp: "", logo_url: "", is_active: true };

export default function ShopManager() {
  const [rows, setRows] = useState<ShopRow[]>([]);
  const [stats, setStats] = useState<Record<string, ShopStat>>({});
  const [form, setForm] = useState({ ...EMPTY });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);

  const load = async () => {
    try {
      setRows(await listShops());
      const st = await shopStats().catch(() => []);
      setStats(Object.fromEntries(st.map((s) => [s.slug, s])));
      setMissing(false);
    } catch {
      setMissing(true); // the SQL for shops has not been applied yet
    }
  };
  useEffect(() => { void load(); }, []);

  const slug = editing ? form.slug : form.slug || slugify(form.name);
  const valid = /^[a-z0-9][a-z0-9-]{1,40}$/.test(slug) && form.name.trim().length >= 2;

  const pickLogo = async (f: File | undefined) => {
    if (!f) return;
    try {
      setBusy(true);
      const data = await shrinkImage(f, 400, 0.88);
      const url = await uploadDataUrl("", `shop-${slug || "new"}`, data);
      setForm((x) => ({ ...x, logo_url: url }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't upload the logo");
    } finally { setBusy(false); }
  };

  const save = async () => {
    if (!valid) return;
    try {
      setBusy(true);
      await saveShop({
        slug, name: form.name.trim(), city: form.city.trim() || null, coupon_text: form.coupon_text.trim() || null,
        coupon_code: form.coupon_code.trim().toUpperCase() || null, whatsapp: form.whatsapp.replace(/\D/g, "") || null,
        logo_url: form.logo_url || null, is_active: form.is_active,
      });
      toast.success(editing ? "Shop updated" : "Shop added");
      setForm({ ...EMPTY }); setEditing(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save the shop");
    } finally { setBusy(false); }
  };

  const edit = (r: ShopRow) => {
    setEditing(true);
    setForm({ slug: r.slug, name: r.name, city: r.city ?? "", coupon_text: r.coupon_text ?? "", coupon_code: r.coupon_code ?? "", whatsapp: r.whatsapp ?? "", logo_url: r.logo_url ?? "", is_active: r.is_active });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totals = useMemo(() => Object.values(stats).reduce((a, s) => ({ users: a.users + s.users, cards: a.cards + s.cards }), { users: 0, cards: 0 }), [stats]);

  if (missing) {
    return (
      <Card><CardContent className="p-6 text-sm">
        The shops tables are not in the database yet. Apply <code>supabase/migrations/20261028120000_diwali_indore.sql</code>, then reload this tab.
      </CardContent></Card>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> {editing ? `Edit ${form.name}` : "Add a shop"}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div><Label>Shop name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Agrawal Sweets, Vijay Nagar" maxLength={60} /></div>
          <div><Label>Link name</Label><Input value={slug} disabled={editing} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} placeholder="agrawal-sweets" />
            <p className="mt-1 text-xs text-muted-foreground">Small letters, numbers and dashes. Can't change after saving: it is printed in the QR.</p></div>
          <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={40} /></div>
          <div><Label>Shop WhatsApp (for our records)</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} inputMode="tel" /></div>
          <div className="md:col-span-2"><Label>Next-visit offer shown on cards</Label><Input value={form.coupon_text} onChange={(e) => setForm({ ...form, coupon_text: e.target.value })} placeholder="10% off on your next order above ₹500, till 30 Nov" maxLength={120} /></div>
          <div><Label>Coupon code (optional)</Label><Input value={form.coupon_code} onChange={(e) => setForm({ ...form, coupon_code: e.target.value })} placeholder="DIWALI10" maxLength={24} /></div>
          <div><Label>Logo</Label>
            <div className="flex items-center gap-3">
              {form.logo_url && <img src={form.logo_url} alt="" className="h-12 w-12 rounded-lg border object-cover" />}
              <Input type="file" accept="image/*" disabled={busy || !slug} onChange={(e) => void pickLogo(e.target.files?.[0])} />
            </div></div>
          <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} id="shop-active" /><Label htmlFor="shop-active">Show the offer on cards</Label></div>
          <div className="flex gap-2 md:col-span-2">
            <Button onClick={() => void save()} disabled={!valid || busy}>{editing ? "Save changes" : "Add shop"}</Button>
            {editing && <Button variant="outline" onClick={() => { setEditing(false); setForm({ ...EMPTY }); }}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shops ({rows.length})</CardTitle>
          <p className="text-sm text-muted-foreground">So far: {totals.users} people linked to a shop, {totals.cards} live cards carrying a shop.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Shop</TableHead><TableHead>Offer</TableHead><TableHead className="text-right">People</TableHead><TableHead className="text-right">Cards</TableHead><TableHead>QR</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.slug}>
                  <TableCell><div className="font-semibold">{r.name}</div><div className="text-xs text-muted-foreground">{r.slug}{r.city ? ` · ${r.city}` : ""}</div>{!r.is_active && <Badge variant="secondary">Off</Badge>}</TableCell>
                  <TableCell className="max-w-[260px] text-sm">{r.coupon_text ?? "—"}{r.coupon_code && <Badge variant="outline" className="ml-2">{r.coupon_code}</Badge>}</TableCell>
                  <TableCell className="text-right">{stats[r.slug]?.users ?? 0}</TableCell>
                  <TableCell className="text-right">{stats[r.slug]?.cards ?? 0}</TableCell>
                  <TableCell><ShopQr slug={r.slug} name={r.name} /></TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => edit(r)}>Edit</Button></TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No shops yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/** The shop's QR as a print-ready PNG for gift-box stickers. */
function ShopQr({ slug, name }: { slug: string; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const download = () => {
    const c = ref.current?.querySelector("canvas");
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `${slug}-diwali-qr.png`;
    a.click();
  };
  return (
    <div className="flex items-center gap-2">
      <div ref={ref} className="hidden"><QRCodeCanvas value={shopQrLink(slug)} size={1000} level="Q" marginSize={4} /></div>
      <Button size="sm" variant="outline" onClick={download} title={`QR for ${name}`}><Download className="mr-1 h-4 w-4" /> PNG</Button>
      <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard.writeText(shopQrLink(slug)); toast.success("Link copied"); }}>Copy link</Button>
    </div>
  );
}
