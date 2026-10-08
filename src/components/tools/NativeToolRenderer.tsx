import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import AppRenderer from "@/apps/AppRenderer";
import { hasEngineApp } from "@/apps/registry";

// Each tool loads only when it is opened (keeps the tool page fast).
const ImageColorPicker = lazy(() => import("./ImageColorPicker").then((m) => ({ default: m.ImageColorPicker })));
const ImageResizer = lazy(() => import("./ImageResizer").then((m) => ({ default: m.ImageResizer })));
const ImageCropper = lazy(() => import("./ImageCropper").then((m) => ({ default: m.ImageCropper })));
const BackgroundRemover = lazy(() => import("./BackgroundRemover").then((m) => ({ default: m.BackgroundRemover })));
const ImageWatermark = lazy(() => import("./ImageWatermark").then((m) => ({ default: m.ImageWatermark })));
const PassportPhotoMaker = lazy(() => import("./PassportPhotoMaker").then((m) => ({ default: m.PassportPhotoMaker })));
const SignatureGenerator = lazy(() => import("./SignatureGenerator").then((m) => ({ default: m.SignatureGenerator })));
const ImageRotator = lazy(() => import("./ImageRotator").then((m) => ({ default: m.ImageRotator })));
const ImageCompressor = lazy(() => import("./ImageCompressor").then((m) => ({ default: m.ImageCompressor })));
const ImageMerger = lazy(() => import("./ImageMerger").then((m) => ({ default: m.ImageMerger })));
const ImageBlur = lazy(() => import("./ImageBlur").then((m) => ({ default: m.ImageBlur })));
const ImagePixelate = lazy(() => import("./ImagePixelate").then((m) => ({ default: m.ImagePixelate })));
const ImageGrayscale = lazy(() => import("./ImageGrayscale").then((m) => ({ default: m.ImageGrayscale })));
const ImageBeautify = lazy(() => import("./ImageBeautify").then((m) => ({ default: m.ImageBeautify })));
const ImageTextOverlay = lazy(() => import("./ImageTextOverlay").then((m) => ({ default: m.ImageTextOverlay })));
const DpiConverter = lazy(() => import("./DpiConverter").then((m) => ({ default: m.DpiConverter })));
const MetadataViewer = lazy(() => import("./MetadataViewer").then((m) => ({ default: m.MetadataViewer })));
const ImageSplitter = lazy(() => import("./ImageSplitter").then((m) => ({ default: m.ImageSplitter })));
const AddLogoToImage = lazy(() => import("./AddLogoToImage").then((m) => ({ default: m.AddLogoToImage })));
const InvoiceGenerator = lazy(() => import("./InvoiceGenerator").then((m) => ({ default: m.InvoiceGenerator })));
const ExpenseTracker = lazy(() => import("./ExpenseTracker").then((m) => ({ default: m.ExpenseTracker })));
const ContractDrafter = lazy(() => import("./ContractDrafter").then((m) => ({ default: m.ContractDrafter })));
const SalaryCalculator = lazy(() => import("./SalaryCalculator").then((m) => ({ default: m.SalaryCalculator })));
const TaxEstimator = lazy(() => import("./TaxEstimator").then((m) => ({ default: m.TaxEstimator })));
const JobPostGenerator = lazy(() => import("./JobPostGenerator").then((m) => ({ default: m.JobPostGenerator })));
const ProfitCalculator = lazy(() => import("./ProfitCalculator").then((m) => ({ default: m.ProfitCalculator })));
const QuizMaker = lazy(() => import("./QuizMaker").then((m) => ({ default: m.QuizMaker })));
const LessonPlanner = lazy(() => import("./LessonPlanner").then((m) => ({ default: m.LessonPlanner })));
const GradeCalculator = lazy(() => import("./GradeCalculator").then((m) => ({ default: m.GradeCalculator })));
const StudyPlanner = lazy(() => import("./StudyPlanner").then((m) => ({ default: m.StudyPlanner })));
const FlashcardMaker = lazy(() => import("./FlashcardMaker").then((m) => ({ default: m.FlashcardMaker })));
const AssignmentTracker = lazy(() => import("./AssignmentTracker").then((m) => ({ default: m.AssignmentTracker })));
const BibliographyGenerator = lazy(() => import("./BibliographyGenerator").then((m) => ({ default: m.BibliographyGenerator })));
const ExamScheduler = lazy(() => import("./ExamScheduler").then((m) => ({ default: m.ExamScheduler })));
const SocialPostGenerator = lazy(() => import("./SocialPostGenerator").then((m) => ({ default: m.SocialPostGenerator })));
const CaptionGenerator = lazy(() => import("./CaptionGenerator").then((m) => ({ default: m.CaptionGenerator })));
const HashtagGenerator = lazy(() => import("./HashtagGenerator").then((m) => ({ default: m.HashtagGenerator })));
const ContentIdeaGenerator = lazy(() => import("./ContentIdeaGenerator").then((m) => ({ default: m.ContentIdeaGenerator })));
const VideoScriptWriter = lazy(() => import("./VideoScriptWriter").then((m) => ({ default: m.VideoScriptWriter })));
const ContentWorkflow = lazy(() => import("./ContentWorkflow").then((m) => ({ default: m.ContentWorkflow })));
const ThumbnailMaker = lazy(() => import("./ThumbnailMaker"));
const VideoMaker = lazy(() => import("./VideoMaker"));

// Map of tool IDs to native components
const nativeTools: Record<string, React.ComponentType> = {
  // (tool-22 Supplier Order and tool-20 Stock Audit used to point at the salary calculator and
  //  job-post generator by mistake; they are now real apps in src/apps.)
  // Color & Basic
  "image-color-picker": ImageColorPicker,
  
  // Resize tools
  "resize-image-pixel": ImageResizer,
  "resize-image-cm": ImageResizer,
  "resize-image-mm": ImageResizer,
  "resize-image-inch": ImageResizer,
  "resize-image-3.5x4.5": ImageResizer,
  "resize-image-3-5x4-5": ImageResizer,

  // AI image (mapped to closest native impl until dedicated UIs ship)
  "ai-face-generator": ImageBeautify,
  "remove-object-photo": BackgroundRemover,
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
  "tool-30": SalaryCalculator,
  "hiring-job-post": JobPostGenerator,
  "job-post-generator": JobPostGenerator,
  "tool-28": JobPostGenerator,

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

  // ===== AI CREATION TOOLS =====
  "thumbnail-maker": ThumbnailMaker,
  "ai-thumbnail-generator": ThumbnailMaker,
  "video-maker": VideoMaker,
  "ai-video-generator": VideoMaker,
};

interface NativeToolRendererProps {
  toolId: string;
}

const Loading = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading app" />
  </div>
);

export const NativeToolRenderer = ({ toolId }: NativeToolRendererProps) => {
  if (hasEngineApp(toolId)) return <AppRenderer toolId={toolId} />;
  const ToolComponent = nativeTools[toolId];
  if (!ToolComponent) return null;
  return (
    <Suspense fallback={<Loading />}>
      <div className="py-3 md:py-6">
        <ToolComponent />
      </div>
    </Suspense>
  );
};

// Check if a tool has a native implementation
export const hasNativeImplementation = (toolId: string): boolean => toolId in nativeTools || hasEngineApp(toolId);
