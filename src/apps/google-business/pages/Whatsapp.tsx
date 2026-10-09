import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gb } from "../lib/business";
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "../components/CopyButton";
import { Panel, fmtDate, useBusinessData } from "../components/dash";
import { logRequest, reviewPageUrl } from "../lib/business";
import { reviewRequestMessage } from "../lib/generate";
import { cn } from "@/lib/utils";


const KINDS = [
  { id: "request", label: "After a visit", hint: "Ask for feedback right after billing" },
  { id: "reminder", label: "Google reminder", hint: "Customer gave feedback but didn't open Google" },
  { id: "staff", label: "To location staff", hint: "Remind your team to share the link" },
] as const;

export default function WhatsApp() {
  const { id } = useParams() as { id: string; sid: string };
  const { biz, reqs } = useBusinessData(id);
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("request");
  const [locId, setLocId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (!biz) return null;
  const loc = biz.locations.find((l) => l.id === locId) ?? biz.locations[0];
  const link = reviewPageUrl(biz, loc);
  const first = name.trim().split(" ")[0];
  const msg =
    kind === "request"
      ? reviewRequestMessage(biz.name, link, name)
      : kind === "reminder"
        ? `Hi ${first || "there"}, thank you for your feedback for ${biz.name}! Could you also post it on Google? It takes 30 seconds and really helps us: ${loc.reviewLink || link}`
        : `Hi ${first || "team"}, please share our review link with every customer after billing today. Link: ${link} — or show them the QR code at the counter. Thank you!`;

  const digits = (kind === "staff" && !phone ? loc.staffPhone || loc.managerPhone : phone).replace(/\D/g, "");
  const wa = `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}?text=${encodeURIComponent(msg)}`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">WhatsApp messages</h2>
        <p className="text-sm text-muted-foreground">Ready-to-send messages. Opens WhatsApp with the text filled in — you press send.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel>
          <div className="grid gap-2 sm:grid-cols-3">
            {KINDS.map((k) => (
              <button
                key={k.id}
                onClick={() => setKind(k.id)}
                className={cn("rounded-lg border p-3 text-left text-sm transition", kind === k.id ? "border-primary bg-primary/5" : "hover:border-primary/40")}
              >
                <div className="font-medium">{k.label}</div>
                <div className="text-xs text-muted-foreground">{k.hint}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {biz.locations.length > 1 && (
              <select className="h-9 rounded-md border bg-background px-2 text-sm" value={loc.id} onChange={(e) => setLocId(e.target.value)}>
                {biz.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            )}
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "staff" ? "Staff name" : "Customer name"} />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={kind === "staff" ? loc.staffPhone || "Staff mobile" : "Mobile number"} inputMode="tel" />
          </div>
          <Textarea readOnly value={msg} rows={4} className="mt-3 text-sm" />
          <div className="mt-3 flex gap-2">
            <Button
              asChild
              className={cn(digits.length < 10 && "pointer-events-none opacity-50")}
              onClick={() =>
                kind !== "staff" && logRequest({ businessId: biz.id, locationId: loc.id, customerName: name, customerPhone: digits, kind })
              }
            >
              <a href={wa} target="_blank" rel="noreferrer"><Send className="mr-1 h-4 w-4" /> Open in WhatsApp</a>
            </Button>
            <CopyButton text={msg} label="Copy" />
          </div>
        </Panel>

        <Panel title="Recently sent" hint={`${reqs.length} review requests`}>
          {reqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Requests you send appear here.</p>
          ) : (
            <div className="max-h-80 divide-y overflow-y-auto">
              {reqs.slice(0, 30).map((r) => (
                <div key={r.id} className="py-2 text-sm">
                  <div className="font-medium">{r.customerName || r.customerPhone}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.kind === "reminder" ? "Google reminder" : "Review request"} · {biz.locations.find((l) => l.id === r.locationId)?.name} · {fmtDate(r.at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
