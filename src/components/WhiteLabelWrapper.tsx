import { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { Sparkles } from "lucide-react";

// Tool-specific branding configuration
export interface ToolBrandingConfig {
  hideTop?: number;      // Pixels to hide from top
  hideBottom?: number;   // Pixels to hide from bottom
  hideLeft?: number;     // Pixels to hide from left
  hideRight?: number;    // Pixels to hide from right
  showTopBar?: boolean;  // Show ezmy.life branded top bar
  showBottomBar?: boolean; // Show ezmy.life branded bottom bar
  topBarHeight?: number; // Height of top branding bar
  bottomBarHeight?: number; // Height of bottom branding bar
}

// Default configurations for known external tools
const toolConfigs: Record<string, ToolBrandingConfig> = {
  // Pi7 Image Tools - typically have header and footer
  "pi7-default": {
    hideTop: 80,
    hideBottom: 60,
    showTopBar: true,
    showBottomBar: true,
    topBarHeight: 56,
    bottomBarHeight: 40,
  },
  // ToolFK tools
  "toolfk-default": {
    hideTop: 70,
    hideBottom: 50,
    showTopBar: true,
    showBottomBar: true,
    topBarHeight: 56,
    bottomBarHeight: 40,
  },
  // Minimal overlay
  "minimal": {
    hideTop: 0,
    hideBottom: 0,
    showTopBar: true,
    showBottomBar: false,
    topBarHeight: 48,
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
  
  // Default - minimal overlay for ezmy.life tools
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

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Top Branding Bar */}
      {config.showTopBar && (
        <div 
          className="absolute top-0 left-0 right-0 z-20 bg-background border-b border-border/30"
          style={{ height: config.topBarHeight || 56 }}
        >
          <div className="h-full flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="ezmy.life" className="h-6 w-auto" />
              {!isFullscreen && (
                <>
                  <span className="text-muted-foreground/50">|</span>
                  <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
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
        </div>
      )}
      
      {/* Content area with clipping */}
      <div 
        className="w-full h-full overflow-hidden"
        style={{
          paddingTop: config.showTopBar ? config.topBarHeight || 56 : 0,
          paddingBottom: config.showBottomBar ? config.bottomBarHeight || 40 : 0,
        }}
      >
        <div 
          className="w-full h-full overflow-hidden"
          style={{
            marginTop: -(config.hideTop || 0),
            marginBottom: -(config.hideBottom || 0),
            marginLeft: -(config.hideLeft || 0),
            marginRight: -(config.hideRight || 0),
            height: `calc(100% + ${(config.hideTop || 0) + (config.hideBottom || 0)}px)`,
          }}
        >
          {children}
        </div>
      </div>
      
      {/* Bottom Branding Bar */}
      {config.showBottomBar && (
        <div 
          className="absolute bottom-0 left-0 right-0 z-20 bg-background border-t border-border/30"
          style={{ height: config.bottomBarHeight || 40 }}
        >
          <div className="h-full flex items-center justify-center px-4">
            <span className="text-xs text-muted-foreground">
              © 2025 ezmy.life — Think it → Done
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
