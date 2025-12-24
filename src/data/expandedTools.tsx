import { 
  FileText, 
  Calculator, 
  Receipt, 
  DollarSign,
  CreditCard,
  FileCheck,
  Shield,
  MessageSquare,
  AlertCircle,
  Megaphone,
  Gift,
  Star,
  UserCheck,
  Calendar,
  Package,
  Trash2,
  ShoppingCart,
  Wrench,
  Repeat,
  Users,
  HelpCircle,
  Wallet,
  AlertTriangle,
  ClipboardList,
  Scale,
  Briefcase,
  TrendingUp,
  Target,
  Percent,
  FileSignature,
  Clock,
  FolderLock,
  UserPlus,
  Award,
  Camera,
  BarChart,
  Eye,
  Heart,
  type LucideIcon
} from "lucide-react";
import { ReactNode } from "react";

export interface ExpandedTool {
  id: string;
  name: string;
  description: string;
  sector: string;
  userPersona: string;
  department: string;
  systemPrompt: string;
  isLive: boolean;
  icon: ReactNode;
}

// Icon mapping for departments
const departmentIcons: Record<string, LucideIcon> = {
  "Finance & Tax": Calculator,
  "Legal & Compliance": Scale,
  "Marketing & Sales": Megaphone,
  "Ops & Inventory": Package,
  "HR & Staff": Users,
  "Growth & Sales": TrendingUp,
  "Legal & Admin": FileSignature,
  "HR & Team": UserPlus,
  "Ops & Stock": Package,
};

// Icon mapping for tool names
const toolIcons: Record<string, LucideIcon> = {
  // Finance & Tax tools
  "Invoice Generator": Receipt,
  "Smart Invoicer": Receipt,
  "Expense Tracker": Wallet,
  "Expense Log": Wallet,
  "Leakage Detector": Eye,
  "Profit Calculator": Calculator,
  "Profit Meter": Calculator,
  "Tax Estimator": FileText,
  "Tax Planner": FileText,
  "Bad Debt Recovery": CreditCard,
  
  // Legal & Compliance tools
  "Contract Drafter": FileCheck,
  "Compliance Checklist": ClipboardList,
  "License Tracker": Clock,
  "Notice Reply Bot": MessageSquare,
  "Dispute Letter": AlertCircle,
  "Dispute Letter Writer": AlertCircle,
  "Safety Protocol": Shield,
  "Safety Audit": Shield,
  "Document Locker": FolderLock,
  
  // Marketing & Sales tools
  "Cold Outreach": Megaphone,
  "Campaign Manager": Megaphone,
  "Offer Generator": Gift,
  "Review Replier": Star,
  "Customer Follow-up": UserCheck,
  "Social Media Plan": Calendar,
  "Loyalty Program": Heart,
  "Lead Magnet": Target,
  "Discount Strategist": Percent,
  
  // Ops & Inventory tools
  "Stock Audit": Package,
  "Stock Watchdog": Package,
  "Wastage Log": Trash2,
  "Wastage Tracker": Trash2,
  "Supplier Order": ShoppingCart,
  "Vendor Rater": Star,
  "Maintenance Log": Wrench,
  "Quality Check": ClipboardList,
  "Shift Handover": Repeat,
  
  // HR & Staff tools
  "Hiring Job Post": Briefcase,
  "Hiring Bot": Briefcase,
  "Interview Guide": HelpCircle,
  "Salary Calculator": DollarSign,
  "Payroll Engine": DollarSign,
  "Warning Letter": AlertTriangle,
  "Daily Task List": ClipboardList,
  "Shift Planner": Calendar,
  "Attendance Tracker": Camera,
  "Performance Scorecard": Award,
};

// All sectors from Excel
export const sectors = [
  "All Sectors",
  "Agriculture & Farming",
  "Automotive & Transport",
  "Banking & Finance",
  "Beauty & Wellness",
  "Construction & Real Estate",
  "Education & Training",
  "Energy & Utilities",
  "Entertainment & Media",
  "Food & Beverage",
  "Gaming & E-sports",
  "Healthcare & Medical",
  "Hospitality & Tourism",
  "IT & Software",
  "Legal Services",
  "Logistics Super-App",
  "Manufacturing Super-App",
  "Non-Profit & NGO",
  "Professional Services",
  "Retail Super-App",
  "Sports & Fitness",
  "Telecommunications",
  "Weddings & Matrimony",
];

