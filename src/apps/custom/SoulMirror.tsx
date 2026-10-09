import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Copy, Loader2, Share2, Sparkles, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/common/Markdown";
import { AppShell } from "../shell/AppShell";
import { useAppStore } from "../lib/store";
import { useRun } from "../lib/api";
import { APPS } from "../registry";

const WORDS = ["able", "accepting", "adaptable", "bold", "brave", "calm", "caring", "cheerful", "clever", "complex", "confident", "dependable", "dignified", "energetic", "extroverted", "friendly", "giving", "happy", "helpful", "idealistic", "independent", "ingenious", "intelligent", "introverted", "kind", "knowledgeable", "logical", "loving", "mature", "modest", "nervous", "observant", "organised", "patient", "powerful", "proud", "quiet", "reflective", "relaxed", "religious", "responsive", "searching", "self-assertive", "self-conscious", "sensible", "sentimental", "shy", "silly", "spontaneous", "sympathetic", "tense", "trustworthy", "warm", "wise", "witty"];
const PICK = 6;

const enc = (o: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const dec = <T,>(s: string): T | null => {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(s.trim().replace(/-/g, "+").replace(/_/g, "/")))));
  } catch {
    return null;
  }
};

function WordGrid({ picked, onToggle }: { picked: number[]; onToggle: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {WORDS.map((w, i) => {
        const on = picked.includes(i);
        return (
          <button key={w} type="button" aria-pressed={on} onClick={() => onToggle(i)} className={`rounded-full border px-3 py-1 text-sm capitalize transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-ink"}`}>
            {w}
          </button>
        );
      })}
    </div>
  );
}

