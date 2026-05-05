import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, Check, Video, FileText, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { BuyCreditsDialog } from "@/components/wallet/BuyCreditsDialog";
import LoginPromptDialog from '@/components/auth/LoginPromptDialog';
import { CreditCostBadge } from "@/components/tools/CreditCostBadge";

interface ScriptSection {
  section: string;
  content: string;
  duration: string;
}

export const VideoScriptWriter = () => {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("60");
  const [style, setStyle] = useState("educational");
  const [keyPoints, setKeyPoints] = useState("");
  const [script, setScript] = useState<ScriptSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

    const { charge: __charge_generateScript, dialogProps: __dlg_generateScript, loginDialogProps: __login_generateScript } = useCredits("video-script-writer");

  const generateScript = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a video topic");
      return;
    }

    setIsLoading(true);
    setScript([]);

    try {
      await __charge_generateScript(async () => {
      const response = await supabase.functions.invoke("content-generator", {
        body: {
          type: "video-script",
          topic,
          duration: parseInt(duration),
          style,
          keyPoints: keyPoints.split("\n").filter(Boolean),
        },
      });

      if (response.error) throw response.error;
      setScript(response.data.script);
      toast.success("Script generated!");
      });
    } catch (error) {
      console.error("Error generating script:", error);
      toast.error("Failed to generate script. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyFullScript = async () => {
    const fullScript = script.map(s => `[${s.section}]\n${s.content}`).join("\n\n");
    await navigator.clipboard.writeText(fullScript);
    setCopied(true);
    toast.success("Full script copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            AI Video Script Writer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Video Topic</label>
            <Input
              placeholder="E.g., 5 Morning Habits for Productivity, How to Start Investing..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Video Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds (Reel/Short)</SelectItem>
                  <SelectItem value="60">60 seconds (Reel/Short)</SelectItem>
                  <SelectItem value="180">3 minutes</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="600">10 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Video Style</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="entertaining">Entertaining</SelectItem>
                  <SelectItem value="storytelling">Storytelling</SelectItem>
                  <SelectItem value="tutorial">Tutorial/How-to</SelectItem>
                  <SelectItem value="review">Review/Opinion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Key Points to Cover (one per line, optional)</label>
            <Textarea
              placeholder="Point 1&#10;Point 2&#10;Point 3"
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <Button onClick={generateScript} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Writing Script...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Script
              </>
            )}
          </Button>

          {script.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Your Video Script</h3>
                <Button variant="outline" size="sm" onClick={copyFullScript}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Full Script
                    </>
                  )}
                </Button>
              </div>

              <Tabs defaultValue="0" className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-1">
                  {script.map((section, index) => (
                    <TabsTrigger key={index} value={index.toString()} className="text-xs">
                      {section.section}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {script.map((section, index) => (
                  <TabsContent key={index} value={index.toString()}>
                    <Card className="border-border/30">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {section.duration}
                        </div>
                        <p className="whitespace-pre-wrap">{section.content}</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
      <BuyCreditsDialog {...__dlg_generateScript} />
      <LoginPromptDialog {...__login_generateScript} />
    </div>
  );
};
