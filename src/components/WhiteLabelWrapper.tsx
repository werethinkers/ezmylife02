import { ReactNode } from "react";

// Check if tool needs white-label wrapper - always returns false now
export const needsWhiteLabel = (_toolId: string): boolean => {
  return false;
};

interface WhiteLabelWrapperProps {
  toolId: string;
  toolName?: string;
  children: ReactNode;
  isFullscreen?: boolean;
}

// Simple passthrough wrapper - no branding overlays or modifications
export const WhiteLabelWrapper = ({ 
  children,
}: WhiteLabelWrapperProps) => {
  return <>{children}</>;
};
