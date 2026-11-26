import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { tools, getToolUrl } from "@/data/tools";
import { supabase } from "@/integrations/supabase/client";
import { ModernHeader } from "@/components/modern/ModernHeader";
import { useModernTheme } from "@/components/modern/theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import { NativeToolRenderer, hasNativeImplementation } from "@/components/tools/NativeToolRenderer";
import { ToolDemoPreview } from "@/components/tools/ToolDemoPreview";
import { APPS, hasEngineApp } from "@/apps/registry";
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
import { STUDIO_IDS, studioTabOf } from "@/data/studios";
import { ModernFooter } from "@/components/modern/ModernFooter";
import { SupportFab } from "@/components/brand/SupportFab";
import { useAuth } from "@/contexts/AuthContext";
import { hasDraft } from "@/apps/lib/store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Soft, Home-style border/shadow for controls inside the tool frame (overrides the shared
// components' default thick ink border + hard offset shadow, which read as too heavy here).
const SOFT_BTN = "border border-zinc-200 shadow-sm hover:translate-x-0 hover:translate-y-0 hover:shadow-sm active:translate-x-0 active:translate-y-0 active:shadow-sm dark:border-zinc-800";

// Lightweight, borderless-looking utility pill for the refined pages' top row (Bulk mode, Full
// screen) — zero shadow, so it reads as part of the editorial hero rather than a separate bar.
const PILL_BTN =
  "rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-[#111111] shadow-none hover:bg-white hover:shadow-none dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10";