// All user personas from Excel
export const inputModes = [
  "All Personas",
  "Business Owner",
  "Accountant",
  "Manager",
  "Freelancer",
  "Consultant",
  "Specialist",
  "Dairy Farmer",
  "Poultry Owner",
  "Crop Farmer",
  "Auto Dealer",
  "Spare Parts Shop",
  "Car Wash Owner",
  "Salon Owner",
  "Spa Manager",
  "Builder",
  "Real Estate Agent",
  "Coaching Center",
  "Online Tutor",
  "Restaurant Owner",
  "Caterer",
  "Sweet Shop",
  "Textile Mill",
  "Courier Franchise",
  "Warehouse",
];

// All departments from Excel  
export const departments = [
  "All Departments",
  "Finance & Tax",
  "Legal & Compliance",
  "Marketing & Sales",
  "Ops & Inventory",
  "HR & Staff",
  "Growth & Sales",
  "Legal & Admin",
  "HR & Team",
  "Ops & Stock",
];

// Core tool definitions (shared across all personas/sectors)
const coreTools = [
  // Finance & Tax Department
  { toolName: "Invoice Generator", department: "Finance & Tax", baseDescription: "Create a tax-compliant bill instantly with GST calculations" },
  { toolName: "Expense Tracker", department: "Finance & Tax", baseDescription: "Log daily cash expenses to stop leakage and track spending" },
  { toolName: "Profit Calculator", department: "Finance & Tax", baseDescription: "Calculate true margin after all hidden costs" },
  { toolName: "Tax Estimator", department: "Finance & Tax", baseDescription: "Estimate GST/TDS liability for this month" },
  { toolName: "Bad Debt Recovery", department: "Finance & Tax", baseDescription: "Draft a strict message for unpaid dues" },
  
  // Legal & Compliance Department
  { toolName: "Contract Drafter", department: "Legal & Compliance", baseDescription: "Create a standard service agreement" },
  { toolName: "Compliance Checklist", department: "Legal & Compliance", baseDescription: "List of licenses/permits needed to operate" },
  { toolName: "Notice Reply Bot", department: "Legal & Compliance", baseDescription: "Draft a formal reply to a government notice" },
  { toolName: "Dispute Letter", department: "Legal & Compliance", baseDescription: "Write a formal complaint letter for bad service" },
  { toolName: "Safety Protocol", department: "Legal & Compliance", baseDescription: "Generate a safety checklist for the workplace" },
  
  // Marketing & Sales Department
  { toolName: "Cold Outreach", department: "Marketing & Sales", baseDescription: "Write a message to pitch services to new clients" },
  { toolName: "Offer Generator", department: "Marketing & Sales", baseDescription: "Create a festival discount strategy" },
  { toolName: "Review Replier", department: "Marketing & Sales", baseDescription: "Draft professional replies to Google/Amazon reviews" },
  { toolName: "Customer Follow-up", department: "Marketing & Sales", baseDescription: "Schedule polite reminders for leads" },
  { toolName: "Social Media Plan", department: "Marketing & Sales", baseDescription: "Create a weekly content calendar" },
  
  // Ops & Inventory Department
  { toolName: "Stock Audit", department: "Ops & Inventory", baseDescription: "Checklist to count physical inventory" },
  { toolName: "Wastage Log", department: "Ops & Inventory", baseDescription: "Track damaged/expired items to reduce loss" },
  { toolName: "Supplier Order", department: "Ops & Inventory", baseDescription: "Draft a purchase order for restocking" },
  { toolName: "Maintenance Log", department: "Ops & Inventory", baseDescription: "Track equipment repair dates" },
  { toolName: "Shift Handover", department: "Ops & Inventory", baseDescription: "Note for the next shift manager" },
  
  // HR & Staff Department
  { toolName: "Hiring Job Post", department: "HR & Staff", baseDescription: "Write a job description to find good staff" },
  { toolName: "Interview Guide", department: "HR & Staff", baseDescription: "List of questions to ask candidates" },
  { toolName: "Salary Calculator", department: "HR & Staff", baseDescription: "Calculate payout after leave/advance deductions" },
  { toolName: "Warning Letter", department: "HR & Staff", baseDescription: "Draft a formal warning for bad behavior" },
  { toolName: "Daily Task List", department: "HR & Staff", baseDescription: "Assign duties to staff members" },
];

