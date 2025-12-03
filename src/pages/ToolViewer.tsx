import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { tools, getToolUrl } from "@/data/tools";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

const ToolViewer = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tool = tools.find(t => t.toolId === toolId);
  const toolUrl = toolId ? getToolUrl(toolId) : null;

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
      
      {/* Tool Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
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
            <div className="hidden sm:block">
              <h1 className="font-semibold text-foreground">{tool.title}</h1>
              <p className="text-xs text-muted-foreground">{tool.category}</p>
            </div>
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

      {/* Iframe Container */}
      <div className={`flex-1 ${isLoading ? 'hidden' : ''}`}>
        <iframe
          src={toolUrl}
          className="w-full h-full min-h-[calc(100vh-8rem)] border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title={tool.title}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

export default ToolViewer;