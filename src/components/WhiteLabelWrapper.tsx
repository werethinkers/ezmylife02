import { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { Sparkles } from "lucide-react";

// Tool-specific branding configuration
export interface ToolBrandingConfig {
  hideTop?: number;      // Pixels to hide from top
  hideBottom?: number;   // Pixels to hide from bottom
  hideLeft?: number;     // Pixels to hide from left (sidebars)
  hideRight?: number;    // Pixels to hide from right (sidebars)
  showTopBar?: boolean;  // Show ezmy.life branded top bar
  topBarHeight?: number; // Height of top branding bar
}

// Default configurations for known external tools
const toolConfigs: Record<string, ToolBrandingConfig> = {
  // Pi7 Image Tools - hide header, footer, and sidebars
  "pi7-default": {
    hideTop: 120,
    hideBottom: 80,
    hideLeft: 0,
    hideRight: 0,
    showTopBar: true,
    topBarHeight: 48,
  },
  // ToolFK tools
  "toolfk-default": {
    hideTop: 100,
    hideBottom: 70,
    hideLeft: 0,
    hideRight: 0,
    showTopBar: true,
    topBarHeight: 48,
  },
  // Minimal - no overlay
  "minimal": {
    hideTop: 0,
    hideBottom: 0,
    hideLeft: 0,
    hideRight: 0,
    showTopBar: false,
    topBarHeight: 0,
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
  
  // Default - no overlay
  return toolConfigs["minimal"];
};

// Check if tool needs white-label wrapper
export const needsWhiteLabel = (toolId: string): boolean => {
  const config = getToolConfig(toolId);
  return (config.hideTop ?? 0) > 0 || config.showTopBar === true;
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

  const topBarH = config.topBarHeight || 48;
  const hideTop = config.hideTop || 0;
  const hideBottom = config.hideBottom || 0;
  const hideLeft = config.hideLeft || 0;
  const hideRight = config.hideRight || 0;

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      {/* Top Branding Bar */}
      {config.showTopBar && (
        <div 
          className="absolute top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/20 flex items-center justify-between px-4"
          style={{ height: topBarH }}
        >
          <div className="flex items-center gap-2">
            <img src={logo} alt="ezmy.life" className="h-5 w-auto" />
            {!isFullscreen && (
              <>
                <span className="text-muted-foreground/30">|</span>
                <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
                  {toolName}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
            <Sparkles className="h-3 w-3 text-primary/70" />
            <span className="hidden sm:inline">ezmy.life</span>
          </div>
        </div>
      )}
      
      {/* Iframe container - clips and repositions to show only tool area */}
      <div 
        className="absolute left-0 right-0 bottom-0 overflow-hidden"
        style={{
          top: config.showTopBar ? topBarH : 0,
        }}
      >
        <div 
          className="relative"
          style={{
            marginTop: -hideTop,
            marginLeft: -hideLeft,
            marginRight: -hideRight,
            width: `calc(100% + ${hideLeft + hideRight}px)`,
            height: `calc(100% + ${hideTop + hideBottom}px)`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
