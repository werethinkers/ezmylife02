import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Printer, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "../shell/AppShell";
import { RowsEditor, inr, num } from "../shell/Fields";
import { OutputPanel } from "../shell/OutputPanel";
import { WorkspaceCard } from "../shell/WorkspaceCard";
import { useAppStore, uid } from "../lib/store";
import { useWorkspace } from "../lib/workspace";
import { takeHandoff } from "../lib/handoff";
import { useRun } from "../lib/api";
import { toCsv, downloadText } from "../lib/files";
import { docFromPurchaseOrder } from "../output/buildDoc";
import { SaveBar } from "../output/SaveBar";
import { makePdf } from "../output/render";
import { saveFile } from "../output/save";
import { APPS } from "../registry";

interface PO {
  id: string;
  number: string;
  date: string;
  supplier: string;
  supplierGstin: string;
  supplierAddress: string;
  deliveryDate: string;
  deliverTo: string;
  terms: string;
  notes: string;
  items: Record<string, string>[];
}

const COLS = [
  { key: "item", label: "Item / description" },
  { key: "hsn", label: "HSN" },
  { key: "qty", label: "Qty", type: "number" as const },
  { key: "unit", label: "Unit" },
  { key: "rate", label: "Rate ₹", type: "money" as const },
  { key: "gst", label: "GST %", type: "select" as const, options: ["0", "5", "12", "18", "28"] },
];

const today = () => new Date().toISOString().slice(0, 10);
const blank = (n: number): PO => ({
  id: uid(),
  number: `PO-${new Date().getFullYear()}-${String(n + 1).padStart(3, "0")}`,
  date: today(),
  supplier: "",
  supplierGstin: "",
  supplierAddress: "",
  deliveryDate: "",
  deliverTo: "",
  terms: "Payment within 30 days of delivery",
  notes: "",
  items: [{ item: "", hsn: "", qty: "", unit: "pcs", rate: "", gst: "18" }],
});

function totals(po: PO) {
  let sub = 0, tax = 0;
  for (const r of po.items) {
    const line = num(r.qty) * num(r.rate);
    sub += line;
    tax += (line * num(r.gst)) / 100;
  }
  return { sub, tax, total: sub + tax };
}

