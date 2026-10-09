import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gb } from "../lib/business";
import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "../components/StarRating";
import { CopyButton } from "../components/CopyButton";
import { createSubmission, decodePublic, feedbackMessage, getBusiness, type FeedbackPacket } from "../lib/business";
import { resolveIndustry } from "../lib/industries";
import { buildReviewDraft } from "../lib/generate";
import { copyTextToClipboard } from "../lib/clipboard";
import { cn } from "@/lib/utils";

type Search = { d?: string };


export default function ReviewPage() {
  const [sp] = useSearchParams();
  const d = sp.get("d") ?? undefined;
  const biz = useMemo(() => decodePublic(d), [d]);

  const [rating, setRating] = useState(0);
  const [bought, setBought] = useState<string[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [own, setOwn] = useState("");
  const [text, setText] = useState("");
  const [edited, setEdited] = useState(false);
  const [opened, setOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [consentPublic, setConsentPublic] = useState(false);
  const [consentGenuine, setConsentGenuine] = useState(false);
  const [sent, setSent] = useState(false);

  const draft = useMemo(
    () => (biz && rating ? buildReviewDraft({ biz, rating, products: bought, liked, ownWords: own }) : ""),
    [biz, rating, bought, liked, own],
  );
  useEffect(() => {
    if (!edited) setText(draft);
  }, [draft, edited]);

  if (!biz)
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-semibold">This review link is incomplete.</p>
          <p className="mt-1 text-sm text-muted-foreground">Please ask the business to share the link again.</p>
        </div>
      </div>
    );

  const ind = resolveIndustry({ industry: biz.i, customIndustry: biz.x, products: biz.p.map(([, t]) => ({ type: t })) });
  const products = Array.from(new Set(biz.p.map(([n, t]) => n || t).filter(Boolean)));
  const praise = biz.h.length ? biz.h : ind.praise;
  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function postOnGoogle() {
    // Open synchronously inside the tap so mobile browsers don't block it.
    const win = biz!.r ? window.open(biz!.r, "_blank", "noopener,noreferrer") : null;
    await copyTextToClipboard(text);
    setCopied(true);
    if (biz!.r) setOpened(true);
    if (biz!.r && !win) window.location.href = biz!.r;
  }

  function packet(): FeedbackPacket {
    return {
      b: biz!.b,
      l: biz!.l,
      nm: name.trim(),
      r: rating,
      pr: bought,
      lk: liked,
      fb: own.trim(),
      rt: text,
      cm: consentPublic,
      cg: consentGenuine,
      op: opened,
      t: new Date().toISOString(),
    };
  }

  function sendFeedback() {
    const f = packet();
    // On the owner's own device (e.g. a counter tablet) save straight to the dashboard.
    if (biz!.b && getBusiness(biz!.b)) {
      createSubmission({
        businessId: f.b,
        locationId: f.l,
        customerName: f.nm,
        customerPhone: "",
        rating: f.r,
        products: f.pr,
        liked: f.lk,
        feedback: f.fb,
        reviewText: f.rt,
        consentMarketing: f.cm,
        consentGenuine: f.cg,
        reviewCopied: copied,
        reviewOpened: f.op,
      });
      setSent(true);
      return;
    }
    if (!biz!.ph) return;
    const num = biz!.ph.length === 10 ? `91${biz!.ph}` : biz!.ph;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(feedbackMessage(biz!, f))}`, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  const canSend = !!biz.b && (!!biz.ph || !!getBusiness(biz.b));

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-md px-4 pb-16 pt-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">How was your visit to</p>
          <h1 className="text-2xl font-bold tracking-tight">{biz.n}</h1>
          {(biz.ln || biz.a || biz.c) && <p className="text-sm text-muted-foreground">{Array.from(new Set([biz.ln, biz.a, biz.c].filter(Boolean))).join(", ")}</p>}
        </div>

        <div className="mt-6 space-y-6 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <StarRating value={rating} onChange={setRating} size={40} />
            {!rating && <p className="text-sm text-muted-foreground">Tap to rate</p>}
          </div>

          {rating > 0 && (
            <>
              {products.length > 0 && (
                <ChipGroup label="What did you buy or use?" options={products} value={bought} onToggle={(v) => toggle(bought, setBought, v)} />
              )}
              <ChipGroup
                label={rating >= 3 ? "What did you like?" : "Was anything good? (optional)"}
                options={praise}
                value={liked}
                onToggle={(v) => toggle(liked, setLiked, v)}
              />
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{rating >= 3 ? "Anything else? In your own words" : "What went wrong?"}</p>
                <Textarea value={own} onChange={(e) => setOwn(e.target.value)} rows={3} placeholder="Optional — a line or two is enough" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Your review</p>
                  <CopyButton text={text} size="sm" variant="ghost" />
                </div>
                <Textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setEdited(true);
                  }}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">Edit anything you like — it's your review.</p>
              </div>

              {biz.r ? (
                <Button size="lg" className="w-full" disabled={!text.trim()} onClick={postOnGoogle}>
                  Copy & post on Google <ExternalLink className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <CopyButton text={text} label="Copy my review" size="lg" variant="default" />
              )}

              {opened && (
                <div className="flex gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <p>Your review is copied. On Google, tap the stars, long-press the text box and paste, then tap <b>Post</b>.</p>
                </div>
              )}

              {canSend && (
                <div className="space-y-3 border-t pt-5">
                  <p className="text-sm font-medium">Share your feedback with {biz.n} too</p>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your first name (optional)"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                  <label className="flex gap-2 text-sm">
                    <input type="checkbox" className="mt-0.5" checked={consentGenuine} onChange={(e) => setConsentGenuine(e.target.checked)} />
                    <span>This feedback is based on my genuine experience at {biz.n}.</span>
                  </label>
                  <label className="flex gap-2 text-sm">
                    <input type="checkbox" className="mt-0.5" checked={consentPublic} onChange={(e) => setConsentPublic(e.target.checked)} />
                    <span className="text-muted-foreground">{biz.n} may share my first name and feedback on Google, social media and in-store. (Optional)</span>
                  </label>
                  <Button variant="outline" className="w-full" disabled={!consentGenuine || sent} onClick={sendFeedback}>
                    {sent ? (
                      <><Check className="mr-1 h-4 w-4" /> Sent — thank you!</>
                    ) : (
                      <><MessageCircle className="mr-1 h-4 w-4" /> Send my feedback to {biz.n}</>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          You post the review yourself from your own Google account. {biz.n} can't post it for you.
        </p>
      </div>
    </div>
  );
}

function ChipGroup({ label, options, value, onToggle }: { label: string; options: string[]; value: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition",
                on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/50",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
