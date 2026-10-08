import { useEffect, useRef, useState } from "react";
import { FileAudio, ListMusic, Play, Plus, Trash2, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "../shell/AppShell";
import { useAppStore, uid } from "../lib/store";
import { APPS } from "../registry";

interface Item {
  id: string;
  title: string;
  src: string;
  category: string;
  pos?: number;
}

const CATS = ["Pravachan", "Bhakti / Stavan", "Lessons", "Pooja & Path", "Kids", "Other"];
const yt = (url: string): { video?: string; list?: string } | null => {
  const list = url.match(/[?&]list=([\w-]+)/)?.[1];
  const video = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/)?.[1];
  return list || video ? { video, list } : null;
};

/** Personal video (YouTube) or audio library with playlists and resume — no AI, free. */
export default function MediaLibrary({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const audio = toolId === "jain-audio-stream";
  const store = useAppStore<{ items: Item[]; lastId?: string; savedAt?: number }>(toolId, { items: [] });
  const items = store.data.items ?? [];
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [filter, setFilter] = useState("All");
  const [local, setLocal] = useState<Item[]>([]);
  const [current, setCurrent] = useState<Item | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!current && store.data.lastId) setCurrent(items.find((i) => i.id === store.data.lastId) ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.data.lastId, items.length]);

  const add = () => {
    const u = url.trim();
    if (!u) return;
    if (!audio && !yt(u)) return toast.error("Paste a YouTube video or playlist link.");
    if (audio && !/^https:\/\//i.test(u)) return toast.error("Use an https link to an audio file (mp3, m4a…), or add files from your device.");
    store.update({ items: [{ id: uid(), title: title.trim() || u.replace(/^https?:\/\//, "").slice(0, 60), src: u, category: cat }, ...items] });
    setUrl("");
    setTitle("");
  };

  const play = (it: Item) => {
    setCurrent(it);
    if (!it.src.startsWith("blob:")) store.update({ lastId: it.id });
  };

  const all = [...local, ...items];
  const shown = filter === "All" ? all : all.filter((i) => i.category === filter);
  const ytInfo = current && !audio ? yt(current.src) : null;
  const embed = ytInfo ? (ytInfo.list ? `https://www.youtube-nocookie.com/embed/${ytInfo.video ?? "videoseries"}?list=${ytInfo.list}&rel=0` : `https://www.youtube-nocookie.com/embed/${ytInfo.video}?rel=0`) : "";

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-4">
          {audio ? (
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="truncate font-semibold">{current?.title ?? "Nothing playing"}</p>
              <p className="text-xs text-muted-foreground">{current?.category}</p>
              <audio
                ref={audioRef}
                key={current?.id}
                src={current?.src}
                controls
                autoPlay={!!current}
                className="mt-3 w-full"
                onLoadedMetadata={(e) => { if (current?.pos) e.currentTarget.currentTime = current.pos; }}
                onPause={(e) => { if (current && !current.src.startsWith("blob:")) { const pos = e.currentTarget.currentTime; store.update({ items: items.map((i) => (i.id === current.id ? { ...i, pos } : i)) }); } }}
                onEnded={() => { const i = shown.findIndex((x) => x.id === current?.id); if (i >= 0 && shown[i + 1]) play(shown[i + 1]); }}
              />
            </div>
          ) : (
            <div className="aspect-video overflow-hidden rounded-2xl border border-border/60 bg-black">
              {embed ? <iframe key={embed} src={embed} title={current?.title ?? "Video"} className="h-full w-full" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <p className="flex h-full items-center justify-center p-6 text-center text-sm text-white/70">Add a video link to start your library.</p>}
            </div>
          )}
          <form className="space-y-2 rounded-2xl border border-border/60 bg-card p-4" onSubmit={(e) => { e.preventDefault(); add(); }}>
            <p className="text-sm font-semibold">Add to your library</p>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={audio ? "https://…/stavan.mp3" : "YouTube video or playlist link"} aria-label="Link" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" aria-label="Title" />
              <select className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">{CATS.map((c) => <option key={c}>{c}</option>)}</select>
              <Button type="submit" className="gap-1.5"><Plus className="h-4 w-4" /> Add</Button>
            </div>
            {audio && (
              <>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}><FileAudio className="h-3.5 w-3.5" /> Play files from this device</Button>
                <input ref={fileRef} type="file" accept="audio/*" multiple className="hidden" onChange={(e) => { const fs = Array.from(e.target.files ?? []); setLocal((l) => [...fs.map((f) => ({ id: uid(), title: f.name.replace(/\.[^.]+$/, ""), src: URL.createObjectURL(f), category: cat })), ...l]); e.target.value = ""; }} />
                <p className="text-[11px] text-muted-foreground">Device files play only in this session (they aren't uploaded). Links are saved to your library.</p>
              </>
            )}
          </form>
        </div>
        <aside className="rounded-2xl border border-border/60 bg-card p-3">
          <div className="flex items-center gap-2 px-1"><ListMusic className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Library ({all.length})</p></div>
          <div className="mt-2 flex flex-wrap gap-1 px-1">{["All", ...CATS].map((c) => <button key={c} type="button" onClick={() => setFilter(c)} className={`rounded-full border px-2 py-0.5 text-[11px] ${filter === c ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}>{c}</button>)}</div>
          <ul className="mt-2 max-h-[60vh] space-y-0.5 overflow-y-auto">
            {shown.map((it) => (
              <li key={it.id} className={`group flex items-center gap-1 rounded-lg ${current?.id === it.id ? "bg-muted" : ""}`}>
                <button type="button" className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm" onClick={() => play(it)}>
                  {audio ? <Play className="h-3.5 w-3.5 shrink-0 text-primary" /> : <Youtube className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                  <span className="truncate">{it.title}</span>
                </button>
                <Button size="icon" variant="ghost" className="h-7 w-7 opacity-60 group-hover:opacity-100" aria-label={`Remove ${it.title}`} onClick={() => { setLocal((l) => l.filter((x) => x.id !== it.id)); store.update({ items: items.filter((x) => x.id !== it.id) }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
              </li>
            ))}
            {!shown.length && <p className="px-2 py-6 text-center text-xs text-muted-foreground">Your saved {audio ? "audio" : "videos"} appear here, synced to your account.</p>}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
