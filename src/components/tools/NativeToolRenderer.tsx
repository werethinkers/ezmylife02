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
import { InvoiceGenerator } from "./InvoiceGenerator";
import { ExpenseTracker } from "./ExpenseTracker";
import { ContractDrafter } from "./ContractDrafter";
import { SalaryCalculator } from "./SalaryCalculator";
import { TaxEstimator } from "./TaxEstimator";
import { JobPostGenerator } from "./JobPostGenerator";
import { ProfitCalculator } from "./ProfitCalculator";
import { QuizMaker } from "./QuizMaker";
import { LessonPlanner } from "./LessonPlanner";
import { GradeCalculator } from "./GradeCalculator";
import { StudyPlanner } from "./StudyPlanner";
import { FlashcardMaker } from "./FlashcardMaker";
import { AssignmentTracker } from "./AssignmentTracker";
import { BibliographyGenerator } from "./BibliographyGenerator";
import { ExamScheduler } from "./ExamScheduler";
import { SocialPostGenerator } from "./SocialPostGenerator";
import { CaptionGenerator } from "./CaptionGenerator";
import { HashtagGenerator } from "./HashtagGenerator";
import { ContentIdeaGenerator } from "./ContentIdeaGenerator";
import { VideoScriptWriter } from "./VideoScriptWriter";
import { ContentWorkflow } from "./ContentWorkflow";

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

  // ===== INDUSTRY / BUSINESS TOOLS =====
  
  // Finance & Accounting
  "invoice-generator": InvoiceGenerator,
  "ai-invoice-generator": InvoiceGenerator,
  "tool-1": InvoiceGenerator,
  "expense-tracker": ExpenseTracker,
  "tool-2": ExpenseTracker,
  "profit-calculator": ProfitCalculator,
  "tool-3": ProfitCalculator,
  "tax-estimator": TaxEstimator,
  "tool-4": TaxEstimator,
  
  // Legal & Compliance
  "contract-drafter": ContractDrafter,
  "tool-6": ContractDrafter,
  
  // HR & Staffing
  "salary-calculator": SalaryCalculator,
  "tool-22": SalaryCalculator,
  "hiring-job-post": JobPostGenerator,
  "job-post-generator": JobPostGenerator,
  "tool-20": JobPostGenerator,

  // ===== EDUCATION TOOLS =====
  "quiz-maker": QuizMaker,
  "quiz": QuizMaker,
  "lesson-planner": LessonPlanner,
  "lesson-plan": LessonPlanner,
  "grade-calculator": GradeCalculator,
  "cgpa-calculator": GradeCalculator,
  "study-planner": StudyPlanner,
  "study-schedule": StudyPlanner,
  "flashcard-maker": FlashcardMaker,
  "flashcards": FlashcardMaker,
  "assignment-tracker": AssignmentTracker,
  "assignments": AssignmentTracker,
  "bibliography-generator": BibliographyGenerator,
  "citation-generator": BibliographyGenerator,
  "exam-scheduler": ExamScheduler,
  "exam-planner": ExamScheduler,

  // ===== CONTENT CREATION TOOLS =====
  "social-post-generator": SocialPostGenerator,
  "caption-generator": CaptionGenerator,
  "hashtag-generator": HashtagGenerator,
  "content-idea-generator": ContentIdeaGenerator,
  "video-script-writer": VideoScriptWriter,
  "content-workflow": ContentWorkflow,
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
