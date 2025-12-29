import { ImageColorPicker } from "./ImageColorPicker";
import { ImageResizer } from "./ImageResizer";
import { ImageCropper } from "./ImageCropper";
import { BackgroundRemover } from "./BackgroundRemover";
import { ImageWatermark } from "./ImageWatermark";
import { PassportPhotoMaker } from "./PassportPhotoMaker";
import { SignatureGenerator } from "./SignatureGenerator";
import { ImageRotator } from "./ImageRotator";
import { ImageCompressor } from "./ImageCompressor";
import { ImageMerger } from "./ImageMerger";

// Map of tool IDs to native components
const nativeTools: Record<string, React.ComponentType> = {
  "image-color-picker": ImageColorPicker,
  "resize-image-pixel": ImageResizer,
  "resize-image-cm": ImageResizer,
  "resize-image-mm": ImageResizer,
  "resize-image-inch": ImageResizer,
  "freehand-crop": ImageCropper,
  "circle-crop": ImageCropper,
  "square-crop": ImageCropper,
  "remove-background": BackgroundRemover,
  "watermark-images": ImageWatermark,
  "passport-photo-maker": PassportPhotoMaker,
  "generate-signature": SignatureGenerator,
  "resize-signature": SignatureGenerator,
  "rotate-image": ImageRotator,
  "flip-image": ImageRotator,
  "reduce-image-size-kb": ImageCompressor,
  "increase-image-size-kb": ImageCompressor,
  "join-images": ImageMerger,
  "merge-photo-signature": ImageMerger,
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
