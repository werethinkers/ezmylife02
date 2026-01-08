import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image, Download, Trash2, History, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Creation {
  id: string;
  title: string | null;
  prompt: string;
  result_url: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const ThumbnailMaker = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('vibrant');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previousCreations, setPreviousCreations] = useState<Creation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

    try {
      // Create a record in the database
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

      // Generate the thumbnail using AI
      const enhancedPrompt = `Create a professional, eye-catching YouTube video thumbnail. Style: ${style}. Aspect ratio: ${aspectRatio}. Description: ${prompt}. Make it vibrant, attention-grabbing, and suitable for social media.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: enhancedPrompt
            }
          ],
          modalities: ['image', 'text']
        })
      });

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (imageUrl) {
        setGeneratedImage(imageUrl);
        
        // Update the creation with the result
        await supabase
          .from('user_creations')
          .update({
            result_url: imageUrl,
            status: 'completed'
          })
          .eq('id', creation.id);

        toast.success('Thumbnail generated successfully!');
        loadPreviousCreations();
      } else {
        throw new Error('No image generated');
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      toast.error('Failed to generate thumbnail. Please try again.');
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
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={style} onValueChange={setStyle}>
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
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
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

              {generatedImage && (
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
                            <Badge variant="secondary" className="text-xs">
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

export default ThumbnailMaker;
