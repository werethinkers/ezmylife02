import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, Hash, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { BuyCreditsDialog } from "@/components/wallet/BuyCreditsDialog";
import { CreditCostBadge } from "@/components/tools/CreditCostBadge";

export const HashtagGenerator = () => {
  const [topic, setTopic] = useState("");
  const [hashtags, setHashtags] = useState<{ tag: string; popularity: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

    const { charge: __charge_generateHashtags, dialogProps: __dlg_generateHashtags } = useCredits("hashtag-generator");

  const generateHashtags = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic or niche");
      return;
    }

    setIsLoading(true);
    setHashtags([]);

    try {
      await __charge_generateHashtags(async () => {
      const response = await supabase.functions.invoke("content-generator", {
        body: {
          type: "hashtags",
          topic,
          count: 30,
        },
      });

      if (response.error) throw response.error;
      setHashtags(response.data.hashtags);
      toast.success("Hashtags generated!");
      });
    } catch (error) {
      console.error("Error generating hashtags:", error);
      toast.error("Failed to generate hashtags. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyAllHashtags = async () => {
    const allTags = hashtags.map(h => h.tag).join(" ");
    await navigator.clipboard.writeText(allTags);
    setCopied(true);
    toast.success("All hashtags copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyHashtag = async (tag: string) => {
    await navigator.clipboard.writeText(tag);
    toast.success(`${tag} copied!`);
  };

  const getPopularityColor = (popularity: string) => {
    switch (popularity) {
      case "high": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            AI Hashtag Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Enter your topic or niche</label>
            <Textarea
              placeholder="E.g., fitness motivation, tech startup, travel photography, vegan recipes..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <Button onClick={generateHashtags} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate 30 Hashtags
              </>
            )}
          </Button>

          {hashtags.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Generated Hashtags</h3>
                <Button variant="outline" size="sm" onClick={copyAllHashtags}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className={getPopularityColor("high")}>High</Badge>
                <Badge variant="outline" className={getPopularityColor("medium")}>Medium</Badge>
                <Badge variant="outline" className={getPopularityColor("low")}>Niche</Badge>
                <span>← Click tags to copy individually</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {hashtags.map((h, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`cursor-pointer hover:scale-105 transition-transform ${getPopularityColor(h.popularity)}`}
                    onClick={() => copyHashtag(h.tag)}
                  >
                    {h.tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <BuyCreditsDialog {...__dlg_generateHashtags} />
    </div>
  );
};
