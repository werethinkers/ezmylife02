/* /business/print/:billId: the bill alone on the page, ready to print or save as PDF. ?size=80 for a bill printer. */

import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Loader2, Printer } from "lucide-react";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { BusinessProvider, useBusiness } from "@/business/useBusiness";
import { paidOnBill } from "@/business/engine";
import type { Rec } from "@/business/types";
import { BillView } from "./BillView";

export default function BusinessPrintPage() {
  return (
    <BusinessProvider>
      <PageSeo title="Print bill | EZYOURLIFE" description="Print a bill from My Business." path="/business/print" noindex />
      <PrintBill />
    </BusinessProvider>
  );
}

function PrintBill() {
  const { billId } = useParams();
  const [params] = useSearchParams();
  const narrow = params.get("size") === "80" || params.get("size") === "58";
  const { ready, db } = useBusiness();
  const bill = db?.recs.find((r) => r.id === billId && r.kind === "bill") as Rec<"bill"> | undefined;
  useEffect(() => {
    if (bill) document.title = `${db?.ws.name ?? ""} bill ${bill.data.number}`;
  }, [bill, db?.ws.name]);
  if (!ready) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!db || !bill) return <div className="p-8 text-center"><p className="font-bold">Bill not found.</p><Link to="/business/app" className="underline">Back to My Business</Link></div>;
  return (
    <div className="min-h-screen bg-muted print:bg-white">
      <style>{`@media print { @page { size: ${narrow ? "80mm auto" : "A4"}; margin: ${narrow ? "2mm" : "12mm"}; } .no-print { display: none !important; } body * { visibility: hidden; } .bill-doc, .bill-doc * { visibility: visible; } .bill-doc { position: absolute; left: 0; top: 0; } }`}</style>
      <div className="no-print flex flex-wrap items-center justify-center gap-2 p-4">
        <Button onClick={() => window.print()}><Printer /> Print or save as PDF</Button>
        <Button variant="outline" asChild><Link to={narrow ? `/business/print/${bill.id}` : `/business/print/${bill.id}?size=80`}>{narrow ? "A4 page" : "Bill printer (80 mm)"}</Link></Button>
        <Button variant="ghost" asChild><Link to="/business/app?s=bills">Back</Link></Button>
      </div>
      <div className="pb-10 print:pb-0"><div className={narrow ? "mx-auto w-fit shadow-block print:shadow-none" : "mx-auto max-w-[720px] shadow-block print:shadow-none"}><BillView ws={db.ws} bill={bill} paid={paidOnBill(db.recs, bill.id)} narrow={narrow} /></div></div>
    </div>
  );
}
