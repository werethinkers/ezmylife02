import { ImageColorPicker } from "./ImageColorPicker";

// Map of tool IDs to native components
const nativeTools: Record<string, React.ComponentType> = {
  "image-color-picker": ImageColorPicker,
};

interface NativeToolRendererProps {
  toolId: string;
}

export const NativeToolRenderer = ({ toolId }: NativeToolRendererProps) => {
  const ToolComponent = nativeTools[toolId];
  
  if (!ToolComponent) {
    return null;
  }
  
  return <ToolComponent />;
};

// Check if a tool has a native implementation
export const hasNativeImplementation = (toolId: string): boolean => {
  return toolId in nativeTools;
};
