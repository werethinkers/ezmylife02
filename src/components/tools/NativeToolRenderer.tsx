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
import { ImageBlur } from "./ImageBlur";
import { ImagePixelate } from "./ImagePixelate";
import { ImageGrayscale } from "./ImageGrayscale";
import { ImageBeautify } from "./ImageBeautify";
import { ImageTextOverlay } from "./ImageTextOverlay";
import { DpiConverter } from "./DpiConverter";
import { MetadataViewer } from "./MetadataViewer";
import { ImageSplitter } from "./ImageSplitter";
import { AddLogoToImage } from "./AddLogoToImage";

// Map of tool IDs to native components
const nativeTools: Record<string, React.ComponentType> = {
  // Color & Basic
  "image-color-picker": ImageColorPicker,
  
  // Resize tools
  "resize-image-pixel": ImageResizer,
  "resize-image-cm": ImageResizer,
  "resize-image-mm": ImageResizer,
  "resize-image-inch": ImageResizer,
  "resize-image-3.5x4.5": ImageResizer,
  "resize-35x45mm": ImageResizer,
  "resize-2x2-inch": ImageResizer,
  "resize-3x4-inch": ImageResizer,
  "resize-4x6-inch": ImageResizer,
  "resize-600x600": ImageResizer,
  "resize-a4": ImageResizer,
  "bulk-image-resizer": ImageResizer,
  "upscale-image-ai": ImageResizer,
  
  // Crop tools
  "freehand-crop": ImageCropper,
  "circle-crop": ImageCropper,
  "square-crop": ImageCropper,
  
  // Background
  "remove-background": BackgroundRemover,
  "blur-background": ImageBlur,
  
  // Watermark & Logo
  "watermark-images": ImageWatermark,
  "add-logo-image": AddLogoToImage,
  
  // Passport & ID Photos
  "passport-photo-maker": PassportPhotoMaker,
  "ssc-photo-resize": PassportPhotoMaker,
  "pan-card-resize": PassportPhotoMaker,
  "upsc-photo-resize": PassportPhotoMaker,
  "psc-photo-resize": PassportPhotoMaker,
  
  // Signature
  "generate-signature": SignatureGenerator,
  "resize-signature": SignatureGenerator,
  "resize-sign-6x2": SignatureGenerator,
  "resize-signature-50x20": SignatureGenerator,
  
  // Rotate & Flip
  "rotate-image": ImageRotator,
  "flip-image": ImageRotator,
  
  // Compress
  "reduce-image-size-kb": ImageCompressor,
  "increase-image-size-kb": ImageCompressor,
  "increase-image-quality": ImageCompressor,
  
  // Merge & Split
  "join-images": ImageMerger,
  "merge-photo-signature": ImageMerger,
  "split-image": ImageSplitter,
  "instagram-grid": ImageSplitter,
  
  // Blur & Effects
  "blur-image": ImageBlur,
  "blur-face": ImageBlur,
  "motion-blur": ImageBlur,
  "unblur-image": ImageBeautify,
  "unblur-face": ImageBeautify,
  
  // Pixelate
  "pixelate-image": ImagePixelate,
  "pixelate-face": ImagePixelate,
  "censor-photo": ImagePixelate,
  "picture-pixel-art": ImagePixelate,
  
  // Color filters
  "grayscale-image": ImageGrayscale,
  "black-white": ImageGrayscale,
  
  // Beautify & Enhance
  "beautify-image": ImageBeautify,
  "retouch-image": ImageBeautify,
  "blemish-remover": ImageBeautify,
  "ai-photo-enhancer": ImageBeautify,
  "super-resolution": ImageBeautify,
  
  // Text
  "add-text-image": ImageTextOverlay,
  "add-name-dob-photo": ImageTextOverlay,
  
  // DPI & Metadata
  "convert-dpi": DpiConverter,
  "check-dpi": DpiConverter,
  "view-metadata": MetadataViewer,
  "edit-metadata": MetadataViewer,
  "remove-metadata": MetadataViewer,
  
  // Social Media
  "instagram-resize": ImageResizer,
  "whatsapp-dp": ImageResizer,
  "youtube-banner": ImageResizer,
  "zoom-out-image": ImageResizer,
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
