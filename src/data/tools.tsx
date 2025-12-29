import { Bot, BookOpen, Library, Calendar, Layers, ClipboardList, Image, BookText, FileText, Notebook, Edit, FileImage, Languages, Code, Eraser, BarChart3, Brain, Map, Calculator, Globe, Video, Network, Headphones, PlayCircle, Sparkles, ScanText, BookMarked, FileCode, Eye, FileSearch, Database, Heart, Lightbulb, Pencil, Camera, ImagePlus } from "lucide-react";
import { ReactNode } from "react";

export interface Tool {
  title: string;
  description: string;
  category: string;
  icon: ReactNode;
  toolId: string; // Internal ID to hide actual URL
  videoLink: string;
}

// Internal mapping - not exported to keep URLs hidden
const toolUrls: Record<string, string> = {
  "jain-audio-stream": "https://kundkund-audio-stream-v3-0-157395066757.us-west1.run.app/",
  "jain-video-stream": "https://kundkund-video-stream-157395066757.us-west1.run.app/",
  "jaingyan-ai": "https://jaingyan-ai-157395066757.us-west1.run.app/",
  "advance-ai-bot": "https://kundkund-advance-bot-v2-0-157395066757.us-west1.run.app/",
  "shastra-pdf-reader": "https://kundkund-shastra-reader-v20-0-157395066757.us-west1.run.app/",
  "jain-encyclopedia": "https://jain-encyclopedia-v2-0-157395066757.us-west1.run.app/",
  "jain-panchang": "https://jain-panchang-digamber-157395066757.us-west1.run.app/",
  "shastra-multi-pdf-ai-bot": "https://shastra-multi-pdf-ai-bot-157395066757.us-west1.run.app/",
  "quiz": "https://kundkund-quiz-2-0-800030665261.us-west1.run.app/",
  "image-creator": "https://kundkund-image-creator-157395066757.us-west1.run.app/",
  "storybook-creator": "https://kundkund-storybook-creator-157395066757.us-west1.run.app/",
  "advance-text-extractor": "https://kundkund-text-extractor-v3-0-800030665261.us-west1.run.app/",
  "create-3d-images": "https://create-3d-images-157395066757.us-west1.run.app/",
  "sketchflow-ai": "https://sketchflow-ai-800030665261.us-west1.run.app/",
  "speedy-notebook": "https://kundkund-speedy-notebook-157395066757.us-west1.run.app/",
  "rich-editor": "https://kundkund-rich-editor-v5-0-800030665261.us-west1.run.app/",
  "pdf-chart-image-extractor": "https://pdf-chart-image-bulk-cover-extractor-v2-0-157395066757.us-west1.run.app/",
  "shastra-hover-dictionary": "https://kundkund-hover-dictionary-157395066757.us-west1.run.app/",
  "html-editor": "https://ezmylife-html-editor-v2-0-157395066757.us-west1.run.app/",
  "wrong-written-words": "https://wrong-written-words-157395066757.us-west1.run.app/",
  "book-editor": "https://kundkund-book-editor-800030665261.us-west1.run.app/",
  "book-editor-html": "https://kundkund-book-editor-with-html-800030665261.us-west1.run.app/",
  "ocr": "https://kundkund-ocr-812410895718.us-west1.run.app/",
  "dictionary-extractor-ai": "https://dictionary-extractor-ai-157395066757.us-west1.run.app/",
  "pdf-profile-extractor": "https://pdf-profile-extractor-3-157395066757.us-west1.run.app/",
  "pdf-metadata-ai-analyst": "https://pdf-metadata-ai-analyst-800030665261.us-west1.run.app/",
  "soul-mirror": "https://soulmirror-johari-jainism-157395066757.us-west1.run.app/",
  "cognimap": "https://cognimap-mental-models-157395066757.us-west1.run.app/",
  "ai-data-analysis": "https://ai-data-analysis-dashboard-v3-0-157395066757.us-west1.run.app/",
  "kundkund-ebook-bot": "https://kundkund-e-book-multi-source-based-ai-bot-157395066757.us-west1.run.app/",
  "kundkund-mindmap": "https://kundkund-mindmap-157395066757.us-west1.run.app/",
  "jain-ganit": "https://jain-ganit-bhugol-157395066757.us-west1.run.app/",
  "jainbhugol-maps": "https://kundkund-jainbhugol-maps-2-0-157395066757.us-west1.run.app/",
  "interactive-videos": "https://kundkund-interactive-video-quiz-157395066757.us-west1.run.app/",
  "smart-diagram-ai": "https://create-smart-diagram-ai-v2-0-157395066757.us-west1.run.app/",
  "auto-text-extractor": "https://auto-text-extractor-agent-157395066757.us-west1.run.app/",
  "ai-id-photo-generator": "https://www.toolfk.com/tools/online-idphotos.html",
  "pi7-image-tools": "https://image.pi7.org",
};

export const getToolUrl = (toolId: string): string | null => {
  return toolUrls[toolId] || null;
};

