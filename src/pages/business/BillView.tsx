/* The bill as the customer sees it, on screen and on paper (A4 or a 58/80 mm bill printer). */

import { QRCodeSVG } from "qrcode.react";
import type { Rec, Settings, Workspace } from "@/business/types";
import { inr, num } from "@/business/format";
import { upiLink } from "@/business/whatsapp";
import { cn } from "@/lib/utils";

export function BillView({ ws, bill, paid, narrow }: { ws: Workspace; bill: Rec<"bill">; paid: number; narrow?: boolean }) {
  const s: Settings = ws.settings;
  const b = bill.data;
  const balance = Math.max(0, b.total - paid);
  const taxed = b.gst_mode === "regular";
  const title = b.gst_mode === "regular" ? "Tax invoice" : b.gst_mode === "composition" ? "Bill of supply" : "Bill";
  const upi = balance > 0 ? upiLink(s, balance, `Bill ${b.number}`) : null;
  return (
    <article className={cn("bill-doc mx-auto bg-white text-black", narrow ? "w-[300px] p-3 text-[12px]" : "w-full max-w-[720px] p-6 text-sm")}>
      <header className={cn("flex gap-4", narrow ? "flex-col items-center text-center" : "items-start justify-between")}>
        <div>
          <h1 className={cn("font-bold", narrow ? "text-base" : "text-xl")}>{ws.name}</h1>
          {s.address && <p>{s.address}</p>}
          <p>{[s.city, s.state].filter(Boolean).join(", ")}</p>
          {s.phone && <p>Phone {s.phone}</p>}
          {s.gstin && <p>GSTIN {s.gstin}</p>}
          {s.fssai && <p>FSSAI {s.fssai}</p>}
        </div>
        <div className={narrow ? "" : "text-right"}>
          <p className="font-bold uppercase tracking-wide">{title}</p>
          <p>No. {b.number}</p>
          <p>Date {new Date(`${b.date}T00:00:00`).toLocaleDateString("en-IN")}</p>
          {b.cancelled && <p className="font-bold text-red-700">CANCELLED</p>}
        </div>
      </header>
      <section className="mt-3 border-t border-black/30 pt-2">
        <p>Bill to: <b>{b.customer_name}</b>{b.phone ? `, ${b.phone}` : ""}</p>
        {b.customer_gstin && <p>Their GSTIN {b.customer_gstin}</p>}
        {taxed && <p>Place of supply: {b.inter_state ? "other state (IGST)" : s.state}</p>}
      </section>
      <table className="mt-3 w-full border-collapse">
        <thead>
          <tr className="border-y border-black/40 text-left">
            <th className="py-1 pr-2">Item</th>
            <th className="py-1 pr-2 text-right">Qty</th>
            {!narrow && <th className="py-1 pr-2 text-right">Rate</th>}
            {taxed && !narrow && <th className="py-1 pr-2 text-right">GST</th>}
            <th className="py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {b.lines.map((l, i) => (
            <tr key={i} className="border-b border-black/10 align-top">
              <td className="py-1 pr-2">{l.name}{narrow && <span className="block text-[11px]">@ {inr(l.price)}{taxed ? ` · GST ${l.gst_rate}%` : ""}</span>}</td>
              <td className="py-1 pr-2 text-right tabular-nums">{num(l.qty)} {l.unit ?? ""}</td>
              {!narrow && <td className="py-1 pr-2 text-right tabular-nums">{inr(l.price)}</td>}
              {taxed && !narrow && <td className="py-1 pr-2 text-right">{l.gst_rate}%</td>}
              <td className="py-1 text-right tabular-nums">{inr(l.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className={cn("mt-3 ml-auto space-y-0.5 tabular-nums", narrow ? "w-full" : "w-64")}>
        {taxed && <Row k="Taxable value" v={inr(b.taxable)} />}
        {b.cgst > 0 && <Row k="CGST" v={inr(b.cgst)} />}
        {b.sgst > 0 && <Row k="SGST" v={inr(b.sgst)} />}
        {b.igst > 0 && <Row k="IGST" v={inr(b.igst)} />}
        {b.discount > 0 && <Row k="Discount" v={`−${inr(b.discount)}`} />}
        {b.round_off !== 0 && <Row k="Round off" v={inr(b.round_off)} />}
        <Row k="Total" v={inr(b.total)} bold />
        {paid > 0 && <Row k="Paid" v={inr(paid)} />}
        {balance > 0 && !b.cancelled && <Row k="To pay" v={inr(balance)} bold />}
      </section>
      {b.gst_mode === "composition" && <p className="mt-3 text-[11px]">Composition taxable person, not eligible to collect tax on supplies.</p>}
      {b.notes && <p className="mt-2">Note: {b.notes}</p>}
      {upi && !b.cancelled && (
        <section className={cn("mt-4 flex items-center gap-3", narrow && "flex-col")}>
          <QRCodeSVG value={upi} size={narrow ? 120 : 104} />
          <p>Scan with any UPI app to pay {inr(balance)}<br />UPI ID: {s.upi_id}</p>
        </section>
      )}
      <p className="mt-4 text-center text-[11px]">Thank you! Made with EZYOURLIFE</p>
    </article>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <p className={cn("flex justify-between gap-4", bold && "border-t border-black/40 pt-0.5 font-bold")}><span>{k}</span><span>{v}</span></p>;
}
