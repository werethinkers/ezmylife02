import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Wand2, Download, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRun } from "@/apps/lib/api";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";

// Soft, Home-style card/border: no neo-brutalist thick border or hard offset shadow here.
const SOFT_CARD = "rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";
const SOFT_INPUT = "border-zinc-200 shadow-sm focus-visible:ring-primary dark:border-zinc-800";

// A face/portrait generator should only generate faces. This is a lightweight allowlist check
// run before any paid call, so an off-topic prompt (a car, a logo, a landscape…) is refused for
// free in the UI instead of spending a generation on something this tool was never meant to make.
const FACE_TERMS =
  /\b(face|faces|facial|portrait|headshot|head[\s-]?shot|selfie|avatar|visage|person|people|human|man|men|woman|women|boy|girl|child|kid|baby|infant|toddler|teen|teenager|elder|elderly|grandmother|grandfather|mother|father|king|queen|prince|princess|warrior|knight|wizard|witch|soldier|doctor|nurse|teacher|student|model|actor|actress|celebrity|character|smile|smiling|eyes|eyebrow|nose|mouth|lips|cheek|jaw|chin|forehead|hair|beard|mustache|moustache|skin|complexion|expression|wrinkle|freckle)\b/i;

function isFaceRelated(prompt: string): boolean {
  return FACE_TERMS.test(prompt);
}

interface Version {
  n: number;
  url: string;
  prompt: string;
}

export const AIFaceGenerator = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const { data: catalog = [] } = useToolsCatalog();
  const title = catalog.find((t) => t.id === toolId)?.name ?? "AI Face Generator";
  const { busy, run } = useRun("ai-face-generator");

  const [prompt, setPrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [guardMessage, setGuardMessage] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [current, setCurrent] = useState(0); // index into versions

  const shown = versions[current];

  const generate = async () => {
    const text = prompt.trim();
    if (!text) return;
    if (!isFaceRelated(text)) {
      setGuardMessage("This generator only makes faces and portraits. Describe the person or face you want — their look, expression or style — and try again.");
      return;
    }
    setGuardMessage(null);
    const url = await run<string>({
      prompt: `A realistic, detailed portrait of a face: ${text}.`,
      style: "portrait photography, sharp focus on the face",
      aspect: "1:1",
    });
    if (url) {
      setVersions([{ n: 1, url, prompt: text }]);
      setCurrent(0);
    }
  };

  const tweak = async () => {
    const text = editPrompt.trim();
    if (!text || !shown) return;
    const url = await run<string>({
      prompt: `Edit this exact face, keeping the same person and composition: ${text}.`,
      images: [shown.url],
    });
    if (url) {
      const n = versions.length + 1;
      setVersions((v) => [...v, { n, url, prompt: text }]);
      setCurrent(versions.length); // the new, last version
      setEditPrompt("");
    }
  };

  const download = (v: Version) => {
    const a = document.createElement("a");
    a.href = v.url;
    a.download = `ai-face-v${v.n}.png`;
    a.click();
  };

  return (
    <div className="px-4 py-6 md:py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl md:text-3xl">{title}</h1>
          <p className="text-muted-foreground">Describe a face and we'll generate it — then tweak it as many times as you like.</p>
        </div>

        <div className={SOFT_CARD}>
          <label htmlFor="face-prompt" className="mb-2 block text-sm font-semibold">
            Describe the face or portrait
          </label>
          <Textarea
            id="face-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. An elderly woman with silver hair, warm smile, soft studio lighting"
            rows={3}
            className={SOFT_INPUT}
          />
          {guardMessage && (
            <p className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {guardMessage}
            </p>
          )}
          <div className="mt-3 flex justify-end">
            <Button onClick={() => void generate()} disabled={busy || !prompt.trim()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate face
            </Button>
          </div>
        </div>

        {shown && (
          <>
            <div className={SOFT_CARD}>
              <h3 className="mb-3 font-bold">Result — v{shown.n}</h3>
              <div className="aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-muted dark:border-zinc-800">
                <img src={shown.url} alt={shown.prompt} className="h-full w-full object-contain" />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="truncate text-sm text-muted-foreground">{shown.prompt}</p>
                <Button variant="outline" size="sm" className={SOFT_INPUT} onClick={() => download(shown)}>
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
              </div>
            </div>

            {versions.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {versions.map((v, i) => (
                  <button
                    key={v.n}
                    type="button"
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "overflow-hidden rounded-xl border p-0.5 transition",
                      i === current ? "border-primary ring-2 ring-primary" : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800",
                    )}
                    aria-label={`View version ${v.n}`}
                    aria-current={i === current ? "true" : undefined}
                  >
                    <img src={v.url} alt={`v${v.n}`} className="h-14 w-14 rounded-lg object-cover" />
                    <span className="block text-center text-[11px] font-semibold">v{v.n}</span>
                  </button>
                ))}
              </div>
            )}

            <div className={SOFT_CARD}>
              <label htmlFor="face-edit" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Wand2 className="h-4 w-4" /> Tweak this face
              </label>
              <Textarea
                id="face-edit"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="e.g. add round glasses, make them smile, change lighting to warm studio"
                rows={2}
                className={SOFT_INPUT}
              />
              <div className="mt-3 flex justify-end">
                <Button onClick={() => void tweak()} disabled={busy || !editPrompt.trim()}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Apply tweak
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