// Super-App specific tool definitions
const superAppTools = [
  // Finance & Tax
  { toolName: "Smart Invoicer", department: "Finance & Tax", baseDescription: "Auto-generate tax compliant bills with GST calculations" },
  { toolName: "Leakage Detector", department: "Finance & Tax", baseDescription: "Analyze expenses to find wastage and theft" },
  { toolName: "Profit Meter", department: "Finance & Tax", baseDescription: "Calculate real-time daily profit margins" },
  { toolName: "Tax Planner", department: "Finance & Tax", baseDescription: "Estimate GST liability and prepare return drafts" },
  { toolName: "Expense Log", department: "Finance & Tax", baseDescription: "Digitize daily petty cash vouchers" },
  
  // HR & Team
  { toolName: "Shift Planner", department: "HR & Team", baseDescription: "Auto-schedule staff shifts based on traffic" },
  { toolName: "Payroll Engine", department: "HR & Team", baseDescription: "Calculate salaries, overtime, and deductions" },
  { toolName: "Hiring Bot", department: "HR & Team", baseDescription: "Screen candidate resumes and schedule interviews" },
  { toolName: "Attendance Tracker", department: "HR & Team", baseDescription: "Selfie-based attendance with location tagging" },
  { toolName: "Performance Scorecard", department: "HR & Team", baseDescription: "Rate employee performance based on tasks" },
  
  // Ops & Stock
  { toolName: "Stock Watchdog", department: "Ops & Stock", baseDescription: "Alerts when inventory hits re-order levels" },
  { toolName: "Wastage Tracker", department: "Ops & Stock", baseDescription: "Log spoiled or damaged goods for audit" },
  { toolName: "Vendor Rater", department: "Ops & Stock", baseDescription: "Score suppliers on quality and timeliness" },
  { toolName: "Quality Check", department: "Ops & Stock", baseDescription: "Digital checklist for product quality inspection" },
  
  // Growth & Sales
  { toolName: "Campaign Manager", department: "Growth & Sales", baseDescription: "Launch SMS/WhatsApp marketing campaigns" },
  { toolName: "Loyalty Program", department: "Growth & Sales", baseDescription: "Manage customer reward points and tiers" },
  { toolName: "Lead Magnet", department: "Growth & Sales", baseDescription: "Capture and qualify potential customer leads" },
  { toolName: "Discount Strategist", department: "Growth & Sales", baseDescription: "Calculate optimal discount rates to maintain margin" },
  
  // Legal & Admin
  { toolName: "License Tracker", department: "Legal & Admin", baseDescription: "Reminders for trade license and permit renewals" },
  { toolName: "Dispute Letter Writer", department: "Legal & Admin", baseDescription: "Draft formal notices for payment recovery" },
  { toolName: "Safety Audit", department: "Legal & Admin", baseDescription: "Workplace safety compliance checklist" },
  { toolName: "Document Locker", department: "Legal & Admin", baseDescription: "Securely store and organize business docs" },
];

