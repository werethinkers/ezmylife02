import { Bot, BookOpen, Library, Calendar, Layers, ClipboardList, Image, BookText, FileText, Notebook, Edit, FileImage, Languages, Code, Eraser, BarChart3, Brain, Map, Calculator, Globe, Video, Network, Headphones, PlayCircle, Sparkles, ScanText, BookMarked, FileCode, Eye, FileSearch, Database, Heart, Lightbulb, Pencil, Camera, ImagePlus, Minimize2, Maximize2, FileSignature, Wand2, RotateCw, FlipHorizontal, Droplets, CircleDot, Square, Merge, SplitSquareHorizontal, Pipette, FileText as MetadataIcon, Sparkle, Focus, Grid3X3, UserCircle, Eraser as BlemishIcon, Type, ImageIcon, Gauge, Zap, Smartphone, Youtube, MessageCircle, Scissors, RectangleHorizontal, CreditCard, GraduationCap, Stamp, Ruler, Hash, Send, Instagram } from "lucide-react";
import { ReactNode } from "react";

export interface Tool {
  title: string;
  description: string;
  category: string;
  icon: ReactNode;
  toolId: string;
  videoLink: string;
  isLive: boolean;
}

// Internal mapping - not exported to keep URLs hidden
const toolUrls: Record<string, string> = {
  // AI Invoice Generator (tool-1)
  
  // Existing ezyourlife tools
  
  // ToolFK - AI ID Photo Generator
  "ai-id-photo-generator": "https://www.toolfk.com/tools/online-idphotos.html",
  
  // Pi7 Image Tools - Most Used
  "passport-photo-maker": "https://image.pi7.org/passport-size-photo",
  "reduce-image-size-kb": "https://image.pi7.org/reduce-image-size-in-kb",
  "resize-image-pixel": "https://image.pi7.org/resize-image-pixel",
  "generate-signature": "https://image.pi7.org/generate-signature",
  "increase-image-size-kb": "https://image.pi7.org/increase-image-size-in-kb",
  "ai-photo-enhancer": "https://vision.pi7.org/restore-image",
  "resize-signature": "https://image.pi7.org/resize-signature",
  "resize-image-cm": "https://image.pi7.org/resize-image-in-cm",
  "resize-image-3.5x4.5": "https://image.pi7.org/resize-image-to-3.5cmx4.5cm",
  
  // Pi7 - Basic Editing
  "blur-background": "https://image.pi7.org/blur-background",
  "remove-background": "https://image.pi7.org/remove-image-background",
  "remove-object-photo": "https://vision.pi7.org/remove-image-object",
  "add-name-dob-photo": "https://image.pi7.org/add-name-and-date-on-photo",
  "rotate-image": "https://image.pi7.org/rotate-image",
  "flip-image": "https://image.pi7.org/flip-image",
  "watermark-images": "https://image.pi7.org/watermark-image",
  "freehand-crop": "https://image.pi7.org/freehand-crop",
  "circle-crop": "https://image.pi7.org/circle-crop",
  "square-crop": "https://image.pi7.org/square-image-cropper",
  "merge-photo-signature": "https://image.pi7.org/merge-photo-and-signature",
  "join-images": "https://image.pi7.org/join-images-online",
  "split-image": "https://image.pi7.org/image-splitter",
  "image-color-picker": "https://image.pi7.org/color-code-from-image",
  "edit-metadata": "https://image.pi7.org/photo-exif-editor",
  "view-metadata": "https://image.pi7.org/photo-metadata-viewer",
  "remove-metadata": "https://image.pi7.org/remove-image-metadata",
  
  // Pi7 - Blur, Pixelate & Effects
  "beautify-image": "https://image.pi7.org/beautify-image",
  "unblur-image": "https://image.pi7.org/unblur-image",
  "blur-image": "https://image.pi7.org/blur-image",
  "blur-face": "https://image.pi7.org/blur-face",
  "unblur-face": "https://image.pi7.org/unblur-face",
  "pixelate-image": "https://image.pi7.org/pixelate-image",
  "pixelate-face": "https://image.pi7.org/pixelate-face",
  "censor-photo": "https://image.pi7.org/censor-photo",
  "motion-blur": "https://image.pi7.org/motion-blur",
  "grayscale-image": "https://image.pi7.org/grayscale-image",
  "black-white": "https://image.pi7.org/turn-image-to-black-and-white",
  "picture-pixel-art": "https://image.pi7.org/picture-to-pixel-art",
  "ai-face-generator": "https://image.pi7.org/this-person-does-not-exist",
  "blemish-remover": "https://image.pi7.org/photo-blemish-remover",
  "retouch-image": "https://image.pi7.org/retouch-photo",
  "add-text-image": "https://image.pi7.org/add-text-to-image",
  "add-logo-image": "https://image.pi7.org/add-logo-to-image",
  
  // Pi7 - DPI & Quality
  "increase-image-quality": "https://image.pi7.org/increase-image-quality",
  "convert-dpi": "https://image.pi7.org/convert-dpi",
  "check-dpi": "https://image.pi7.org/dpi-checker",
  "super-resolution": "https://image.pi7.org/super-resolution",
  
  // Pi7 - General Resizing
  "resize-image-mm": "https://image.pi7.org/resize-image-in-mm",
  "resize-image-inch": "https://image.pi7.org/resize-image-in-inch",
  "bulk-image-resizer": "https://bulkresizer.pi7.org/",
  "upscale-image-ai": "https://image.pi7.org/upscale-image",
  
  // Pi7 - Official Sizes
  "resize-a4": "https://image.pi7.org/resize-image-to-a4-size",
  "ssc-photo-resize": "https://image.pi7.org/ssc-photo-resizer",
  "pan-card-resize": "https://image.pi7.org/resize-for-pan-card",
  "upsc-photo-resize": "https://image.pi7.org/resize-image-for-upsc",
  "psc-photo-resize": "https://image.pi7.org/psc-photo-resize",
  
  // Pi7 - Passport & ID Sizes
  "resize-sign-6x2": "https://image.pi7.org/resize-image-to-6cmx2cm",
  "resize-signature-50x20": "https://image.pi7.org/resize-signature-to-50mmx20mm",
  "resize-35x45mm": "https://image.pi7.org/resize-image-to-35mmx45mm",
  "resize-2x2-inch": "https://image.pi7.org/resize-image-to-2x2",
  "resize-3x4-inch": "https://image.pi7.org/resize-image-to-3x4",
  "resize-4x6-inch": "https://image.pi7.org/resize-image-to-4x6",
  "resize-600x600": "https://image.pi7.org/resize-image-to-600x600-pixel",
  
  // Pi7 - Social Media
  "instagram-resize": "https://image.pi7.org/resize-image-for-instagram",
  "instagram-grid": "https://image.pi7.org/instagram-grid",
  "whatsapp-dp": "https://image.pi7.org/resize-image-for-whatsapp-dp",
  "youtube-banner": "https://image.pi7.org/resize-image-for-youtube-banner",
  "zoom-out-image": "https://image.pi7.org/zoom-out-image",
};

