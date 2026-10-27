import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Download, Gift, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CollapsibleCard } from "@/components/admin/CollapsibleCard";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SignaturePad } from "./promo-card/SignaturePad";
import { PromoCardBack, PromoCardFront, type CardStyle } from "./promo-card/PromoCard";

/*
 * Admin: visiting-card promos. Make a batch of cards (one code each, or one shared code), design the card
 * with a signature, preview it, download a PNG, and print sheets (10 cards per A4, fronts then backs).
 */

interface CardRow {
  id: string;
  code: string;
  kind: "unique" | "shared";
  credits: number;
  per_app_limit: number;
  label: string | null;
  expires_at: string | null;
  max_claims: number | null;
  claim_count: number;
  is_active: boolean;
  created_at: string;
}

const STYLE_KEY = "ez_card_style";
const SIGN_KEY = "ez_card_signature";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any; // the card tables are newer than the generated database types

const loadStyle = (): CardStyle => {
  let saved: Partial<CardStyle> = {};
  let signature: string | null = null;
  try {
    saved = JSON.parse(localStorage.getItem(STYLE_KEY) ?? "{}");
    signature = localStorage.getItem(SIGN_KEY);
  } catch { /* ignore */ }
  return {
    name: saved.name ?? "Abhijay Jain",
    title: saved.title ?? "Founder, EZYOURLIFE",
    tagline: saved.tagline ?? "Scan, sign up and try any of our AI apps. My gift to you.",
    offer: saved.offer ?? "₹5,000",
    perApp: 3,
    signature,
  };
};

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null);
const PER_SHEET = 10;

const PRINT_CSS = `
@page { size: A4; margin: 0; }
.promo-print-root { display: none; }
@media print {
  body * { visibility: hidden !important; }
  .promo-print-root, .promo-print-root * { visibility: visible !important; }
  .promo-print-root { display: block; position: absolute; left: 0; top: 0; width: 210mm; }
  .promo-sheet { width: 210mm; height: 297mm; padding: 11mm 15mm; box-sizing: border-box; display: grid; grid-template-columns: 90mm 90mm; grid-auto-rows: 55mm; gap: 0; justify-content: center; align-content: start; page-break-after: always; }
}`;

