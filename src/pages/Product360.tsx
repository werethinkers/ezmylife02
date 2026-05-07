import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { AppState, GeneratedAssets, GenerationStatus } from "@/components/product360/types";
import FileUpload from "@/components/product360/FileUpload";
import Dashboard from "@/components/product360/Dashboard";
import { startRun, completeRun } from "@/lib/credits";
import { BuyCreditsDialog } from "@/components/wallet/BuyCreditsDialog";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const TOOL_ID = "product-360";

const Product360 = () => {
  const { user } = useAuth();
  const [productImage, setProductImage] = useState<File | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.START);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAssets | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    rotational: "idle", vertical: "idle", message: "",
  });
  const [runId, setRunId] = useState<string | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [needed, setNeeded] = useState<{ required: number; balance: number }>({ required: 50, balance: 0 });

  const handleFileSelect = async (file: File) => {
    if (!user) {
      toast.error("Please sign in to use this tool");
      return;
    }
    const start = await startRun(TOOL_ID);
    if (!start.ok || !start.run_id) {
      if (start.reason === "insufficient") {
        setNeeded({ required: start.credits_required ?? 50, balance: start.balance ?? 0 });
        setBuyOpen(true);
      } else {
        toast.error("Could not start tool run");
      }
      return;
    }
    setRunId(start.run_id);
    setProductImage(file);
    setGeneratedAssets(null);
    setGenerationStatus({ rotational: "loading", vertical: "loading", message: "Starting..." });
    setAppState(AppState.GENERATING);
  };

  const handleGenerationFinished = async (success: boolean) => {
    if (!runId) return;
    await completeRun(runId, success);
    if (success) toast.success("50 credits charged");
    setRunId(null);
  };

  const handleReset = () => {
    setProductImage(null);
    setGeneratedAssets(null);
    setAppState(AppState.START);
    setGenerationStatus({ rotational: "idle", vertical: "idle", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Product 360 Studio – EZYOURLIFE" description="Generate catalog-grade product photos from a single image. AI-powered angle generation, background studio, and bulk downloads." path="/tools/Product-360" />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {appState !== AppState.START && (
          <button onClick={handleReset} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Upload a different product
          </button>
        )}
        {appState === AppState.START || !productImage ? (
          <FileUpload onFileSelect={handleFileSelect} />
        ) : (
          <Dashboard
            productImage={productImage}
            appState={appState}
            setAppState={setAppState}
            generatedAssets={generatedAssets}
            setGeneratedAssets={setGeneratedAssets}
            generationStatus={generationStatus}
            setGenerationStatus={setGenerationStatus}
            onGenerationFinished={handleGenerationFinished}
          />
        )}
      </main>
      <BuyCreditsDialog open={buyOpen} onOpenChange={setBuyOpen} required={needed.required} balance={needed.balance} />
    </div>
  );
};

export default Product360;
