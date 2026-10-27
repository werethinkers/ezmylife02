import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Content, Product } from "./types";
import { langById, parsePeople, personalLink, type LangId } from "./festLang";
import { fill, isMobile, waTo, waShare } from "./util";

/** Send the same card to many people, each with their own name on it: one tap per person on WhatsApp. */
/** lang: the card language the sender chose in the share kit; every person gets their card in it. */
export function BulkSend({ product, content, link, lang = "en" }: { product: Product; content: Content; link: string; lang?: LangId }) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [sent, setSent] = useState<Record<number, boolean>>({});
  const people = parsePeople(text);
  const isDiwali = product.opts.art === "diya";
  const L = langById(lang);

  const msgFor = (name: string) => {
    const l = personalLink(link, name, lang);
    const first = isDiwali ? L.share : product.opts.greeting;
    return `${product.glyph} ${first}, ${name}!\n${fill("A little greeting from {sender}:", content)}\n${l}`;
  };
  const href = (p: { name: string; phone: string }) => (isMobile(p.phone) ? waTo(p.phone, msgFor(p.name)) : waShare(msgFor(p.name)));
  const copyAll = async () => {
    const out = people.map((p) => `${p.name}\n${msgFor(p.name)}`).join("\n\n");
    try { await navigator.clipboard.writeText(out); toast({ title: `${people.length} messages copied`, description: "Each has its greeting and personal link." }); } catch { toast({ title: "Could not copy", description: "Use the WhatsApp button for each person." }); }
  };

  return (
    <div className="grid gap-3">
      <div className="font-semibold">Send to many people, each with their name</div>
      <p className="text-sm text-muted-foreground">Add one person per line, like <span className="font-mono">Rahul Sharma, 98xxxxxx12</span>. The phone number is optional. Each person gets "Dear Rahul," on their own card. Up to 200 people.</p>
      <textarea value={text} onChange={(e) => { setText(e.target.value); setSent({}); }} rows={5} placeholder={"Rahul Sharma, 9876543210\nMeena Aunty\nThe Patels"} className="w-full rounded-xl border bg-background p-3 text-sm" aria-label="People to send to" />
      {people.length > 0 && (
        <>
          <div className="flex items-center justify-between text-sm"><span>{people.length} {people.length === 1 ? "person" : "people"} · {Object.keys(sent).length} sent</span>
            <Button variant="outline" size="sm" onClick={copyAll}><Copy className="h-4 w-4 mr-1" /> Copy all messages</Button></div>
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
