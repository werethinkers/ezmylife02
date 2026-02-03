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
  "Image Tools": {
    icon: Image,
    gradient: "from-violet-500 to-purple-600",
    color: "text-violet-500",
    description: "Edit, enhance, and transform images",
    toolNames: [] // No image tools in expandedTools - these are from featured tools only
  },
  "Document Tools": {
    icon: FileText,
    gradient: "from-blue-500 to-cyan-600",
    color: "text-blue-500",
    description: "Create, convert, and manage documents",
    toolNames: [
      "Invoice Generator", "Contract Drafter", "Compliance Checklist", 
      "Warning Letter", "Dispute Letter", "Notice Reply Bot", "Safety Protocol"
    ]
  },
  "Video Tools": {
    icon: Video,
    gradient: "from-red-500 to-orange-600",
    color: "text-red-500",
    description: "Edit and enhance video content",
    toolNames: []
  },
  "Audio Tools": {
    icon: Mic,
    gradient: "from-green-500 to-emerald-600",
    color: "text-green-500",
    description: "Process and edit audio files",
    toolNames: []
  },
  "AI & Automation": {
    icon: Bot,
    gradient: "from-indigo-500 to-violet-600",
    color: "text-indigo-500",
    description: "AI-powered tools for automation",
    toolNames: [
      "Notice Reply Bot", "Review Replier", "Lead Magnet", "FAQ Builder"
    ]
  },
  "Analytics Tools": {
    icon: BarChart3,
    gradient: "from-teal-500 to-cyan-600",
    color: "text-teal-500",
    description: "Track, analyze, and visualize data",
    toolNames: [
      "Expense Tracker", "Profit Calculator", "Performance Scorecard", 
      "Vendor Rater", "Stock Audit", "Quality Check"
    ]
  },
  "Developer Tools": {
    icon: Code,
    gradient: "from-gray-600 to-zinc-700",
    color: "text-gray-400",
    description: "Tools for developers and tech teams",
    toolNames: []
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
      "Safety Protocol", "Compliance Checklist"
    ]
  },
  "Productivity": {
    icon: Zap,
    gradient: "from-yellow-500 to-orange-600",
    color: "text-yellow-500",
    description: "Boost efficiency and save time",
    toolNames: [
      "Daily Task List", "Shift Planner", "Attendance Tracker",
      "Shift Handover", "Maintenance Log", "Ticket Manager"
    ]
  },
  "Text Tools": {
    icon: Type,
    gradient: "from-rose-500 to-pink-600",
    color: "text-rose-500",
    description: "Format, convert, and analyze text",
    toolNames: []
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
      "Payroll Engine", "Discount Strategist"
    ]
  },
  "Converters": {
    icon: RefreshCw,
    gradient: "from-cyan-500 to-teal-600",
    color: "text-cyan-500",
    description: "Convert between formats and units",
    toolNames: []
  },
  "Social Media": {
    icon: Share2,
    gradient: "from-pink-500 to-fuchsia-600",
    color: "text-pink-500",
    description: "Tools for social media management",
    toolNames: [
      "Social Media Plan"
    ]
  },
  "SEO Tools": {
    icon: Search,
    gradient: "from-orange-500 to-red-600",
    color: "text-orange-500",
    description: "Optimize for search engines",
    toolNames: []
  },
  "File Management": {
    icon: Database,
    gradient: "from-purple-500 to-indigo-600",
    color: "text-purple-500",
    description: "Organize and manage your files",
    toolNames: []
  },
  "Design Tools": {
    icon: Paintbrush,
    gradient: "from-fuchsia-500 to-pink-600",
    color: "text-fuchsia-500",
    description: "Create stunning visual designs",
    toolNames: []
  },
  "Writing Tools": {
    icon: PenTool,
    gradient: "from-lime-500 to-green-600",
    color: "text-lime-500",
    description: "Write better content faster",
    toolNames: [
      "Hiring Job Post", "Interview Guide", "Cold Outreach", 
      "Offer Generator", "FAQ Builder", "Warning Letter", 
      "Dispute Letter", "Notice Reply Bot"
    ]
  },
  "Data Tools": {
    icon: Table,
    gradient: "from-blue-600 to-indigo-700",
    color: "text-blue-600",
    description: "Process and analyze data",
    toolNames: [
      "Stock Audit", "Stock Watchdog", "Wastage Log", "Quality Check"
    ]
  },
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
    icon: Bot,
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
