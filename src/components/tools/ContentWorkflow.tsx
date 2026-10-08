import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Sparkles, ArrowRight, CheckCircle2, Circle, 
  Lightbulb, FileText, Hash, MessageSquare, Send, 
  Instagram, Twitter, Linkedin, Facebook, Copy, Check,
  RotateCcw, Wand2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { CreditCostBadge } from "@/components/tools/CreditCostBadge";
import { BuyCreditsDialog } from "@/components/wallet/BuyCreditsDialog";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";

type WorkflowStep = "idea" | "content" | "hashtags" | "caption" | "publish";

interface GeneratedContent {
  idea?: { title: string; hook: string; format: string };
  content?: string;
  hashtags?: string[];
  caption?: string;
}

const platforms = [
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "twitter", name: "Twitter/X", icon: Twitter },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin },
  { id: "facebook", name: "Facebook", icon: Facebook },
];

const steps = [
  { id: "idea", label: "Idea", icon: Lightbulb },
  { id: "content", label: "Content", icon: FileText },
  { id: "hashtags", label: "Hashtags", icon: Hash },
  { id: "caption", label: "Caption", icon: MessageSquare },
  { id: "publish", label: "Publish", icon: Send },
];

export const ContentWorkflow = () => {
  // Each AI step (idea, content, hashtags, caption) is one charged run; failed steps are free.
  const { charge, dialogProps, loginDialogProps } = useCredits("content-workflow");
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("idea");
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [customIdea, setCustomIdea] = useState("");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({});
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const stepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const generateIdea = async () => {
    if (!niche.trim()) {
      toast.error("Please enter your niche");
      return;
    }

    setIsLoading(true);
    try {
      const data = await charge(async () => {
        const response = await supabase.functions.invoke("content-generator", {
          body: {
            type: "workflow-idea",
            niche,
            platform,
          },
        });
        if (response.error) throw response.error;
        return response.data;
      });
      if (!data) return;
      setGeneratedContent(prev => ({ ...prev, idea: data.idea }));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate idea");
    } finally {
      setIsLoading(false);
    }
  };

  const generateContent = async () => {
    const idea = generatedContent.idea?.title || customIdea;
    if (!idea) {
      toast.error("Please generate or enter an idea first");
      return;
    }

    setIsLoading(true);
    try {
      const data = await charge(async () => {
        const response = await supabase.functions.invoke("content-generator", {
          body: {
            type: "workflow-content",
            idea,
            platform,
            format: generatedContent.idea?.format || "post",
          },
        });
        if (response.error) throw response.error;
        return response.data;
      });
      if (!data) return;
      setGeneratedContent(prev => ({ ...prev, content: data.content }));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate content");
    } finally {
      setIsLoading(false);
    }
  };

  const generateHashtags = async () => {
    const topic = generatedContent.idea?.title || customIdea || niche;
    
    setIsLoading(true);
    try {
      const data = await charge(async () => {
        const response = await supabase.functions.invoke("content-generator", {
          body: {
            type: "workflow-hashtags",
            topic,
            platform,
            count: 20,
          },
        });
        if (response.error) throw response.error;
        return response.data;
      });
      if (!data) return;
      setGeneratedContent(prev => ({ ...prev, hashtags: data.hashtags }));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate hashtags");
    } finally {
      setIsLoading(false);
    }
  };

  const generateCaption = async () => {
    const content = generatedContent.content;
    const idea = generatedContent.idea?.title || customIdea;
    
    setIsLoading(true);
    try {
      const data = await charge(async () => {
        const response = await supabase.functions.invoke("content-generator", {
          body: {
            type: "workflow-caption",
            content,
            idea,
            platform,
            hashtags: generatedContent.hashtags,
          },
        });
        if (response.error) throw response.error;
        return response.data;
      });
      if (!data) return;
      setGeneratedContent(prev => ({ ...prev, caption: data.caption }));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate caption");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const resetWorkflow = () => {
    setCurrentStep("idea");
    setGeneratedContent({});
    setCustomIdea("");
    toast.success("Workflow reset");
  };

  const nextStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as WorkflowStep);
    }
  };

  const goToStep = (stepId: WorkflowStep) => {
    setCurrentStep(stepId);
  };

  const PlatformIcon = platforms.find(p => p.id === platform)?.icon || Instagram;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="border-border/50 bg-gradient-to-r from-primary/10 to-purple-500/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Wand2 className="h-6 w-6 text-primary" />
                Content Creation Workflow
              </h2>
              <p className="text-muted-foreground">From idea to published post in minutes</p>
            </div>
            <Button variant="outline" size="sm" onClick={resetWorkflow}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {steps.map((step, index) => {
                const isCompleted = index < stepIndex;
                const isCurrent = step.id === currentStep;
                const StepIcon = step.icon;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id as WorkflowStep)}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      isCompleted ? "text-primary" : isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className={`h-4 w-4 ${isCurrent ? "fill-primary text-primary" : ""}`} />
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          {/* Step 1: Idea */}
          {currentStep === "idea" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Step 1: Generate Your Idea</h3>
              </div>
              <p className="-mt-2 text-xs text-muted-foreground">
                Each AI step below uses <CreditCostBadge toolId="content-workflow" className="mx-0.5 align-middle" />. You can also type your own idea and skip steps.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Niche</label>
                  <Input
                    placeholder="E.g., fitness, tech, cooking..."
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                  />
                </div>
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
              </div>

              <Button onClick={generateIdea} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Idea with AI
                  </>
                )}
              </Button>

              {generatedContent.idea && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                  <Badge>{generatedContent.idea.format}</Badge>
                  <h4 className="font-medium">{generatedContent.idea.title}</h4>
                  <p className="text-sm text-muted-foreground">{generatedContent.idea.hook}</p>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">or enter your own</span>
                </div>
              </div>

              <Input
                placeholder="Enter your own content idea..."
                value={customIdea}
                onChange={(e) => setCustomIdea(e.target.value)}
              />

              <Button 
                onClick={nextStep} 
                disabled={!generatedContent.idea && !customIdea}
                className="w-full"
                variant="outline"
              >
                Continue to Content <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Content */}
          {currentStep === "content" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Step 2: Create Your Content</h3>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="text-sm text-muted-foreground">Creating content for:</p>
                <p className="font-medium">{generatedContent.idea?.title || customIdea}</p>
              </div>

              <Button onClick={generateContent} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>

              {generatedContent.content && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Generated Content</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.content!, "content")}
                    >
                      {copied === "content" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Textarea
                    value={generatedContent.content}
                    onChange={(e) => setGeneratedContent(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[200px]"
                  />
                </div>
              )}

              <Button 
                onClick={nextStep} 
                disabled={!generatedContent.content}
                className="w-full"
                variant="outline"
              >
                Continue to Hashtags <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 3: Hashtags */}
          {currentStep === "hashtags" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Step 3: Generate Hashtags</h3>
              </div>

              <Button onClick={generateHashtags} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Hashtags
                  </>
                )}
              </Button>

              {generatedContent.hashtags && generatedContent.hashtags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Generated Hashtags</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.hashtags!.join(" "), "hashtags")}
                    >
                      {copied === "hashtags" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-muted/50 border border-border">
                    {generatedContent.hashtags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="cursor-pointer hover:bg-primary/10">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={nextStep} 
                disabled={!generatedContent.hashtags}
                className="w-full"
                variant="outline"
              >
                Continue to Caption <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 4: Caption */}
          {currentStep === "caption" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Step 4: Create Your Caption</h3>
              </div>

              <Button onClick={generateCaption} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Caption with Hashtags
                  </>
                )}
              </Button>

              {generatedContent.caption && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Final Caption</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.caption!, "caption")}
                    >
                      {copied === "caption" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Textarea
                    value={generatedContent.caption}
                    onChange={(e) => setGeneratedContent(prev => ({ ...prev, caption: e.target.value }))}
                    className="min-h-[200px]"
                  />
                </div>
              )}

              <Button 
                onClick={nextStep} 
                disabled={!generatedContent.caption}
                className="w-full"
                variant="outline"
              >
                Continue to Publish <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 5: Publish */}
          {currentStep === "publish" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Send className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Step 5: Publish Your Content</h3>
              </div>

              <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                <h4 className="text-xl font-semibold">Your Content is Ready!</h4>
                <p className="text-muted-foreground">
                  Copy your content and publish it on {platforms.find(p => p.id === platform)?.name}
                </p>
              </div>

              <div className="grid gap-4">
                <Card className="border-border/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PlatformIcon className="h-4 w-4" />
                      Final Post Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/30 whitespace-pre-wrap text-sm">
                      {generatedContent.caption}
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => copyToClipboard(generatedContent.caption || "", "final")}
                    >
                      {copied === "final" ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Everything
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Now paste your content into {platforms.find(p => p.id === platform)?.name} and hit publish! 🚀</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <BuyCreditsDialog {...dialogProps} />
      <LoginPromptDialog {...loginDialogProps} />
    </div>
  );
};
