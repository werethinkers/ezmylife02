import { useMemo, useState } from "react";
import { Check, ChevronDown, Copy, FileText, FileType2, Loader2, MessageCircle, Plus, RotateCcw, ShieldCheck, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useModernTheme } from "@/components/modern/theme";
import { cn } from "@/lib/utils";
import { usePrefill, useWriteBack } from "@/apps/lib/context";
import { ContextBanner } from "@/apps/shell/ContextBanner";
import { NextApps } from "@/apps/shell/NextApps";
import { useWorkspace } from "@/apps/lib/workspace";
import { docFromInvoice } from "@/apps/output/buildDoc";
import { saveFile } from "@/apps/output/save";
import { downloadWord } from "@/apps/lib/files";
import { blocksToMarkdown } from "@/apps/output/fromElement";
import { usePreparedPdf } from "@/apps/output/usePreparedPdf";
import { AmbientGlow, CONTROL, LABEL, UNBOUNDED } from "@/apps/flagship/studioUi";

/*
 * Invoice Generator's own refined screen for /tool/tool-1 (ambient glow hero, soft form card,
 * dark gradient totals/export footer) instead of the old plain shadcn card — still used, unchanged,
 * by the separate "invoice-generator"/"ai-invoice-generator" catalogue ids (InvoiceGenerator.tsx).
 * Stays a plain native tool (no credit gate, no engine registration) so it keeps being free.
 * All the invoice maths and the document it builds (docFromInvoice) are unchanged — only this
 * file's layout and styling, and the "See an example" content below, are new.
 */

const TOOL_ID = "tool-1";

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  rate: number;
  gstRate: number;
}

const money = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const plain = (md: string) =>
  md
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^\|.*\|$/gm, (l) => (/^\|\s*-/.test(l) ? "" : l.replace(/^\|\s*|\s*\|$/g, "").replace(/\s*\|\s*/g, " · ")))
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const PILL = "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20";
const MICRO_LABEL = "text-xs font-semibold uppercase tracking-wide text-black/55 dark:text-white/50";

const EXAMPLE_INPUT = [
  "Your Business: Bright Web Studio, GSTIN 27AABCU9603R1ZV",
  "Client: Meridian Textiles Pvt Ltd",
  "Item 1: Website Design — ₹25,000, 18% GST",
  "Item 2: 1 year hosting — ₹3,000, 18% GST",
].join("\n");

const EXAMPLE_OUTPUT = [
  `**Taxable value:** ${money(28000)}`,
  `**GST (18%):** ${money(5040)}`,
  `**Invoice total:** ${money(33040)}`,
].join("\n");

