import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { tools, getToolUrl } from "@/data/tools";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import { NativeToolRenderer, hasNativeImplementation } from "@/components/tools/NativeToolRenderer";
import { ToolDemoPreview } from "@/components/tools/ToolDemoPreview";
import { hasEngineApp } from "@/apps/registry";
import { BulkButton } from "@/apps/bulk/BulkButton";
import { NextApps } from "@/apps/shell/NextApps";
import { FieldMemory } from "@/apps/shell/FieldMemory";
import { logActivity } from "@/lib/activityLogger";
import { useToolMedia } from "@/hooks/useToolMedia";
import { PageSeo } from "@/components/seo/PageSeo";
import { Logo } from "@/components/brand/Logo";
import { FlowSteps } from "@/components/brand/FlowSteps";
import { AppIcon } from "@/components/store/AppIcon";
import { GiveGet } from "@/components/brand/GiveGet";
import { categoryInfo, goalOf } from "@/data/goals";
import { appIntroOf } from "@/data/appKind";
import { appSeoDescription, appSeoKeywords, appSeoTitle, sentence } from "@/lib/appSeo";
import { AppAbout } from "@/components/tools/AppAbout";
import { isDeveloperApp } from "@/lib/devApps";
import DeveloperApp from "@/apps/hosted/DeveloperApp";

interface CatalogTool {
  name: string;
  description: string;
  category: string;
  dedicated_route: string | null;
  has_uploaded_files: boolean;
  is_live: boolean;
  demo_input: string | null;
  demo_output: string | null;
}

