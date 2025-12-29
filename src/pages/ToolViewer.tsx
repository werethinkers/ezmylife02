import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { tools, getToolUrl } from "@/data/tools";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";

// Check if tool is from external sources that need branding overlay
const isExternalTool = (toolId: string): boolean => {
  const externalPrefixes = [
    'pi7', 'image.pi7', 'vision.pi7', 'bulkresizer.pi7',
    'toolfk', 'passport-photo', 'reduce-image', 'resize-image', 
    'increase-image', 'blur-', 'remove-background', 'remove-object',
    'add-name', 'rotate-image', 'flip-image', 'watermark', 'crop',
    'merge-photo', 'join-images', 'split-image', 'color-picker',
    'metadata', 'beautify', 'unblur', 'pixelate', 'censor', 'motion-blur',
    'grayscale', 'black-white', 'pixel-art', 'face-generator', 'blemish',
    'retouch', 'add-text', 'add-logo', 'dpi', 'super-resolution', 'upscale',
    'ssc-photo', 'pan-card', 'upsc-photo', 'psc-photo', 'instagram', 'whatsapp',
    'youtube-banner', 'zoom-out', 'generate-signature', 'ai-photo-enhancer',
    'ai-id-photo'
  ];
  return externalPrefixes.some(prefix => toolId.includes(prefix));
};

const ToolViewer = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tool = tools.find(t => t.toolId === toolId);
  const toolUrl = toolId ? getToolUrl(toolId) : null;
  const showBrandOverlay = toolId ? isExternalTool(toolId) : false;

  useEffect(() => {
    if (!tool || !toolUrl) {
      setError("Tool not found");
      setIsLoading(false);
    }
  }, [tool, toolUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError("Failed to load tool");
    setIsLoading(false);
  };

  if (error || !tool || !toolUrl) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
          <AlertCircle className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Tool Not Found</h1>
          <p className="text-muted-foreground">The requested tool could not be found.</p>
          <Button onClick={() => navigate("/tools")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tools
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Branded Tool Header */}
      <div className="border-b border-border/40 bg-gradient-to-r from-background via-primary/5 to-background sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate("/tools")} 
              variant="ghost" 
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border/50 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-3">
              <img src={logo} alt="ezmy.life" className="h-6 w-auto" />
              <span className="text-muted-foreground">/</span>
              <div>
                <h1 className="font-semibold text-foreground">{tool.title}</h1>
                <p className="text-xs text-muted-foreground">{tool.category}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by ezmy.life
            </Badge>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading {tool.title}...</p>
          </div>
        </div>
      )}

      {/* Iframe Container with Branding Overlay */}
      <div className={`flex-1 relative ${isLoading ? 'hidden' : ''}`}>
        {/* Top branding overlay to cover external headers */}
        {showBrandOverlay && (
          <div className="absolute top-0 left-0 right-0 z-10 h-16 bg-gradient-to-b from-background via-background to-transparent pointer-events-none">
            <div className="h-12 bg-background flex items-center justify-center border-b border-border/20">
              <div className="flex items-center gap-2">
                <img src={logo} alt="ezmy.life" className="h-5 w-auto opacity-80" />
              </div>
            </div>
          </div>
        )}
        
        <iframe
          src={toolUrl}
          className={`w-full h-full min-h-[calc(100vh-8rem)] border-0 ${showBrandOverlay ? 'pt-0' : ''}`}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title={tool.title}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          referrerPolicy="no-referrer"
          style={showBrandOverlay ? { marginTop: '-60px' } : undefined}
        />
        
        {/* Bottom branding footer */}
        {showBrandOverlay && (
          <div className="absolute bottom-0 left-0 right-0 z-10 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default ToolViewer;