import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookUser, Check, ClipboardPaste, Copy, FileUp, Loader2, Send, SkipForward, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRefreshWallet, useWallet } from "@/hooks/useWallet";
import { fmtCredits, SEND_ALL_AUTO_CREDITS_EACH, SEND_ALL_MAX, SEND_ALL_PEOPLE_PER_CREDIT, sendAllCredits } from "@/lib/creditRate";
import { cn } from "@/lib/utils";
import type { Content, Product } from "./types";
import { langById, parsePeople, personalLink, type LangId, type Person } from "./festLang";
import { describeForRecipient } from "./meta";
import { bulkSend, checkout, CheckoutError, startQueueSend } from "./api";
import { canPickContacts, dedupe, greetingName, isIOS, pickFromPhone, readContactsFile } from "./contacts";
import { ContactList, type ContactRow } from "./ContactList";
import { fill, isMobile, waDigits, waTo, waShare } from "./util";

type Mode = "queue" | "auto";
/** A number WhatsApp can reach: an Indian mobile, or a full international number. */
const reachable = (phone: string) => !!phone && (isMobile(phone) || /^(?!91)\d{11,15}$/.test(waDigits(phone)));

interface QueueState { sendId: string; people: Person[]; at: number; done: number[] }
const queueKey = (pageId: string) => `ip-send-all-${pageId}`;
const readQueue = (pageId?: string): QueueState | null => {
  if (!pageId) return null;
  try { const s = sessionStorage.getItem(queueKey(pageId)); return s ? JSON.parse(s) : null; } catch { return null; }
};

/**
 * Send a card or website to many people, each by name. People come from the phone's contact book,
 * a contacts file, or a pasted list. "Send all" costs credits, asks for permission first, then either
 * opens each chat on the sender's own WhatsApp in turn (one tap each), or, when switched on, sends
 * everything automatically from EZYOURLIFE's WhatsApp number.
 * lang: the card language the sender chose in the share kit; every person gets their card in it.
 * pageId: needed to charge and to make personal link previews; without it only one-by-one links show.
 */
