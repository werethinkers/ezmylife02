import { ReactNode } from "react";
import logo from "@/assets/logo.png";

// Tool-specific branding overlay configuration
export interface ToolBrandingConfig {
  // Overlay positions for covering external branding
  overlays?: OverlayConfig[];
  // Show minimal top bar with tool name
  showTopBar?: boolean;
  topBarHeight?: number;
}

interface OverlayConfig {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  width?: string;
  height?: string;
  offsetX?: number;
  offsetY?: number;
  showLogo?: boolean;
  showText?: string;
  backgroundColor?: string;
}

// Per-tool configurations for precise overlay placement
const specificToolConfigs: Record<string, ToolBrandingConfig> = {
  // Pi7 Standard Tools - overlay the top-left logo area
  "passport-photo-maker": { 
    showTopBar: true, 
    topBarHeight: 48,
    overlays: [
      { position: 'top-left', width: '200px', height: '60px', offsetX: 0, offsetY: 48, showLogo: true },
      { position: 'bottom-center', width: '100%', height: '80px', offsetX: 0, offsetY: 0, showLogo: false, backgroundColor: 'background' }
    ]
  },
};

// Default overlay configs for tool categories
const defaultConfigs: Record<string, ToolBrandingConfig> = {
  "pi7-standard": { 
    showTopBar: true, 
    topBarHeight: 48,
    overlays: [
      { position: 'top-left', width: '200px', height: '60px', offsetX: 0, offsetY: 48, showLogo: true },
      { position: 'bottom-center', width: '100%', height: '80px', offsetX: 0, offsetY: 0, showLogo: false, backgroundColor: 'background' }
    ]
  },
  "pi7-vision": { 
    showTopBar: true, 
    topBarHeight: 48,
    overlays: [
      { position: 'top-left', width: '180px', height: '50px', offsetX: 0, offsetY: 48, showLogo: true },
      { position: 'bottom-center', width: '100%', height: '60px', offsetX: 0, offsetY: 0, showLogo: false, backgroundColor: 'background' }
    ]
  },
  "toolfk": { 
    showTopBar: true, 
    topBarHeight: 48,
    overlays: [
      { position: 'top-left', width: '220px', height: '70px', offsetX: 0, offsetY: 48, showLogo: true },
      { position: 'bottom-center', width: '100%', height: '100px', offsetX: 0, offsetY: 0, showLogo: false, backgroundColor: 'background' }
    ]
  },
  "minimal": { showTopBar: false, topBarHeight: 0, overlays: [] },
};

// Get config for a specific tool - always return minimal (no overlays)
export const getToolConfig = (toolId: string): ToolBrandingConfig => {
  // Always return minimal config - no white label overlays
  return defaultConfigs["minimal"];
};

// Check if tool needs white-label wrapper
export const needsWhiteLabel = (toolId: string): boolean => {
  const config = getToolConfig(toolId);
  return config.showTopBar === true || (config.overlays && config.overlays.length > 0);
};

interface WhiteLabelWrapperProps {
  toolId: string;
  toolName?: string;
  children: ReactNode;
  isFullscreen?: boolean;
}

// Overlay component to cover external branding
const BrandOverlay = ({ 
  config, 
  topBarHeight 
}: { 
  config: OverlayConfig; 
  topBarHeight: number;
}) => {
  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width: config.width || 'auto',
      height: config.height || 'auto',
      zIndex: 25,
      display: 'flex',
      alignItems: 'center',
      justifyContent: config.showLogo ? 'flex-start' : 'center',
      padding: config.showLogo ? '0 12px' : '0',
    };

    switch (config.position) {
      case 'top-left':
        return { ...base, top: config.offsetY ?? topBarHeight, left: config.offsetX ?? 0 };
      case 'top-center':
        return { ...base, top: config.offsetY ?? topBarHeight, left: '50%', transform: 'translateX(-50%)' };
      case 'top-right':
        return { ...base, top: config.offsetY ?? topBarHeight, right: config.offsetX ?? 0 };
      case 'bottom-left':
        return { ...base, bottom: config.offsetY ?? 0, left: config.offsetX ?? 0 };
      case 'bottom-center':
        return { ...base, bottom: config.offsetY ?? 0, left: 0, right: 0, width: '100%' };
      case 'bottom-right':
        return { ...base, bottom: config.offsetY ?? 0, right: config.offsetX ?? 0 };
      default:
        return base;
    }
  };

  return (
    <div 
      style={getPositionStyles()}
      className={`${config.backgroundColor === 'background' ? 'bg-background' : 'bg-background/95 backdrop-blur-sm'}`}
    >
      {config.showLogo && (
        <img src={logo} alt="ezmy.life" className="h-6 w-auto" />
      )}
      {config.showText && (
        <span className="text-sm font-medium text-foreground">{config.showText}</span>
      )}
    </div>
  );
};

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

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      {/* Top Branding Bar */}
      {config.showTopBar && (
        <div 
          className="absolute top-0 left-0 right-0 z-30 bg-background border-b border-border/30 flex items-center justify-between px-4 shadow-sm"
          style={{ height: topBarH }}
        >
          <div className="flex items-center gap-3">
            <img src={logo} alt="ezmy.life" className="h-6 w-auto" />
            {!isFullscreen && (
              <>
                <span className="text-muted-foreground/40">|</span>
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {toolName}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Powered by</span>
            <span className="font-medium text-primary">ezmy.life</span>
          </div>
        </div>
      )}
      
      {/* Branding overlays to cover external logos */}
      {config.overlays?.map((overlay, index) => (
        <BrandOverlay key={index} config={overlay} topBarHeight={topBarH} />
      ))}
      
      {/* Iframe container - full content visible, overlays cover branding */}
      <div 
        className="absolute left-0 right-0 bottom-0 overflow-hidden"
        style={{ top: config.showTopBar ? topBarH : 0 }}
      >
        {children}
      </div>
    </div>
  );
};
