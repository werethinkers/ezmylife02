import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lightbulb, Calendar, TrendingUp, Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { BuyCreditsDialog } from "@/components/wallet/BuyCreditsDialog";
import LoginPromptDialog from '@/components/auth/LoginPromptDialog';
import { CreditCostBadge } from "@/components/tools/CreditCostBadge";

interface ContentIdea {
  title: string;
  format: string;
  hook: string;
  bestTime: string;
  saved?: boolean;
}

const contentFormats = [
  { id: "any", name: "Any Format" },
  { id: "reel", name: "Reels/TikTok" },
  { id: "carousel", name: "Carousel Post" },
  { id: "story", name: "Story Series" },
  { id: "video", name: "Long-form Video" },
  { id: "blog", name: "Blog Article" },
];

export const ContentIdeaGenerator = () => {
  const [niche, setNiche] = useState("");
  const [format, setFormat] = useState("any");
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);

    const { charge: __charge_generateIdeas, dialogProps: __dlg_generateIdeas, loginDialogProps: __login_generateIdeas } = useCredits("content-idea-generator");

  const generateIdeas = async () => {
    if (!niche.trim()) {
      toast.error("Please enter your niche or industry");
      return;
    }

    setIsLoading(true);
    setIdeas([]);

    try {
      await __charge_generateIdeas(async () => {
      const response = await supabase.functions.invoke("content-generator", {
        body: {
          type: "content-ideas",
          niche,
          format: format === "any" ? null : format,
          count: 10,
        },
      });

      if (response.error) throw response.error;
      setIdeas(response.data.ideas.map((idea: ContentIdea) => ({ ...idea, saved: false })));
      toast.success("Ideas generated!");
      });
    } catch (error) {
      console.error("Error generating ideas:", error);
      toast.error("Failed to generate ideas. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSave = (index: number) => {
    setIdeas(prev => prev.map((idea, i) => 
      i === index ? { ...idea, saved: !idea.saved } : idea
    ));
    const idea = ideas[index];
    toast.success(idea.saved ? "Removed from saved" : "Saved for later!");
  };

  const getFormatColor = (format: string) => {
    const colors: Record<string, string> = {
      "Reel": "bg-pink-500/20 text-pink-400",
      "Carousel": "bg-blue-500/20 text-blue-400",
      "Story": "bg-purple-500/20 text-purple-400",
      "Video": "bg-red-500/20 text-red-400",
      "Blog": "bg-green-500/20 text-green-400",
    };
    return colors[format] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            AI Content Idea Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Niche/Industry</label>
              <Input
                placeholder="E.g., fitness coaching, SaaS, personal finance..."
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Content Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentFormats.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generateIdeas} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Generate 10 Content Ideas
              </>
            )}
          </Button>

          {ideas.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Content Ideas</h3>
              
              <div className="grid gap-4">
                {ideas.map((idea, index) => (
                  <Card key={index} className="border-border/30 bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getFormatColor(idea.format)}>
                              {idea.format}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {idea.bestTime}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{idea.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Hook:</span> {idea.hook}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSave(index)}
                          className={idea.saved ? "text-primary" : ""}
                        >
                          {idea.saved ? (
                            <BookmarkCheck className="h-5 w-5" />
                          ) : (
                            <Bookmark className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <BuyCreditsDialog {...__dlg_generateIdeas} />
      <LoginPromptDialog {...__login_generateIdeas} />
    </div>
  );
};