// Sector-Persona combinations
const sectorPersonaCombinations = [
  // Agriculture & Farming
  { sector: "Agriculture & Farming", personas: ["Dairy Farmer", "Crop Farmer", "Poultry Owner", "Business Owner", "Manager", "Consultant", "Specialist", "Freelancer"] },
  { sector: "Automotive & Transport", personas: ["Auto Dealer", "Spare Parts Shop", "Car Wash Owner", "Business Owner", "Manager", "Consultant", "Specialist", "Freelancer"] },
  { sector: "Banking & Finance", personas: ["Business Owner", "Manager", "Consultant", "Specialist", "Freelancer", "Accountant"] },
  { sector: "Beauty & Wellness", personas: ["Salon Owner", "Spa Manager", "Business Owner", "Manager", "Consultant", "Specialist", "Freelancer"] },
  { sector: "Construction & Real Estate", personas: ["Builder", "Real Estate Agent", "Business Owner", "Manager", "Consultant", "Specialist", "Freelancer"] },
  { sector: "Education & Training", personas: ["Coaching Center", "Online Tutor", "Business Owner", "Manager", "Consultant", "Specialist", "Freelancer"] },
  { sector: "Food & Beverage", personas: ["Restaurant Owner", "Caterer", "Business Owner", "Manager", "Consultant", "Specialist", "Freelancer"] },
  { sector: "Healthcare & Medical", personas: ["Business Owner", "Manager", "Consultant", "Specialist", "Freelancer"] },
  { sector: "IT & Software", personas: ["Business Owner", "Manager", "Consultant", "Specialist", "Freelancer"] },
  { sector: "Gaming & E-sports", personas: ["Business Owner", "Manager", "Consultant", "Specialist", "Freelancer"] },
  { sector: "Weddings & Matrimony", personas: ["Business Owner", "Manager", "Consultant", "Specialist", "Freelancer"] },
  { sector: "Retail Super-App", personas: ["Sweet Shop - Business Owner", "Sweet Shop - Accountant"] },
  { sector: "Manufacturing Super-App", personas: ["Textile Mill - Business Owner", "Textile Mill - Accountant"] },
  { sector: "Logistics Super-App", personas: ["Courier Franchise - Business Owner", "Warehouse - Business Owner"] },
];

function getIconForTool(toolName: string, department: string): LucideIcon {
  if (toolIcons[toolName]) {
    return toolIcons[toolName];
  }
  if (departmentIcons[department]) {
    return departmentIcons[department];
  }
  return FileText;
}

function generateSystemPrompt(sector: string, persona: string, toolName: string, description: string): string {
  return `ACT AS: An Expert AI Consultant specialized in ${sector}.
CURRENT USER: ${persona} (Indian Context).
APP FEATURE: ${toolName}
GOAL: ${description} specifically for a ${persona} in the ${sector} industry.
LOGIC:
1. Ask/Identify key details (Amounts, Dates, Names).
2. Apply specific logic for ${sector} (e.g., GST rates, Industry Laws, Jargon).
3. Generate the final output directly (Document, Table, or Message).
4. Do not offer generic advice. Solve the specific problem.`;
}

// Generate all expanded tools
function generateExpandedTools(): ExpandedTool[] {
  const tools: ExpandedTool[] = [];
  let idCounter = 1;

  // Generate tools for regular sectors
  for (const combo of sectorPersonaCombinations) {
    const isSuperApp = combo.sector.includes("Super-App");
    const toolSet = isSuperApp ? superAppTools : coreTools;
    
    for (const persona of combo.personas) {
      for (const tool of toolSet) {
        const IconComponent = getIconForTool(tool.toolName, tool.department);
        const description = `${tool.baseDescription} for ${persona} in ${combo.sector}`;
        
        tools.push({
          id: `tool-${idCounter++}`,
          name: tool.toolName,
          description: description,
          sector: combo.sector,
          userPersona: persona,
          department: tool.department,
          systemPrompt: generateSystemPrompt(combo.sector, persona, tool.toolName, tool.baseDescription),
          isLive: true,
          icon: <IconComponent className="h-6 w-6" />,
        });
      }
    }
  }

  return tools;
}

export const expandedTools = generateExpandedTools();
export const totalToolCount = expandedTools.length;

// Filter functions
export function filterToolsBySector(tools: ExpandedTool[], sector: string): ExpandedTool[] {
  if (sector === "All Sectors") return tools;
  return tools.filter(tool => tool.sector === sector);
}

export function filterToolsByDepartment(tools: ExpandedTool[], department: string): ExpandedTool[] {
  if (department === "All Departments") return tools;
  return tools.filter(tool => tool.department === department);
}

export function filterToolsByPersona(tools: ExpandedTool[], persona: string): ExpandedTool[] {
  if (persona === "All Personas") return tools;
  return tools.filter(tool => tool.userPersona === persona || tool.userPersona.includes(persona));
}