export default function CardPromoManager() {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [style, setStyle] = useState<CardStyle>(loadStyle);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printCards, setPrintCards] = useState<CardRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ count: "50", label: "", kind: "unique", sharedCode: "", credits: "5000", perApp: "3", expires: "", maxClaims: "" });
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data, error } = await db.from("card_promos").select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) toast.error("Could not load cards. Has the card promo SQL been applied?");
    setCards((data as CardRow[]) ?? []);
  };
  useEffect(() => { void load(); }, []);

  const patchStyle = (p: Partial<CardStyle>) => {
    const next = { ...style, ...p };
    setStyle(next);
    try {
      const { signature, ...rest } = next;
      localStorage.setItem(STYLE_KEY, JSON.stringify(rest));
      if (signature) localStorage.setItem(SIGN_KEY, signature); else if ("signature" in p) localStorage.removeItem(SIGN_KEY);
    } catch { /* ignore */ }
  };

  const create = async () => {
    setBusy(true);
    const { data, error } = await db.rpc("admin_create_card_promos", {
      _count: Number(form.count) || 1,
      _label: form.label || null,
      _kind: form.kind,
      _credits: Number(form.credits) || 5000,
      _per_app_limit: Number(form.perApp) || 3,
      _expires_at: form.expires ? new Date(form.expires).toISOString() : null,
      _max_claims: form.maxClaims ? Number(form.maxClaims) : null,
      _shared_code: form.kind === "shared" ? form.sharedCode : null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${(data as CardRow[]).length} card${(data as CardRow[]).length === 1 ? "" : "s"} made`);
    setSelected(new Set((data as CardRow[]).map((c) => c.id)));
    void load();
  };

  const toggleActive = async (c: CardRow) => {
    await db.from("card_promos").update({ is_active: !c.is_active }).eq("id", c.id);
    void load();
  };

  const preview = useMemo(() => cards.find((c) => selected.has(c.id)) ?? cards[0] ?? null, [cards, selected]);
  const previewCode = preview?.code ?? "K7M2-9XQP-4TRD";
  const previewExpiry = fmtDate(preview?.expires_at ?? null);

  const printNow = (list: CardRow[]) => {
    if (!list.length) { toast.error("Tick the cards to print first."); return; }
    setPrintCards(list);
    setTimeout(() => window.print(), 300);
  };

  const png = async (el: HTMLDivElement | null, name: string) => {
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 6, backgroundColor: null, useCORS: true });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${name}.png`;
    a.click();
  };

  const sheets = useMemo(() => {
    const pages: CardRow[][] = [];
    for (let i = 0; i < printCards.length; i += PER_SHEET) pages.push(printCards.slice(i, i + PER_SHEET));
    return pages;
  }, [printCards]);

  const chosen = cards.filter((c) => selected.has(c.id));
  const setAll = (on: boolean) => setSelected(on ? new Set(cards.map((c) => c.id)) : new Set());

  return (
    <div className="space-y-6">
      <style>{PRINT_CSS}</style>

      <CollapsibleCard title={<><Gift className="h-5 w-5" /> Visiting-card gift</>} size="lg" contentClassName="space-y-3 text-sm">
        <p>
          Each card gives <b>{Number(form.credits).toLocaleString("en-IN")} gift credits</b>, claimed once, on one account. Gift credits are spent first and work on
          each app up to <b>{form.perApp}</b> times (Bulk Mode counts each file as one use); after that the app uses free or bought credits.
        </p>
      </CollapsibleCard>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CollapsibleCard title="1. Make cards" size="lg" contentClassName="space-y-3">
          <div className="flex gap-2">
            {(["unique", "shared"] as const).map((k) => (
              <Button key={k} type="button" size="sm" variant={form.kind === k ? "default" : "outline"} onClick={() => setForm({ ...form, kind: k })}>
                {k === "unique" ? "A code on every card" : "One code on all cards"}
              </Button>
            ))}
          </div>
          {form.kind === "unique" ? (
            <div><Label>How many cards</Label><Input type="number" min={1} max={2000} value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} /></div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div><Label>The code (like K7M2-9XQP-4TRD)</Label><Input value={form.sharedCode} onChange={(e) => setForm({ ...form, sharedCode: e.target.value.toUpperCase() })} placeholder="ABCD-EFGH-JKLM" /></div>
              <div><Label>Most people (optional)</Label><Input type="number" min={1} value={form.maxClaims} onChange={(e) => setForm({ ...form, maxClaims: e.target.value })} placeholder="no limit" /></div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Credits</Label><Input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} /></div>
            <div><Label>Uses per app</Label><Input type="number" min={1} value={form.perApp} onChange={(e) => setForm({ ...form, perApp: e.target.value })} /></div>
            <div><Label>Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Diwali batch" /></div>
          </div>
          <div><Label>Claim by (optional)</Label><Input type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} /></div>
          <Button onClick={create} disabled={busy}>Make cards</Button>
        </CollapsibleCard>

        <CollapsibleCard title="2. Design and sign" size="lg" contentClassName="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Your name</Label><Input value={style.name} onChange={(e) => patchStyle({ name: e.target.value })} /></div>
            <div><Label>Title</Label><Input value={style.title} onChange={(e) => patchStyle({ title: e.target.value })} /></div>
            <div><Label>Offer shown</Label><Input value={style.offer} onChange={(e) => patchStyle({ offer: e.target.value })} /></div>
            <div><Label>Uses per app (printed)</Label><Input type="number" min={1} value={style.perApp} onChange={(e) => patchStyle({ perApp: Number(e.target.value) || 3 })} /></div>
          </div>
          <div><Label>Line on the card</Label><Input value={style.tagline} onChange={(e) => patchStyle({ tagline: e.target.value })} /></div>
          <div><Label>Your signature</Label><SignaturePad value={style.signature} onChange={(sig) => patchStyle({ signature: sig })} /></div>
        </CollapsibleCard>
      </div>

      <CollapsibleCard title="3. Preview and print" size="lg" contentClassName="space-y-4">
        <div className="flex flex-wrap items-start gap-6 overflow-x-auto">
          <div><p className="mb-1 text-xs font-bold uppercase">Front</p><PromoCardFront ref={frontRef} code={previewCode} style={style} expires={previewExpiry} /></div>
          <div><p className="mb-1 text-xs font-bold uppercase">Back</p><PromoCardBack ref={backRef} code={previewCode} style={style} expires={previewExpiry} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => png(frontRef.current, `card-front-${previewCode}`)}><Download className="mr-1 h-4 w-4" /> Front PNG</Button>
          <Button variant="outline" size="sm" onClick={() => png(backRef.current, `card-back-${previewCode}`)}><Download className="mr-1 h-4 w-4" /> Back PNG</Button>
          <Button size="sm" onClick={() => printNow(chosen)}><Printer className="mr-1 h-4 w-4" /> Print {chosen.length || ""} ticked (A4, 10 per sheet)</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Print fronts and backs double-sided (flip on the long edge); backs are laid out in mirror order so they line up. Cut to 90 × 55 mm.
          The signature and design are saved on this device only.
        </p>
      </CollapsibleCard>

      <CollapsibleCard title={<>Cards ({cards.length})</>} size="lg">
        <div className="mb-2 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setAll(true)}>Tick all</Button>
          <Button size="sm" variant="outline" onClick={() => setAll(false)}>Clear</Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead /><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Label</TableHead><TableHead>Claimed</TableHead><TableHead>Claim by</TableHead><TableHead>On</TableHead></TableRow></TableHeader>
          <TableBody>
            {cards.map((c) => (
              <TableRow key={c.id}>
                <TableCell><input type="checkbox" checked={selected.has(c.id)} onChange={() => { const n = new Set(selected); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); setSelected(n); }} aria-label={`Select ${c.code}`} /></TableCell>
                <TableCell className="font-mono">{c.code}</TableCell>
                <TableCell><Badge variant="outline">{c.kind}</Badge></TableCell>
                <TableCell>{c.label ?? "—"}</TableCell>
                <TableCell>{c.claim_count}{c.max_claims ? ` / ${c.max_claims}` : ""}</TableCell>
                <TableCell>{fmtDate(c.expires_at) ?? "—"}</TableCell>
                <TableCell><Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleCard>

      {/* Print sheets: fronts first, then backs with the columns mirrored for double-sided printing. */}
      <div className="promo-print-root">
        {sheets.map((page, i) => (
          <div className="promo-sheet" key={`f${i}`}>
            {page.map((c) => <PromoCardFront key={c.id} code={c.code} style={style} expires={fmtDate(c.expires_at)} />)}
          </div>
        ))}
        {sheets.map((page, i) => (
          <div className="promo-sheet" key={`b${i}`}>
            {mirrorRows(page).map((c) => c && <PromoCardBack key={c.id} code={c.code} style={style} expires={fmtDate(c.expires_at)} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Swaps the two cards in each row so a back lines up behind its front when printed double-sided. */
function mirrorRows<T>(page: T[]): (T | null)[] {
  const out: (T | null)[] = [];
  for (let i = 0; i < page.length; i += 2) out.push(page[i + 1] ?? null, page[i]);
  return out;
}
