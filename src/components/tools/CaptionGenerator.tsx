import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { BuyCreditsDialog } from "@/components/wallet/BuyCreditsDialog";
import { CreditCostBadge } from "@/components/tools/CreditCostBadge";

const captionStyles = [
  { id: "engaging", name: "Engaging & Catchy" },
  { id: "storytelling", name: "Storytelling" },
  { id: "question", name: "Question-based" },
  { id: "cta", name: "Call-to-Action" },
  { id: "minimal", name: "Minimal & Clean" },
];

export const CaptionGenerator = () => {
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [style, setStyle] = useState("engaging");
  const [captions, setCaptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { charge, dialogProps } = useCredits("caption-generator");

  const generateCaptions = async () => {
    if (!description.trim()) {
      toast.error("Please describe your image or video");
      return;
    }

    setIsLoading(true);
    setCaptions([]);

    try {
      await charge(async () => {
        const response = await supabase.functions.invoke("content-generator", {
          body: {
            type: "captions",
            description,
            keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
            style,
            count: 5,
          },
        });
        if (response.error) throw response.error;
        setCaptions(response.data.captions);
        toast.success("Captions generated!");
      });
    } catch (error) {
      console.error("Error generating captions:", error);
      toast.error("Failed to generate captions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCaption = async (caption: string, index: number) => {
    await navigator.clipboard.writeText(caption);
    setCopiedIndex(index);
    toast.success("Caption copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            AI Caption Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Describe your image/video</label>
            <Textarea
              placeholder="E.g., A sunset photo at the beach with friends, a product showcase, behind-the-scenes of our team..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Keywords (optional, comma-separated)</label>
            <Input
              placeholder="summer, vacation, memories, beach vibes"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Caption Style</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {captionStyles.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generateCaptions} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate 5 Captions
              </>
            )}
          </Button>

          {captions.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-medium">Generated Captions</h3>
              {captions.map((caption, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-muted/50 border border-border flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">Option {index + 1}</Badge>
                    <p className="whitespace-pre-wrap text-sm">{caption}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCaption(caption, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