// Bespoke tools that get the refined chrome without being a Studio or a document-generator —
// each one special-cased because it isn't picked up by STUDIO_IDS or by `engine === "doc"`.
// "emi-calculator" is its own "custom" engine app; "tool-1" is still a plain native tool (free,
// no credit gate) with its own refined screen — see src/components/tools/InvoiceGeneratorRefined.tsx.
const REFINED_CUSTOM_IDS = new Set(["emi-calculator", "tool-1"]);

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
  const { dark } = useModernTheme();

  const tool = tools.find(t => t.toolId === toolId);
  const toolUrl = toolId ? getToolUrl(toolId) : null;
  const isNativeTool = toolId ? hasNativeImplementation(toolId) : false;
  // Apps published by outside developers (ids start with "dev-") run in a sandbox: src/apps/hosted.
  const isHosted = isDeveloperApp(toolId);
  // Studio-branded tools get the refined modern-look chrome (sub-header, footer, support FAB,
  // "Studios" nav highlight); every other tool page keeps today's look untouched.
  const isStudioTool = !!toolId && STUDIO_IDS.has(toolId);
  // EMI Calculator and every document-generator ("doc" engine) tool get the same refined chrome
  // as Studio tools (sub-header, footer, support FAB) for their neo-brutalist redesign, without
  // joining the generated Studios list (they aren't Studios).
  const toolEngine = toolId ? APPS[toolId]?.engine : undefined;
  const refinedChrome = isStudioTool || REFINED_CUSTOM_IDS.has(toolId ?? "") || toolEngine === "doc";
  const { user } = useAuth();
  const [confirmLeave, setConfirmLeave] = useState(false);

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

  const backTo = toolTitle && toolTitle !== toolId ? `/promo/${toolTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}` : "/ai-apps";
  const goBack = () => navigate(backTo);
  // Studio tools keep an unsubmitted form as a draft (see PlanApp); check before leaving so an
  // accidental tap on the header "← Back" doesn't lose it silently.
  const onBackClick = () => {
    if (refinedChrome && toolId && hasDraft(toolId, user?.id)) setConfirmLeave(true);
    else goBack();
  };

  // Error state - truly not found
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className={cn("ez-modern", dark && "dark")}><ModernHeader /></div>
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

  const studioTab = isStudioTool ? studioTabOf(toolId ?? "") : undefined;

  return (
    <div className={cn("min-h-screen flex flex-col", refinedChrome && "ez-modern", refinedChrome && dark && "dark")}>
      <PageSeo
        title={appSeoTitle(seoName, catalogInfo?.description || tool?.description || "")}
        description={seoDesc}
        keywords={seoKeywords}
        path={`/tool/${toolId}`}
        jsonLd={seoJsonLd}
      />
      <div className={cn("ez-modern", dark && "dark")}><ModernHeader section={isStudioTool ? "studios" : undefined} /></div>
      {refinedChrome ? (
        // The refined pages fold this into one editorial hero: a plain breadcrumb back-link and
        // lightweight utility pills, with no icon/title or progress bar — the app's own hero below
        // (icon, H1, eyebrow pill) already carries those, so nothing is said twice.
        <div className="relative z-20 bg-[#FAF7F2] dark:bg-[#0D0D0F]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={onBackClick}
              className="flex min-w-0 items-center gap-1.5 text-sm text-black/50 transition hover:text-[#111111] dark:text-white/50 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Business apps{toolCategory ? ` / ${toolCategory}` : ""}</span>
            </button>
            <div className="flex items-center gap-2">
              {toolId && <BulkButton toolId={toolId} className={PILL_BTN} />}
              <Button onClick={toggleFullscreen} variant="outline" size="sm" className={cn("h-auto", PILL_BTN)}>
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Full screen</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="z-20 shrink-0 border-b border-zinc-200 bg-card dark:border-zinc-800">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button onClick={onBackClick} variant="outline" size="sm" className={cn("h-9 shrink-0", SOFT_BTN)} aria-label="Back to what this app does">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <AppIcon toolId={toolId ?? ""} category={toolCategory} name={toolTitle} size="sm" className="hidden h-10 w-10 sm:block" />
              <div className="min-w-0">
                <p className="truncate font-bold leading-tight">{toolTitle}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {studioTab ? studioTab.tab.label : toolCategory ? `${goalOf(toolCategory).name} · ${toolCategory}` : "App"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {toolId && <BulkButton toolId={toolId} className={SOFT_BTN} />}
              <Button onClick={toggleFullscreen} variant="outline" size="sm" className={cn("h-9", SOFT_BTN)}>
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden text-xs sm:inline">Full screen</span>
              </Button>
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6 lg:px-8">
            <FlowSteps flow="app" step={2} className="max-w-3xl" />
          </div>
        </div>
      )}

      {/* Older apps don't carry the shared app frame, so show what they do in plain words here.
          Refined-chrome native tools (e.g. tool-1) build their own version of this inside their
          own screen, so they're excluded here too even though they aren't an engine app. */}
      {isNativeTool && !uploadedToolUrl && toolCategory && !hasEngineApp(toolId ?? "") && !refinedChrome && (
        <div className="mx-auto w-full max-w-4xl px-4 pt-6">
          <GiveGet give={categoryInfo(toolCategory).give} get={categoryInfo(toolCategory).get} time={null} className={cn("max-w-2xl", SOFT_BTN)} />
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

      {/* Engine apps and refined-chrome native tools list related apps inside their own frame;
          every other older app gets the generic suggestions strip. */}
      {toolId && !isLoading && !hasEngineApp(toolId) && !refinedChrome && <NextApps toolId={toolId} />}

      {!hasEngineApp(toolId ?? "") && !refinedChrome && <ToolDemoPreview
        demoInput={catalogInfo?.demo_input}
        demoOutput={catalogInfo?.demo_output}
        toolName={toolTitle}
      />}

      {toolId && !isHosted && seoCategory && !isLoading && <AppAbout toolId={toolId} name={seoName} description={seoIntro} category={seoCategory} wide={refinedChrome} />}

      {refinedChrome && !isLoading && (
        <>
          <ModernFooter />
          <SupportFab />
        </>
      )}

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              Your answers here are saved as a draft, so you can pick up where you left off next time. Leave this page now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => goBack()}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ToolViewer;
