import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, Sparkles, Instagram, Twitter, Linkedin, Facebook } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const platforms = [
  { id: "instagram", name: "Instagram", icon: Instagram, charLimit: 2200 },
  { id: "twitter", name: "Twitter/X", icon: Twitter, charLimit: 280 },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, charLimit: 3000 },
  { id: "facebook", name: "Facebook", icon: Facebook, charLimit: 63206 },
];

export const SocialPostGenerator = () => {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("professional");
  const [generatedPost, setGeneratedPost] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePost = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic or idea");
      return;
    }

    setIsLoading(true);
    setGeneratedPost("");

    try {
      const selectedPlatform = platforms.find(p => p.id === platform);
      
      const response = await supabase.functions.invoke("content-generator", {
        body: {
          type: "social-post",
          topic,
          platform: selectedPlatform?.name,
          charLimit: selectedPlatform?.charLimit,
          tone,
        },
      });

      if (response.error) throw response.error;
      setGeneratedPost(response.data.content);
      toast.success("Post generated successfully!");
    } catch (error) {
      console.error("Error generating post:", error);
      toast.error("Failed to generate post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedPlatform = platforms.find(p => p.id === platform);
  const PlatformIcon = selectedPlatform?.icon || Instagram;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Social Media Post Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">What's your post about?</label>
            <Textarea
              placeholder="E.g., Launching our new product, sharing a productivity tip, announcing an event..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Platform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <p.icon className="h-4 w-4" />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual & Friendly</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                  <SelectItem value="inspiring">Inspiring</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generatePost} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Post
              </>
            )}
          </Button>

          {generatedPost && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlatformIcon className="h-5 w-5 text-primary" />
                  <span className="font-medium">Generated Post</span>
                </div>
                <Badge variant="outline">
                  {generatedPost.length} / {selectedPlatform?.charLimit} chars
                </Badge>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="whitespace-pre-wrap">{generatedPost}</p>
              </div>

              <Button variant="outline" onClick={copyToClipboard} className="w-full">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
