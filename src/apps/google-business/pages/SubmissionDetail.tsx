import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gb } from "../lib/business";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ExternalLink, MessageCircle, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "../components/CopyButton";
import { Panel, Stars, StatusBadge, fmtDate, useBusinessData } from "../components/dash";
import { deleteSubmission, getSubmission, updateSubmission, type Status, type Submission } from "../lib/business";
import { generateCaption } from "../lib/generate";
import { copyTextToClipboard } from "../lib/clipboard";


function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

export default function Detail() {
  const { id, sid } = useParams() as { id: string; sid: string };
  const navigate = useNavigate();
  const { biz, subs } = useBusinessData(id);
  const sub: Submission | undefined = subs.find((s) => s.id === sid) ?? getSubmission(sid);
  const loc = biz?.locations.find((l) => l.id === sub?.locationId);
  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (biz && sub) setCaption(sub.caption || generateCaption(biz, loc, sub));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biz?.id, sub?.id]);

  if (!biz) return null;
  if (!sub)
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <p className="font-medium">Submission not found.</p>
        <Button asChild variant="outline" className="mt-3"><Link to={gb(`/b/${id}/submissions`)}>Back to submissions</Link></Button>
      </div>
    );

  const set = (status: Status, action: string, extra: Partial<Submission> = {}) => {
    updateSubmission(sub.id, { status, caption, ...extra }, action);
    toast.success(action);
  };
  const noConsent = !sub.consentMarketing;
  const gbpUrl = "https://business.google.com/posts";
  const phone = sub.customerPhone.replace(/\D/g, "");
  const waPhone = phone.length === 10 ? `91${phone}` : phone;
  const followUp = `Hi ${sub.customerName || "there"}, thank you for sharing your feedback with ${biz.name}! If you have a minute, please post it on Google too — it really helps us: ${loc?.reviewLink ?? ""}`;

  async function copyAndOpen() {
    window.open(gbpUrl, "_blank", "noopener,noreferrer");
    await copyTextToClipboard(caption);
    toast.success("Caption copied — paste it into a new post on Google");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to={gb(`/b/${id}/submissions`)}><ArrowLeft className="mr-1 h-4 w-4" /> Submissions</Link>
        </Button>
        <div className="flex items-center gap-2">
          <StatusBadge status={sub.status} />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete submission"
            onClick={() => {
              if (!confirm("Delete this submission?")) return;
              deleteSubmission(sub.id);
              navigate(gb(`/b/${id}/submissions`));
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Panel title="Customer">
            <Row label="Name">{sub.customerName || "—"}</Row>
            <Row label="Phone">{sub.customerPhone || "—"}</Row>
            <Row label="Submitted">{fmtDate(sub.createdAt)}</Row>
            <Row label="Location">{loc ? `${loc.name}${loc.city ? `, ${loc.city}` : ""}` : "—"}</Row>
            <Row label="Rating"><Stars n={sub.rating} /></Row>
            {sub.products.length > 0 && <Row label="Bought / used">{sub.products.join(", ")}</Row>}
            {sub.liked.length > 0 && <Row label="Liked">{sub.liked.join(", ")}</Row>}
          </Panel>
          <Panel title="Feedback">
            {sub.feedback ? <p className="text-sm">"{sub.feedback}"</p> : <p className="text-sm text-muted-foreground">No written feedback.</p>}
            <p className="mt-3 text-xs font-medium text-muted-foreground">Review text the customer took to Google</p>
            <p className="mt-1 rounded-md bg-muted/50 p-3 text-sm">{sub.reviewText || "—"}</p>
          </Panel>
          <Panel title="Consent & activity">
            <Row label="Marketing use">{sub.consentMarketing ? <span className="text-emerald-600">Given</span> : <span className="text-destructive">Not given</span>}</Row>
            <Row label="Genuine experience">{sub.consentGenuine ? "Confirmed" : "Not confirmed"}</Row>
            <Row label="Copied review text">{sub.reviewCopied ? "Yes" : "No"}</Row>
            <Row label="Opened Google review page">{sub.reviewOpened ? "Yes" : "No"}</Row>
            {!sub.reviewOpened && phone.length >= 10 && (
              <Button asChild variant="outline" size="sm" className="mt-2">
                <a href={`https://wa.me/${waPhone}?text=${encodeURIComponent(followUp)}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-1 h-4 w-4" /> Remind on WhatsApp
                </a>
              </Button>
            )}
            <div className="mt-4 border-t pt-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">History</p>
              {sub.log.map((l, i) => (
                <p key={i} className="text-xs text-muted-foreground">{fmtDate(l.at)} · {l.action} · {l.by}</p>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Google Business Profile post" hint="Turn this moment into a post on your profile.">
            {noConsent && (
              <div className="mb-3 flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                Customer consent is missing. This submission cannot be posted publicly.
              </div>
            )}
            <div className="rounded-xl border">
              <div className="flex items-center gap-2 border-b p-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{biz.name.slice(0, 1)}</div>
                <div>
                  <p className="text-sm font-medium">{biz.name}</p>
                  <p className="text-xs text-muted-foreground">{loc?.city ?? ""} · Update</p>
                </div>
              </div>
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 1500))} rows={9} className="rounded-none border-0 focus-visible:ring-0" />
              <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">Text-only post · add a real photo from your shop on Google · {caption.length}/1500</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setCaption(generateCaption(biz, loc, sub))}>Regenerate</Button>
              <Button variant="outline" size="sm" onClick={() => { updateSubmission(sub.id, { caption }, "Caption edited"); toast.success("Caption saved"); }}>Save caption</Button>
              <CopyButton text={caption} label="Copy caption" />
            </div>
          </Panel>

          <Panel title="Decision">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button disabled={noConsent} onClick={() => set("Approved", "Approved for posting")}>Approve</Button>
              <Button disabled={noConsent} variant="outline" onClick={copyAndOpen}>
                Copy & open Google <ExternalLink className="ml-1 h-4 w-4" />
              </Button>
              <Button
                disabled={noConsent}
                variant="outline"
                onClick={() => set("Posted on Google", "Marked as posted on Google", { postedAt: new Date().toISOString() })}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" /> Mark as posted
              </Button>
              <Button variant="outline" onClick={() => set("Needs edit", "Marked as needs edit")}>Needs edit</Button>
              <Button variant="outline" onClick={() => set("Internal only", "Kept for internal use")}>Use internally only</Button>
              <Button variant="outline" className="text-destructive" onClick={() => set("Rejected", "Rejected")}>Reject</Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Posting goes through your Google Business Profile: copy the caption, create a post there, then mark it posted here. Automatic posting
              needs the Google Business Profile API and a backend.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