export const tools: Tool[] = [
  {
    title: "Audio Stream",
    description: "Listen to various audios, lectures, and music for relaxation and learning.",
    category: "Popular",
    icon: <Headphones className="h-8 w-8" />,
    toolId: "jain-audio-stream",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Video Stream",
    description: "Watch lectures, documentaries, and educational videos.",
    category: "Popular",
    icon: <PlayCircle className="h-8 w-8" />,
    toolId: "jain-video-stream",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Gyan AI",
    description: "An intelligent AI assistant providing insights and answers on various topics.",
    category: "AI Agent",
    icon: <Sparkles className="h-8 w-8" />,
    toolId: "jaingyan-ai",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Advance AI Bot",
    description: "Ask questions from multiple specified sources to get instant answers.",
    category: "Popular",
    icon: <Bot className="h-8 w-8" />,
    toolId: "advance-ai-bot",
    videoLink: "https://www.loom.com/share/88b01502cfc94549961e5a65aaae8603?sid=f7e70c03-a887-4e0d-bafe-6fd85d27dd45"
  },
  {
    title: "PDF Reader",
    description: "Read documents in digital format. This tool helps you easily read and study texts in PDF format.",
    category: "Popular",
    icon: <BookOpen className="h-8 w-8" />,
    toolId: "shastra-pdf-reader",
    videoLink: "https://www.loom.com/share/88c39a36c6cc499a85d913e69347ea18?sid=a8906f09-33fb-4ba4-918c-2b9890fd4d66"
  },
  {
    title: "Encyclopedia",
    description: "A comprehensive encyclopedia of terms, concepts, and history.",
    category: "Popular",
    icon: <Library className="h-8 w-8" />,
    toolId: "jain-encyclopedia",
    videoLink: "https://www.loom.com/share/f94c887d82ca415c8a5e47943d4ce237?sid=419fd2ff-d39a-4a88-8042-1e137f14ff5d"
  },
  {
    title: "Panchang",
    description: "Stay updated with upcoming festivals, dates, and important days.",
    category: "Content",
    icon: <Calendar className="h-8 w-8" />,
    toolId: "jain-panchang",
    videoLink: "https://www.loom.com/share/27c8f352c22f48df9f8efb0b15327506?sid=9b8b19a6-9810-4674-8c6f-b4dc0562073b"
  },
  {
    title: "Multi-PDF AI Bot",
    description: "Ask questions from multiple documents at once with our advanced AI and get answers.",
    category: "Popular",
    icon: <Layers className="h-8 w-8" />,
    toolId: "shastra-multi-pdf-ai-bot",
    videoLink: "https://www.loom.com/share/419a9d4378b8417491a95d0e1d4cdb0d?sid=74611eba-9223-4985-a782-231e36c0f8e2"
  },
  {
    title: "Quiz",
    description: "Test your knowledge on various topics by creating quizzes of your choice and reinforce your understanding.",
    category: "Content",
    icon: <ClipboardList className="h-8 w-8" />,
    toolId: "quiz",
    videoLink: "https://www.loom.com/share/20204bab9ceb46e68027cde57ed2bbfc?sid=74e8480-087c-42fe-83f6-038ea97e780e"
  },
  {
    title: "Image Creator",
    description: "Create and share beautiful and inspiring images and quotes.",
    category: "Content",
    icon: <Image className="h-8 w-8" />,
    toolId: "image-creator",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "StoryBook Creator",
    description: "Use AI to create new, inspiring stories and illustrations based on principles and narratives.",
    category: "Content",
    icon: <BookText className="h-8 w-8" />,
    toolId: "storybook-creator",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Advance Text Extractor",
    description: "Extract and organize important excerpts from documents.",
    category: "Content",
    icon: <FileText className="h-8 w-8" />,
    toolId: "advance-text-extractor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Create 3D Images",
    description: "Design and generate stunning 3D images and models for visual representations of concepts.",
    category: "Content",
    icon: <Image className="h-8 w-8" />,
    toolId: "create-3d-images",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "SketchFlow AI",
    description: "Transform your ideas into detailed flowcharts, diagrams, and visual plans with AI assistance.",
    category: "Content",
    icon: <Pencil className="h-8 w-8" />,
    toolId: "sketchflow-ai",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Speedy Notebook",
    description: "Save time writing notes and content.",
    category: "Research",
    icon: <Notebook className="h-8 w-8" />,
    toolId: "speedy-notebook",
    videoLink: "https://www.loom.com/share/ef5ff4f1569b4d87962d83483e619e98?sid=1258a673-0f71-404c-ac29-11bf9b03ce99"
  },
  {
    title: "Rich Editor",
    description: "This is a powerful tool for formatting text in digital form.",
    category: "Research",
    icon: <Edit className="h-8 w-8" />,
    toolId: "rich-editor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "PDF Chart & Image Extractor",
    description: "A powerful tool to extract charts and images from PDFs.",
    category: "Research",
    icon: <FileImage className="h-8 w-8" />,
    toolId: "pdf-chart-image-extractor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Hover Dictionary",
    description: "See the meaning of difficult words from documents by simply hovering over them.",
    category: "Research",
    icon: <Languages className="h-8 w-8" />,
    toolId: "shastra-hover-dictionary",
    videoLink: "https://www.loom.com/share/ef5ff4f1569b4d87962d83483e619e98?sid=1258a673-0f71-404c-ac29-11bf9b03ce99"
  },
  {
    title: "HTML Editor",
    description: "Create and edit HTML content with a simple and powerful editor.",
    category: "Research",
    icon: <Code className="h-8 w-8" />,
    toolId: "html-editor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Wrong Written Words",
    description: "It identifies incorrectly written words and finds their correct forms, improving writing accuracy.",
    category: "Research",
    icon: <Eraser className="h-8 w-8" />,
    toolId: "wrong-written-words",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Book Editor",
    description: "Edit and format books and texts with a dedicated book editor.",
    category: "Research",
    icon: <BookMarked className="h-8 w-8" />,
    toolId: "book-editor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Book Editor with HTML",
    description: "Edit and format books and texts, including HTML content, with an advanced book editor.",
    category: "Research",
    icon: <FileCode className="h-8 w-8" />,
    toolId: "book-editor-html",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "OCR",
    description: "Convert images or scanned documents into editable and searchable text with high accuracy.",
    category: "Research",
    icon: <ScanText className="h-8 w-8" />,
    toolId: "ocr",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Dictionary Extractor AI",
    description: "Extract and compile dictionaries from texts using AI.",
    category: "Research",
    icon: <Database className="h-8 w-8" />,
    toolId: "dictionary-extractor-ai",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "PDF Profile Extractor",
    description: "Extract profiles and structured data from PDF documents.",
    category: "Research",
    icon: <FileSearch className="h-8 w-8" />,
    toolId: "pdf-profile-extractor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "PDF Metadata AI Analyst",
    description: "Extract, analyze, and visualize metadata from PDF documents using AI.",
    category: "Research",
    icon: <Eye className="h-8 w-8" />,
    toolId: "pdf-metadata-ai-analyst",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Soul Mirror - Johari Window",
    description: "Reflect on self-awareness and personal growth through the Johari Window model.",
    category: "Modern Science",
    icon: <Heart className="h-8 w-8" />,
    toolId: "soul-mirror",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Cognimap - Mental Models",
    description: "Explore and apply various mental models for improved thinking and decision-making.",
    category: "Modern Science",
    icon: <Lightbulb className="h-8 w-8" />,
    toolId: "cognimap",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "AI Data Analysis",
    description: "Visualize and analyze data with our interactive AI-powered dashboard.",
    category: "Lab",
    icon: <BarChart3 className="h-8 w-8" />,
    toolId: "ai-data-analysis",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "E-book & Advance Bot",
    description: "An advanced e-book reader with an integrated AI assistant.",
    category: "Lab",
    icon: <Brain className="h-8 w-8" />,
    toolId: "kundkund-ebook-bot",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "MindMap",
    description: "Visually organize and explore concepts with mind maps.",
    category: "Lab",
    icon: <Map className="h-8 w-8" />,
    toolId: "kundkund-mindmap",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Ganit",
    description: "Explore complex mathematics and cosmology concepts.",
    category: "Lab",
    icon: <Calculator className="h-8 w-8" />,
    toolId: "jain-ganit",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Bhugol Maps (Beta)",
    description: "Explore the concepts of geography and cosmology with interactive maps. (Beta Version)",
    category: "Lab",
    icon: <Globe className="h-8 w-8" />,
    toolId: "jainbhugol-maps",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Interactive Videos (Beta)",
    description: "Engage with educational content through interactive videos with quizzes. (Beta Version)",
    category: "Lab",
    icon: <Video className="h-8 w-8" />,
    toolId: "interactive-videos",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Create Smart Diagram AI v2.0",
    description: "Generate complex diagrams, flowcharts, and visual aids from your notes and ideas using AI.",
    category: "Lab",
    icon: <Network className="h-8 w-8" />,
    toolId: "smart-diagram-ai",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Auto Text Extractor Agent",
    description: "Automatically extract and organize text from various sources using an intelligent AI agent.",
    category: "AI Agent",
    icon: <ScanText className="h-8 w-8" />,
    toolId: "auto-text-extractor",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "AI ID Photo Generator",
    description: "Generate professional AI ID photos for passport, visa, and ID cards. Supports custom backgrounds, DPI settings, and various international standards.",
    category: "Popular",
    icon: <Camera className="h-8 w-8" />,
    toolId: "ai-id-photo-generator",
    videoLink: ""
  },
  {
    title: "Pi7 Image Tools",
    description: "Comprehensive image editing suite with compression, resizing, format conversion, passport photo maker, signature generator, and AI photo enhancer.",
    category: "Popular",
    icon: <ImagePlus className="h-8 w-8" />,
    toolId: "pi7-image-tools",
    videoLink: ""
  },
];
