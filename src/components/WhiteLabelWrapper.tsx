import { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { Sparkles } from "lucide-react";

// Tool-specific branding configuration
export interface ToolBrandingConfig {
  hideTop?: number;      // Pixels to hide from top
  hideBottom?: number;   // Pixels to hide from bottom
  showTopBar?: boolean;  // Show ezmy.life branded top bar
  topBarHeight?: number; // Height of top branding bar
}

// Per-tool configurations for precise cropping
const specificToolConfigs: Record<string, ToolBrandingConfig> = {
  // Pi7 Standard Tools (most common layout)
  "passport-photo-maker": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "reduce-image-size-kb": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "resize-image-pixel": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "resize-image-cm": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "resize-image-mm": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "resize-image-inch": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "resize-image-3.5x4.5": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "increase-image-size-kb": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "generate-signature": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "resize-signature": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  
  // Pi7 Blur & Effects Tools
  "blur-background": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "blur-image": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "blur-face": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "unblur-image": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "unblur-face": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "motion-blur": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "pixelate-image": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "pixelate-face": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "censor-photo": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  
  // Pi7 Color & Style Tools
  "grayscale-image": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "black-white": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "picture-pixel-art": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "beautify-image": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "blemish-remover": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "retouch-image": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  
  // Pi7 Background & Object Tools
  "remove-background": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "remove-object-photo": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  
  // Pi7 Transform Tools
  "rotate-image": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "flip-image": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "freehand-crop": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "circle-crop": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "square-crop": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  
  // Pi7 Merge & Split Tools
  "merge-photo-signature": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "join-images": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "split-image": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  
  // Pi7 Text & Overlay Tools
  "add-text-image": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "add-logo-image": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "add-name-dob-photo": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "watermark-images": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  
  // Pi7 Metadata Tools
  "image-color-picker": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "edit-metadata": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "view-metadata": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "remove-metadata": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  
  // Pi7 Quality Tools
  "increase-image-quality": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "convert-dpi": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "check-dpi": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "super-resolution": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "upscale-image-ai": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  
  // Pi7 AI Enhanced (vision.pi7.org - different layout)
  "ai-photo-enhancer": { hideTop: 100, hideBottom: 250, showTopBar: true, topBarHeight: 44 },
  "ai-face-generator": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  
  // Pi7 Official Document Sizes
  "resize-a4": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "ssc-photo-resize": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "pan-card-resize": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "upsc-photo-resize": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "psc-photo-resize": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  
  // Pi7 Passport & ID Sizes
  "resize-sign-6x2": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "resize-signature-50x20": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "resize-35x45mm": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "resize-2x2-inch": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "resize-3x4-inch": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "resize-4x6-inch": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "resize-600x600": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  
  // Pi7 Social Media
  "instagram-resize": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "instagram-grid": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "whatsapp-dp": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "youtube-banner": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "zoom-out-image": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  
  // Pi7 Bulk Resizer (different domain/layout)
  "bulk-image-resizer": { hideTop: 80, hideBottom: 200, showTopBar: true, topBarHeight: 44 },
  
  // ToolFK - AI ID Photo Generator
  "ai-id-photo-generator": { hideTop: 180, hideBottom: 400, showTopBar: true, topBarHeight: 44 },
};

// Default configs for tool categories
const defaultConfigs: Record<string, ToolBrandingConfig> = {
  "pi7-standard": { hideTop: 140, hideBottom: 300, showTopBar: true, topBarHeight: 44 },
  "pi7-vision": { hideTop: 100, hideBottom: 250, showTopBar: true, topBarHeight: 44 },
  "toolfk": { hideTop: 180, hideBottom: 400, showTopBar: true, topBarHeight: 44 },
  "minimal": { hideTop: 0, hideBottom: 0, showTopBar: false, topBarHeight: 0 },
};

// Get config for a specific tool
export const getToolConfig = (toolId: string): ToolBrandingConfig => {
  // Check for specific tool config first
  if (specificToolConfigs[toolId]) {
    return specificToolConfigs[toolId];
  }
  
  // Fallback to category-based detection
  if (toolId.includes("vision") || toolId.includes("restore") || toolId.includes("ai-photo-enhancer")) {
    return defaultConfigs["pi7-vision"];
  }
  
  if (toolId.includes("toolfk") || toolId.includes("ai-id-photo")) {
    return defaultConfigs["toolfk"];
  }
  
  // Check if it's a Pi7 tool by common patterns
  const pi7Patterns = [
    "passport", "resize", "reduce", "increase", "blur", "remove", "rotate", "flip",
    "watermark", "crop", "merge", "join", "split", "color-picker", "metadata",
    "beautify", "unblur", "pixelate", "censor", "motion", "grayscale", "black-white",
    "pixel-art", "face-generator", "blemish", "retouch", "add-text", "add-logo",
    "add-name", "dpi", "super-resolution", "upscale", "ssc-photo", "pan-card",
    "upsc-photo", "psc-photo", "instagram", "whatsapp", "youtube", "zoom-out",
    "generate-signature"
  ];
  
  if (pi7Patterns.some(pattern => toolId.includes(pattern))) {
    return defaultConfigs["pi7-standard"];
  }
  
  // Default - no overlay for internal ezmy.life tools
  return defaultConfigs["minimal"];
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

  const topBarH = config.topBarHeight || 44;
  const hideTop = config.hideTop || 0;
  const hideBottom = config.hideBottom || 0;

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      {/* Top Branding Bar */}
      {config.showTopBar && (
        <div 
          className="absolute top-0 left-0 right-0 z-30 bg-background border-b border-border/20 flex items-center justify-between px-4"
          style={{ height: topBarH }}
        >
          <div className="flex items-center gap-2">
            <img src={logo} alt="ezmy.life" className="h-5 w-auto" />
            {!isFullscreen && (
              <>
                <span className="text-muted-foreground/30">|</span>
                <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
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
      
      {/* Iframe container - clips to show only tool interface */}
      <div 
        className="absolute left-0 right-0 bottom-0 overflow-hidden"
        style={{ top: config.showTopBar ? topBarH : 0 }}
      >
        <div 
          className="relative w-full"
          style={{
            marginTop: -hideTop,
            height: `calc(100% + ${hideTop + hideBottom}px)`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
