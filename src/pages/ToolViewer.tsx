import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { tools, getToolUrl } from "@/data/tools";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle, Maximize2, Minimize2, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NativeToolRenderer, hasNativeImplementation } from "@/components/tools/NativeToolRenderer";
import { logActivity } from "@/lib/activityLogger";
import { useToolMedia } from "@/hooks/useToolMedia";
import logo from "@/assets/logo.png";

interface CatalogTool {
  name: string;
  description: string;
  category: string;
  dedicated_route: string | null;
  has_uploaded_files: boolean;
  is_live: boolean;
}

const ToolViewer = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploadedToolUrl, setUploadedToolUrl] = useState<string | null>(null);
  const [catalogInfo, setCatalogInfo] = useState<CatalogTool | null>(null);

  const tool = tools.find(t => t.toolId === toolId);
  const toolUrl = toolId ? getToolUrl(toolId) : null;
  const isNativeTool = toolId ? hasNativeImplementation(toolId) : false;

  const hasLoggedRef = useRef(false);

  // Check if tool has a dedicated route or uploaded files in the catalog
  useEffect(() => {
    if (!toolId) return;

    const checkCatalog = async () => {
      const { data } = await supabase
        .from("tools_catalog")
        .select("name, description, category, dedicated_route, has_uploaded_files, is_live")
        .eq("id", toolId)
        .single();

      if (data) {
        setCatalogInfo(data as CatalogTool);

        // Redirect to dedicated route if set
        if ((data as any).dedicated_route) {
          navigate((data as any).dedicated_route, { replace: true });
          return;
        }

        // Load uploaded tool via storage URL
        if ((data as any).has_uploaded_files) {
          const { data: publicUrl } = supabase.storage
            .from("tool-uploads")
            .getPublicUrl(`${toolId}/index.html`);
          if (publicUrl?.publicUrl) {
            setUploadedToolUrl(publicUrl.publicUrl);
            setIsLoading(false);
            return;
          }
        }
      }

      // Fallback: native or iframe tool
      if (isNativeTool) {
        setIsLoading(false);
      } else if (tool && toolUrl) {
        // Has a static URL - will load via iframe
      } else if (data) {
        // Tool exists in catalog but has no URL/native - show preview
        setIsLoading(false);
      } else {
        setError("Tool not found");
        setIsLoading(false);
      }
    };

    checkCatalog();
  }, [toolId, navigate, isNativeTool, tool, toolUrl]);

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
    return () => { document.body.style.overflow = ""; };
  }, [isFullscreen]);

  const handleIframeLoad = () => setIsLoading(false);
  const handleIframeError = () => { setError("Failed to load tool"); setIsLoading(false); };
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  // Determine the iframe source
  const iframeSrc = uploadedToolUrl || toolUrl;
  const toolTitle = tool?.title || catalogInfo?.name || toolId || "Tool";
  const toolDescription = tool?.description || catalogInfo?.description || "";
  const toolCategory = tool?.category || catalogInfo?.category || "";
  const { iconUrl: resolvedIconUrl } = useToolMedia(toolId, toolCategory);

  // Error state - truly not found
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
          <AlertCircle className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Tool Not Found</h1>
          <p className="text-muted-foreground">The requested tool could not be found.</p>
          <Button onClick={() => navigate("/ai-apps")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tools
          </Button>
        </div>
      </div>
    );
  }

  // Tool exists in catalog but has no implementation yet — redirect to catalog.
  if (!isLoading && !isNativeTool && !iframeSrc && catalogInfo) {
    return <Navigate to="/ai-apps" replace />;
  }

  const renderContent = () => {
    if (isNativeTool && !uploadedToolUrl) {
      return <NativeToolRenderer toolId={toolId!} />;
    }
    return (
      <iframe
        src={iframeSrc!}
        className="w-full h-full border-0"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title={toolTitle}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        referrerPolicy="no-referrer"
      />
    );
  };

  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="absolute top-0 left-0 right-0 z-30 h-12 bg-background/95 backdrop-blur-sm border-b border-border/20 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ezyourlife" className="h-8 w-auto" />
            <span className="text-sm font-medium text-foreground">{toolTitle}</span>
          </div>
          <Button onClick={toggleFullscreen} variant="ghost" size="sm" className="gap-2">
            <Minimize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Exit Fullscreen</span>
          </Button>
        </div>
        <div className="pt-12 h-full overflow-auto">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="border-b border-border/40 bg-background/95 backdrop-blur-sm z-20 shrink-0">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate("/ai-apps")} variant="ghost" size="sm" className="gap-2 h-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="h-5 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <img src={logo} alt="ezyourlife" className="h-8 w-auto hidden sm:block" />
              <span className="hidden sm:block text-muted-foreground" aria-hidden="true">/</span>
              <span className="font-medium text-foreground text-sm truncate max-w-[200px]">{toolTitle}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Live
              </Badge>
            </div>
          </div>
          <Button onClick={toggleFullscreen} variant="outline" size="sm" className="gap-2 h-8">
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Fullscreen</span>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading {toolTitle}...</p>
          </div>
        </div>
      )}

      <div className={`flex-1 min-h-0 ${isLoading ? 'hidden' : ''}`}>
        {renderContent()}
      </div>
    </div>
  );
};

export default ToolViewer;