export const getToolUrl = (toolId: string): string | null => {
  return toolUrls[toolId] || null;
};

// Helper to get live tools count
export const getLiveToolsCount = (): number => {
  return tools.filter(t => t.isLive).length;
};

// Helper to get coming soon tools count
export const getComingSoonToolsCount = (): number => {
  return tools.filter(t => !t.isLive).length;
};

export const tools: Tool[
] = [
  // ============ EXISTING EZYOURLIFE TOOLS (LIVE) ============
  {
    title: "Audio Stream",
    description: "Listen to various audios, lectures, and music for relaxation and learning.",
    category: "Popular",
    icon: <Headphones className="h-8 w-8" />,
    toolId: "jain-audio-stream",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Video Stream",
    description: "Watch lectures, documentaries, and educational videos.",
    category: "Popular",
    icon: <PlayCircle className="h-8 w-8" />,
    toolId: "jain-video-stream",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Gyan AI",
    description: "An intelligent AI assistant providing insights and answers on various topics.",
    category: "AI Agent",
    icon: <Sparkles className="h-8 w-8" />,
    toolId: "jaingyan-ai",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Advance AI Bot",
    description: "Ask questions from multiple specified sources to get instant answers.",
    category: "Popular",
    icon: <Bot className="h-8 w-8" />,
    toolId: "advance-ai-bot",
    videoLink: "https://www.loom.com/share/88b01502cfc94549961e5a65aaae8603?sid=f7e70c03-a887-4e0d-bafe-6fd85d27dd45",
    isLive: true
  },
  {
    title: "PDF Reader",
    description: "Read documents in digital format. This tool helps you easily read and study texts in PDF format.",
    category: "Popular",
    icon: <BookOpen className="h-8 w-8" />,
    toolId: "shastra-pdf-reader",
    videoLink: "https://www.loom.com/share/88c39a36c6cc499a85d913e69347ea18?sid=a8906f09-33fb-4ba4-918c-2b9890fd4d66",
    isLive: true
  },
  {
    title: "Encyclopedia",
    description: "A comprehensive encyclopedia of terms, concepts, and history.",
    category: "Popular",
    icon: <Library className="h-8 w-8" />,
    toolId: "jain-encyclopedia",
    videoLink: "https://www.loom.com/share/f94c887d82ca415c8a5e47943d4ce237?sid=419fd2ff-d39a-4a88-8042-1e137f14ff5d",
    isLive: true
  },
  {
    title: "Panchang",
    description: "Stay updated with upcoming festivals, dates, and important days.",
    category: "Content",
    icon: <Calendar className="h-8 w-8" />,
    toolId: "jain-panchang",
    videoLink: "https://www.loom.com/share/27c8f352c22f48df9f8efb0b15327506?sid=9b8b19a6-9810-4674-8c6f-b4dc0562073b",
    isLive: true
  },
  {
    title: "Multi-PDF AI Bot",
    description: "Ask questions from multiple documents at once with our advanced AI and get answers.",
    category: "Popular",
    icon: <Layers className="h-8 w-8" />,
    toolId: "shastra-multi-pdf-ai-bot",
    videoLink: "https://www.loom.com/share/419a9d4378b8417491a95d0e1d4cdb0d?sid=74611eba-9223-4985-a782-231e36c0f8e2",
    isLive: true
  },
  {
    title: "Quiz",
    description: "Test your knowledge on various topics by creating quizzes of your choice and reinforce your understanding.",
    category: "Content",
    icon: <ClipboardList className="h-8 w-8" />,
    toolId: "quiz",
    videoLink: "https://www.loom.com/share/20204bab9ceb46e68027cde57ed2bbfc?sid=74e8480-087c-42fe-83f6-038ea97e780e",
    isLive: true
  },
  {
    title: "Image Creator",
    description: "Create and share beautiful and inspiring images and quotes.",
    category: "Content",
    icon: <Image className="h-8 w-8" />,
    toolId: "image-creator",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "StoryBook Creator",
    description: "Use AI to create new, inspiring stories and illustrations based on principles and narratives.",
    category: "Content",
    icon: <BookText className="h-8 w-8" />,
    toolId: "storybook-creator",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Advance Text Extractor",
    description: "Extract and organize important excerpts from documents.",
    category: "Content",
    icon: <FileText className="h-8 w-8" />,
    toolId: "advance-text-extractor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Create 3D Images",
    description: "Design and generate stunning 3D images and models for visual representations of concepts.",
    category: "Content",
    icon: <Image className="h-8 w-8" />,
    toolId: "create-3d-images",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "SketchFlow AI",
    description: "Transform your ideas into detailed flowcharts, diagrams, and visual plans with AI assistance.",
    category: "Content",
    icon: <Pencil className="h-8 w-8" />,
    toolId: "sketchflow-ai",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Speedy Notebook",
    description: "Rich-text workspace with AI rephrasing, personal shortcuts that sync to browser extensions, and auto-saving.",
    category: "Research",
    icon: <Notebook className="h-8 w-8" />,
    toolId: "speedy-notebook",
    videoLink: "https://www.loom.com/share/ef5ff4f1569b4d87962d83483e619e98?sid=1258a673-0f71-404c-ac29-11bf9b03ce99",
    isLive: true
  },
  {
    title: "PromptMaster AI",
    description: "Elite prompt engineering workspace with AI brainstorm, favourites with synced shortcuts, and multi-format output.",
    category: "AI Agent",
    icon: <Wand2 className="h-8 w-8" />,
    toolId: "promptmaster-ai",
    videoLink: "",
    isLive: true
  },
  {
    title: "Startup Analyser",
    description: "Generate exhaustive VC-style investment reports with AI. Upload pitch decks, get competitor analysis, financials & more.",
    category: "AI Agent",
    icon: <BarChart3 className="h-8 w-8" />,
    toolId: "startup-analyser",
    videoLink: "",
    isLive: true
  },
  {
    title: "Rich Editor",
    description: "This is a powerful tool for formatting text in digital form.",
    category: "Research",
    icon: <Edit className="h-8 w-8" />,
    toolId: "rich-editor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "PDF Chart & Image Extractor",
    description: "A powerful tool to extract charts and images from PDFs.",
    category: "Research",
    icon: <FileImage className="h-8 w-8" />,
    toolId: "pdf-chart-image-extractor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Hover Dictionary",
    description: "See the meaning of difficult words from documents by simply hovering over them.",
    category: "Research",
    icon: <Languages className="h-8 w-8" />,
    toolId: "shastra-hover-dictionary",
    videoLink: "https://www.loom.com/share/ef5ff4f1569b4d87962d83483e619e98?sid=1258a673-0f71-404c-ac29-11bf9b03ce99",
    isLive: true
  },
  {
    title: "HTML Editor",
    description: "Create and edit HTML content with a simple and powerful editor.",
    category: "Research",
    icon: <Code className="h-8 w-8" />,
    toolId: "html-editor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Wrong Written Words",
    description: "It identifies incorrectly written words and finds their correct forms, improving writing accuracy.",
    category: "Research",
    icon: <Eraser className="h-8 w-8" />,
    toolId: "wrong-written-words",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Book Editor",
    description: "Edit and format books and texts with a dedicated book editor.",
    category: "Research",
    icon: <BookMarked className="h-8 w-8" />,
    toolId: "book-editor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Book Editor with HTML",
    description: "Edit and format books and texts, including HTML content, with an advanced book editor.",
    category: "Research",
    icon: <FileCode className="h-8 w-8" />,
    toolId: "book-editor-html",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "OCR",
    description: "Convert images or scanned documents into editable and searchable text with high accuracy.",
    category: "Research",
    icon: <ScanText className="h-8 w-8" />,
    toolId: "ocr",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Dictionary Extractor AI",
    description: "Extract and compile dictionaries from texts using AI.",
    category: "Research",
    icon: <Database className="h-8 w-8" />,
    toolId: "dictionary-extractor-ai",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "PDF Profile Extractor",
    description: "Extract profiles and structured data from PDF documents.",
    category: "Research",
    icon: <FileSearch className="h-8 w-8" />,
    toolId: "pdf-profile-extractor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "PDF Metadata AI Analyst",
    description: "Extract, analyze, and visualize metadata from PDF documents using AI.",
    category: "Research",
    icon: <Eye className="h-8 w-8" />,
    toolId: "pdf-metadata-ai-analyst",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Soul Mirror - Johari Window",
    description: "Reflect on self-awareness and personal growth through the Johari Window model.",
    category: "Modern Science",
    icon: <Heart className="h-8 w-8" />,
    toolId: "soul-mirror",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Cognimap - Mental Models",
    description: "Explore and apply various mental models for improved thinking and decision-making.",
    category: "Modern Science",
    icon: <Lightbulb className="h-8 w-8" />,
    toolId: "cognimap",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "AI Data Analysis",
    description: "Visualize and analyze data with our interactive AI-powered dashboard.",
    category: "Lab",
    icon: <BarChart3 className="h-8 w-8" />,
    toolId: "ai-data-analysis",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "E-book & Advance Bot",
    description: "An advanced e-book reader with an integrated AI assistant.",
    category: "Lab",
    icon: <Brain className="h-8 w-8" />,
    toolId: "kundkund-ebook-bot",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "MindMap",
    description: "Visually organize and explore concepts with mind maps.",
    category: "Lab",
    icon: <Map className="h-8 w-8" />,
    toolId: "kundkund-mindmap",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Ganit",
    description: "Explore complex mathematics and cosmology concepts.",
    category: "Lab",
    icon: <Calculator className="h-8 w-8" />,
    toolId: "jain-ganit",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Bhugol Maps (Beta)",
    description: "Explore the concepts of geography and cosmology with interactive maps. (Beta Version)",
    category: "Lab",
    icon: <Globe className="h-8 w-8" />,
    toolId: "jainbhugol-maps",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Interactive Videos (Beta)",
    description: "Engage with educational content through interactive videos with quizzes. (Beta Version)",
    category: "Lab",
    icon: <Video className="h-8 w-8" />,
    toolId: "interactive-videos",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Create Smart Diagram AI v2.0",
    description: "Generate complex diagrams, flowcharts, and visual aids from your notes and ideas using AI.",
    category: "Lab",
    icon: <Network className="h-8 w-8" />,
    toolId: "smart-diagram-ai",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },
  {
    title: "Auto Text Extractor Agent",
    description: "Automatically extract and organize text from various sources using an intelligent AI agent.",
    category: "AI Agent",
    icon: <ScanText className="h-8 w-8" />,
    toolId: "auto-text-extractor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4",
    isLive: true
  },

  // ============ TOOLFK - ID PHOTO TOOLS (LIVE) ============
  {
    title: "AI ID Photo Generator",
    description: "Generate professional AI ID photos for passport, visa, and ID cards. Supports custom backgrounds, DPI settings, and international standards.",
    category: "Image Tools",
    icon: <Camera className="h-8 w-8" />,
    toolId: "ai-id-photo-generator",
    videoLink: "",
    isLive: true
  },

  // ============ PI7 IMAGE TOOLS - MOST USED (LIVE) ============
  {
    title: "Passport Photo Maker",
    description: "Create professional passport size photos that meet official requirements for documents and applications.",
    category: "Image Tools",
    icon: <Camera className="h-8 w-8" />,
    toolId: "passport-photo-maker",
    videoLink: "",
    isLive: true
  },
  {
    title: "Reduce Image Size in KB",
    description: "Compress images to a specific file size in KB while maintaining quality for uploads and submissions.",
    category: "Image Tools",
    icon: <Minimize2 className="h-8 w-8" />,
    toolId: "reduce-image-size-kb",
    videoLink: "",
    isLive: true
  },
  {
    title: "Resize Image by Pixel",
    description: "Resize images to exact pixel dimensions for websites, social media, and digital applications.",
    category: "Image Tools",
    icon: <Maximize2 className="h-8 w-8" />,
    toolId: "resize-image-pixel",
    videoLink: "",
    isLive: true
  },
  {
    title: "Generate Signature",
    description: "Create digital signatures for documents, forms, and official submissions.",
    category: "Image Tools",
    icon: <FileSignature className="h-8 w-8" />,
    toolId: "generate-signature",
    videoLink: "",
    isLive: true
  },
  {
    title: "Increase Image Size in KB",
    description: "Increase image file size to meet minimum size requirements for submissions.",
    category: "Image Tools",
    icon: <Maximize2 className="h-8 w-8" />,
    toolId: "increase-image-size-kb",
    videoLink: "",
    isLive: true
  },
  {
    title: "AI Photo Enhancer",
    description: "Enhance photo quality using AI to restore and improve image clarity and details.",
    category: "Image Tools",
    icon: <Wand2 className="h-8 w-8" />,
    toolId: "ai-photo-enhancer",
    videoLink: "",
    isLive: true
  },
  {
    title: "Resize Signature",
    description: "Resize digital signatures to specific dimensions for forms and documents.",
    category: "Image Tools",
    icon: <FileSignature className="h-8 w-8" />,
    toolId: "resize-signature",
    videoLink: "",
    isLive: true
  },
  {
    title: "Resize Image in Centimeters",
    description: "Resize images to exact centimeter dimensions for print and official documents.",
    category: "Image Tools",
    icon: <Ruler className="h-8 w-8" />,
    toolId: "resize-image-cm",
    videoLink: "",
    isLive: true
  },
  {
    title: "Resize Image 3.5cm x 4.5cm",
    description: "Resize photos to standard 3.5cm x 4.5cm passport photo dimensions.",
    category: "Image Tools",
    icon: <Camera className="h-8 w-8" />,
    toolId: "resize-image-3.5x4.5",
    videoLink: "",
    isLive: true
  },

  // ============ PI7 - BASIC EDITING (LIVE) ============
  {
    title: "Blur Background",
    description: "Add professional blur effect to photo backgrounds for portraits and product images.",
    category: "Image Tools",
    icon: <Droplets className="h-8 w-8" />,
    toolId: "blur-background",
    videoLink: "",
    isLive: true
  },
  {
    title: "Remove Background",
    description: "Automatically remove image backgrounds for transparent or custom colored backgrounds.",
    category: "Image Tools",
    icon: <Eraser className="h-8 w-8" />,
    toolId: "remove-background",
    videoLink: "",
    isLive: true
  },
  {
    title: "Remove Object from Photo",
    description: "AI-powered tool to remove unwanted objects from photos seamlessly.",
    category: "Image Tools",
    icon: <Eraser className="h-8 w-8" />,
    toolId: "remove-object-photo",
    videoLink: "",
    isLive: true
  },
  {
    title: "Add Name & DOB on Photo",
    description: "Add name and date of birth text overlays on photos for official documents.",
    category: "Image Tools",
    icon: <Type className="h-8 w-8" />,
    toolId: "add-name-dob-photo",
    videoLink: "",
    isLive: true
  },
  {
    title: "Rotate Image",
    description: "Rotate images to any angle for proper orientation and alignment.",
    category: "Image Tools",
    icon: <RotateCw className="h-8 w-8" />,
    toolId: "rotate-image",
    videoLink: "",
    isLive: true
  },
  {
    title: "Flip Image",
    description: "Flip images horizontally or vertically for mirror effects.",
    category: "Image Tools",
    icon: <FlipHorizontal className="h-8 w-8" />,
    toolId: "flip-image",
    videoLink: "",
    isLive: true
  },
  {
    title: "Watermark Images",
    description: "Add custom watermarks to protect and brand your images.",
    category: "Image Tools",
    icon: <Stamp className="h-8 w-8" />,
    toolId: "watermark-images",
    videoLink: "",
    isLive: true
  },
  {
    title: "Freehand Crop",
    description: "Crop images in custom freehand shapes for creative designs.",
    category: "Image Tools",
    icon: <Scissors className="h-8 w-8" />,
    toolId: "freehand-crop",
    videoLink: "",
    isLive: true
  },
  {
    title: "Circle Crop",
    description: "Crop images into perfect circles for profile pictures and avatars.",
    category: "Image Tools",
    icon: <CircleDot className="h-8 w-8" />,
    toolId: "circle-crop",
    videoLink: "",
    isLive: true
  },
  {
    title: "Square Crop",
    description: "Crop images into perfect squares for social media and thumbnails.",
    category: "Image Tools",
    icon: <Square className="h-8 w-8" />,
    toolId: "square-crop",
    videoLink: "",
    isLive: true
  },
  {
    title: "Merge Photo & Signature",
    description: "Combine photo and signature into one image for official applications.",
    category: "Image Tools",
    icon: <Merge className="h-8 w-8" />,
    toolId: "merge-photo-signature",
    videoLink: "",
    isLive: true
  },
  {
    title: "Join Multiple Images",
    description: "Combine multiple images into one for collages and panoramas.",
    category: "Image Tools",
    icon: <Layers className="h-8 w-8" />,
    toolId: "join-images",
    videoLink: "",
    isLive: true
  },
  {
    title: "Split Image",
    description: "Split images into multiple parts for grids and multi-post layouts.",
    category: "Image Tools",
    icon: <SplitSquareHorizontal className="h-8 w-8" />,
    toolId: "split-image",
    videoLink: "",
    isLive: true
  },
  {
    title: "Image Color Picker",
    description: "Extract exact color codes from any part of an image.",
    category: "Image Tools",
    icon: <Pipette className="h-8 w-8" />,
    toolId: "image-color-picker",
    videoLink: "",
    isLive: true
  },
  {
    title: "Edit Image Metadata",
    description: "Edit EXIF data and metadata information in photos.",
    category: "Image Tools",
    icon: <MetadataIcon className="h-8 w-8" />,
    toolId: "edit-metadata",
    videoLink: "",
    isLive: true
  },
  {
    title: "View Image Metadata",
    description: "View detailed EXIF and metadata information from photos.",
    category: "Image Tools",
    icon: <Eye className="h-8 w-8" />,
    toolId: "view-metadata",
    videoLink: "",
    isLive: true
  },
  {
    title: "Remove Image Metadata",
    description: "Strip all metadata and EXIF data from images for privacy.",
    category: "Image Tools",
    icon: <Eraser className="h-8 w-8" />,
    toolId: "remove-metadata",
    videoLink: "",
    isLive: true
  },

  // ============ PI7 - BLUR, PIXELATE & EFFECTS (LIVE) ============
  {
    title: "Beautify Image",
    description: "Enhance photos with automatic beauty adjustments and filters.",
    category: "Image Tools",
    icon: <Sparkle className="h-8 w-8" />,
    toolId: "beautify-image",
    videoLink: "",
    isLive: true
  },
  {
    title: "Unblur Image",
    description: "Sharpen and unblur images using AI to restore clarity.",
    category: "Image Tools",
    icon: <Focus className="h-8 w-8" />,
    toolId: "unblur-image",
    videoLink: "",
    isLive: true
  },
  {
    title: "Blur Image",
    description: "Apply blur effects to entire images or specific areas.",
    category: "Image Tools",
    icon: <Droplets className="h-8 w-8" />,
    toolId: "blur-image",
    videoLink: "",
    isLive: true
  },
  {
    title: "Blur Face",
    description: "Automatically detect and blur faces for privacy protection.",
    category: "Image Tools",
    icon: <UserCircle className="h-8 w-8" />,
    toolId: "blur-face",
    videoLink: "",
    isLive: true
  },
  {
    title: "Unblur Face",
    description: "Enhance and sharpen blurred faces in photos using AI.",
    category: "Image Tools",
    icon: <UserCircle className="h-8 w-8" />,
    toolId: "unblur-face",
    videoLink: "",
    isLive: true
  },
  {
    title: "Pixelate Image",
    description: "Add pixelation effect to images for artistic or privacy purposes.",
    category: "Image Tools",
    icon: <Grid3X3 className="h-8 w-8" />,
    toolId: "pixelate-image",
    videoLink: "",
    isLive: true
  },
  {
    title: "Pixelate Face",
    description: "Automatically detect and pixelate faces for anonymity.",
    category: "Image Tools",
    icon: <Grid3X3 className="h-8 w-8" />,
    toolId: "pixelate-face",
    videoLink: "",
    isLive: true
  },
  {
    title: "Censor Photo",
    description: "Censor sensitive parts of photos with blur or black bars.",
    category: "Image Tools",
    icon: <RectangleHorizontal className="h-8 w-8" />,
    toolId: "censor-photo",
    videoLink: "",
    isLive: true
  },
  {
    title: "Motion Blur",
    description: "Add dynamic motion blur effects to create sense of movement.",
    category: "Image Tools",
    icon: <Zap className="h-8 w-8" />,
    toolId: "motion-blur",
    videoLink: "",
    isLive: true
  },
  {
    title: "Grayscale Image",
    description: "Convert color images to grayscale for classic look.",
    category: "Image Tools",
    icon: <ImageIcon className="h-8 w-8" />,
    toolId: "grayscale-image",
    videoLink: "",
    isLive: true
  },
  {
    title: "Black & White",
    description: "Convert photos to high-contrast black and white.",
    category: "Image Tools",
    icon: <ImageIcon className="h-8 w-8" />,
    toolId: "black-white",
    videoLink: "",
    isLive: true
  },
  {
    title: "Picture to Pixel Art",
    description: "Transform photos into retro-style pixel art.",
    category: "Image Tools",
    icon: <Grid3X3 className="h-8 w-8" />,
    toolId: "picture-pixel-art",
    videoLink: "",
    isLive: true
  },
  {
    title: "AI Face Generator",
    description: "Generate realistic AI-created faces that don't exist.",
    category: "Image Tools",
    icon: <UserCircle className="h-8 w-8" />,
    toolId: "ai-face-generator",
    videoLink: "",
    isLive: true
  },
  {
    title: "Blemish Remover",
    description: "Remove skin blemishes and imperfections from photos.",
    category: "Image Tools",
    icon: <BlemishIcon className="h-8 w-8" />,
    toolId: "blemish-remover",
    videoLink: "",
    isLive: true
  },
  {
    title: "Retouch Image",
    description: "Professional photo retouching for portraits and product images.",
    category: "Image Tools",
    icon: <Wand2 className="h-8 w-8" />,
    toolId: "retouch-image",
    videoLink: "",
    isLive: true
  },
  {
    title: "Add Text to Image",
    description: "Add custom text overlays with various fonts and styles.",
    category: "Image Tools",
    icon: <Type className="h-8 w-8" />,
    toolId: "add-text-image",
    videoLink: "",
    isLive: true
  },
  {
    title: "Add Logo to Image",
    description: "Add logos and watermarks to brand your images.",
    category: "Image Tools",
    icon: <ImagePlus className="h-8 w-8" />,
    toolId: "add-logo-image",
    videoLink: "",
    isLive: true
  },

  // ============ PI7 - DPI & QUALITY (LIVE) ============
  {
    title: "Increase Image Quality",
    description: "Enhance image resolution and quality using AI upscaling.",
    category: "Image Tools",
    icon: <Zap className="h-8 w-8" />,
    toolId: "increase-image-quality",
    videoLink: "",
    isLive: true
  },
  {
    title: "Convert DPI",
    description: "Convert image DPI to 200, 300, or 600 for print requirements.",
    category: "Image Tools",
    icon: <Gauge className="h-8 w-8" />,
    toolId: "convert-dpi",
    videoLink: "",
    isLive: true
  },
  {
    title: "Check Image DPI",
    description: "Check the DPI and resolution of any image file.",
    category: "Image Tools",
    icon: <Gauge className="h-8 w-8" />,
    toolId: "check-dpi",
    videoLink: "",
    isLive: true
  },
  {
    title: "Super Resolution",
    description: "Upscale images to higher resolution with AI enhancement.",
    category: "Image Tools",
    icon: <Maximize2 className="h-8 w-8" />,
    toolId: "super-resolution",
    videoLink: "",
    isLive: true
  },

  // ============ PI7 - GENERAL RESIZING (LIVE) ============
  {
    title: "Resize Image in Millimeters",
    description: "Resize images to exact millimeter dimensions for precision.",
    category: "Image Tools",
    icon: <Ruler className="h-8 w-8" />,
    toolId: "resize-image-mm",
    videoLink: "",
    isLive: true
  },
  {
    title: "Resize Image in Inches",
    description: "Resize images to exact inch dimensions for print.",
    category: "Image Tools",
    icon: <Ruler className="h-8 w-8" />,
    toolId: "resize-image-inch",
    videoLink: "",
    isLive: true
  },
  {
    title: "Bulk Image Resizer",
    description: "Resize multiple images at once for batch processing.",
    category: "Image Tools",
    icon: <Layers className="h-8 w-8" />,
    toolId: "bulk-image-resizer",
    videoLink: "",
    isLive: true
  },
  {
    title: "Upscale Image with AI",
    description: "Use AI to upscale and enhance image resolution.",
    category: "Image Tools",
    icon: <Wand2 className="h-8 w-8" />,
    toolId: "upscale-image-ai",
    videoLink: "",
    isLive: true
  },

  // ============ PI7 - OFFICIAL SIZES (LIVE) ============
  {
    title: "Resize to A4 Size",
    description: "Resize images to standard A4 paper dimensions.",
    category: "Image Tools",
    icon: <FileText className="h-8 w-8" />,
    toolId: "resize-a4",
    videoLink: "",
    isLive: true
  },
  {
    title: "SSC Photo Resize",
    description: "Resize photos to SSC exam application requirements.",
    category: "Image Tools",
    icon: <GraduationCap className="h-8 w-8" />,
    toolId: "ssc-photo-resize",
    videoLink: "",
    isLive: true
  },
  {
    title: "PAN Card Photo Resize",
    description: "Resize photos to Indian PAN card specifications.",
    category: "Image Tools",
    icon: <CreditCard className="h-8 w-8" />,
    toolId: "pan-card-resize",
    videoLink: "",
    isLive: true
  },
  {
    title: "UPSC Photo Resize",
    description: "Resize photos to UPSC exam application requirements.",
    category: "Image Tools",
    icon: <GraduationCap className="h-8 w-8" />,
    toolId: "upsc-photo-resize",
    videoLink: "",
    isLive: true
  },
  {
    title: "PSC Photo Resize",
    description: "Resize photos to PSC exam application requirements.",
    category: "Image Tools",
    icon: <GraduationCap className="h-8 w-8" />,
    toolId: "psc-photo-resize",
    videoLink: "",
    isLive: true
  },

  // ============ PI7 - PASSPORT & ID SIZES (LIVE) ============
  {
    title: "Resize Sign 6cm x 2cm",
    description: "Resize signatures to 6cm x 2cm at 300 DPI for forms.",
    category: "Image Tools",
    icon: <FileSignature className="h-8 w-8" />,
    toolId: "resize-sign-6x2",
    videoLink: "",
    isLive: true
  },
  {
    title: "Signature 50mm x 20mm",
    description: "Resize signatures to 50mm x 20mm for official documents.",
    category: "Image Tools",
    icon: <FileSignature className="h-8 w-8" />,
    toolId: "resize-signature-50x20",
    videoLink: "",
    isLive: true
  },
  {
    title: "Resize 35mm x 45mm",
    description: "Resize photos to 35mm x 45mm passport photo standard.",
    category: "Image Tools",
    icon: <Camera className="h-8 w-8" />,
    toolId: "resize-35x45mm",
    videoLink: "",
    isLive: true
  },
  {
    title: "Resize 2x2 Inch",
    description: "Resize photos to 2x2 inch US passport photo size.",
    category: "Image Tools",
    icon: <Camera className="h-8 w-8" />,
    toolId: "resize-2x2-inch",
    videoLink: "",
    isLive: true
  },
  {
    title: "Resize 3x4 Inch",
    description: "Resize photos to 3x4 inch dimensions.",
    category: "Image Tools",
    icon: <Camera className="h-8 w-8" />,
    toolId: "resize-3x4-inch",
    videoLink: "",
    isLive: true
  },
  {
    title: "Resize 4x6 Inch",
    description: "Resize photos to standard 4x6 inch print size.",
    category: "Image Tools",
    icon: <Camera className="h-8 w-8" />,
    toolId: "resize-4x6-inch",
    videoLink: "",
    isLive: true
  },
  {
    title: "Resize 600x600 Pixels",
    description: "Resize images to exact 600x600 pixel dimensions.",
    category: "Image Tools",
    icon: <Maximize2 className="h-8 w-8" />,
    toolId: "resize-600x600",
    videoLink: "",
    isLive: true
  },

  // ============ PI7 - SOCIAL MEDIA (LIVE) ============
  {
    title: "Instagram Resize (No Crop)",
    description: "Resize images for Instagram without cropping or distortion.",
    category: "Image Tools",
    icon: <Smartphone className="h-8 w-8" />,
    toolId: "instagram-resize",
    videoLink: "",
    isLive: true
  },
  {
    title: "Instagram Grid Maker",
    description: "Split images into grids for Instagram carousel posts.",
    category: "Image Tools",
    icon: <Grid3X3 className="h-8 w-8" />,
    toolId: "instagram-grid",
    videoLink: "",
    isLive: true
  },
  {
    title: "WhatsApp DP Resize",
    description: "Resize images perfectly for WhatsApp profile pictures.",
    category: "Image Tools",
    icon: <MessageCircle className="h-8 w-8" />,
    toolId: "whatsapp-dp",
    videoLink: "",
    isLive: true
  },
  {
    title: "YouTube Banner Resize",
    description: "Resize images to YouTube channel banner dimensions.",
    category: "Image Tools",
    icon: <Youtube className="h-8 w-8" />,
    toolId: "youtube-banner",
    videoLink: "",
    isLive: true
  },
  {
    title: "Zoom Out Image",
    description: "Extend image canvas and zoom out to show more content.",
    category: "Image Tools",
    icon: <Minimize2 className="h-8 w-8" />,
    toolId: "zoom-out-image",
    videoLink: "",
    isLive: true
  },

  // ============ EDUCATION TOOLS - FOR STUDENTS ============
  {
    title: "Quiz Maker",
    description: "Create interactive quizzes with multiple choice questions for self-assessment.",
    category: "For Students",
    icon: <ClipboardList className="h-8 w-8" />,
    toolId: "quiz-maker",
    videoLink: "",
    isLive: true
  },
  {
    title: "Grade Calculator",
    description: "Calculate your GPA, CGPA, and overall grades across subjects.",
    category: "For Students",
    icon: <Calculator className="h-8 w-8" />,
    toolId: "grade-calculator",
    videoLink: "",
    isLive: true
  },
  {
    title: "Study Planner",
    description: "Create personalized study schedules and track your progress.",
    category: "For Students",
    icon: <Calendar className="h-8 w-8" />,
    toolId: "study-planner",
    videoLink: "",
    isLive: true
  },
  {
    title: "Flashcard Maker",
    description: "Create digital flashcards for memorization and spaced repetition learning.",
    category: "For Students",
    icon: <Layers className="h-8 w-8" />,
    toolId: "flashcard-maker",
    videoLink: "",
    isLive: true
  },
  {
    title: "Assignment Tracker",
    description: "Track assignments, deadlines, and priorities across all your subjects.",
    category: "For Students",
    icon: <ClipboardList className="h-8 w-8" />,
    toolId: "assignment-tracker",
    videoLink: "",
    isLive: true
  },
  {
    title: "Bibliography Generator",
    description: "Generate citations in APA, MLA, Chicago, and Harvard formats.",
    category: "For Students",
    icon: <BookText className="h-8 w-8" />,
    toolId: "bibliography-generator",
    videoLink: "",
    isLive: true
  },
  {
    title: "Exam Scheduler",
    description: "Schedule exams and automatically generate study plans.",
    category: "For Students",
    icon: <Calendar className="h-8 w-8" />,
    toolId: "exam-scheduler",
    videoLink: "",
    isLive: true
  },

  // ============ EDUCATION TOOLS - FOR TEACHERS ============
  {
    title: "Lesson Planner",
    description: "Create comprehensive lesson plans with objectives, activities, and assessments.",
    category: "For Teachers",
    icon: <BookOpen className="h-8 w-8" />,
    toolId: "lesson-planner",
    videoLink: "",
    isLive: true
  },
  {
    title: "Quiz Maker for Teachers",
    description: "Create quizzes and assessments for your students.",
    category: "For Teachers",
    icon: <ClipboardList className="h-8 w-8" />,
    toolId: "quiz-maker",
    videoLink: "",
    isLive: true
  },
  {
    title: "Grade Calculator for Teachers",
    description: "Calculate and manage student grades efficiently.",
    category: "For Teachers",
    icon: <Calculator className="h-8 w-8" />,
    toolId: "grade-calculator",
    videoLink: "",
    isLive: true
  },
  {
    title: "Flashcard Creator",
    description: "Create flashcard decks for your students to study.",
    category: "For Teachers",
    icon: <Layers className="h-8 w-8" />,
    toolId: "flashcard-maker",
    videoLink: "",
    isLive: true
  },

  // ============ CONTENT CREATION TOOLS ============
  {
    title: "Social Post Generator",
    description: "AI-powered tool to generate engaging social media posts for any platform.",
    category: "Content Creation",
    icon: <Instagram className="h-8 w-8" />,
    toolId: "social-post-generator",
    videoLink: "",
    isLive: true
  },
  {
    title: "Caption Generator",
    description: "Generate multiple creative captions for your images and videos.",
    category: "Content Creation",
    icon: <MessageCircle className="h-8 w-8" />,
    toolId: "caption-generator",
    videoLink: "",
    isLive: true
  },
  {
    title: "Hashtag Generator",
    description: "Generate relevant hashtags with popularity levels for maximum reach.",
    category: "Content Creation",
    icon: <Hash className="h-8 w-8" />,
    toolId: "hashtag-generator",
    videoLink: "",
    isLive: true
  },
  {
    title: "Content Idea Generator",
    description: "Get AI-powered content ideas with hooks and best posting times.",
    category: "Content Creation",
    icon: <Lightbulb className="h-8 w-8" />,
    toolId: "content-idea-generator",
    videoLink: "",
    isLive: true
  },
  {
    title: "Video Script Writer",
    description: "Generate video scripts with sections, timing, and calls to action.",
    category: "Content Creation",
    icon: <Video className="h-8 w-8" />,
    toolId: "video-script-writer",
    videoLink: "",
    isLive: true
  },
  {
    title: "Content Creation Workflow",
    description: "Complete end-to-end workflow from idea to ready-to-publish content.",
    category: "Content Creation",
    icon: <Wand2 className="h-8 w-8" />,
    toolId: "content-workflow",
    videoLink: "",
    isLive: true
  },
  {
    title: "AI Thumbnail Maker",
    description: "Generate eye-catching video thumbnails using AI. Perfect for YouTube, TikTok, and social media.",
    category: "Content Creation",
    icon: <ImagePlus className="h-8 w-8" />,
    toolId: "thumbnail-maker",
    videoLink: "",
    isLive: true
  },
  {
    title: "AI Video Maker",
    description: "Create stunning videos from text prompts or images using AI. Generate professional video content.",
    category: "Content Creation",
    icon: <Video className="h-8 w-8" />,
    toolId: "video-maker",
    videoLink: "",
    isLive: true
  },
];