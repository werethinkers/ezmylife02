import { useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Content, Product } from "./types";
import { langById, parsePeople, personalLink, type LangId } from "./festLang";
import { describeForRecipient } from "./meta";
import { checkout } from "./api";
import { fill, isMobile, waTo, waShare } from "./util";

/** Send the same card to many people, each with their own name on it: one tap per person on WhatsApp. */
/** lang: the card language the sender chose in the share kit; every person gets their card in it.
 *  pageId: lets "Give everyone their own WhatsApp preview" write each person their own small share
 *  page, so the name in the WhatsApp link preview is theirs, not just the greeting inside the card.
 *  Without it (an older caller, or the page isn't saved yet) bulk send still works as before. */
export function BulkSend({ product, content, link, lang = "en", pageId }: { product: Product; content: Content; link: string; lang?: LangId; pageId?: string }) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [sent, setSent] = useState<Record<number, boolean>>({});
  const [personal, setPersonal] = useState<Record<string, string>>({});
  const [building, setBuilding] = useState(false);
  const [buildErr, setBuildErr] = useState("");
  const people = parsePeople(text);
  const isDiwali = product.opts.art === "diya";
  const L = langById(lang);

  const linkFor = (name: string) => personal[name] ?? personalLink(link, name, lang);
  const msgFor = (name: string) => {
    const first = isDiwali ? L.share : product.opts.greeting;
    return `${product.glyph} ${first}, ${name}!\n${fill("A little greeting from {sender}:", content)}\n${linkFor(name)}`;
  };
  const href = (p: { name: string; phone: string }) => (isMobile(p.phone) ? waTo(p.phone, msgFor(p.name)) : waShare(msgFor(p.name)));
  const copyAll = async () => {
    const out = people.map((p) => `${p.name}\n${msgFor(p.name)}`).join("\n\n");
    try { await navigator.clipboard.writeText(out); toast({ title: `${people.length} messages copied`, description: "Each has its greeting and personal link." }); } catch { toast({ title: "Could not copy", description: "Use the WhatsApp button for each person." }); }
  };

  // Writes one small page per person (their name in the WhatsApp preview, not just inside the card),
  // in a handful of batched commits on the server - see ip-checkout's "share_bulk" action.
  const buildPersonal = async () => {
    if (!pageId || people.length === 0) return;
    setBuilding(true); setBuildErr("");
    try {
      const payload = people.map((p) => {
        const { title, desc } = describeForRecipient(product, content, p.name);
        return { name: p.name, title, description: desc };
      });
      const res = await checkout({ action: "share_bulk", page_id: pageId, lang, people: payload });
      setPersonal((res?.links as Record<string, string>) ?? {});
    } catch (e) {
      setBuildErr(e instanceof Error ? e.message : "Couldn't make the personal links. The generic links below still work.");
    } finally { setBuilding(false); }
  };

  return (
    <div className="grid gap-3">
      <div className="font-semibold">Send to many people, each with their name</div>
      <p className="text-sm text-muted-foreground">Add one person per line, like <span className="font-mono">Rahul Sharma, 98xxxxxx12</span>. The phone number is optional. Each person gets "Dear Rahul," on their own card. Up to 200 people.</p>
      <textarea value={text} onChange={(e) => { setText(e.target.value); setSent({}); setPersonal({}); setBuildErr(""); }} rows={5} placeholder={"Rahul Sharma, 9876543210\nMeena Aunty\nThe Patels"} className="w-full rounded-xl border bg-background p-3 text-sm" aria-label="People to send to" />
      {people.length > 0 && (
        <>
          <div className="flex items-center justify-between text-sm"><span>{people.length} {people.length === 1 ? "person" : "people"} · {Object.keys(sent).length} sent</span>
            <Button variant="outline" size="sm" onClick={copyAll}><Copy className="h-4 w-4 mr-1" /> Copy all messages</Button></div>
          {pageId && (
            <div className="rounded-xl border bg-muted/30 p-3 grid gap-1.5">
              <Button type="button" variant="outline" size="sm" disabled={building} onClick={() => void buildPersonal()} className="justify-self-start">
                <Sparkles className="h-4 w-4 mr-1" /> {building ? "Setting up each person's preview…" : Object.keys(personal).length ? "Redo personal WhatsApp previews" : "Give everyone their own WhatsApp preview"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {Object.keys(personal).length ? `${Object.keys(personal).length} of ${people.length} people now show their own name when the link is shared on WhatsApp, not just inside the card.` : "Without this, everyone's link preview shows the same title. This makes each person's say their own name."}
              </p>
              {buildErr && <p className="text-xs text-destructive" role="alert">{buildErr}</p>}
            </div>
          )}
          <ul className="grid gap-2 max-h-80 overflow-auto">
            {people.map((p, i) => (
              <li key={i} className="flex items-center gap-2 rounded-xl border p-2">
                <span className="flex-1 min-w-0 truncate text-sm font-medium">{p.name}{p.phone && !isMobile(p.phone) && <span className="ml-2 text-xs text-muted-foreground">number not valid, you will choose the chat</span>}</span>
                <a href={href(p)} target="_blank" rel="noopener noreferrer" onClick={() => setSent((s) => ({ ...s, [i]: true }))}
                  className={"inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold " + (sent[i] ? "bg-muted text-muted-foreground" : "bg-[#25D366] text-[#06260F]")}>{sent[i] ? "Sent ✓" : "WhatsApp"}</a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">WhatsApp opens with the message ready for each person. You tap send. Names are kept only on this screen, not saved.</p>
        </>
      )}
    </div>
  );
}
