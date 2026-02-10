import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { tools, getToolUrl } from "@/data/tools";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NativeToolRenderer, hasNativeImplementation } from "@/components/tools/NativeToolRenderer";
import { logActivity } from "@/lib/activityLogger";
import logo from "@/assets/logo.png";

const ToolViewer = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const tool = tools.find(t => t.toolId === toolId);
  const toolUrl = toolId ? getToolUrl(toolId) : null;
  const isNativeTool = toolId ? hasNativeImplementation(toolId) : false;

  const hasLoggedRef = useRef(false);

  useEffect(() => {
    // Native tools don't need URL validation
    if (isNativeTool) {
      setIsLoading(false);
    } else if (!tool || !toolUrl) {
      setError("Tool not found");
      setIsLoading(false);
    }
  }, [tool, toolUrl, isNativeTool]);

  // Log tool usage once
  useEffect(() => {
    if (tool && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      logActivity("tool_usage", {
        tool_id: toolId,
        tool_name: tool.title,
        tool_category: tool.category || "",
      });
    }
  }, [tool, toolId]);

  // Handle escape key to exit fullscreen
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && isFullscreen) {
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError("Failed to load tool");
    setIsLoading(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Error state - only for non-native tools that don't have a URL
  if (error || !tool || (!isNativeTool && !toolUrl)) {
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

  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        {/* Minimal fullscreen header */}
        <div className="absolute top-0 left-0 right-0 z-30 h-12 bg-background/95 backdrop-blur-sm border-b border-border/20 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ezyourlife" className="h-8 w-auto" />
            <span className="text-sm font-medium text-foreground">{tool.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={toggleFullscreen} 
              variant="ghost" 
              size="sm"
              className="gap-2"
            >
              <Minimize2 className="h-4 w-4" />
              <span className="hidden sm:inline">Exit Fullscreen</span>
            </Button>
          </div>
        </div>
        
        {/* Fullscreen content */}
        <div className="pt-12 h-full overflow-auto">
          {isNativeTool ? (
            <NativeToolRenderer toolId={toolId!} />
          ) : (
            <iframe
              src={toolUrl!}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title={tool.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Compact Tool Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate("/tools")} 
              variant="ghost" 
              size="sm"
              className="gap-2 h-8"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="h-5 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <img src={logo} alt="ezyourlife" className="h-8 w-auto hidden sm:block" />
              <span className="hidden sm:block text-muted-foreground/50">/</span>
              <span className="font-medium text-foreground text-sm truncate max-w-[200px]">
                {tool.title}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Live
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={toggleFullscreen} 
              variant="outline" 
              size="sm"
              className="gap-2 h-8"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Fullscreen</span>
            </Button>
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

      {/* Tool Content */}
      <div className={`flex-1 ${isLoading ? 'hidden' : ''}`} style={{ height: 'calc(100vh - 8rem)' }}>
        {isNativeTool ? (
          <NativeToolRenderer toolId={toolId!} />
        ) : (
          <iframe
            src={toolUrl!}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={tool.title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  );
};

export default ToolViewer;
