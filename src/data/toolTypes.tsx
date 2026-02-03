import { 
  Image, 
  FileText, 
  Video, 
  Mic, 
  Bot, 
  BarChart3, 
  Code, 
  Mail, 
  Shield, 
  Zap, 
  Type, 
  QrCode, 
  Calculator, 
  RefreshCw, 
  Share2, 
  Search, 
  Database, 
  Paintbrush, 
  PenTool, 
  Table,
  GraduationCap,
  Camera,
  Lightbulb,
  Users,
  BookOpen,
  Layers,
  type LucideIcon
} from "lucide-react";

// Tool type configuration with icons and tool mappings
export interface ToolTypeConfig {
  icon: LucideIcon;
  gradient: string;
  color: string;
  description: string;
  toolNames: string[];
}

export const toolTypeData: Record<string, ToolTypeConfig> = {
  // ========== FEATURED TOOL CATEGORIES ==========
  "Image Tools": {
    icon: Image,
    gradient: "from-violet-500 to-purple-600",
    color: "text-violet-500",
    description: "Edit, enhance, and transform images",
    toolNames: [
      // Pi7 Image Tools - Most Used
      "Passport Photo Maker", "Reduce Image Size in KB", "Resize Image by Pixel",
      "Generate Signature", "Increase Image Size in KB", "AI Photo Enhancer",
      "Resize Signature", "Resize Image in Centimeters", "Resize Image 3.5cm x 4.5cm",
      // Basic Editing
      "Blur Background", "Remove Background", "Remove Object from Photo",
      "Add Name & DOB on Photo", "Rotate Image", "Flip Image", "Watermark Images",
      "Freehand Crop", "Circle Crop", "Square Crop", "Merge Photo & Signature",
      "Join Multiple Images", "Split Image", "Image Color Picker",
      "Edit Image Metadata", "View Image Metadata", "Remove Image Metadata",
      // Blur, Pixelate & Effects
      "Beautify Image", "Unblur Image", "Blur Image", "Blur Face", "Unblur Face",
      "Pixelate Image", "Pixelate Face", "Censor Photo", "Motion Blur",
      "Grayscale Image", "Black & White", "Picture to Pixel Art",
      "AI Face Generator", "Blemish Remover", "Retouch Image",
      "Add Text to Image", "Add Logo to Image",
      // DPI & Quality
      "Increase Image Quality", "Convert DPI", "Check Image DPI", "Super Resolution",
      // General Resizing
      "Resize Image in Millimeters", "Resize Image in Inches", "Bulk Image Resizer", "Upscale Image with AI",
      // Official Sizes
      "Resize to A4 Size", "SSC Photo Resize", "PAN Card Photo Resize", "UPSC Photo Resize", "PSC Photo Resize",
      // Passport & ID Sizes
      "Resize Sign 6cm x 2cm", "Signature 50mm x 20mm", "Resize 35mm x 45mm",
      "Resize 2x2 Inch", "Resize 3x4 Inch", "Resize 4x6 Inch", "Resize 600x600 Pixels",
      // Social Media
      "Instagram Resize (No Crop)", "Instagram Grid Maker", "WhatsApp DP Resize", "YouTube Banner Resize", "Zoom Out Image",
      // ID Photos
      "AI ID Photo Generator"
    ]
  },
  "Document Tools": {
    icon: FileText,
    gradient: "from-blue-500 to-cyan-600",
    color: "text-blue-500",
    description: "Create, convert, and manage documents",
    toolNames: [
      // Business Documents
      "Invoice Generator", "Contract Drafter", "Compliance Checklist", 
      "Warning Letter", "Dispute Letter", "Notice Reply Bot", "Safety Protocol",
      // PDF Tools
      "PDF Reader", "Multi-PDF AI Bot", "PDF Chart & Image Extractor",
      "PDF Profile Extractor", "PDF Metadata AI Analyst",
      // Editing Tools
      "Rich Editor", "HTML Editor", "Book Editor", "Book Editor with HTML",
      "Speedy Notebook", "Advance Text Extractor", "OCR", "Auto Text Extractor Agent"
    ]
  },
  "Video Tools": {
    icon: Video,
    gradient: "from-red-500 to-orange-600",
    color: "text-red-500",
    description: "Edit and enhance video content",
    toolNames: [
      "Video Stream", "Interactive Videos (Beta)", "AI Video Maker", "Video Script Writer"
    ]
  },
  "Audio Tools": {
    icon: Mic,
    gradient: "from-green-500 to-emerald-600",
    color: "text-green-500",
    description: "Process and edit audio files",
    toolNames: [
      "Audio Stream"
    ]
  },
  "AI & Automation": {
    icon: Bot,
    gradient: "from-indigo-500 to-violet-600",
    color: "text-indigo-500",
    description: "AI-powered tools for automation",
    toolNames: [
      // Business AI
      "Notice Reply Bot", "Review Replier", "Lead Magnet", "FAQ Builder",
      // Featured AI Tools
      "Gyan AI", "Advance AI Bot", "E-book & Advance Bot",
      "Dictionary Extractor AI", "Create Smart Diagram AI",
      "Auto Text Extractor Agent", "AI Photo Enhancer", "AI Face Generator",
      "AI ID Photo Generator", "AI Data Analysis", "AI Thumbnail Maker", "AI Video Maker",
      "Content Idea Generator", "Social Post Generator", "Caption Generator"
    ]
  },
  "Analytics Tools": {
    icon: BarChart3,
    gradient: "from-teal-500 to-cyan-600",
    color: "text-teal-500",
    description: "Track, analyze, and visualize data",
    toolNames: [
      "Expense Tracker", "Profit Calculator", "Performance Scorecard", 
      "Vendor Rater", "Stock Audit", "Quality Check", "AI Data Analysis"
    ]
  },
  "Developer Tools": {
    icon: Code,
    gradient: "from-gray-600 to-zinc-700",
    color: "text-gray-400",
    description: "Tools for developers and tech teams",
    toolNames: [
      "HTML Editor", "SketchFlow AI"
    ]
  },
  "Communication": {
    icon: Mail,
    gradient: "from-sky-500 to-blue-600",
    color: "text-sky-500",
    description: "Email, messaging, and outreach tools",
    toolNames: [
      "Cold Outreach", "Campaign Manager", "Customer Follow-up",
      "Review Replier", "Notice Reply Bot", "Feedback Collector"
    ]
  },
  "Security Tools": {
    icon: Shield,
    gradient: "from-amber-500 to-yellow-600",
    color: "text-amber-500",
    description: "Protect and secure your digital assets",
    toolNames: [
      "Safety Protocol", "Compliance Checklist", "Remove Image Metadata", "Censor Photo"
    ]
  },
  "Productivity": {
    icon: Zap,
    gradient: "from-yellow-500 to-orange-600",
    color: "text-yellow-500",
    description: "Boost efficiency and save time",
    toolNames: [
      "Daily Task List", "Shift Planner", "Attendance Tracker",
      "Shift Handover", "Maintenance Log", "Ticket Manager",
      "Study Planner", "Assignment Tracker", "Exam Scheduler",
      "Content Creation Workflow", "MindMap"
    ]
  },
  "Text Tools": {
    icon: Type,
    gradient: "from-rose-500 to-pink-600",
    color: "text-rose-500",
    description: "Format, convert, and analyze text",
    toolNames: [
      "Add Text to Image", "Add Name & DOB on Photo", "Wrong Written Words",
      "Hover Dictionary", "OCR", "Advance Text Extractor"
    ]
  },
  "QR & Barcode": {
    icon: QrCode,
    gradient: "from-slate-500 to-gray-600",
    color: "text-slate-500",
    description: "Generate and scan QR codes & barcodes",
    toolNames: []
  },
  "Calculators": {
    icon: Calculator,
    gradient: "from-emerald-500 to-green-600",
    color: "text-emerald-500",
    description: "Calculate anything you need",
    toolNames: [
      "Tax Estimator", "Profit Calculator", "Salary Calculator", 
      "Payroll Engine", "Discount Strategist", "Grade Calculator", "Ganit"
    ]
  },
  "Converters": {
    icon: RefreshCw,
    gradient: "from-cyan-500 to-teal-600",
    color: "text-cyan-500",
    description: "Convert between formats and units",
    toolNames: [
      "Convert DPI", "Grayscale Image", "Black & White", "Picture to Pixel Art"
    ]
  },
  "Social Media": {
    icon: Share2,
    gradient: "from-pink-500 to-fuchsia-600",
    color: "text-pink-500",
    description: "Tools for social media management",
    toolNames: [
      "Social Media Plan", "Social Post Generator", "Caption Generator",
      "Hashtag Generator", "Instagram Resize (No Crop)", "Instagram Grid Maker",
      "WhatsApp DP Resize", "YouTube Banner Resize"
    ]
  },
  "SEO Tools": {
    icon: Search,
    gradient: "from-orange-500 to-red-600",
    color: "text-orange-500",
    description: "Optimize for search engines",
    toolNames: [
      "Hashtag Generator", "Content Idea Generator"
    ]
  },
  "File Management": {
    icon: Database,
    gradient: "from-purple-500 to-indigo-600",
    color: "text-purple-500",
    description: "Organize and manage your files",
    toolNames: [
      "Edit Image Metadata", "View Image Metadata", "Remove Image Metadata",
      "PDF Metadata AI Analyst"
    ]
  },
  "Design Tools": {
    icon: Paintbrush,
    gradient: "from-fuchsia-500 to-pink-600",
    color: "text-fuchsia-500",
    description: "Create stunning visual designs",
    toolNames: [
      "Image Creator", "Create 3D Images", "SketchFlow AI",
      "AI Thumbnail Maker", "Beautify Image", "Retouch Image",
      "StoryBook Creator"
    ]
  },
  "Writing Tools": {
    icon: PenTool,
    gradient: "from-lime-500 to-green-600",
    color: "text-lime-500",
    description: "Write better content faster",
    toolNames: [
      // Business Writing
      "Hiring Job Post", "Interview Guide", "Cold Outreach", 
      "Offer Generator", "FAQ Builder", "Warning Letter", 
      "Dispute Letter", "Notice Reply Bot",
      // Content Writing
      "Social Post Generator", "Caption Generator", "Video Script Writer",
      "Content Idea Generator", "Speedy Notebook"
    ]
  },
  "Data Tools": {
    icon: Table,
    gradient: "from-blue-600 to-indigo-700",
    color: "text-blue-600",
    description: "Process and analyze data",
    toolNames: [
      "Stock Audit", "Stock Watchdog", "Wastage Log", "Quality Check",
      "AI Data Analysis", "PDF Profile Extractor"
    ]
  },
  
  // ========== BUSINESS TOOL CATEGORIES ==========
  "Finance & Billing": {
    icon: Calculator,
    gradient: "from-emerald-500 to-teal-600",
    color: "text-emerald-500",
    description: "Financial and billing tools",
    toolNames: [
      "Invoice Generator", "Expense Tracker", "Profit Calculator",
      "Tax Estimator", "Bad Debt Recovery"
    ]
  },
  "HR & Staffing": {
    icon: Users,
    gradient: "from-violet-500 to-purple-600",
    color: "text-violet-500",
    description: "Human resources tools",
    toolNames: [
      "Hiring Job Post", "Interview Guide", "Salary Calculator",
      "Warning Letter", "Daily Task List", "Shift Planner",
      "Payroll Engine", "Attendance Tracker", "Performance Scorecard"
    ]
  },
  "Marketing & Sales": {
    icon: Share2,
    gradient: "from-pink-500 to-rose-600",
    color: "text-pink-500",
    description: "Marketing and sales tools",
    toolNames: [
      "Cold Outreach", "Offer Generator", "Review Replier",
      "Customer Follow-up", "Social Media Plan", "Campaign Manager",
      "Loyalty Program", "Lead Magnet", "Discount Strategist"
    ]
  },
  "Operations": {
    icon: Database,
    gradient: "from-amber-500 to-orange-600",
    color: "text-amber-500",
    description: "Operations and inventory tools",
    toolNames: [
      "Stock Audit", "Wastage Log", "Supplier Order", 
      "Maintenance Log", "Shift Handover", "Stock Watchdog",
      "Vendor Rater", "Quality Check"
    ]
  },
  "Customer Service": {
    icon: Mail,
    gradient: "from-cyan-500 to-sky-600",
    color: "text-cyan-500",
    description: "Customer service tools",
    toolNames: [
      "Ticket Manager", "FAQ Builder", "Feedback Collector"
    ]
  },
  "Legal & Compliance": {
    icon: Shield,
    gradient: "from-blue-500 to-indigo-600",
    color: "text-blue-500",
    description: "Legal and compliance tools",
    toolNames: [
      "Contract Drafter", "Compliance Checklist", "Notice Reply Bot",
      "Dispute Letter", "Safety Protocol"
    ]
  },
  
  // ========== EDUCATION TOOL CATEGORIES ==========
  "Education": {
    icon: GraduationCap,
    gradient: "from-blue-500 to-cyan-600",
    color: "text-blue-500",
    description: "Learning and teaching tools",
    toolNames: [
      // For Students
      "Quiz Maker", "Grade Calculator", "Study Planner", "Flashcard Maker",
      "Assignment Tracker", "Bibliography Generator", "Exam Scheduler",
      // For Teachers  
      "Lesson Planner", "Quiz Maker for Teachers", "Grade Calculator for Teachers",
      "Flashcard Creator",
      // Knowledge Tools
      "Encyclopedia", "Hover Dictionary", "Dictionary Extractor AI"
    ]
  },
  "Research Tools": {
    icon: BookOpen,
    gradient: "from-indigo-500 to-purple-600",
    color: "text-indigo-500",
    description: "Research and reference tools",
    toolNames: [
      "Encyclopedia", "PDF Reader", "Multi-PDF AI Bot", "Hover Dictionary",
      "Book Editor", "Book Editor with HTML", "Bibliography Generator",
      "Dictionary Extractor AI", "PDF Profile Extractor", "PDF Metadata AI Analyst"
    ]
  },
  
  // ========== CONTENT CREATION CATEGORY ==========
  "Content Creation": {
    icon: Lightbulb,
    gradient: "from-orange-500 to-red-600",
    color: "text-orange-500",
    description: "Create engaging content",
    toolNames: [
      "Social Post Generator", "Caption Generator", "Hashtag Generator",
      "Content Idea Generator", "Video Script Writer", "Content Creation Workflow",
      "AI Thumbnail Maker", "AI Video Maker", "Image Creator", "StoryBook Creator"
    ]
  },
  
  // ========== SPECIAL CATEGORIES ==========
  "Photo ID & Passport": {
    icon: Camera,
    gradient: "from-green-500 to-teal-600",
    color: "text-green-500",
    description: "Passport and ID photo tools",
    toolNames: [
      "AI ID Photo Generator", "Passport Photo Maker", "Resize Image 3.5cm x 4.5cm",
      "SSC Photo Resize", "PAN Card Photo Resize", "UPSC Photo Resize", "PSC Photo Resize",
      "Resize 35mm x 45mm", "Resize 2x2 Inch"
    ]
  },
  "Signature Tools": {
    icon: PenTool,
    gradient: "from-slate-500 to-gray-600",
    color: "text-slate-500",
    description: "Create and resize signatures",
    toolNames: [
      "Generate Signature", "Resize Signature", "Resize Sign 6cm x 2cm",
      "Signature 50mm x 20mm", "Merge Photo & Signature"
    ]
  },
  "Mind & Knowledge": {
    icon: Layers,
    gradient: "from-purple-500 to-pink-600",
    color: "text-purple-500",
    description: "Mind mapping and knowledge tools",
    toolNames: [
      "MindMap", "Soul Mirror - Johari Window", "Cognimap - Mental Models",
      "Encyclopedia", "Panchang", "Ganit", "Bhugol Maps (Beta)"
    ]
  }
};

// Get tool type for a given tool name
export function getToolType(toolName: string): string | null {
  for (const [typeName, config] of Object.entries(toolTypeData)) {
    if (config.toolNames.includes(toolName)) {
      return typeName;
    }
  }
  return null;
}

// Get tool type config for a given tool name
export function getToolTypeConfig(toolName: string): ToolTypeConfig | null {
  const typeName = getToolType(toolName);
  return typeName ? toolTypeData[typeName] : null;
}

// Get all tool names for a tool type
export function getToolNamesForType(toolType: string): string[] {
  return toolTypeData[toolType]?.toolNames || [];
}

// Get all tool types list
export const toolTypes = ["All Types", ...Object.keys(toolTypeData)];
