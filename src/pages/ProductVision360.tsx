import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { callFunction, functionError } from "@/lib/credits";
import { BuyCreditsDialog } from "@/components/wallet/BuyCreditsDialog";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { useToolPricing } from "@/hooks/useToolPricing";
import { FileUpload, fileToPayload } from "@/components/productvision360/FileUpload";
import { AnglesGrid } from "@/components/productvision360/AnglesGrid";
import { BackgroundStudio } from "@/components/productvision360/BackgroundStudio";
import { Downloads } from "@/components/productvision360/Downloads";
import {
  AngleName, AngleResult, DEFAULT_ANGLES, OPTIONAL_ANGLES,
} from "@/components/productvision360/types";
import { removeWhiteBackground } from "@/components/productvision360/utils/backgroundRemover";
import { motion } from "framer-motion";
import { Sparkles, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRefreshWallet } from "@/hooks/useWallet";

type Phase = "start" | "generating" | "done";

const ProductVision360 = () => {
  const [phase, setPhase] = useState<Phase>("start");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedAngles, setSelectedAngles] = useState<AngleName[]>(DEFAULT_ANGLES);
  const [results, setResults] = useState<AngleResult[]>([]);
  const [buyOpen, setBuyOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [need, setNeed] = useState({ required: 0, balance: 0 });
  const refreshWallet = useRefreshWallet();
  // Charged per angle that is actually generated (the server creates the price row on first use).
  const { creditCost: anglePrice } = useToolPricing("productvision-angle");
  const perAngle = anglePrice > 0 ? anglePrice : 27;

  const toggleAngle = (a: AngleName) => {
    setSelectedAngles((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  };

  const handleFile = async (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    await runGeneration(file);
  };

  const runGeneration = async (file: File) => {
    setPhase("generating");
    setResults(selectedAngles.map((a) => ({ angle: a, status: "pending" })));

    try {
      const { base64, mimeType } = await fileToPayload(file);
      // The server checks the balance for every angle, then charges only for angles that come back.
      const data = await callFunction<{
        success: boolean;
        images: Array<{ angle: AngleName; mimeType: string; base64: string }>;
        failed: Array<{ angle: AngleName; error: string }>;
        credits_charged?: number;
      }>("productvision-angles", { imageBase64: base64, mimeType, angles: selectedAngles });

      const next: AngleResult[] = selectedAngles.map((a) => {
        const img = data.images?.find((i) => i.angle === a);
        if (img) {
          return { angle: a, status: "done", url: `data:${img.mimeType};base64,${img.base64}` };
        }
        const fail = data.failed?.find((f) => f.angle === a);
        return { angle: a, status: "failed", error: fail?.error };
      });

      // Compute transparent versions in parallel
      await Promise.all(next.map(async (r) => {
        if (r.status === "done" && r.url) {
          try { r.transparentUrl = await removeWhiteBackground(r.url); } catch { /* keep the original */ }
        }
      }));

      setResults(next);
      const successCount = next.filter((r) => r.status === "done").length;
      refreshWallet();
      if (successCount === 0) {
        toast.error("All angles failed. You were not charged.");
        setPhase("start");
        return;
      }
      const charged = data.credits_charged ?? successCount * perAngle;
      toast.success(`${successCount}/${next.length} angles generated · ${charged} credits used${successCount < next.length ? " (failed angles are free)" : ""}`);
      setPhase("done");
    } catch (e) {
      const info = await functionError(e);
      setPhase("start");
      setResults([]);
      if (info?.status === 402) {
        setNeed({ required: info.data?.credits_required ?? perAngle * selectedAngles.length, balance: info.data?.balance ?? 0 });
        setBuyOpen(true);
        return;
      }
      if (info?.status === 401) {
        setLoginOpen(true);
        return;
      }
      toast.error("Generation failed. You were not charged.");
    }
  };

  const reset = () => {
    setPhase("start");
    setResults([]);
    setPreviewUrl(null);
    setSelectedAngles(DEFAULT_ANGLES);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-8 md:mb-10"
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" /> ProductVision 360
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Catalog-grade product angles in one click
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Upload a single product photo. We'll generate a clean, multi-angle product set, swap backgrounds, and let you download a ready-to-publish pack. <span className="text-foreground font-medium">{perAngle} credits per angle</span> generated — angles that fail are free.
          </p>
        </motion.div>

        {phase === "start" && (
          <div className="space-y-6">
            <Card className="p-5 bg-card/50 backdrop-blur border-border space-y-4">
              <h3 className="font-semibold">Choose angles</h3>
              <div className="flex flex-wrap gap-2">
                {[...DEFAULT_ANGLES, ...OPTIONAL_ANGLES].map((a) => {
                  const active = selectedAngles.includes(a);
                  return (
                    <button
                      key={a}
                      onClick={() => toggleAngle(a)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/50"}`}
                    >
                      <Checkbox checked={active} className="h-3.5 w-3.5 pointer-events-none" />
                      {a}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedAngles.length} angle{selectedAngles.length === 1 ? "" : "s"} selected · up to {selectedAngles.length * perAngle} credits · ~10–15s per angle
              </p>
            </Card>
            <FileUpload onFile={handleFile} disabled={!selectedAngles.length} />
          </div>
        )}

        {phase === "generating" && (
          <div className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur border-border flex items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div>
                <p className="font-semibold">Generating {selectedAngles.length} angles…</p>
                <p className="text-sm text-muted-foreground">This usually takes ~{Math.round(selectedAngles.length * 12)}s. You can stay on this page.</p>
              </div>
            </Card>
            {previewUrl && (
              <div className="flex items-start gap-4">
                <img src={previewUrl} alt="source" className="h-32 w-32 object-contain rounded-lg border border-border bg-muted/30" />
                <div className="text-sm text-muted-foreground">Source product image</div>
              </div>
            )}
            <AnglesGrid results={results} />
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {results.filter((r) => r.status === "done").length}/{results.length} angles ready
                </p>
                <p className="text-sm text-muted-foreground">Switch tabs to style backgrounds or download.</p>
              </div>
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-2" /> Start a new product
              </Button>
            </div>
            <Tabs defaultValue="angles">
              <TabsList>
                <TabsTrigger value="angles">Angles</TabsTrigger>
                <TabsTrigger value="studio">Background Studio</TabsTrigger>
                <TabsTrigger value="downloads">Downloads</TabsTrigger>
              </TabsList>
              <TabsContent value="angles" className="pt-4">
                <AnglesGrid results={results} />
              </TabsContent>
              <TabsContent value="studio" className="pt-4">
                <BackgroundStudio angles={results} />
              </TabsContent>
              <TabsContent value="downloads" className="pt-4">
                <Downloads results={results} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <BuyCreditsDialog
          open={buyOpen}
          onOpenChange={setBuyOpen}
          required={need.required}
          balance={need.balance}
        />
        <LoginPromptDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </main>
    </div>
  );
};

export default ProductVision360;
