import { useRef, useState } from "react";
import { Download, FileUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppShell } from "../shell/AppShell";
import { useAppStore, uid } from "../lib/store";
import { runApp, NeedsCredits, errorText } from "../lib/api";
import { downloadText, fileText, toCsv } from "../lib/files";
import { APPS } from "../registry";

interface Profile {
  id: string;
  file: string;
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  skills: string[];
  languages: string[];
  experience: { title: string; company: string; start: string; end: string; highlights: string[] }[];
  education: { degree: string; institution: string; year: string }[];
  certifications: string[];
}

export default function ProfileExtractor({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const store = useAppStore<{ profiles: Profile[]; savedAt?: number }>(toolId, { profiles: [] });
  const profiles = store.data.profiles ?? [];
  const [queue, setQueue] = useState<{ name: string; state: string }[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const process = async (files: File[]) => {
    const list = files.slice(0, 20);
    setQueue(list.map((f) => ({ name: f.name, state: "waiting" })));
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const mark = (state: string) => setQueue((q) => q.map((x, j) => (j === i ? { ...x, state } : x)));
      try {
        mark("reading");
        const text = await fileText(f);
        if (text.replace(/--- Page \d+ ---/g, "").trim().length < 40) {
          mark("no text (scanned?)");
          continue;
        }
        mark("extracting");
        const p = await runApp<Omit<Profile, "id" | "file">>(toolId, { context: text.slice(0, 25000), inputs: { "File name": f.name } });
        const prof = { ...p, id: uid(), file: f.name } as Profile;
        store.update((d) => ({ profiles: [prof, ...(d.profiles ?? [])].slice(0, 200) }));
        mark("done");
      } catch (e) {
        if (e instanceof NeedsCredits) {
          mark("stopped — add credits");
          break;
        }
        mark(errorText(e).slice(0, 60));
      }
    }
  };

  const csv = () => {
    const rows = profiles.map((p) => ({
      ...p,
      skills: (p.skills ?? []).join("; "),
      languages: (p.languages ?? []).join("; "),
      latest: p.experience?.[0] ? `${p.experience[0].title} at ${p.experience[0].company}` : "",
      education: (p.education ?? []).map((e) => `${e.degree} ${e.institution} ${e.year}`.trim()).join("; "),
    }));
    downloadText(toCsv(rows, [["name", "Name"], ["headline", "Headline"], ["email", "Email"], ["phone", "Phone"], ["location", "Location"], ["latest", "Latest role"], ["skills", "Skills"], ["education", "Education"], ["linkedin", "LinkedIn"], ["file", "Source file"]].map(([key, label]) => ({ key, label }))), "profiles.csv", "text/csv");
  };

  const open = profiles.find((p) => p.id === openId);

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState} wide steps={["Add resume PDFs", "AI extracts each profile", "Review & export CSV"]}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="space-y-3">
          <button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-[150px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-6 hover:border-primary/50">
            <FileUp className="h-7 w-7 text-primary" />
            <span className="mt-2 font-medium">Add resumes (PDF or text)</span>
            <span className="text-xs text-muted-foreground">Up to 20 at a time · {def.credits} credits per profile</span>
          </button>
          <input ref={fileRef} type="file" multiple accept=".pdf,.txt,application/pdf" className="hidden" onChange={(e) => { void process(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
          {queue.length > 0 && (
            <ul className="space-y-1 rounded-2xl border-2 border-ink bg-card p-3 text-xs">
              {queue.map((q, i) => <li key={i} className="flex justify-between gap-2"><span className="truncate">{q.name}</span><span className={q.state === "done" ? "text-emerald-600" : "text-muted-foreground"}>{["reading", "extracting"].includes(q.state) && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}{q.state}</span></li>)}
            </ul>
          )}
        </div>
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{profiles.length} profiles</p>
            <Button size="sm" variant="outline" className="gap-1.5" disabled={!profiles.length} onClick={csv}><Download className="h-3.5 w-3.5" /> Export CSV</Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border-2 border-ink bg-card">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="p-2">Name</th><th className="p-2">Latest role</th><th className="p-2">Email / phone</th><th className="p-2">Location</th><th /></tr></thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="cursor-pointer border-t border-border/50 hover:bg-muted/30" onClick={() => setOpenId(p.id === openId ? null : p.id)}>
                    <td className="p-2 font-medium">{p.name || p.file}</td>
                    <td className="p-2">{p.experience?.[0] ? `${p.experience[0].title}, ${p.experience[0].company}` : p.headline}</td>
                    <td className="p-2 text-xs">{p.email}<br />{p.phone}</td>
                    <td className="p-2">{p.location}</td>
                    <td className="p-2"><Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Delete" onClick={(e) => { e.stopPropagation(); store.update((d) => ({ profiles: (d.profiles ?? []).filter((x) => x.id !== p.id) })); }}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                ))}
                {!profiles.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Extracted profiles appear here.</td></tr>}
              </tbody>
            </table>
          </div>
          {open && (
            <div className="space-y-2 rounded-2xl border-2 border-ink bg-card p-4 text-sm">
              <p className="text-base font-semibold">{open.name} <span className="font-normal text-muted-foreground">· {open.headline}</span></p>
              {open.summary && <p className="text-muted-foreground">{open.summary}</p>}
              {open.skills?.length > 0 && <div className="flex flex-wrap gap-1">{open.skills.map((s) => <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs">{s}</span>)}</div>}
              {(open.experience ?? []).map((x, i) => <div key={i}><p className="font-medium">{x.title} — {x.company} <span className="text-xs text-muted-foreground">{x.start}–{x.end}</span></p><ul className="ml-4 list-disc text-xs text-muted-foreground">{(x.highlights ?? []).map((h, j) => <li key={j}>{h}</li>)}</ul></div>)}
              {(open.education ?? []).map((x, i) => <p key={i} className="text-xs">{x.degree}, {x.institution} {x.year}</p>)}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