export default function PurchaseOrder({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const ws = useWorkspace();
  const store = useAppStore<{ orders: PO[]; savedAt?: number }>(toolId, { orders: [] });
  const orders = store.data.orders ?? [];
  const [po, setPo] = useState<PO>(() => blank(orders.length));
  const [email, setEmail] = useState("");
  const { busy, run } = useRun(toolId);
  const t = useMemo(() => totals(po), [po]);

  useEffect(() => {
    setPo((p) => (p.deliverTo ? p : { ...p, deliverTo: ws.profile.address ?? "" }));
  }, [ws.profile.address]);

  useEffect(() => {
    const h = takeHandoff(toolId);
    if (h) {
      setPo((p) => ({ ...p, notes: h.text.slice(0, 3000) }));
      toast.success(`Added the reorder list from ${h.fromName} to notes — copy the items into the table.`);
    }
  }, [toolId]);

  const set = (k: keyof PO, v: string) => setPo((p) => ({ ...p, [k]: v }));
  const filled = po.items.filter((r) => r.item.trim() && num(r.qty));

  const saveOrder = () => {
    if (!po.supplier.trim() || !filled.length) return toast.error("Add the supplier and at least one item.");
    store.update((d) => ({ orders: [po, ...(d.orders ?? []).filter((o) => o.id !== po.id)].slice(0, 50) }));
    toast.success(`${po.number} saved`);
  };

  const poDoc = useMemo(
    () =>
      filled.length
        ? docFromPurchaseOrder({
            ...po,
            items: filled.map((r) => ({ item: r.item, hsn: r.hsn ?? "", qty: num(r.qty), unit: r.unit ?? "", rate: num(r.rate), gst: num(r.gst) })),
            profile: ws.profile,
          })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(po), ws.profile],
  );
  const [making, setMaking] = useState(false);
  const print = async () => {
    if (!poDoc) return toast.error("Add at least one item.");
    setMaking(true);
    try {
      const { blob } = await makePdf(poDoc);
      await saveFile(blob, `${poDoc.fileName}.pdf`, `Purchase order ${po.number}`);
    } catch {
      toast.error("The PDF could not be made on this device.");
    } finally {
      setMaking(false);
    }
  };

  const draftEmail = async () => {
    if (!po.supplier.trim() || !filled.length) return toast.error("Add the supplier and at least one item.");
    const out = await run<string>({
      inputs: {
        "Buyer": `${ws.profile.businessName ?? ""} ${ws.profile.phone ?? ""}`.trim(),
        "Supplier": po.supplier,
        "PO number": po.number,
        "PO date": po.date,
        "Items": filled.map((r) => `${r.qty} ${r.unit} ${r.item} @ ${inr(num(r.rate))} + ${r.gst}% GST`).join("; "),
        "Total": inr(t.total),
        "Delivery date": po.deliveryDate,
        "Delivery address": po.deliverTo,
        "Payment terms": po.terms,
        "Sender": ws.profile.ownerName ?? "",
      },
    });
    if (out) setEmail(out);
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState} steps={["Add supplier & items", "Print or save the PO", "Send with the AI email"]}>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-2xl border-2 border-ink bg-card p-4 sm:grid-cols-2">
            {([
              ["number", "PO number"], ["date", "PO date", "date"], ["supplier", "Supplier name *"], ["supplierGstin", "Supplier GSTIN"],
              ["supplierAddress", "Supplier address"], ["deliveryDate", "Deliver by", "date"], ["deliverTo", "Deliver to"], ["terms", "Payment terms"],
            ] as [keyof PO, string, string?][]).map(([k, label, type]) => (
              <div key={k} className="space-y-1">
                <Label htmlFor={`po-${k}`} className="text-xs">{label}</Label>
                <Input id={`po-${k}`} type={type ?? "text"} value={po[k] as string} onChange={(e) => set(k, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border-2 border-ink bg-card p-4">
            <p className="mb-2 text-sm font-semibold">Items</p>
            <RowsEditor columns={COLS} rows={po.items} onChange={(items) => setPo((p) => ({ ...p, items }))} />
            <div className="mt-3 flex flex-wrap justify-end gap-x-6 gap-y-1 text-sm tabular-nums">
              <span>Subtotal <strong>{inr(t.sub)}</strong></span>
              <span>GST <strong>{inr(t.tax)}</strong></span>
              <span className="text-base">Total <strong>{inr(t.total)}</strong></span>
            </div>
            <div className="mt-3 space-y-1">
              <Label htmlFor="po-notes" className="text-xs">Notes</Label>
              <Textarea id="po-notes" rows={2} value={po.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => void print()} disabled={making} variant="outline" className="gap-1.5">{making ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} Download PO PDF</Button>
              <Button onClick={saveOrder} variant="outline" className="gap-1.5"><Save className="h-4 w-4" /> Save PO</Button>
              <Button onClick={draftEmail} disabled={busy} className="gap-1.5">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Write email to supplier
              </Button>
              <Button variant="ghost" onClick={() => { setPo(blank(orders.length)); setEmail(""); }}>New PO</Button>
            </div>
          </div>
          <SaveBar toolId={toolId} appName="Purchase Order" doc={poDoc} />
          {email && <OutputPanel toolId={toolId} text={email} title="Email to supplier" fileName={`${po.number}-email`} editable onEdit={setEmail} />}
        </div>
        <aside className="space-y-4">
          <WorkspaceCard />
          <div className="rounded-2xl border-2 border-ink bg-card p-3">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saved orders</p>
            {orders.length ? (
              <ul className="mt-2 space-y-1">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center gap-1">
                    <button type="button" className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted" onClick={() => setPo(o)}>
                      <span className="block truncate font-medium">{o.number} · {o.supplier}</span>
                      <span className="text-[11px] text-muted-foreground">{o.date} · {inr(totals(o).total)}</span>
                    </button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Delete" onClick={() => store.update((d) => ({ orders: (d.orders ?? []).filter((x) => x.id !== o.id) }))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-1 py-2 text-xs text-muted-foreground">No saved orders yet.</p>
            )}
            {orders.length > 0 && (
              <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => downloadText(toCsv(orders.map((o) => ({ ...o, total: totals(o).total.toFixed(2), items: o.items.length })), [{ key: "number", label: "PO" }, { key: "date", label: "Date" }, { key: "supplier", label: "Supplier" }, { key: "items", label: "Lines" }, { key: "total", label: "Total" }]), "purchase-orders.csv", "text/csv")}>
                Export list (CSV)
              </Button>
            )}
          </div>
          <p className="px-1 text-xs text-muted-foreground">One charge covers 30 minutes of making POs; the AI email is one extra run.</p>
        </aside>
      </div>
    </AppShell>
  );
}
