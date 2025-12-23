import { 
  FileText, Calculator, TrendingUp, Receipt, DollarSign, 
  MessageSquare, BarChart3, Mail, Calendar, Users,
  Pencil, Image, Video, Mic, Share2, 
  FileSearch, BookOpen, Brain, Lightbulb, GraduationCap,
  Bot, Zap, Workflow, Clock, Settings,
  Search, BookMarked, Notebook, Library, Target
} from "lucide-react";
import { ReactNode } from "react";

export interface ExpandedTool {
  id: string;
  name: string;
  description: string;
  sector: string;
  department: string;
  inputMode: string;
  isLive: boolean;
  problemCategories: string[];
  icon: ReactNode;
}

// Problem category mappings
export const problemCategories = [
  {
    id: "gst-compliance",
    label: "I need help with GST & compliance",
    description: "Tax filing, invoicing, and regulatory compliance tools",
    keywords: ["invoice", "tax", "gst", "expense", "profit", "recovery", "payment", "compliance", "finance"],
    icon: Receipt
  },
  {
    id: "content-creation",
    label: "I want to create better content",
    description: "Content creation, social media, and marketing tools",
    keywords: ["caption", "post", "script", "video", "social", "content", "marketing", "brand", "creative", "image", "pitch", "offer"],
    icon: Pencil
  },
  {
    id: "pdf-documents",
    label: "I need to analyze PDFs and documents",
    description: "Document processing, OCR, and text extraction tools",
    keywords: ["pdf", "document", "extract", "text", "ocr", "reader", "summary", "file", "scan"],
    icon: FileSearch
  },
  {
    id: "automation",
    label: "I want to automate business tasks",
    description: "Automation, workflow, and productivity tools",
    keywords: ["automate", "workflow", "bot", "schedule", "task", "follow", "reply", "email", "reminder"],
    icon: Zap
  },
  {
    id: "learning",
    label: "I need help studying or learning",
    description: "Learning, research, and educational tools",
    keywords: ["learn", "study", "quiz", "explain", "course", "teach", "education", "research", "note", "knowledge"],
    icon: GraduationCap
  }
];

