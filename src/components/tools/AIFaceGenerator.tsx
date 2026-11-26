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

// Tweaks don't need to re-state "face" — "add glasses" or "warmer lighting" are legitimate
// edits on an already-generated face. Anything matching either list is allowed; a tweak that
// matches neither (e.g. "turn this into a sports car") is refused.
const EDIT_TERMS =
  /\b(background|backdrop|lighting|light|shadow|glow|studio|outdoor|indoor|scene|setting|clothing|clothes|outfit|shirt|dress|jacket|suit|tie|collar|uniform|hoodie|sweater|scarf|hat|cap|turban|veil|glasses|spectacles|sunglasses|earring|earrings|necklace|jewel(?:le)?ry|makeup|lipstick|blush|hairstyle|haircut|hair(?:colou?r)?|colou?r|tone|warm|cool|bright|dark(?:er|est)?|contrast|saturation|sharp|blur|angle|pose|posture|close[\s-]?up|zoom|crop|aspect|ratio|widescreen|vertical|horizontal|landscape|square|story|younger|older|age|background|tattoo|scar|age(?:d|ing)?)\b/i;

function isFaceRelated(prompt: string): boolean {
  return FACE_TERMS.test(prompt);
}

function isAllowedEdit(prompt: string): boolean {
  return FACE_TERMS.test(prompt) || EDIT_TERMS.test(prompt);
}

const ASPECT_OPTIONS: { value: string; label: string; css: string }[] = [
  { value: "1:1", label: "Square", css: "1 / 1" },
  { value: "16:9", label: "Widescreen", css: "16 / 9" },
  { value: "9:16", label: "Vertical", css: "9 / 16" },
  { value: "4:3", label: "4:3", css: "4 / 3" },
  { value: "3:4", label: "3:4", css: "3 / 4" },
];
const aspectCss = (ratio: string) => ASPECT_OPTIONS.find((a) => a.value === ratio)?.css ?? "1 / 1";

/** Reads an aspect ratio straight out of what the user typed, so a mention in the prompt
 *  itself (not just the selector) still reaches the API. */
function parseAspectFromText(text: string): string | null {
  const t = text.toLowerCase();
  if (/\b16\s*:\s*9\b/.test(t) || /\bwidescreen\b/.test(t) || /\blandscape\b/.test(t)) return "16:9";
  if (/\b9\s*:\s*16\b/.test(t) || /\b(portrait mode|vertical|story|reel)\b/.test(t)) return "9:16";
  if (/\b4\s*:\s*3\b/.test(t)) return "4:3";
  if (/\b3\s*:\s*4\b/.test(t)) return "3:4";
  if (/\b1\s*:\s*1\b|\bsquare\b/.test(t)) return "1:1";
  return null;
}

interface Version {
  n: number;
  url: string;
  prompt: string;
  aspect: string;
}

export const AIFaceGenerator = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const { data: catalog = [] } = useToolsCatalog();
  const title = catalog.find((t) => t.id === toolId)?.name ?? "AI Face Generator";
  const { busy, run } = useRun("ai-face-generator");

  const [prompt, setPrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [genGuard, setGenGuard] = useState<string | null>(null);
  const [editGuard, setEditGuard] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [current, setCurrent] = useState(0); // index into versions

  const shown = versions[current];

  const onPromptChange = (v: string) => {
    setPrompt(v);
    const found = parseAspectFromText(v);
    if (found) setAspect(found);
  };
  const onEditPromptChange = (v: string) => {
    setEditPrompt(v);
    const found = parseAspectFromText(v);
    if (found) setAspect(found);
  };

  const generate = async () => {
    const text = prompt.trim();
    if (!text || busy) return;
    setGenError(null);
    if (!isFaceRelated(text)) {
      setGenGuard("This generator only makes faces and portraits. Describe the person or face you want — their look, expression or style — and try again.");
      return;
    }
    setGenGuard(null);
    const url = await run<string>({
      prompt: `A realistic, detailed portrait of a face: ${text}.`,
      style: "portrait photography, sharp focus on the face",
      aspect,
    });
    if (url) {
      setVersions([{ n: 1, url, prompt: text, aspect }]);
      setCurrent(0);
    } else {
      setGenError("Couldn't generate that face. You were not charged — please try again.");
    }
  };

  const tweak = async () => {
    const text = editPrompt.trim();
    if (!text || !shown || busy) return;
    setEditError(null);
    if (!isAllowedEdit(text)) {
      setEditGuard("Describe a visual change to this face — background, lighting, clothing, glasses, hairstyle or aspect ratio — rather than a new subject.");
      return;
    }
    setEditGuard(null);
    const url = await run<string>({
      prompt: `Edit this exact face, keeping the same person and composition: ${text}.`,
      images: [shown.url],
      aspect,
    });
    if (url) {
      const n = versions.length + 1;
      setVersions((v) => [...v, { n, url, prompt: text, aspect }]);
      setCurrent(versions.length); // the new, last version
      setEditPrompt("");
    } else {
      setEditError("Couldn't apply that tweak. You were not charged — please try again.");
    }
  };

  const download = (v: Version) => {
    const a = document.createElement("a");
    a.href = v.url;
    a.download = `ai-face-v${v.n}.png`;
    a.click();
  };

  const AspectPicker = () => (
    <div className="flex flex-wrap gap-1.5">
      {ASPECT_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setAspect(o.value)}
          aria-pressed={aspect === o.value}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold transition",
            aspect === o.value ? "border-primary bg-primary text-primary-foreground" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
          )}
        >
          {o.label} <span className="opacity-70">{o.value}</span>
        </button>
      ))}
    </div>
  );

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
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="e.g. An elderly woman with silver hair, warm smile, soft studio lighting, 16:9"
            rows={3}
            className={SOFT_INPUT}
          />
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aspect ratio</p>
            <AspectPicker />
          </div>
          {genGuard && (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {genGuard}
            </p>
          )}
          {genError && (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {genError}
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
              <div
                className="mx-auto w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-muted dark:border-zinc-800"
                style={{ aspectRatio: aspectCss(shown.aspect) }}
              >
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
                onChange={(e) => onEditPromptChange(e.target.value)}
                placeholder="e.g. add round glasses, make them smile, change lighting to warm studio"
                rows={2}
                className={SOFT_INPUT}
              />
              <div className="mt-3">
                <AspectPicker />
              </div>
              {editGuard && (
                <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {editGuard}
                </p>
              )}
              {editError && (
                <p className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {editError}
                </p>
              )}
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
