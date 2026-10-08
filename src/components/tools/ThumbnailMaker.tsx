import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Image, Download, Trash2, History, Sparkles, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { callFunction } from '@/lib/credits';
import { BuyCreditsDialog } from '@/components/wallet/BuyCreditsDialog';
import LoginPromptDialog from '@/components/auth/LoginPromptDialog';

interface Creation {
  id: string;
  title: string | null;
  prompt: string;
  result_url: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  message?: string;
}

const ThumbnailMaker = () => {
  const { user } = useAuth();
  const { charge, dialogProps, loginDialogProps } = useCredits('thumbnail-maker');
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('vibrant');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previousCreations, setPreviousCreations] = useState<Creation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);

  const initialSteps: ProgressStep[] = [
    { id: 'validate', label: 'Validating input', status: 'pending' },
    { id: 'save', label: 'Saving to your library', status: 'pending' },
    { id: 'enhance', label: 'Enhancing prompt', status: 'pending' },
    { id: 'generate', label: 'AI generating thumbnail', status: 'pending' },
    { id: 'process', label: 'Processing image', status: 'pending' },
    { id: 'complete', label: 'Finalizing', status: 'pending' },
  ];

  const updateStep = (stepId: string, status: ProgressStep['status'], message?: string) => {
    setProgressSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ));
  };

  useEffect(() => {
    if (user) {
      loadPreviousCreations();
    }
  }, [user]);

  const loadPreviousCreations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_creations')
        .select('*')
        .eq('user_id', user.id)
        .eq('tool_type', 'thumbnail')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPreviousCreations((data || []).map(item => ({
        ...item,
        metadata: (item.metadata as Record<string, unknown>) || {}
      })));
    } catch (error) {
      console.error('Error loading creations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateThumbnail = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for your thumbnail');
      return;
    }

    if (!user) {
      toast.error('Please sign in to generate thumbnails');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressSteps(initialSteps);
    setGeneratedImage(null);

    let creationId: string | null = null;

    try {
      updateStep('validate', 'completed', 'Input checked');

      updateStep('save', 'active', 'Creating entry in your library...');
      setProgress(15);
      const { data: creation, error: createError } = await supabase
        .from('user_creations')
        .insert({
          user_id: user.id,
          tool_type: 'thumbnail',
          title: title || `Thumbnail - ${new Date().toLocaleDateString()}`,
          prompt: prompt,
          status: 'processing',
          metadata: { style, aspectRatio }
        })
        .select()
        .single();

      if (createError) throw createError;
      creationId = creation.id;
      updateStep('save', 'completed', 'Saved to library');

      const enhancedPrompt = `A professional, eye-catching YouTube video thumbnail. ${title ? `Large, legible headline text: "${title}". ` : ''}Description: ${prompt}. Bold contrast, clear focal point, readable at small sizes.`;
      updateStep('enhance', 'completed', 'Prompt prepared');

      // The server checks the balance, generates the image and deducts credits only on success.
      updateStep('generate', 'active', 'AI is creating your thumbnail (10–30 s)...');
      setProgress(35);
      const data = await charge(() =>
        callFunction<{ ok: boolean; image?: string }>('ai-app', {
          tool_id: 'thumbnail-maker',
          prompt: enhancedPrompt,
          style,
          aspect: aspectRatio,
        }),
      );
      if (!data) {
        // Sign-in or buy-credits dialog is open; nothing was charged.
        setProgressSteps(initialSteps);
        setProgress(0);
        await supabase.from('user_creations').delete().eq('id', creation.id);
        creationId = null;
        return;
      }
      setProgress(75);
      const imageUrl = data.image;

      updateStep('generate', 'completed', 'Thumbnail generated');

      // Step 5: Process image
      updateStep('process', 'active', 'Processing the image...');
      setProgress(85);

      if (imageUrl) {
        setGeneratedImage(imageUrl);
        
        await supabase
          .from('user_creations')
          .update({
            result_url: imageUrl,
            status: 'completed'
          })
          .eq('id', creation.id);

        updateStep('process', 'completed', 'Image processed');

        // Step 6: Complete
        updateStep('complete', 'active', 'Wrapping up...');
        setProgress(95);
        updateStep('complete', 'completed', 'All done!');
        setProgress(100);

        toast.success('Thumbnail generated successfully!');
        loadPreviousCreations();
      } else {
        throw new Error('No image generated');
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      
      // Mark current step as error
      setProgressSteps(prev => prev.map(step => 
        step.status === 'active' ? { ...step, status: 'error', message: 'Failed' } : step
      ));

      // Update database status if we have a creation
      if (creationId) {
        await supabase
          .from('user_creations')
          .update({ status: 'failed' })
          .eq('id', creationId);
      }

      toast.error(error instanceof Error && error.message ? error.message : 'Failed to generate thumbnail. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || 'thumbnail.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteCreation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_creations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Creation deleted');
      loadPreviousCreations();
    } catch (error) {
      console.error('Error deleting creation:', error);
      toast.error('Failed to delete creation');
    }
  };

  const loadCreation = (creation: Creation) => {
    setPrompt(creation.prompt);
    setTitle(creation.title || '');
    setStyle((creation.metadata?.style as string) || 'vibrant');
    setAspectRatio((creation.metadata?.aspectRatio as string) || '16:9');
    if (creation.result_url) {
      setGeneratedImage(creation.result_url);
    }
    setShowHistory(false);
  };

  const getStepIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            AI Thumbnail Maker
          </CardTitle>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              {showHistory ? 'Hide History' : 'View History'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!showHistory ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My awesome thumbnail"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Describe your thumbnail</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A person looking surprised at a glowing treasure chest, with bold text saying 'YOU WON'T BELIEVE THIS!'"
                  rows={3}
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vibrant">Vibrant & Bold</SelectItem>
                      <SelectItem value="minimal">Minimal & Clean</SelectItem>
                      <SelectItem value="dramatic">Dramatic & Cinematic</SelectItem>
                      <SelectItem value="playful">Playful & Fun</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (YouTube)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="9:16">9:16 (TikTok/Reels)</SelectItem>
                      <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={generateThumbnail}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Thumbnail
                  </>
                )}
              </Button>

              {/* Progress Section */}
              {isGenerating && (
                <div className="mt-6 space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Generation Progress</span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    {progressSteps.map((step) => (
                      <div 
                        key={step.id} 
                        className={`flex items-center gap-3 text-sm transition-opacity ${
                          step.status === 'pending' ? 'opacity-50' : 'opacity-100'
                        }`}
                      >
                        {getStepIcon(step.status)}
                        <span className={step.status === 'active' ? 'font-medium' : ''}>
                          {step.label}
                        </span>
                        {step.message && step.status !== 'pending' && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {step.message}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedImage && !isGenerating && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold">Generated Thumbnail</h3>
                  <div className="relative rounded-lg overflow-hidden border">
                    <img
                      src={generatedImage}
                      alt="Generated thumbnail"
                      className="w-full h-auto"
                    />
                  </div>
                  <Button
                    onClick={() => downloadImage(generatedImage, `thumbnail-${Date.now()}.png`)}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Thumbnail
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : previousCreations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No previous thumbnails found. Start creating!
                </p>
              ) : (
                <div className="grid gap-4">
                  {previousCreations.map((creation) => (
                    <Card key={creation.id} className="overflow-hidden">
                      <div className="flex">
                        {creation.result_url && (
                          <div className="w-32 h-20 flex-shrink-0">
                            <img
                              src={creation.result_url}
                              alt={creation.title || 'Thumbnail'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 p-3 flex flex-col justify-between">
                          <div>
                            <h4 className="font-medium text-sm truncate">
                              {creation.title || 'Untitled'}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {creation.prompt}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <Badge 
                              variant={
                                creation.status === 'completed' ? 'default' : 
                                creation.status === 'failed' ? 'destructive' : 'secondary'
                              } 
                              className="text-xs"
                            >
                              {creation.status}
                            </Badge>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => loadCreation(creation)}
                              >
                                Load
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteCreation(creation.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <BuyCreditsDialog {...dialogProps} />
      <LoginPromptDialog {...loginDialogProps} />
    </div>
  );
};

export default ThumbnailMaker;