const ToolViewer = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploadedToolUrl, setUploadedToolUrl] = useState<string | null>(null);
  const [catalogInfo, setCatalogInfo] = useState<CatalogTool | null>(null);
  const [catalogChecked, setCatalogChecked] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const tool = tools.find(t => t.toolId === toolId);
  const toolUrl = toolId ? getToolUrl(toolId) : null;
  const isNativeTool = toolId ? hasNativeImplementation(toolId) : false;
  // Apps published by outside developers (ids start with "dev-") run in a sandbox: src/apps/hosted.
  const isHosted = isDeveloperApp(toolId);

  const hasLoggedRef = useRef(false);

  // Check if tool has a dedicated route or uploaded files in the catalog
  useEffect(() => {
    if (!toolId) return;

    const checkCatalog = async () => {
      const { data } = await supabase
        .from("tools_catalog")
        .select("name, description, category, dedicated_route, has_uploaded_files, is_live, demo_input, demo_output")
        .eq("id", toolId)
        .maybeSingle();

      if (isHosted) {
        if (data) setCatalogInfo(data as CatalogTool);
        setIsLoading(false);
        setCatalogChecked(true);
        return;
      }

      if (data) {
        // Redirect to dedicated route if set — do this FIRST and don't touch
        // any other state so the orphan-guard below cannot fire.
        if ((data as any).dedicated_route) {
          setRedirecting(true);
          navigate((data as any).dedicated_route, { replace: true });
          return;
        }

        setCatalogInfo(data as CatalogTool);

        // Load uploaded tool via storage URL
        if ((data as any).has_uploaded_files) {
          const { data: publicUrl } = supabase.storage
            .from("tool-uploads")
            .getPublicUrl(`${toolId}/index.html`);
          if (publicUrl?.publicUrl) {
            setUploadedToolUrl(publicUrl.publicUrl);
            setIsLoading(false);
            setCatalogChecked(true);
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
      setCatalogChecked(true);
    };

    checkCatalog();
  }, [toolId, navigate, isNativeTool, isHosted, tool, toolUrl]);

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
          <h1 className="text-2xl font-bold text-foreground">We couldn't find that app</h1>
          <p className="text-muted-foreground">It may have been renamed. Browse the apps to find it.</p>
          <Button onClick={() => navigate("/ai-apps")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> See all apps
          </Button>
        </div>
      </div>
    );
  }

  // Tool exists in catalog but has no implementation yet — redirect to catalog.
  if (catalogChecked && !redirecting && !isNativeTool && !isHosted && !iframeSrc && !uploadedToolUrl && catalogInfo) {
    return <Navigate to="/ai-apps" replace />;
  }

  const renderContent = () => {
    if (isHosted) return <DeveloperApp toolId={toolId!} />;
    if (isNativeTool && !uploadedToolUrl) {
      // Remembers entries across apps and offers them back in any matching field.
      return <FieldMemory><NativeToolRenderer toolId={toolId!} /></FieldMemory>;
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
        <div className="absolute top-0 left-0 right-0 z-30 h-14 bg-background border-b-2 border-ink flex items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo compact />
            <span className="truncate text-sm font-bold text-foreground">{toolTitle}</span>
          </div>
          <Button onClick={toggleFullscreen} variant="ghost" size="sm" className="gap-2">
            <Minimize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Exit full screen</span>
          </Button>
        </div>
        <div className="pt-14 h-full overflow-auto">
          {renderContent()}
        </div>
      </div>
    );
  }

  // Same words as the page written for search engines at build time (scripts/prerender-apps.mjs).
  const seoName = catalogInfo?.name || tool?.title || toolTitle;
  const seoCategory = catalogInfo?.category || tool?.category || "";
  const seoInfo = categoryInfo(seoCategory);
  const seoIntro = appIntroOf(toolId) || catalogInfo?.description || tool?.description || "";
  const seoDesc = appSeoDescription(seoName, seoIntro, seoInfo.give, seoInfo.get);
  const seoKeywords = appSeoKeywords(seoName, seoCategory);
  const seoJsonLd = catalogInfo
    ? {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: seoName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: sentence(seoIntro || seoName),
        url: `https://ezyourlife.com/tool/${toolId}`,
      }
    : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <PageSeo
        title={appSeoTitle(seoName, catalogInfo?.description || tool?.description || "")}
        description={seoDesc}
        keywords={seoKeywords}
        path={`/tool/${toolId}`}
        jsonLd={seoJsonLd}
      />
      <Navbar />
      <div className="z-20 shrink-0 border-b-2 border-ink bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Button onClick={() => navigate(toolTitle && toolTitle !== toolId ? `/promo/${toolTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}` : "/ai-apps")} variant="outline" size="sm" className="h-9 shrink-0" aria-label="Back to what this app does">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <AppIcon toolId={toolId ?? ""} category={toolCategory} name={toolTitle} size="sm" className="hidden h-10 w-10 sm:block" />
            <div className="min-w-0">
              <p className="truncate font-bold leading-tight">{toolTitle}</p>
              <p className="truncate text-xs text-muted-foreground">{toolCategory ? `${goalOf(toolCategory).name} · ${toolCategory}` : "App"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {toolId && <BulkButton toolId={toolId} />}
            <Button onClick={toggleFullscreen} variant="outline" size="sm" className="h-9">
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden text-xs sm:inline">Full screen</span>
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-3">
          <FlowSteps flow="app" step={2} className="max-w-3xl" />
        </div>
      </div>

      {/* Older apps don't carry the shared app frame, so show what they do in plain words here. */}
      {isNativeTool && !uploadedToolUrl && toolCategory && !hasEngineApp(toolId ?? "") && (
        <div className="mx-auto w-full max-w-4xl px-4 pt-6">
          <GiveGet give={categoryInfo(toolCategory).give} get={categoryInfo(toolCategory).get} time={null} className="max-w-2xl" />
        </div>
      )}


      {isLoading && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-ink" />
            <p className="font-semibold text-muted-foreground">Opening {toolTitle}…</p>
          </div>
        </div>
      )}

      <div className={`${isNativeTool && !uploadedToolUrl ? "min-h-[calc(100vh-7rem)] pb-24 md:pb-8" : "h-[calc(100vh-7rem)] min-h-[500px]"} ${isLoading ? "hidden" : ""}`}>
        {renderContent()}
      </div>

      {/* Engine apps list related apps inside their own frame; older apps get the suggestions strip. */}
      {toolId && !isLoading && !hasEngineApp(toolId) && <NextApps toolId={toolId} />}

      {!hasEngineApp(toolId ?? "") && <ToolDemoPreview
        demoInput={catalogInfo?.demo_input}
        demoOutput={catalogInfo?.demo_output}
        toolName={toolTitle}
      />}

      {toolId && !isHosted && seoCategory && !isLoading && <AppAbout toolId={toolId} name={seoName} description={seoIntro} category={seoCategory} />}
    </div>
  );
};

export default ToolViewer;