export function BulkSend({ product, content, link, lang = "en", pageId, ready = true }: { product: Product; content: Content; link: string; lang?: LangId; pageId?: string; ready?: boolean }) {
  const { toast } = useToast();
  const { total: balance } = useWallet();
  const refreshWallet = useRefreshWallet();
  // Everyone imported; only ticked rows are sent, greeted by the (editable) name in the row.
  const [rows, setRows] = useState<ContactRow[]>([]);
  const people = useMemo<Person[]>(() => rows.filter((r) => r.on).map((r) => ({ name: r.name.trim() || r.saved, phone: r.phone })), [rows]);
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [mode, setMode] = useState<Mode>("queue");
  const [autoOn, setAutoOn] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<QueueState | null>(() => readQueue(pageId));
  const [auto, setAuto] = useState<{ sendId: string; status: string; people: number; sent: number; failed: number; refunded: number; failedNames: string[] } | null>(null);
  const [personal, setPersonal] = useState<Record<string, string>>({});
  const [building, setBuilding] = useState(false);
  const [buildErr, setBuildErr] = useState("");
  const [previewsOff, setPreviewsOff] = useState(false); // the share-page service isn't deployed yet: hide the option
  const fileRef = useRef<HTMLInputElement>(null);
  const ios = isIOS();
  const isFestival = product.family === "festival";
  const isDiwali = product.opts.art === "diya";
  const L = langById(lang);

  const withPhone = useMemo(() => people.filter((p) => reachable(p.phone)), [people]);
  const sendCount = mode === "auto" ? withPhone.length : people.length;
  const need = sendAllCredits(mode, sendCount);
  const short = Math.max(0, need - balance);

  // Is automatic sending switched on (its WhatsApp template approved)? Asked once.
  useEffect(() => {
    if (!pageId) return;
    bulkSend({ action: "quote", people: 1, with_phone: 1 }).then((q) => setAutoOn(!!q?.auto?.available), () => setAutoOn(false));
  }, [pageId]);
  useEffect(() => { if (!autoOn && mode === "auto") setMode("queue"); }, [autoOn, mode]);

  // Remember the queue in this tab, so a refresh or a trip to WhatsApp doesn't lose the place (or charge twice).
  useEffect(() => {
    if (!pageId) return;
    try {
      if (queue) sessionStorage.setItem(queueKey(pageId), JSON.stringify(queue));
      else sessionStorage.removeItem(queueKey(pageId));
    } catch { /* storage blocked */ }
  }, [queue, pageId]);

  // Automatic send: check progress until it is done.
  useEffect(() => {
    if (!auto || auto.status === "done") return;
    const t = setInterval(() => {
      bulkSend({ action: "status", send_id: auto.sendId }).then((s) => {
        setAuto((a) => a && { ...a, status: s.status, people: s.people, sent: s.sent, failed: s.failed, refunded: s.refunded, failedNames: s.failed_names ?? [] });
        if (s.status === "done") refreshWallet();
      }, () => undefined);
    }, 4000);
    return () => clearInterval(t);
  }, [auto, refreshWallet]);

  const add = (more: Person[], from: string) => {
    const before = rows.length;
    // Same rules as dedupe() (one per number), keeping any names already edited.
    const merged = dedupe([...rows.map((r) => ({ name: r.saved, phone: r.phone })), ...more]);
    const fresh = merged.slice(before).map((p, i) => ({ id: Date.now() + i, saved: p.name, phone: p.phone, on: true, ...greetingName(p.name) }));
    const next = [...rows, ...fresh];
    setRows(next); setPersonal({});
    const added = fresh.length;
    toast({ title: added ? `${added} ${added === 1 ? "person" : "people"} added from ${from}` : "No new people found", description: next.length >= SEND_ALL_MAX ? `The list holds up to ${SEND_ALL_MAX.toLocaleString("en-IN")} people.` : undefined });
  };
  const fromPhone = async () => {
    try { add(await pickFromPhone(), "your contacts"); }
    catch (e) { if ((e as Error)?.name !== "AbortError" && (e as Error)?.name !== "InvalidStateError") toast({ title: "Couldn't open your contacts", description: "Allow contacts access, or upload a contacts file instead.", variant: "destructive" }); }
  };
  const fromFile = async (f: File | undefined) => {
    if (!f) return;
    try { add(await readContactsFile(f), f.name); }
    catch (e) { toast({ title: "Couldn't read that file", description: e instanceof Error ? e.message : "Use a .vcf or .csv contacts file.", variant: "destructive" }); }
    if (fileRef.current) fileRef.current.value = "";
  };
  const fromPaste = () => { add(parsePeople(paste), "your list"); setPaste(""); setShowPaste(false); };

  // Festival cards: put each person's name in the big greeting on their card ("Happy Diwali, Arinjay!").
  const [nameInHead, setNameInHead] = useState(true);
  const linkFor = (name: string) => personal[name] ?? personalLink(link, name, lang, isFestival && nameInHead);
  const msgFor = (name: string) => {
    if (isFestival) {
      const first = isDiwali ? L.share : product.opts.greeting;
      return `${product.glyph} ${first}, ${name}!\n${fill("A little greeting from {sender}:", content)}\n${linkFor(name)}`;
    }
    // Invitations, websites, menus and profiles: the page's own share message, with a hello by name.
    return `Hi ${name},\n${fill(product.share, { ...content, link: linkFor(name) })}`;
  };
  const href = (p: Person) => (reachable(p.phone) ? waTo(p.phone, msgFor(p.name)) : waShare(msgFor(p.name)));
  const copyAll = async () => {
    const out = people.map((p) => `${p.name}\n${msgFor(p.name)}`).join("\n\n");
    try { await navigator.clipboard.writeText(out); toast({ title: `${people.length} messages copied`, description: "Each has its greeting and personal link." }); } catch { toast({ title: "Could not copy", description: "Use Send all instead." }); }
  };

  // Festival cards: one small page per person, so the WhatsApp link preview carries their name too.
  const buildPersonal = async () => {
    if (!pageId || people.length === 0) return;
    setBuilding(true); setBuildErr("");
    try {
      const payload = people.slice(0, 500).map((p) => { const { title, desc } = describeForRecipient(product, content, p.name); return { name: p.name, title, description: desc }; });
      const res = await checkout({ action: "share_bulk", page_id: pageId, lang, people: payload });
      setPersonal((res?.links as Record<string, string>) ?? {});
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (/being updated|failed to send a request|unknown action/i.test(msg)) { setPreviewsOff(true); return; }
      setBuildErr(msg || "Couldn't make the personal links. The normal links still work.");
    } finally { setBuilding(false); }
  };

  const start = async () => {
    if (!pageId || !consent) return;
    setBusy(true);
    try {
      const res = mode === "auto"
        ? await bulkSend({ action: "start", page_id: pageId, mode, lang, consent: true, people: withPhone.map((p) => ({ name: p.name, phone: waDigits(p.phone) })) })
        : await startQueueSend(pageId, lang, people.length);
      refreshWallet();
      setConfirmOpen(false); setConsent(false);
      toast({ title: `${fmtCredits(res.charged)} used`, description: mode === "auto" ? "Sending now. You can leave this page." : "Now tap Send for each person. WhatsApp opens with their message ready." });
      if (mode === "auto") setAuto({ sendId: res.send_id, status: "sending", people: res.people, sent: 0, failed: 0, refunded: 0, failedNames: [] });
      else setQueue({ sendId: res.send_id, people, at: 0, done: [] });
    } catch (e) {
      refreshWallet();
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: e instanceof CheckoutError && e.status === 402 ? "Not enough credits" : "Couldn't start sending", description: msg, variant: "destructive" });
    } finally { setBusy(false); }
  };

  // ---------- sending from the sender's own WhatsApp, one chat at a time ----------
  if (queue) {
    const total = queue.people.length;
    const cur = queue.people[queue.at];
    const finished = queue.at >= total;
    const advance = (sent: boolean) => setQueue((q) => q && { ...q, done: sent ? [...q.done, q.at] : q.done, at: q.at + 1 });
    return (
      <div className="grid gap-3" aria-live="polite">
        <div className="font-semibold">Sending to {total.toLocaleString("en-IN")} people from your WhatsApp</div>
        <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-card"><div className="h-full bg-[#25D366] transition-all" style={{ width: `${Math.round((Math.min(queue.at, total) / total) * 100)}%` }} /></div>
        <p className="text-sm text-muted-foreground">{queue.done.length.toLocaleString("en-IN")} sent · {Math.max(0, total - queue.at).toLocaleString("en-IN")} left</p>
        {finished ? (
          <div className="grid gap-2 rounded-2xl border-2 border-ink bg-sun/40 p-4">
            <p className="font-bold">All done 🎉</p>
            <p className="text-sm">You went through everyone on the list.</p>
            <Button variant="outline" onClick={() => { setQueue(null); setRows([]); }}>Send to another list</Button>
          </div>
        ) : (
          <div className="grid gap-2 rounded-2xl border-2 border-ink bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground">Person {queue.at + 1} of {total}</p>
            <p className="truncate text-lg font-bold">{cur.name}{!reachable(cur.phone) && <span className="ml-2 text-xs font-medium text-muted-foreground">no number, you'll choose the chat</span>}</p>
            <a href={href(cur)} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(() => advance(true), 300)}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-base font-semibold text-[#06260F]">
              <Send className="h-5 w-5" /> Send to {cur.name.split(" ")[0]}
            </a>
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => advance(false)}><SkipForward className="h-4 w-4 mr-1" /> Skip</Button>
              <Button variant="ghost" size="sm" onClick={() => setQueue(null)}>Stop</Button>
            </div>
            <p className="text-xs text-muted-foreground">WhatsApp opens with {cur.name.split(" ")[0]}'s message ready. Tap send there, come back, and the next person is waiting here.</p>
          </div>
        )}
      </div>
    );
  }

  // ---------- automatic sending, progress ----------
  if (auto) {
    const done = auto.status === "done";
    return (
      <div className="grid gap-3" aria-live="polite">
        <div className="font-semibold">{done ? "Sent" : "Sending automatically"} to {auto.people.toLocaleString("en-IN")} people</div>
        <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-card"><div className="h-full bg-[#25D366] transition-all" style={{ width: `${Math.round(((auto.sent + auto.failed) / Math.max(1, auto.people)) * 100)}%` }} /></div>
        <p className="text-sm">{auto.sent.toLocaleString("en-IN")} delivered to WhatsApp · {auto.failed.toLocaleString("en-IN")} failed{!done && <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />}</p>
        {done && auto.refunded > 0 && <p className="text-sm font-semibold">{fmtCredits(auto.refunded)} returned for the messages that failed.</p>}
        {done && auto.failedNames.length > 0 && <p className="text-xs text-muted-foreground">Not sent: {auto.failedNames.join(", ")}{auto.failed > auto.failedNames.length ? "…" : ""}</p>}
        {!done && <p className="text-xs text-muted-foreground">You can close this page. Sending carries on.</p>}
        {done && <Button variant="outline" onClick={() => { setAuto(null); setRows([]); }}>Send to another list</Button>}
      </div>
    );
  }

  // ---------- building the list ----------
  return (
    <div className="grid gap-3">
      <div className="font-semibold">Send to everyone, each by name</div>
      <p className="text-sm text-muted-foreground">Add people from your contacts. Each one gets a WhatsApp message with their own name{isFestival ? ", and their name on the card" : product.family === "event" ? ", and their name on the invitation" : ""}. Up to {SEND_ALL_MAX.toLocaleString("en-IN")} people.</p>

      {/* Phone contact book where the browser allows it (Chrome on Android, with select-all). On iPhone no
          website can read contacts, so the fastest way is exporting "All Contacts" once and importing that file. */}
      {canPickContacts() ? (
        <Button type="button" className="h-14 text-base" onClick={() => void fromPhone()}><BookUser className="h-5 w-5 mr-2" /> Import from my contacts</Button>
      ) : (
        <div className="grid gap-3 rounded-2xl border-2 border-ink bg-sun/30 p-4">
          <p className="font-bold">Import all your contacts at once</p>
          <ol className="grid gap-1.5 text-sm">
            {(ios ? [
              <>Open the <b>Contacts</b> app and tap <b>Lists</b> (top left).</>,
              <>Press and hold <b>All Contacts</b> (or All iCloud), tap <b>Export</b>, then <b>Done</b>, and <b>Save to Files</b>.</>,
              <>Come back here and tap the button below, then pick that file.</>,
            ] : [
              <>Open the <b>Contacts</b> app, go to <b>Settings</b> (or Fix &amp; manage) and tap <b>Export</b>.</>,
              <>Save the <b>.vcf</b> file to your phone.</>,
              <>Come back here and tap the button below, then pick that file.</>,
            ]).map((step, i) => (
              <li key={i} className="flex gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink bg-card text-xs font-bold">{i + 1}</span><span>{step}</span></li>
            ))}
          </ol>
          <Button type="button" className="h-14 text-base" onClick={() => fileRef.current?.click()}><BookUser className="h-5 w-5 mr-2" /> Import my contacts</Button>
          <p className="text-xs text-muted-foreground">{ios ? "iPhone doesn't let websites open your contacts directly, so this is the quickest way. " : ""}You do the export once; the file is read on this phone only and never uploaded.</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {canPickContacts() && <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()}><FileUp className="h-4 w-4 mr-1" /> Import a contacts file</Button>}
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowPaste((v) => !v)}><ClipboardPaste className="h-4 w-4 mr-1" /> Paste a list</Button>
      </div>
      <input ref={fileRef} type="file" accept=".vcf,.vcard,.csv,.txt,text/vcard,text/x-vcard,text/csv" className="hidden" onChange={(e) => void fromFile(e.target.files?.[0])} aria-label="Contacts file" />
      {showPaste && (
        <div className="grid gap-2">
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={4} placeholder={"Rahul Sharma, 9876543210\nMeena Aunty, 98xxxxxx12"} className="w-full rounded-xl border bg-background p-3 text-sm" aria-label="People to send to, one per line" />
          <Button type="button" variant="outline" size="sm" className="justify-self-start" disabled={!paste.trim()} onClick={fromPaste}>Add to the list</Button>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-bold">{rows.length.toLocaleString("en-IN")} contacts</span>
            <span className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={copyAll} disabled={people.length === 0}><Copy className="h-4 w-4 mr-1" /> Copy messages</Button>
              <Button variant="ghost" size="sm" onClick={() => { setRows([]); setPersonal({}); }}>Clear list</Button>
            </span>
          </div>
          <ContactList rows={rows} setRows={(f) => { setRows(f); setPersonal({}); }} reachable={reachable} />
          {isFestival && (
            <label className="flex items-start gap-3 rounded-2xl border-2 border-ink bg-card p-3">
              <Checkbox checked={nameInHead} onCheckedChange={(v) => setNameInHead(v === true)} className="mt-0.5 h-6 w-6 rounded-md border-2" />
              <span className="grid gap-0.5">
                <span className="font-bold">Put each name in the big greeting</span>
                <span className="text-sm text-muted-foreground">{people[0] ? `${people[0].name}'s card will say "${(product.opts.langs === true ? L.head : product.opts.greeting).replace(/[!.\s]+$/, "")}, ${people[0].name}!"` : `Each card says "Happy Diwali, <name>!"`}{nameInHead ? "" : ` Off: the card says "Dear ${people[0]?.name ?? "<name>"}," under the greeting.`}</span>
              </span>
            </label>
          )}
          {people[0] && <p className="rounded-xl bg-muted/50 px-3 py-2 text-sm"><span className="text-muted-foreground">{people[0].name}'s WhatsApp message starts: </span>{msgFor(people[0].name).split("\n")[0]}</p>}

          {isFestival && pageId && !previewsOff && (
            <div className="grid gap-1.5 rounded-xl border bg-muted/30 p-3">
              <Button type="button" variant="outline" size="sm" disabled={building} onClick={() => void buildPersonal()} className="justify-self-start">
                <Sparkles className="h-4 w-4 mr-1" /> {building ? "Setting up each person's preview…" : Object.keys(personal).length ? "Redo personal WhatsApp previews" : "Give everyone their own WhatsApp preview"}
              </Button>
              <p className="text-xs text-muted-foreground">{Object.keys(personal).length ? `${Object.keys(personal).length} of ${people.length} people now see their own name in the link preview. Free.` : "Optional and free: each person's link preview shows their own name, not just the card."}</p>
              {buildErr && <p className="text-xs text-destructive" role="alert">{buildErr}</p>}
            </div>
          )}

          <div className="grid gap-2" role="radiogroup" aria-label="How to send">
            <ModeOption active={mode === "queue"} onClick={() => setMode("queue")} icon={<Send className="h-4 w-4" />}
              title="From my WhatsApp" price={fmtCredits(sendAllCredits("queue", people.length))}
              text={`1 credit for every ${SEND_ALL_PEOPLE_PER_CREDIT} people. Messages go from your own number; WhatsApp opens each chat ready and you tap send.`} />
            <ModeOption active={mode === "auto"} disabled={!autoOn} onClick={() => autoOn && setMode("auto")} icon={<Zap className="h-4 w-4" />}
              title="Send automatically" price={autoOn ? fmtCredits(sendAllCredits("auto", withPhone.length)) : "Coming soon"}
              text={`${SEND_ALL_AUTO_CREDITS_EACH} credits a person with a number. EZYOURLIFE's WhatsApp sends them all for you, no tapping. Failed ones are refunded.`} />
          </div>

          {pageId ? (
            // Stays at the bottom of the screen while scrolling a long list.
            <div className="sticky bottom-2 z-10 grid gap-1 rounded-2xl border-2 border-ink bg-card p-2 shadow-[3px_3px_0_0_hsl(var(--ink))]">
              <Button className="h-14 text-base" disabled={sendCount === 0 || !ready} onClick={() => { setConsent(false); setConfirmOpen(true); }}>
                {ready ? <Send className="h-5 w-5 mr-2" /> : <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                {ready ? <>Send to {sendCount.toLocaleString("en-IN")} · {fmtCredits(need)}</> : "Getting the preview ready…"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">{rows.length - people.length > 0 ? `${(rows.length - people.length).toLocaleString("en-IN")} skipped · ` : ""}You have {fmtCredits(balance)}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Publish the page to send it to everyone.</p>
          )}
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !busy && setConfirmOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send to {sendCount.toLocaleString("en-IN")} {sendCount === 1 ? "person" : "people"}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="grid gap-2 text-sm">
                <p>{mode === "auto" ? `EZYOURLIFE's WhatsApp number will send each person their own message, with their name and link.${people.length > withPhone.length ? ` ${people.length - withPhone.length} without a valid number are left out.` : ""}` : "WhatsApp opens each person's chat with their message ready, one after the other. You tap send in each."}</p>
                <p className="font-semibold text-foreground">This uses {fmtCredits(need)}. You have {fmtCredits(balance)}.</p>
                {short > 0 && <p className="text-destructive">You need {fmtCredits(short)} more.</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
            <span>These are people I know, and they are happy to get this message from me. I allow EZYOURLIFE to use {fmtCredits(need)} for it.</span>
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            {short > 0 ? (
              <Button asChild><Link to={`/credits?next=${encodeURIComponent(location.pathname + location.search)}`}>Buy credits</Link></Button>
            ) : (
              <Button disabled={!consent || busy} onClick={() => void start()}>{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}Use {fmtCredits(need)} and send</Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ModeOption({ active, disabled, onClick, icon, title, price, text }: { active: boolean; disabled?: boolean; onClick: () => void; icon: React.ReactNode; title: string; price: string; text: string }) {
  return (
    <button type="button" role="radio" aria-checked={active} aria-disabled={disabled} onClick={onClick}
      className={cn("grid gap-1 rounded-2xl border-2 p-3 text-left", active ? "border-ink bg-sun/40 shadow-[2px_2px_0_0_hsl(var(--ink))]" : "border-ink/30 bg-card hover:border-ink", disabled && "cursor-not-allowed opacity-60 hover:border-ink/30")}>
      <span className="flex items-center justify-between gap-2 font-bold"><span className="flex items-center gap-2">{icon}{title}</span><span className="text-sm">{price}</span></span>
      <span className="text-xs text-muted-foreground">{text}</span>
    </button>
  );
}
