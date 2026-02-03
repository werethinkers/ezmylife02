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
import { toolsDatabase, getToolNamesForType as getToolNamesFromDB } from "./toolsDatabase";

// Tool type configuration with icons
export interface ToolTypeConfig {
  icon: LucideIcon;
  gradient: string;
  color: string;
  description: string;
  toolNames: string[];
}

// Tool type visual configuration
const toolTypeVisuals: Record<string, { icon: LucideIcon; gradient: string; color: string; description: string }> = {
  "Image Tools": { icon: Image, gradient: "from-violet-500 to-purple-600", color: "text-violet-500", description: "Edit, enhance, and transform images" },
  "Document Tools": { icon: FileText, gradient: "from-blue-500 to-cyan-600", color: "text-blue-500", description: "Create, convert, and manage documents" },
  "Video Tools": { icon: Video, gradient: "from-red-500 to-orange-600", color: "text-red-500", description: "Edit and enhance video content" },
  "Audio Tools": { icon: Mic, gradient: "from-green-500 to-emerald-600", color: "text-green-500", description: "Process and edit audio files" },
  "AI & Automation": { icon: Bot, gradient: "from-indigo-500 to-violet-600", color: "text-indigo-500", description: "AI-powered tools for automation" },
  "Analytics Tools": { icon: BarChart3, gradient: "from-teal-500 to-cyan-600", color: "text-teal-500", description: "Track, analyze, and visualize data" },
  "Developer Tools": { icon: Code, gradient: "from-gray-600 to-zinc-700", color: "text-gray-400", description: "Tools for developers and tech teams" },
  "Communication": { icon: Mail, gradient: "from-sky-500 to-blue-600", color: "text-sky-500", description: "Email, messaging, and outreach tools" },
  "Security Tools": { icon: Shield, gradient: "from-amber-500 to-yellow-600", color: "text-amber-500", description: "Protect and secure your digital assets" },
  "Productivity": { icon: Zap, gradient: "from-yellow-500 to-orange-600", color: "text-yellow-500", description: "Boost efficiency and save time" },
  "Text Tools": { icon: Type, gradient: "from-rose-500 to-pink-600", color: "text-rose-500", description: "Format, convert, and analyze text" },
  "QR & Barcode": { icon: QrCode, gradient: "from-slate-500 to-gray-600", color: "text-slate-500", description: "Generate and scan QR codes & barcodes" },
  "Calculators": { icon: Calculator, gradient: "from-emerald-500 to-green-600", color: "text-emerald-500", description: "Calculate anything you need" },
  "Converters": { icon: RefreshCw, gradient: "from-cyan-500 to-teal-600", color: "text-cyan-500", description: "Convert between formats and units" },
  "Social Media": { icon: Share2, gradient: "from-pink-500 to-fuchsia-600", color: "text-pink-500", description: "Tools for social media management" },
  "SEO Tools": { icon: Search, gradient: "from-orange-500 to-red-600", color: "text-orange-500", description: "Optimize for search engines" },
  "File Management": { icon: Database, gradient: "from-purple-500 to-indigo-600", color: "text-purple-500", description: "Organize and manage your files" },
  "Design Tools": { icon: Paintbrush, gradient: "from-fuchsia-500 to-pink-600", color: "text-fuchsia-500", description: "Create stunning visual designs" },
  "Writing Tools": { icon: PenTool, gradient: "from-lime-500 to-green-600", color: "text-lime-500", description: "Write better content faster" },
  "Data Tools": { icon: Table, gradient: "from-blue-600 to-indigo-700", color: "text-blue-600", description: "Process and analyze data" },
  "Finance & Billing": { icon: Calculator, gradient: "from-emerald-500 to-teal-600", color: "text-emerald-500", description: "Financial and billing tools" },
  "HR & Staffing": { icon: Users, gradient: "from-violet-500 to-purple-600", color: "text-violet-500", description: "Human resources tools" },
  "Marketing & Sales": { icon: Share2, gradient: "from-pink-500 to-rose-600", color: "text-pink-500", description: "Marketing and sales tools" },
  "Operations": { icon: Database, gradient: "from-amber-500 to-orange-600", color: "text-amber-500", description: "Operations and inventory tools" },
  "Customer Service": { icon: Mail, gradient: "from-cyan-500 to-sky-600", color: "text-cyan-500", description: "Customer service tools" },
  "Legal & Compliance": { icon: Shield, gradient: "from-blue-500 to-indigo-600", color: "text-blue-500", description: "Legal and compliance tools" },
  "Education": { icon: GraduationCap, gradient: "from-blue-500 to-cyan-600", color: "text-blue-500", description: "Learning and teaching tools" },
  "Research Tools": { icon: BookOpen, gradient: "from-indigo-500 to-purple-600", color: "text-indigo-500", description: "Research and reference tools" },
  "Content Creation": { icon: Lightbulb, gradient: "from-orange-500 to-red-600", color: "text-orange-500", description: "Create engaging content" },
  "Photo ID & Passport": { icon: Camera, gradient: "from-green-500 to-teal-600", color: "text-green-500", description: "Passport and ID photo tools" },
  "Signature Tools": { icon: PenTool, gradient: "from-slate-500 to-gray-600", color: "text-slate-500", description: "Create and resize signatures" },
  "Mind & Knowledge": { icon: Layers, gradient: "from-purple-500 to-pink-600", color: "text-purple-500", description: "Mind mapping and knowledge tools" },
};

// Build toolTypeData dynamically from the database
export const toolTypeData: Record<string, ToolTypeConfig> = Object.fromEntries(
  Object.entries(toolTypeVisuals).map(([typeName, visual]) => [
    typeName,
    {
      ...visual,
      toolNames: getToolNamesFromDB(typeName)
    }
  ])
);

// Get tool type for a given tool name
export function getToolType(toolName: string): string | null {
  const tool = toolsDatabase.find(t => t.name === toolName);
  return tool?.toolType[0] || null;
}

// Get tool type config for a given tool name
export function getToolTypeConfig(toolName: string): ToolTypeConfig | null {
  const typeName = getToolType(toolName);
  return typeName ? toolTypeData[typeName] : null;
}

// Get all tool names for a tool type (uses database)
export function getToolNamesForType(toolType: string): string[] {
  return getToolNamesFromDB(toolType);
}

// Get all tool types list
export const toolTypes = ["All Types", ...Object.keys(toolTypeData)];
