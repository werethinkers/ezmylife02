import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gb } from "../lib/business";
import { useMemo, useState } from "react";
import { Download, MessageCircle, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, Stars, StatusBadge, fmtDate, useBusinessData } from "../components/dash";
import { STATUSES, importFeedback } from "../lib/business";


const sel = "h-9 rounded-md border bg-background px-2 text-sm";

export default function Submissions() {
  const { id } = useParams() as { id: string; sid: string };
  const navigate = useNavigate();
  const { biz, subs } = useBusinessData(id);
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState("");
  const [status, setStatus] = useState("");
  const [consent, setConsent] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [fromPhone, setFromPhone] = useState("");

  function runImport() {
    const { added, skipped } = importFeedback(id, pasted, fromPhone.trim());
    if (added) toast.success(`Added ${added} submission${added === 1 ? "" : "s"}`);
    if (!added) toast.error(skipped ? "Already added, or not for this business" : "No feedback code found in the pasted text");
    if (added) {
      setPasted("");
      setFromPhone("");
      setImportOpen(false);
    }
  }

  const locs = biz?.locations ?? [];
  const locById = useMemo(() => Object.fromEntries(locs.map((l) => [l.id, l])), [locs]);
  const cities = Array.from(new Set(locs.map((l) => l.city).filter(Boolean)));

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return subs.filter((s) => {
      const l = locById[s.locationId];
      if (loc && s.locationId !== loc) return false;
      if (city && l?.city !== city) return false;
      if (rating && s.rating !== Number(rating)) return false;
      if (status && s.status !== status) return false;
      if (consent === "yes" && !s.consentMarketing) return false;
      if (consent === "no" && s.consentMarketing) return false;
      if (from && s.createdAt < from) return false;
      if (to && s.createdAt.slice(0, 10) > to) return false;
      if (needle && !`${s.customerName} ${s.customerPhone} ${s.feedback} ${s.reviewText}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [subs, q, loc, city, rating, status, consent, from, to, locById]);

  const filtered = q || loc || city || rating || status || consent || from || to;

  function exportCsv() {
    const head = ["Date", "Location", "City", "Customer", "Phone", "Rating", "Products", "Liked", "Feedback", "Review text", "Consent", "Opened Google", "Status"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((s) => {
      const l = locById[s.locationId];
      return [s.createdAt, l?.name, l?.city, s.customerName, s.customerPhone, s.rating, s.products.join("; "), s.liked.join("; "), s.feedback, s.reviewText, s.consentMarketing ? "Yes" : "No", s.reviewOpened ? "Yes" : "No", s.status].map(esc).join(",");
    });
    const blob = new Blob([[head.map(esc).join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${biz?.name ?? "submissions"}-submissions.csv`;
    a.click();
  }

  if (!biz) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Submissions</h2>
          <p className="text-sm text-muted-foreground">{rows.length} of {subs.length} customer submissions</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setImportOpen(true)}>
            <MessageCircle className="mr-1 h-4 w-4" /> Add from WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
            <Download className="mr-1 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add feedback from WhatsApp</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            When customers tap "Send my feedback", you get a WhatsApp message ending in <code>Ref: LK1:…</code>. Long-press it → Copy, and
            paste here. You can paste several messages at once.
          </p>
          <Textarea rows={7} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Paste WhatsApp message(s) here" />
          <input
            value={fromPhone}
            onChange={(e) => setFromPhone(e.target.value)}
            placeholder="Customer's number (optional, if pasting one message)"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={runImport} disabled={!pasted.trim()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone or text" className="h-9 pl-8" />
        </div>
        {locs.length > 1 && (
          <select className={sel} value={loc} onChange={(e) => setLoc(e.target.value)}>
            <option value="">All locations</option>
            {locs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        )}
        {cities.length > 1 && (
          <select className={sel} value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">All cities</option>
            {cities.map((c) => <option key={c}>{c}</option>)}
          </select>
        )}
        <select className={sel} value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star</option>)}
        </select>
        <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={sel} value={consent} onChange={(e) => setConsent(e.target.value)}>
          <option value="">Consent: any</option>
          <option value="yes">Consent given</option>
          <option value="no">No consent</option>
        </select>
        <input type="date" className={sel} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <input type="date" className={sel} value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
        {filtered && (
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); setLoc(""); setCity(""); setRating(""); setStatus(""); setConsent(""); setFrom(""); setTo(""); }}>
            <X className="mr-1 h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={subs.length ? "Nothing matches these filters" : "No submissions yet"}
          body={subs.length ? "Try clearing a filter." : "Share your review link. When customers send feedback on WhatsApp, paste it here with Add from WhatsApp."}
        >
          {!subs.length && (
            <Button asChild><Link to={gb(`/b/${id}/share`)}>Get review link</Link></Button>
          )}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-3 font-medium">Location</th>
                <th className="px-3 font-medium">Rating</th>
                <th className="px-3 font-medium">Feedback</th>
                <th className="px-3 font-medium">Consent</th>
                <th className="px-3 font-medium">Google opened</th>
                <th className="px-3 font-medium">Date</th>
                <th className="px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const l = locById[s.locationId];
                return (
                  <tr
                    key={s.id}
                    onClick={() => navigate(gb(`/b/${id}/submissions/${s.id}`))}
                    className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{s.customerName || "—"}</div>
                      <div className="text-xs text-muted-foreground">{s.customerPhone || "No phone"}</div>
                    </td>
                    <td className="px-3">
                      <div>{l?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{l?.city}</div>
                    </td>
                    <td className="px-3"><Stars n={s.rating} /></td>
                    <td className="max-w-72 px-3"><p className="line-clamp-2 text-muted-foreground">{s.feedback || s.reviewText}</p></td>
                    <td className="px-3">{s.consentMarketing ? <span className="text-emerald-600">Yes</span> : <span className="text-destructive">No</span>}</td>
                    <td className="px-3">{s.reviewOpened ? "Yes" : <span className="text-muted-foreground">No</span>}</td>
                    <td className="whitespace-nowrap px-3 text-xs text-muted-foreground">{fmtDate(s.createdAt)}</td>
                    <td className="px-4"><StatusBadge status={s.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
