import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Edit2, Check, X, Sparkles, ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { virasatService, type VirasatMessage } from "./services/virasatService";

interface ReviewPanelProps {
  conversation: VirasatMessage[];
  bookStyle: string;
  onStyleChange: (s: string) => void;
  onUpdateConversation: (next: VirasatMessage[]) => void;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function ReviewPanel({
  conversation,
  bookStyle,
  onStyleChange,
  onUpdateConversation,
  onBack,
  onGenerate,
  isGenerating,
}: ReviewPanelProps) {
  const [outline, setOutline] = useState<{ title: string; synopsis: string }[]>([]);
  const [loadingOutline, setLoadingOutline] = useState(true);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const userStories = conversation
    .map((m, i) => ({ ...m, _index: i }))
    .filter((m) => m.role === "user");

  useEffect(() => {
    let cancelled = false;
    setLoadingOutline(true);
    virasatService
      .chapterOutline(conversation)
      .then((r) => { if (!cancelled) setOutline(r.outline || []); })
      .catch((e) => console.error("outline err", e))
      .finally(() => { if (!cancelled) setLoadingOutline(false); });
    return () => { cancelled = true; };
  }, [conversation]);

  const deleteStory = (idx: number) => {
    const next = conversation.filter((_, i) => i !== idx);
    // Also remove the question right before it (model turn)
    if (idx > 0 && conversation[idx - 1]?.role === "model") {
      next.splice(idx - 1, 1);
    }
    onUpdateConversation(next);
  };

  const saveEdit = (idx: number) => {
    const next = conversation.map((m, i) => (i === idx ? { ...m, text: editText } : m));
    onUpdateConversation(next);
    setEditIndex(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="h-7 w-7 text-primary" />
        <h2 className="text-3xl font-serif font-bold text-foreground">Aapki Kahani Ka Jaiza</h2>
      </div>

      {/* Book style */}
      <Card className="p-6 mb-6 bg-card/50 backdrop-blur border-border">
        <h3 className="font-semibold mb-4 text-foreground">Kitaab ka Andaaz chunein</h3>
        <RadioGroup value={bookStyle} onValueChange={onStyleChange} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { v: "emotional", label: "Dil Se", desc: "Bhavnaon se bhari, kavyatmak" },
            { v: "factual", label: "Sahi Yaadein", desc: "Saaf, sachhi, tareekhon ke saath" },
            { v: "legacy", label: "Seekh", desc: "Har kahani mein ek sandesh" },
          ].map((s) => (
            <Label key={s.v} htmlFor={s.v} className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${bookStyle === s.v ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
              <RadioGroupItem value={s.v} id={s.v} className="mt-1" />
              <div>
                <div className="font-semibold text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </Card>

      {/* Outline preview */}
      <Card className="p-6 mb-6 bg-card/50 backdrop-blur border-border">
        <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Adhyay Preview (AI generated)
        </h3>
        {loadingOutline ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Outline taiyar kar raha hoon...</div>
        ) : outline.length === 0 ? (
          <p className="text-sm text-muted-foreground">Outline available nahi. Aap fir bhi kitaab bana sakte hain.</p>
        ) : (
          <ol className="space-y-2 list-decimal list-inside">
            {outline.map((c, i) => (
              <li key={i} className="text-foreground">
                <span className="font-medium">{c.title}</span>
                <span className="text-muted-foreground italic"> — {c.synopsis}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* Stories */}
      <Card className="p-6 mb-6 bg-card/50 backdrop-blur border-border">
        <h3 className="font-semibold mb-4 text-foreground">
          Aapki Kahaniyan ({userStories.length})
        </h3>
        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
          {userStories.map((s) => {
            const q = conversation[s._index - 1]?.role === "model" ? conversation[s._index - 1].text : "Pehla sawaal";
            return (
              <div key={s._index} className="border border-border rounded-lg p-4 bg-background/50">
                <div className="text-xs text-muted-foreground mb-2 italic">Q: {q}</div>
                {editIndex === s._index ? (
                  <>
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="mb-2" rows={4} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(s._index)}><Check className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditIndex(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-foreground whitespace-pre-wrap">{s.text}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="ghost" onClick={() => { setEditIndex(s._index); setEditText(s.text); }}>
                        <Edit2 className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteStory(s._index)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-1" /> Hatayein
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Button variant="outline" onClick={onBack} disabled={isGenerating}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Aur stories add karein
        </Button>
        <Button size="lg" onClick={onGenerate} disabled={isGenerating || userStories.length === 0} className="gap-2">
          {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Kitaab ban rahi hai...</> : <><Sparkles className="h-4 w-4" /> Kitaab Banayein</>}
        </Button>
      </div>
    </motion.div>
  );
}