// Unique tool templates from the CSV (base tools)
const toolTemplates = [
  // Finance & Tax Tools
  { name: "Invoice Generator", dept: "Finance & Tax", keywords: ["gst-compliance"], desc: "Create tax-compliant invoices for your business" },
  { name: "Expense Log", dept: "Finance & Tax", keywords: ["gst-compliance"], desc: "Track daily cash expenses and manage budgets" },
  { name: "Profit Calc", dept: "Finance & Tax", keywords: ["gst-compliance"], desc: "Calculate true profit margins for your business" },
  { name: "Tax Estimator", dept: "Finance & Tax", keywords: ["gst-compliance"], desc: "Estimate GST liability and tax obligations" },
  { name: "Recovery Msg", dept: "Finance & Tax", keywords: ["gst-compliance", "automation"], desc: "Draft professional payment reminder messages" },
  { name: "Cash Flow Tracker", dept: "Finance & Tax", keywords: ["gst-compliance"], desc: "Monitor and forecast cash flow patterns" },
  { name: "Budget Planner", dept: "Finance & Tax", keywords: ["gst-compliance"], desc: "Plan and allocate budgets effectively" },
  { name: "Invoice Analyzer", dept: "Finance & Tax", keywords: ["gst-compliance", "pdf-documents"], desc: "Analyze and validate invoices automatically" },
  { name: "Expense Report", dept: "Finance & Tax", keywords: ["gst-compliance"], desc: "Generate detailed expense reports" },
  { name: "GST Calculator", dept: "Finance & Tax", keywords: ["gst-compliance"], desc: "Calculate GST amounts instantly" },
  
  // Marketing & Sales Tools
  { name: "Cold Pitch", dept: "Marketing & Sales", keywords: ["content-creation", "automation"], desc: "Write compelling sales messages that convert" },
  { name: "Offer Creator", dept: "Marketing & Sales", keywords: ["content-creation"], desc: "Create irresistible discount strategies" },
  { name: "Review Reply", dept: "Marketing & Sales", keywords: ["content-creation", "automation"], desc: "Craft professional responses to customer reviews" },
  { name: "Follow-up Bot", dept: "Marketing & Sales", keywords: ["automation"], desc: "Draft effective follow-up emails" },
  { name: "Social Plan", dept: "Marketing & Sales", keywords: ["content-creation"], desc: "Create content calendars for social media" },
  { name: "Ad Copy Writer", dept: "Marketing & Sales", keywords: ["content-creation"], desc: "Generate high-converting ad copy" },
  { name: "Email Campaign", dept: "Marketing & Sales", keywords: ["content-creation", "automation"], desc: "Design and manage email campaigns" },
  { name: "Lead Scorer", dept: "Marketing & Sales", keywords: ["automation"], desc: "Score and prioritize sales leads" },
  { name: "Brand Voice", dept: "Marketing & Sales", keywords: ["content-creation"], desc: "Define and maintain consistent brand messaging" },
  { name: "Competitor Analyzer", dept: "Marketing & Sales", keywords: ["automation"], desc: "Analyze competitor strategies and positioning" },
  
  // Content Tools
  { name: "Caption Writer", dept: "Content", keywords: ["content-creation"], desc: "Create engaging social media captions" },
  { name: "Script Generator", dept: "Content", keywords: ["content-creation"], desc: "Generate scripts for videos and podcasts" },
  { name: "Blog Outline", dept: "Content", keywords: ["content-creation"], desc: "Create structured blog post outlines" },
  { name: "Hashtag Finder", dept: "Content", keywords: ["content-creation"], desc: "Find relevant hashtags for maximum reach" },
  { name: "Thumbnail Ideas", dept: "Content", keywords: ["content-creation"], desc: "Generate thumbnail concepts for videos" },
  { name: "Story Planner", dept: "Content", keywords: ["content-creation"], desc: "Plan engaging story content" },
  { name: "Reel Script", dept: "Content", keywords: ["content-creation"], desc: "Write scripts for short-form videos" },
  { name: "Newsletter Writer", dept: "Content", keywords: ["content-creation"], desc: "Create compelling newsletter content" },
  { name: "Content Calendar", dept: "Content", keywords: ["content-creation"], desc: "Plan content across platforms" },
  { name: "Hook Generator", dept: "Content", keywords: ["content-creation"], desc: "Create attention-grabbing hooks" },
  
  // Document & PDF Tools
  { name: "PDF Summarizer", dept: "Documents", keywords: ["pdf-documents"], desc: "Summarize long PDF documents instantly" },
  { name: "Text Extractor", dept: "Documents", keywords: ["pdf-documents"], desc: "Extract text from images and PDFs" },
  { name: "Document Merger", dept: "Documents", keywords: ["pdf-documents"], desc: "Merge multiple documents into one" },
  { name: "OCR Scanner", dept: "Documents", keywords: ["pdf-documents"], desc: "Convert scanned documents to text" },
  { name: "PDF Analyzer", dept: "Documents", keywords: ["pdf-documents"], desc: "Analyze document structure and content" },
  { name: "Form Filler", dept: "Documents", keywords: ["pdf-documents", "automation"], desc: "Auto-fill forms from existing data" },
  { name: "Contract Reviewer", dept: "Documents", keywords: ["pdf-documents"], desc: "Review contracts for key terms" },
  { name: "Data Extractor", dept: "Documents", keywords: ["pdf-documents", "automation"], desc: "Extract structured data from documents" },
  { name: "Report Generator", dept: "Documents", keywords: ["pdf-documents"], desc: "Generate reports from document analysis" },
  { name: "Doc Translator", dept: "Documents", keywords: ["pdf-documents"], desc: "Translate documents to multiple languages" },
  
  // Automation Tools
  { name: "Task Automator", dept: "Automation", keywords: ["automation"], desc: "Automate repetitive business tasks" },
  { name: "Workflow Builder", dept: "Automation", keywords: ["automation"], desc: "Build custom automation workflows" },
  { name: "Schedule Bot", dept: "Automation", keywords: ["automation"], desc: "Automate scheduling and reminders" },
  { name: "Data Sync", dept: "Automation", keywords: ["automation"], desc: "Sync data across platforms automatically" },
  { name: "Alert Manager", dept: "Automation", keywords: ["automation"], desc: "Set up automated alerts and notifications" },
  { name: "Process Mapper", dept: "Automation", keywords: ["automation"], desc: "Map and optimize business processes" },
  { name: "Auto Responder", dept: "Automation", keywords: ["automation"], desc: "Set up automatic email responses" },
  { name: "Batch Processor", dept: "Automation", keywords: ["automation", "pdf-documents"], desc: "Process multiple files simultaneously" },
  { name: "Integration Hub", dept: "Automation", keywords: ["automation"], desc: "Connect and integrate various tools" },
  { name: "Template Engine", dept: "Automation", keywords: ["automation"], desc: "Create reusable templates" },
  
  // Learning & Education Tools
  { name: "Quiz Maker", dept: "Education", keywords: ["learning"], desc: "Create interactive quizzes for learning" },
  { name: "Flashcard Creator", dept: "Education", keywords: ["learning"], desc: "Generate flashcards from content" },
  { name: "Study Planner", dept: "Education", keywords: ["learning"], desc: "Plan study schedules effectively" },
  { name: "Concept Explainer", dept: "Education", keywords: ["learning"], desc: "Get simple explanations of complex topics" },
  { name: "Note Summarizer", dept: "Education", keywords: ["learning", "pdf-documents"], desc: "Summarize notes and study materials" },
  { name: "Practice Test", dept: "Education", keywords: ["learning"], desc: "Take practice tests on any subject" },
  { name: "Topic Deep Dive", dept: "Education", keywords: ["learning"], desc: "Explore topics in depth" },
  { name: "Learning Path", dept: "Education", keywords: ["learning"], desc: "Get personalized learning recommendations" },
  { name: "Revision Helper", dept: "Education", keywords: ["learning"], desc: "Review and revise learned content" },
  { name: "Mind Map Creator", dept: "Education", keywords: ["learning"], desc: "Create visual mind maps for concepts" }
];

