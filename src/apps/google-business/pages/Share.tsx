import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gb } from "../lib/business";
import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { AlertTriangle, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "../components/CopyButton";
import { Panel, useBusinessData } from "../components/dash";
import { reviewPageUrl, type Business, type Location } from "../lib/business";


export default function Share() {
  const { id } = useParams() as { id: string; sid: string };
  const { biz } = useBusinessData(id);
  if (!biz) return null;
  const active = biz.locations.filter((l) => l.status === "active");
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Review links & QR</h2>
        <p className="text-sm text-muted-foreground">
          One link per location. Customers rate, tap what they bought, write a line, and post on Google from their own account.
        </p>
      </div>
      {active.map((l) => <LocationShare key={l.id} biz={biz} loc={l} id={id} />)}
    </div>
  );
}

function LocationShare({ biz, loc, id }: { biz: Business; loc: Location; id: string }) {
  const url = reviewPageUrl(biz, loc);
  const qrRef = useRef<HTMLDivElement>(null);
  function download() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${biz.name}-${loc.name}-review-qr.png`.replace(/[^\w.-]+/g, "-").toLowerCase();
    a.click();
  }
  return (
    <Panel title={loc.name} hint={[loc.code, loc.area, loc.city].filter(Boolean).join(" · ")}>
      <div className="grid gap-4 md:grid-cols-[1fr_200px]">
        <div className="space-y-3">
          {!loc.reviewLink && (
            <div className="flex gap-2 rounded-lg bg-amber-400/15 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                No Google review link for this location — customers can copy their review but can't jump to Google.{" "}
                <Link to={gb(`/b/${id}/locations`)} className="font-medium underline">Add it</Link>
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <Input readOnly value={url} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <CopyButton text={url} />
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <a href={url} target="_blank" rel="noreferrer" aria-label="Open"><ExternalLink className="h-4 w-4" /></a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            After posting on Google, customers can send their feedback to you on WhatsApp
            {loc.managerPhone || biz.phone ? ` (${loc.managerPhone || biz.phone})` : " — add a phone number to enable this"}. Paste those
            messages under Submissions → Add from WhatsApp.
          </p>
        </div>
        <div className="text-center">
          <div ref={qrRef} className="inline-block rounded-lg bg-white p-2">
            <QRCodeCanvas value={url} size={180} level="M" marginSize={1} />
          </div>
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={download}>
            <Download className="mr-1 h-4 w-4" /> Download QR
          </Button>
        </div>
      </div>
    </Panel>
  );
}
