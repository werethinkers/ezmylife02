import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Video, Download, Trash2, History, Sparkles, Upload, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { BuyCreditsDialog } from '@/components/wallet/BuyCreditsDialog';
import { CreditCostBadge } from '@/components/tools/CreditCostBadge';

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

const VideoMaker = () => {
  const { user } = useAuth();
  const { charge, dialogProps } = useCredits('video-maker');
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('5');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [startingFrame, setStartingFrame] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [previousCreations, setPreviousCreations] = useState<Creation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);

  const initialSteps: ProgressStep[] = [
    { id: 'validate', label: 'Validating input', status: 'pending' },
    { id: 'save', label: 'Saving to your library', status: 'pending' },
    { id: 'analyze', label: 'Analyzing prompt', status: 'pending' },
    { id: 'generate', label: 'Generating video frame', status: 'pending' },
    { id: 'process', label: 'Processing result', status: 'pending' },
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
        .eq('tool_type', 'video')
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStartingFrame(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for your video');
      return;
    }

    if (!user) {
      toast.error('Please sign in to generate videos');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressSteps(initialSteps);
    setGeneratedVideo(null);

    let creationId: string | null = null;

    try {
      // Step 1: Validate
      updateStep('validate', 'active', 'Checking your input...');
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStep('validate', 'completed', 'Input validated');

      // Step 2: Save to database
      updateStep('save', 'active', 'Creating entry in your library...');
      setProgress(20);
      
      const { data: creation, error: createError } = await supabase
        .from('user_creations')
        .insert({
          user_id: user.id,
          tool_type: 'video',
          title: title || `Video - ${new Date().toLocaleDateString()}`,
          prompt: prompt,
          status: 'processing',
          metadata: { duration, aspectRatio, resolution, hasStartingFrame: !!startingFrame }
        })
        .select()
        .single();

      if (createError) throw createError;
      creationId = creation.id;
      updateStep('save', 'completed', 'Saved to library');

      // Step 3: Analyze prompt
      updateStep('analyze', 'active', 'Understanding your creative vision...');
      setProgress(35);
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStep('analyze', 'completed', 'Prompt analyzed');

      // Step 4: Generate video
      updateStep('generate', 'active', 'AI is creating your video frame...');
      setProgress(50);

      const { data, error } = await supabase.functions.invoke('video-generator', {
        body: {
          prompt,
          duration: parseInt(duration),
          aspectRatio,
          resolution,
          startingFrame
        }
      });

      if (error) throw error;

      setProgress(75);
      updateStep('generate', 'completed', 'Frame generated successfully');

      // Step 5: Process result
      updateStep('process', 'active', 'Processing the generated content...');
      setProgress(85);

      if (data?.videoUrl) {
        setGeneratedVideo(data.videoUrl);
        
        await supabase
          .from('user_creations')
          .update({
            result_url: data.videoUrl,
            status: 'completed'
          })
          .eq('id', creation.id);

        updateStep('process', 'completed', 'Content processed');

        // Step 6: Complete
        updateStep('complete', 'active', 'Wrapping up...');
        setProgress(95);
        await new Promise(resolve => setTimeout(resolve, 500));
        updateStep('complete', 'completed', 'All done!');
        setProgress(100);

        toast.success('Video frame generated successfully!');
        loadPreviousCreations();
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        const existingMetadata = (creation.metadata as Record<string, unknown>) || {};
        await supabase
          .from('user_creations')
          .update({
            status: 'pending',
            metadata: { ...existingMetadata, message: 'Generation in progress' }
          })
          .eq('id', creation.id);

        updateStep('process', 'completed', 'Request submitted');
        updateStep('complete', 'completed', 'Processing in background');
        setProgress(100);
        
        toast.info('Video generation started. This may take a few minutes.');
        loadPreviousCreations();
      }
    } catch (error) {
      console.error('Error generating video:', error);
      
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

      toast.error(error instanceof Error ? error.message : 'Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
    setDuration((creation.metadata?.duration as string) || '5');
    setAspectRatio((creation.metadata?.aspectRatio as string) || '16:9');
    setResolution((creation.metadata?.resolution as string) || '1080p');
    if (creation.result_url) {
      setGeneratedVideo(creation.result_url);
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
            <Video className="h-5 w-5" />
            AI Video Maker
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
                  placeholder="My awesome video"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Describe your video</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A serene sunset over calm ocean waves, with gentle camera movement and soft ambient lighting"
                  rows={3}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label>Starting Frame (optional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="starting-frame"
                    disabled={isGenerating}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('starting-frame')?.click()}
                    className="w-full"
                    disabled={isGenerating}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {startingFrame ? 'Change Starting Frame' : 'Upload Starting Frame'}
                  </Button>
                </div>
                {startingFrame && (
                  <div className="mt-2 relative">
                    <img
                      src={startingFrame}
                      alt="Starting frame"
                      className="w-32 h-20 object-cover rounded border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-0 right-0 h-6 w-6 p-0"
                      onClick={() => setStartingFrame(null)}
                      disabled={isGenerating}
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={setDuration} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
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
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="480p">480p (Fast)</SelectItem>
                      <SelectItem value="1080p">1080p (HD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={generateVideo}
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
                    Generate Video
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

              {generatedVideo && !isGenerating && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Generated Video Frame</h3>
                    <Badge variant="secondary" className="text-xs">Preview</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This is a high-quality preview frame. Full video generation is coming soon!
                  </p>
                  <div className="relative rounded-lg overflow-hidden border">
                    <img
                      src={generatedVideo}
                      alt="Generated video frame"
                      className="w-full h-auto"
                    />
                  </div>
                  <a
                    href={generatedVideo}
                    download={`video-frame-${Date.now()}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Frame
                    </Button>
                  </a>
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
                  No previous videos found. Start creating!
                </p>
              ) : (
                <div className="grid gap-4">
                  {previousCreations.map((creation) => (
                    <Card key={creation.id} className="overflow-hidden">
                      <div className="flex">
                        {creation.result_url ? (
                          <div className="w-32 h-20 flex-shrink-0">
                            <img
                              src={creation.result_url}
                              alt={creation.title || 'Video frame'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-20 flex-shrink-0 bg-muted flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
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
    </div>
  );
};

export default VideoMaker;