export const InvoiceGeneratorRefined = () => {
  const { dark } = useModernTheme();
  const { profile } = useWorkspace();
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyGST, setCompanyGST] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientGST, setClientGST] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([{ id: 1, description: "", quantity: 1, rate: 0, gstRate: 18 }]);
  const [notes, setNotes] = useState("");
  const [showExample, setShowExample] = useState(false);
  const [copied, setCopied] = useState(false);

  // Workspace: your business details and the current client fill in automatically, and the
  // client + invoice totals flow on to Expense Tracker, Tax Estimator, Profit Calculator and
  // the Contract Drafter.
  usePrefill((ctx, p) => {
    setCompanyName((v) => v || p.businessName || "");
    setCompanyAddress((v) => v || [p.address, p.city].filter(Boolean).join(", "));
    setCompanyGST((v) => v || p.gstin || "");
    setClientName((v) => v || ctx.client?.name || "");
    setClientAddress((v) => v || ctx.client?.address || "");
    setClientGST((v) => v || ctx.client?.gstin || "");
    if (ctx.engagement?.service && ctx.engagement.fee)
      setItems((it) => (it.length === 1 && !it[0].description ? [{ ...it[0], description: ctx.engagement!.service!, rate: parseFloat(ctx.engagement!.fee!) || 0 }] : it));
  });
  useWriteBack({ clientName, clientAddress, clientGST, invoiceNumber, items }, (v) => {
    const subtotal = v.items.reduce((s, i) => s + i.quantity * i.rate, 0);
    const gst = v.items.reduce((s, i) => s + (i.quantity * i.rate * i.gstRate) / 100, 0);
    return {
      ...(v.clientName ? { client: { name: v.clientName, address: v.clientAddress, gstin: v.clientGST } } : {}),
      ...(subtotal > 0
        ? { lastInvoice: { number: v.invoiceNumber, subtotal, gst, total: subtotal + gst, items: v.items.filter((i) => i.description).map((i) => ({ description: i.description, quantity: i.quantity, rate: i.rate })) } }
        : {}),
    };
  });

  const addItem = () => setItems((it) => [...it, { id: Date.now(), description: "", quantity: 1, rate: 0, gstRate: 18 }]);
  const removeItem = (id: number) => setItems((it) => (it.length > 1 ? it.filter((item) => item.id !== id) : it));
  const updateItem = (id: number, field: keyof InvoiceItem, value: string | number) =>
    setItems((it) => it.map((item) => (item.id === id ? { ...item, [field]: value } : item)));

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const totalGst = items.reduce((sum, item) => sum + (item.quantity * item.rate * item.gstRate) / 100, 0);
  const total = subtotal + totalGst;

  const clear = () => {
    setCompanyName("");
    setCompanyAddress("");
    setCompanyGST("");
    setClientName("");
    setClientAddress("");
    setClientGST("");
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setDueDate("");
    setItems([{ id: Date.now(), description: "", quantity: 1, rate: 0, gstRate: 18 }]);
    setNotes("");
  };

  const fillExample = () => {
    setCompanyName("Bright Web Studio");
    setCompanyAddress("MG Road, Bengaluru");
    setCompanyGST("29AABCU9603R1ZV");
    setClientName("Meridian Textiles Pvt Ltd");
    setClientAddress("Andheri East, Mumbai");
    setClientGST("27AABCU9603R1ZV");
    setItems([
      { id: 1, description: "Website design", quantity: 1, rate: 25000, gstRate: 18 },
      { id: 2, description: "1 year hosting", quantity: 1, rate: 3000, gstRate: 18 },
    ]);
  };

  const ready = !!companyName && !!clientName && items.every((item) => item.description && item.rate > 0);
  const invoiceDoc = useMemo(
    () => (ready ? docFromInvoice({ companyName, companyAddress, companyGST, clientName, clientAddress, clientGST, invoiceNumber, invoiceDate, dueDate, items, notes, profile }) : null),
    [ready, companyName, companyAddress, companyGST, clientName, clientAddress, clientGST, invoiceNumber, invoiceDate, dueDate, items, notes, profile],
  );
  const preparedPdf = usePreparedPdf(invoiceDoc, { wait: 1200 });
  const markdown = invoiceDoc ? blocksToMarkdown(invoiceDoc.title, invoiceDoc.blocks) : "";

  const needFirst = () => toast.error("Please fill in your business name, the customer and every item's description and rate");

  const savePdf = () => {
    if (!invoiceDoc) return needFirst();
    if (preparedPdf.state === "ready") void saveFile(preparedPdf.pdf.blob, `${invoiceDoc.fileName}.pdf`, `Invoice ${invoiceNumber}`);
    else if (preparedPdf.state === "error") toast.error("The PDF could not be made on this device.");
    else toast.info("Your PDF is nearly ready — try again in a moment.");
  };
  const saveWord = () => {
    if (!invoiceDoc) return needFirst();
    downloadWord(markdown, invoiceDoc.fileName, `Invoice ${invoiceNumber}`);
  };
  const whatsapp = () => {
    if (!invoiceDoc) return needFirst();
    window.open(`https://wa.me/?text=${encodeURIComponent(plain(markdown).slice(0, 3500))}`, "_blank", "noopener,noreferrer");
  };
  const copy = async () => {
    if (!invoiceDoc) return needFirst();
    try {
      await navigator.clipboard.writeText(plain(markdown));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy was blocked by the browser.");
    }
  };

  return (
    <div className={cn("ez-modern", dark && "dark")}>
      <div className="relative overflow-hidden bg-[#FAF7F2] dark:bg-[#0D0D0F]">
        <AmbientGlow />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Hero */}
          <header>
            <span className="inline-flex items-center rounded-full border border-black/15 bg-[#C8E967] px-3 py-1 text-xs font-bold uppercase text-[#111111]">
              Finance tool · GST ready
            </span>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-[#111111] dark:text-white sm:text-3xl" style={UNBOUNDED}>
              Invoice Generator
            </h1>
            <p className="mt-1.5 max-w-2xl text-[16px] text-black/60 dark:text-white/60">Create professional GST-compliant invoices</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-black/50 dark:text-white/50">
              <span>Saved on this device</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Free to use
              </span>
            </div>
          </header>

          <div className="mt-6">
            <ContextBanner show={["client"]} tone="soft" />
          </div>

          {/* Workspace */}
          <div className="rounded-3xl border border-black/[0.08] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#16161A] sm:p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className={MICRO_LABEL}>Your business</h3>
                <div>
                  <label className={LABEL}>Company name *</label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company name" className={cn("mt-1.5 h-10 w-full px-3.5 text-sm outline-none", CONTROL)} />
                </div>
                <div>
                  <label className={LABEL}>Address</label>
                  <textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Company address" rows={2} className={cn("mt-1.5 w-full px-3.5 py-2.5 text-sm outline-none", CONTROL)} />
                </div>
                <div>
                  <label className={LABEL}>GSTIN</label>
                  <input value={companyGST} onChange={(e) => setCompanyGST(e.target.value)} placeholder="22AAAAA0000A1Z5" className={cn("mt-1.5 h-10 w-full px-3.5 text-sm outline-none", CONTROL)} />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className={MICRO_LABEL}>Client details</h3>
                <div>
                  <label className={LABEL}>Client name *</label>
                  <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client/company name" className={cn("mt-1.5 h-10 w-full px-3.5 text-sm outline-none", CONTROL)} />
                </div>
                <div>
                  <label className={LABEL}>Address</label>
                  <textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Client address" rows={2} className={cn("mt-1.5 w-full px-3.5 py-2.5 text-sm outline-none", CONTROL)} />
                </div>
                <div>
                  <label className={LABEL}>Client GSTIN</label>
                  <input value={clientGST} onChange={(e) => setClientGST(e.target.value)} placeholder="22AAAAA0000A1Z5" className={cn("mt-1.5 h-10 w-full px-3.5 text-sm outline-none", CONTROL)} />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className={MICRO_LABEL}>Invoice details</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className={LABEL}>Invoice number</label>
                  <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className={cn("mt-1.5 h-10 w-full px-3.5 text-sm outline-none", CONTROL)} />
                </div>
                <div>
                  <label className={LABEL}>Invoice date</label>
                  <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={cn("mt-1.5 h-10 w-full px-3.5 text-sm outline-none", CONTROL)} />
                </div>
                <div>
                  <label className={LABEL}>Due date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={cn("mt-1.5 h-10 w-full px-3.5 text-sm outline-none", CONTROL)} />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className={MICRO_LABEL}>Items</h3>
                <button type="button" onClick={addItem} className="inline-flex items-center gap-1.5 rounded-full bg-[#111111] px-4 py-1.5 text-xs font-medium text-white transition hover:bg-[#27272A] dark:bg-white dark:text-[#111111] dark:hover:bg-white/85">
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 rounded-2xl border border-black/[0.06] bg-[#FAF7F2] p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="col-span-12 sm:col-span-4">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        placeholder="Description *"
                        className={cn("h-9 w-full px-2.5 text-sm outline-none", CONTROL)}
                        aria-label="Description"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value, 10) || 1)}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Qty"
                        className={cn("h-9 w-full px-2.5 text-sm outline-none", CONTROL)}
                        aria-label="Quantity"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Rate (₹)"
                        className={cn("h-9 w-full px-2.5 text-sm outline-none", CONTROL)}
                        aria-label="Rate"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min={0}
                        max={28}
                        value={item.gstRate}
                        onChange={(e) => updateItem(item.id, "gstRate", parseInt(e.target.value, 10) || 0)}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="GST %"
                        className={cn("h-9 w-full px-2.5 text-sm outline-none", CONTROL)}
                        aria-label="GST percent"
                      />
                    </div>
                    <div className="col-span-10 flex items-center justify-end text-sm font-semibold tabular-nums text-[#111111] dark:text-white sm:col-span-1">
                      {money(item.quantity * item.rate)}
                    </div>
                    <div className="col-span-2 flex items-center justify-end sm:col-span-1">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        aria-label="Remove item"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-black/40 transition hover:bg-black/5 hover:text-destructive disabled:opacity-40 dark:text-white/40 dark:hover:bg-white/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className={LABEL}>Notes / terms</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, bank details, or any additional notes…"
                rows={3}
                className={cn("mt-1.5 w-full px-3.5 py-2.5 text-sm outline-none", CONTROL)}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-5 dark:border-white/10">
              <button type="button" onClick={fillExample} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[#111111] transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10">
                <Wand2 className="h-3.5 w-3.5" /> Fill in an example
              </button>
              <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[#111111] transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10">
                <RotateCcw className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
          </div>

          {/* Dark totals & export footer */}
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#18181B] via-[#111111] to-[#1F1523] p-5 text-white sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs text-white/50">Subtotal</p>
                  <p className="text-base font-bold tabular-nums">{money(subtotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">GST</p>
                  <p className="text-base font-bold tabular-nums">{money(totalGst)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Total</p>
                  <p className="text-2xl font-extrabold tabular-nums text-[#FACC15]" style={UNBOUNDED}>
                    {money(total)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={PILL} onClick={savePdf}>
                  {preparedPdf.state === "making" && !preparedPdf.previous ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} PDF
                </button>
                <button type="button" className={PILL} onClick={saveWord}>
                  <FileType2 className="h-3.5 w-3.5" /> Word
                </button>
                <button type="button" className={PILL} onClick={whatsapp}>
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </button>
                <button type="button" className={PILL} onClick={() => void copy()}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy text"}
                </button>
                <button
                  type="button"
                  onClick={savePdf}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#F472D0] px-6 py-3 text-sm font-semibold text-[#111111] transition hover:brightness-95"
                >
                  {preparedPdf.state === "making" && !preparedPdf.previous ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Download invoice PDF
                </button>
              </div>
            </div>
          </div>

          {/* See an example */}
          <section className="mt-6 overflow-hidden rounded-3xl border border-black/[0.08] bg-white dark:border-white/10 dark:bg-[#16161A]">
            <button type="button" onClick={() => setShowExample((v) => !v)} className="flex w-full items-center justify-between gap-3 p-5" aria-expanded={showExample}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8E967]">
                  <Sparkles className="h-4 w-4 text-[#111111]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#111111] dark:text-white">See an example</p>
                  <p className="text-xs text-black/50 dark:text-white/50">{showExample ? "Hide example" : "A GST invoice worked out for you"}</p>
                </div>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-black/40 transition-transform dark:text-white/40", showExample && "rotate-180")} />
            </button>
            {showExample && (
              <div className="grid gap-4 p-5 pt-0 md:grid-cols-2">
                <div className="rounded-2xl border border-black/[0.08] bg-[#FAF7F2] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-black/45 dark:text-white/45">If you enter</p>
                  <div className="mt-2 whitespace-pre-wrap font-mono text-sm leading-relaxed text-[#111111]/90 dark:text-white/85">{EXAMPLE_INPUT}</div>
                </div>
                <div className="rounded-2xl border border-black/15 bg-[#C8E967]/15 p-4 dark:border-white/15">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-black/55 dark:text-white/60">You'll get</p>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#111111]/90 dark:text-white/85">{EXAMPLE_OUTPUT}</div>
                </div>
              </div>
            )}
            {showExample && <p className="px-5 pb-5 text-center text-[11px] text-black/45 dark:text-white/40">Example only — your actual invoice is worked out from what you enter above.</p>}
          </section>

          <NextApps toolId={TOOL_ID} variant="refined" pinned={["auto-text-extractor", "tool-12", "tool-2", "tool-19"]} />
        </div>
      </div>
    </div>
  );
};

export default InvoiceGeneratorRefined;
