import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, PlayCircle, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "../shell/AppShell";
import { useAppStore, uid } from "../lib/store";
import { useRun } from "../lib/api";
import { APPS } from "../registry";

interface Checkpoint {
  at: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}
interface Lesson {
  id: string;
  videoId: string;
  title: string;
  checkpoints: Checkpoint[];
}

export const youTubeId = (url: string) => {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? m[1] : /^[\w-]{11}$/.test(url.trim()) ? url.trim() : null;
};
const secs = (t: string) => t.split(":").map(Number).reduce((a, b) => a * 60 + (b || 0), 0);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YTPlayer = any;
let ytReady: Promise<void> | null = null;
function loadYouTube(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve();
  if (!ytReady) {
    ytReady = new Promise((resolve) => {
      w.onYouTubeIframeAPIReady = () => resolve();
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return ytReady;
}

export default function InteractiveVideo({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const store = useAppStore<{ lessons: Lesson[]; savedAt?: number }>(toolId, { lessons: [] });
  const [form, setForm] = useState({ url: "", topic: "", transcript: "", duration: "10", count: "5" });
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState<Record<number, boolean>>({});
  const { busy, run } = useRun(toolId);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer>(null);
  const done = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!lesson || !host.current) return;
    let timer: ReturnType<typeof setInterval>;
    let alive = true;
    done.current = new Set();
    setScore({});
    void loadYouTube().then(() => {
      if (!alive || !host.current) return;
      host.current.innerHTML = '<div id="ez-yt"></div>';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      player.current = new (window as any).YT.Player("ez-yt", { videoId: lesson.videoId, width: "100%", height: "100%", playerVars: { rel: 0, modestbranding: 1 } });
      timer = setInterval(() => {
        const t = player.current?.getCurrentTime?.() ?? 0;
        const idx = lesson.checkpoints.findIndex((c, i) => !done.current.has(i) && t >= secs(c.at) && t < secs(c.at) + 2);
        if (idx >= 0) {
          done.current.add(idx);
          player.current?.pauseVideo?.();
          setActive(idx);
          setPicked(null);
        }
      }, 500);
    });
    return () => {
      alive = false;
      clearInterval(timer);
      player.current?.destroy?.();
    };
  }, [lesson]);

  const create = async () => {
    const vid = youTubeId(form.url);
    if (!vid) return toast.error("Paste a valid YouTube link.");
    if (!form.topic.trim() && !form.transcript.trim()) return toast.error("Add the video's topic or its transcript.");
    const out = await run<{ checkpoints: Checkpoint[] }>({
      inputs: { Topic: form.topic, "Video duration (minutes)": form.duration, "Number of checkpoints": form.count },
      context: form.transcript ? `Transcript:\n${form.transcript.slice(0, 25000)}` : undefined,
    });
    if (out?.checkpoints?.length) {
      const l = { id: uid(), videoId: vid, title: form.topic || "Video lesson", checkpoints: out.checkpoints.filter((c) => c.options?.length >= 2).sort((a, b) => secs(a.at) - secs(b.at)) };
      setLesson(l);
      store.update((d) => ({ lessons: [l, ...(d.lessons ?? [])].slice(0, 20) }));
    }
  };

  const cp = active !== null ? lesson?.checkpoints[active] : null;
  const correct = Object.values(score).filter(Boolean).length;

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState} steps={["Paste a YouTube link", "Generate checkpoints", "Watch & answer"]}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
            <div className="space-y-1"><Label htmlFor="iv-url" className="text-xs">YouTube link *</Label><Input id="iv-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://youtu.be/…" /></div>
            <div className="space-y-1"><Label htmlFor="iv-topic" className="text-xs">What the video teaches</Label><Input id="iv-topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Photosynthesis for class 7" /></div>
            <div className="space-y-1"><Label htmlFor="iv-tr" className="text-xs">Transcript (best results — YouTube ▸ … ▸ Show transcript)</Label><Textarea id="iv-tr" rows={4} value={form.transcript} onChange={(e) => setForm({ ...form, transcript: e.target.value })} placeholder="0:00 Today we will learn…" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label htmlFor="iv-d" className="text-xs">Length (min)</Label><Input id="iv-d" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="iv-c" className="text-xs">Questions</Label><Input id="iv-c" type="number" min={2} max={12} value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} /></div>
            </div>
            <Button className="w-full gap-2" onClick={create} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Create interactive lesson</Button>
          </div>
          {(store.data.lessons ?? []).length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-3">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your lessons</p>
              {(store.data.lessons ?? []).map((l) => (
                <button key={l.id} type="button" className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted" onClick={() => setLesson({ ...l })}>
                  <PlayCircle className="h-4 w-4 text-primary" /> <span className="truncate">{l.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/60 bg-black">
            <div ref={host} className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full" />
            {!lesson && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">Your interactive video plays here.</p>}
            {cp && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/75 p-4">
                <div className="w-full max-w-lg rounded-2xl bg-card p-5 text-foreground">
                  <p className="text-xs text-muted-foreground">Checkpoint at {cp.at}</p>
                  <p className="mt-1 font-semibold">{cp.question}</p>
                  <div className="mt-3 space-y-2">
                    {cp.options.map((o, i) => (
                      <button key={i} type="button" disabled={picked !== null} onClick={() => { setPicked(i); setScore((s) => ({ ...s, [active!]: i === cp.answer })); }}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${picked === null ? "hover:border-primary" : i === cp.answer ? "border-emerald-500 bg-emerald-500/10" : i === picked ? "border-destructive bg-destructive/10" : "opacity-60"}`}>
                        {o}
                      </button>
                    ))}
                  </div>
                  {picked !== null && (
                    <>
                      <p className="mt-3 flex items-start gap-2 text-sm">{picked === cp.answer ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <XCircle className="h-4 w-4 shrink-0 text-destructive" />}{cp.explanation}</p>
                      <Button className="mt-3 w-full" onClick={() => { setActive(null); player.current?.playVideo?.(); }}>Continue video</Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {lesson && (
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="text-sm font-semibold">{lesson.checkpoints.length} checkpoints · score {correct}/{Object.keys(score).length}</p>
              <ol className="mt-2 space-y-1 text-sm">
                {lesson.checkpoints.map((c, i) => (
                  <li key={i} className="flex gap-2">
                    <button type="button" className="font-mono text-xs text-primary hover:underline" onClick={() => { done.current.delete(i); player.current?.seekTo?.(Math.max(0, secs(c.at) - 1), true); player.current?.playVideo?.(); }}>{c.at}</button>
                    <span className="text-muted-foreground">{c.question}</span>
                    {i in score && (score[i] ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-destructive" />)}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