export default function SoulMirror({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const [params] = useSearchParams();
  const forName = params.get("jw_for");
  const store = useAppStore<{ name: string; self: number[]; friends: { name: string; picks: number[] }[]; reading?: string; savedAt?: number }>(toolId, { name: "", self: [], friends: [] });
  const d = store.data;
  const [code, setCode] = useState("");
  const [friendPicks, setFriendPicks] = useState<number[]>([]);
  const [friendName, setFriendName] = useState("");
  const { busy, run } = useRun(toolId);
  const toggle = (list: number[], i: number) => (list.includes(i) ? list.filter((x) => x !== i) : list.length >= PICK ? list : [...list, i]);

  const windowAreas = useMemo(() => {
    const self = new Set(d.self ?? []);
    const others = new Map<number, number>();
    (d.friends ?? []).forEach((f) => f.picks.forEach((p) => others.set(p, (others.get(p) ?? 0) + 1)));
    const label = (i: number) => `${WORDS[i]}${others.get(i) ? ` (${others.get(i)})` : ""}`;
    return {
      Open: [...self].filter((i) => others.has(i)).map(label),
      Blind: [...others.keys()].filter((i) => !self.has(i)).map(label),
      Hidden: [...self].filter((i) => !others.has(i)).map((i) => WORDS[i]),
      Unknown: WORDS.filter((_, i) => !self.has(i) && !others.has(i)),
    };
  }, [d.self, d.friends]);

  // ── Friend mode: someone opened a share link ──
  if (forName) {
    const reply = friendPicks.length ? enc({ n: friendName || "A friend", p: friendPicks }) : "";
    return (
      <AppShell toolId={toolId} intro={`${forName} asked you to pick ${PICK} words that describe them. It takes one minute — no sign-in needed.`}>
        <div className="space-y-4 rounded-2xl border-2 border-ink bg-card p-5">
          <Input value={friendName} onChange={(e) => setFriendName(e.target.value)} placeholder="Your name (optional)" className="max-w-xs" aria-label="Your name" />
          <p className="text-sm font-medium">Pick {PICK} words that describe {forName} ({friendPicks.length}/{PICK})</p>
          <WordGrid picked={friendPicks} onToggle={(i) => setFriendPicks((x) => toggle(x, i))} />
          {friendPicks.length === PICK && (
            <div className="rounded-xl bg-primary/5 p-4">
              <p className="text-sm font-semibold">Send this reply code back to {forName}:</p>
              <code className="mt-2 block break-all rounded-lg bg-background p-2 text-xs">{reply}</code>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" className="gap-1.5" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`My Johari Window answers for you: ${reply}`)}`, "_blank", "noopener,noreferrer")}><Share2 className="h-3.5 w-3.5" /> Send on WhatsApp</Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { void navigator.clipboard.writeText(reply); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /> Copy code</Button>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  const shareLink = `${window.location.origin}/tool/${toolId}?jw_for=${encodeURIComponent(d.name || "me")}`;

  const addFriend = () => {
    const raw = code.match(/[A-Za-z0-9_-]{8,}/g)?.pop() ?? "";
    const r = dec<{ n: string; p: number[] }>(raw);
    if (!r || !Array.isArray(r.p)) return toast.error("That code didn't work — ask your friend to copy it again.");
    store.update((x) => ({ friends: [...(x.friends ?? []), { name: r.n || "Friend", picks: r.p.filter((i) => i >= 0 && i < WORDS.length).slice(0, PICK) }] }));
    setCode("");
    toast.success(`Added ${r.n || "a friend"}'s answers`);
  };

  const interpret = async () => {
    const out = await run<string>({ inputs: { Name: d.name, ...Object.fromEntries(Object.entries(windowAreas).map(([k, v]) => [`${k} area`, k === "Unknown" ? `${v.length} words` : v.join(", ") || "—"])), "Friends who answered": String((d.friends ?? []).length) } });
    if (out) store.update({ reading: out });
  };

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState} steps={["Pick your 6 words", "Share the link with friends", "Add their codes, see your window"]}>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border-2 border-ink bg-card p-4">
            <Input value={d.name} onChange={(e) => store.update({ name: e.target.value })} placeholder="Your first name" className="max-w-xs" aria-label="Your name" />
            <p className="text-sm font-medium">1. Pick {PICK} words that describe you ({(d.self ?? []).length}/{PICK})</p>
            <WordGrid picked={d.self ?? []} onToggle={(i) => store.update((x) => ({ self: toggle(x.self ?? [], i) }))} />
          </div>
          <div className="space-y-3 rounded-2xl border-2 border-ink bg-card p-4">
            <p className="text-sm font-medium">2. Ask friends, family or colleagues</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-1.5" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Can you pick 6 words that describe me? Takes a minute: ${shareLink}`)}`, "_blank", "noopener,noreferrer")}><Share2 className="h-3.5 w-3.5" /> Share on WhatsApp</Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { void navigator.clipboard.writeText(shareLink); toast.success("Link copied"); }}><Copy className="h-3.5 w-3.5" /> Copy link</Button>
            </div>
            <p className="text-sm font-medium">3. Paste the reply codes they send back</p>
            <div className="flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste a reply code" aria-label="Reply code" />
              <Button onClick={addFriend} className="gap-1.5"><UserPlus className="h-4 w-4" /> Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(d.friends ?? []).map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                  {f.name}
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => store.update((x) => ({ friends: (x.friends ?? []).filter((_, j) => j !== i) }))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {([["Open", "Known to you and others", "bg-emerald-500/10"], ["Blind", "Others see, you don't", "bg-amber-500/10"], ["Hidden", "You see, others don't", "bg-sky-500/10"], ["Unknown", "Not picked by anyone", "bg-muted/50"]] as const).map(([k, sub, cls]) => (
              <div key={k} className={`min-h-[140px] rounded-2xl p-3 ${cls}`}>
                <p className="text-sm font-bold">{k}</p>
                <p className="text-[11px] text-muted-foreground">{sub}</p>
                <p className="mt-2 text-xs capitalize leading-relaxed">{k === "Unknown" ? `${windowAreas.Unknown.length} words` : windowAreas[k].join(", ") || "—"}</p>
              </div>
            ))}
          </div>
          <Button className="w-full gap-2" onClick={interpret} disabled={busy || (d.self ?? []).length < 3}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Get my reflection</Button>
          {(d.friends ?? []).length === 0 && <p className="text-center text-xs text-muted-foreground">Works best with answers from 3 or more people.</p>}
          {d.reading && <div className="rounded-2xl border-2 border-ink bg-card p-4"><Markdown>{d.reading}</Markdown></div>}
        </div>
      </div>
    </AppShell>
  );
}
