import { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { Sparkles } from "lucide-react";

// Tool-specific branding configuration
export interface ToolBrandingConfig {
  hideTop?: number;      // Pixels to hide from top (external tool's header)
  hideBottom?: number;   // Pixels to hide from bottom (external tool's footer)
  showTopBar?: boolean;  // Show ezmy.life branded top bar
  showBottomBar?: boolean; // Show ezmy.life branded bottom bar
  topBarHeight?: number; // Height of top branding bar
  bottomBarHeight?: number; // Height of bottom branding bar
}

// Default configurations for known external tools
const toolConfigs: Record<string, ToolBrandingConfig> = {
  // Pi7 Image Tools - hide their header/footer and show our branding
  "pi7-default": {
    hideTop: 85,
    hideBottom: 60,
    showTopBar: true,
    showBottomBar: true,
    topBarHeight: 50,
    bottomBarHeight: 36,
  },
  // ToolFK tools
  "toolfk-default": {
    hideTop: 75,
    hideBottom: 55,
    showTopBar: true,
    showBottomBar: true,
    topBarHeight: 50,
    bottomBarHeight: 36,
  },
  // Minimal overlay for internal tools
  "minimal": {
    hideTop: 0,
    hideBottom: 0,
    showTopBar: false,
    showBottomBar: false,
    topBarHeight: 0,
    bottomBarHeight: 0,
  },
};

// Get config for a specific tool
export const getToolConfig = (toolId: string): ToolBrandingConfig => {
  // Check for Pi7 tools
  if (toolId.includes("pi7") || 
      toolId.includes("passport-photo") ||
      toolId.includes("resize-image") ||
      toolId.includes("reduce-image") ||
      toolId.includes("increase-image") ||
      toolId.includes("blur-") ||
      toolId.includes("remove-background") ||
      toolId.includes("remove-object") ||
      toolId.includes("rotate-image") ||
      toolId.includes("flip-image") ||
      toolId.includes("watermark") ||
      toolId.includes("crop") ||
      toolId.includes("merge-photo") ||
      toolId.includes("join-images") ||
      toolId.includes("split-image") ||
      toolId.includes("color-picker") ||
      toolId.includes("metadata") ||
      toolId.includes("beautify") ||
      toolId.includes("unblur") ||
      toolId.includes("pixelate") ||
      toolId.includes("censor") ||
      toolId.includes("motion-blur") ||
      toolId.includes("grayscale") ||
      toolId.includes("black-white") ||
      toolId.includes("pixel-art") ||
      toolId.includes("face-generator") ||
      toolId.includes("blemish") ||
      toolId.includes("retouch") ||
      toolId.includes("add-text") ||
      toolId.includes("add-logo") ||
      toolId.includes("add-name") ||
      toolId.includes("dpi") ||
      toolId.includes("super-resolution") ||
      toolId.includes("upscale") ||
      toolId.includes("ssc-photo") ||
      toolId.includes("pan-card") ||
      toolId.includes("upsc-photo") ||
      toolId.includes("psc-photo") ||
      toolId.includes("instagram") ||
      toolId.includes("whatsapp") ||
      toolId.includes("youtube-banner") ||
      toolId.includes("zoom-out") ||
      toolId.includes("generate-signature") ||
      toolId.includes("ai-photo-enhancer")
  ) {
    return toolConfigs["pi7-default"];
  }
  
  // Check for ToolFK tools
  if (toolId.includes("toolfk") || toolId.includes("ai-id-photo")) {
    return toolConfigs["toolfk-default"];
  }
  
  // Default - no overlay for internal tools
  return toolConfigs["minimal"];
};

// Check if tool needs white-label wrapper
export const needsWhiteLabel = (toolId: string): boolean => {
  const config = getToolConfig(toolId);
  return (config.hideTop ?? 0) > 0 || 
         (config.hideBottom ?? 0) > 0 ||
         config.showTopBar === true;
};

interface WhiteLabelWrapperProps {
  toolId: string;
  toolName?: string;
  children: ReactNode;
  isFullscreen?: boolean;
}

export const WhiteLabelWrapper = ({ 
  toolId, 
  toolName = "Tool",
  children,
  isFullscreen = false
}: WhiteLabelWrapperProps) => {
  const config = getToolConfig(toolId);
  const showWrapper = needsWhiteLabel(toolId);
  
  if (!showWrapper) {
    return <>{children}</>;
  }

  const topBarH = config.topBarHeight || 50;
  const bottomBarH = config.bottomBarHeight || 36;
  const hideTop = config.hideTop || 0;
  const hideBottom = config.hideBottom || 0;

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      {/* Top Branding Bar - covers external tool's header */}
      {config.showTopBar && (
        <div 
          className="absolute top-0 left-0 right-0 z-30 bg-background border-b border-border/30 flex items-center justify-between px-4"
          style={{ height: topBarH }}
        >
          <div className="flex items-center gap-3">
            <img src={logo} alt="ezmy.life" className="h-5 w-auto" />
            {!isFullscreen && (
              <>
                <span className="text-muted-foreground/40">|</span>
                <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                  {toolName}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="hidden sm:inline">Powered by ezmy.life</span>
          </div>
        </div>
      )}
      
      {/* Iframe container - positioned to hide external branding */}
      <div 
        className="absolute left-0 right-0 overflow-hidden"
        style={{
          top: config.showTopBar ? topBarH : 0,
          bottom: config.showBottomBar ? bottomBarH : 0,
        }}
      >
        {/* The iframe is shifted up to hide external header */}
        <div 
          className="w-full"
          style={{
            marginTop: -hideTop,
            height: `calc(100% + ${hideTop + hideBottom}px)`,
          }}
        >
          {children}
        </div>
      </div>
      
      {/* Bottom Branding Bar - covers external tool's footer */}
      {config.showBottomBar && (
        <div 
          className="absolute bottom-0 left-0 right-0 z-30 bg-background border-t border-border/30 flex items-center justify-center px-4"
          style={{ height: bottomBarH }}
        >
          <span className="text-xs text-muted-foreground">
            © 2025 ezmy.life — Think it → Done
          </span>
        </div>
      )}
    </div>
  );
};