// Sectors from CSV
const sectors = [
  "Agriculture & Farming", "Automotive", "Banking & Finance", "Construction",
  "E-commerce", "Education", "Energy & Utilities", "Entertainment",
  "Fashion & Apparel", "Food & Beverage", "Healthcare", "Hospitality",
  "Insurance", "IT & Software", "Legal Services", "Logistics",
  "Manufacturing", "Media & Publishing", "Non-Profit", "Pharmaceuticals",
  "Real Estate", "Retail", "Sports & Fitness", "Telecommunications",
  "Travel & Tourism", "Freelancers", "Startups", "Small Business", 
  "Enterprise", "Government"
];

// User personas from CSV
const personas = [
  "The Intern/Junior", "The Manager", "The Executive", "The Founder",
  "The Freelancer", "The Student", "The Consultant", "The Specialist"
];

// Input modes from CSV
const inputModes = ["Text Input Mode", "Voice Note Mode"];

// Generate the full 250K+ tools count (simulated for display)
export const totalToolCount = 250000;

// Generate expanded tools based on templates and sectors
export function generateExpandedTools(): ExpandedTool[] {
  const tools: ExpandedTool[] = [];
  let id = 0;
  
  // Generate tools for each sector and template combination
  sectors.forEach(sector => {
    toolTemplates.forEach(template => {
      inputModes.forEach(mode => {
        tools.push({
          id: `TOOL-${id++}`,
          name: template.name,
          description: `${template.desc} - optimized for ${sector}`,
          sector: sector,
          department: template.dept,
          inputMode: mode,
          isLive: id < 100, // First 100 tools are live
          problemCategories: template.keywords,
          icon: getIconForDepartment(template.dept)
        });
      });
    });
  });
  
  return tools;
}

function getIconForDepartment(dept: string): ReactNode {
  switch (dept) {
    case "Finance & Tax": return <Receipt className="h-6 w-6" />;
    case "Marketing & Sales": return <TrendingUp className="h-6 w-6" />;
    case "Content": return <Pencil className="h-6 w-6" />;
    case "Documents": return <FileSearch className="h-6 w-6" />;
    case "Automation": return <Zap className="h-6 w-6" />;
    case "Education": return <GraduationCap className="h-6 w-6" />;
    default: return <Bot className="h-6 w-6" />;
  }
}

// Get unique tools for display (deduplicated by name)
export function getUniqueTools(): ExpandedTool[] {
  const uniqueMap = new Map<string, ExpandedTool>();
  const tools = generateExpandedTools();
  
  tools.forEach(tool => {
    if (!uniqueMap.has(tool.name)) {
      uniqueMap.set(tool.name, tool);
    }
  });
  
  return Array.from(uniqueMap.values());
}

// Filter tools by problem category
export function filterToolsByProblem(problemId: string): ExpandedTool[] {
  const tools = getUniqueTools();
  return tools.filter(tool => 
    tool.problemCategories.includes(problemId)
  );
}

// Get tool count by problem
export function getToolCountByProblem(problemId: string): number {
  const category = problemCategories.find(c => c.id === problemId);
  if (!category) return 0;
  
  // Count tools across all sectors for this problem
  const baseCount = toolTemplates.filter(t => 
    t.keywords.includes(problemId)
  ).length;
  
  // Multiply by sectors and input modes for full count
  return baseCount * sectors.length * inputModes.length;
}
