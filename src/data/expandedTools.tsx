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
  Target,
  Percent,
  Award,
  Camera,
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
  "Finance & Accounting": Calculator,
  "Legal & Compliance": Scale,
  "Marketing & Sales": Megaphone,
  "Operations & Inventory": Package,
  "HR & Staffing": Users,
  "Customer Service": MessageSquare,
};

// Department subcategories mapping (only tools that exist in coreTools)
export const departmentSubcategories: Record<string, { name: string; tools: string[] }[]> = {
  "Finance & Accounting": [
    { name: "Billing & Invoicing", tools: ["Invoice Generator"] },
    { name: "Expense Tracking", tools: ["Expense Tracker"] },
    { name: "Tax & Compliance", tools: ["Tax Estimator"] },
    { name: "Profit Analysis", tools: ["Profit Calculator"] },
    { name: "Debt Recovery", tools: ["Bad Debt Recovery"] },
  ],
  "Legal & Compliance": [
    { name: "Contract Management", tools: ["Contract Drafter"] },
    { name: "Regulatory Compliance", tools: ["Compliance Checklist"] },
    { name: "Dispute Resolution", tools: ["Notice Reply Bot", "Dispute Letter"] },
    { name: "Safety & Audits", tools: ["Safety Protocol"] },
  ],
  "Marketing & Sales": [
    { name: "Outreach & Campaigns", tools: ["Cold Outreach", "Campaign Manager"] },
    { name: "Customer Engagement", tools: ["Customer Follow-up", "Review Replier", "Loyalty Program"] },
    { name: "Social Media", tools: ["Social Media Plan"] },
    { name: "Lead Generation", tools: ["Lead Magnet"] },
    { name: "Promotions & Offers", tools: ["Offer Generator", "Discount Strategist"] },
  ],
  "Operations & Inventory": [
    { name: "Stock Management", tools: ["Stock Audit", "Stock Watchdog"] },
    { name: "Supplier Relations", tools: ["Supplier Order", "Vendor Rater"] },
    { name: "Quality Control", tools: ["Quality Check", "Wastage Log"] },
    { name: "Maintenance", tools: ["Maintenance Log"] },
    { name: "Shift Operations", tools: ["Shift Handover"] },
  ],
  "HR & Staffing": [
    { name: "Recruitment", tools: ["Hiring Job Post", "Interview Guide"] },
    { name: "Payroll & Benefits", tools: ["Salary Calculator", "Payroll Engine"] },
    { name: "Performance", tools: ["Performance Scorecard", "Daily Task List"] },
    { name: "Scheduling", tools: ["Shift Planner", "Attendance Tracker"] },
    { name: "Discipline & Compliance", tools: ["Warning Letter"] },
  ],
  "Customer Service": [
    { name: "Ticket Management", tools: ["Ticket Manager"] },
    { name: "FAQ & Knowledge Base", tools: ["FAQ Builder"] },
    { name: "Feedback & Reviews", tools: ["Feedback Collector"] },
  ],
};

// Icon mapping for tool names (only tools that exist in coreTools)
const toolIcons: Record<string, LucideIcon> = {
  // Finance & Accounting tools
  "Invoice Generator": Receipt,
  "Expense Tracker": Wallet,
  "Profit Calculator": Calculator,
  "Tax Estimator": FileText,
  "Bad Debt Recovery": CreditCard,
  
  // Legal & Compliance tools
  "Contract Drafter": FileCheck,
  "Compliance Checklist": ClipboardList,
  "Notice Reply Bot": MessageSquare,
  "Dispute Letter": AlertCircle,
  "Safety Protocol": Shield,
  
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
  
  // Operations & Inventory tools
  "Stock Audit": Package,
  "Stock Watchdog": Package,
  "Wastage Log": Trash2,
  "Supplier Order": ShoppingCart,
  "Vendor Rater": Star,
  "Maintenance Log": Wrench,
  "Quality Check": ClipboardList,
  "Shift Handover": Repeat,
  
  // HR & Staffing tools
  "Hiring Job Post": Briefcase,
  "Interview Guide": HelpCircle,
  "Salary Calculator": DollarSign,
  "Payroll Engine": DollarSign,
  "Warning Letter": AlertTriangle,
  "Daily Task List": ClipboardList,
  "Shift Planner": Calendar,
  "Attendance Tracker": Camera,
  "Performance Scorecard": Award,
};

// Industry Categories (grouped logically)
export const sectorCategories = {
  "Services & Professional": [
    "Banking & Finance",
    "Legal Services",
    "Professional Services",
    "IT & Software",
    "Education & Training",
  ],
  "Retail & Commerce": [
    "Retail",
    "Food & Beverage",
    "Beauty & Wellness",
    "Hospitality & Tourism",
  ],
  "Industrial & Production": [
    "Manufacturing",
    "Agriculture & Farming",
    "Construction & Real Estate",
    "Energy & Utilities",
  ],
  "Logistics & Transport": [
    "Logistics",
    "Automotive & Transport",
    "Telecommunications",
  ],
  "Lifestyle & Entertainment": [
    "Entertainment & Media",
    "Gaming & E-sports",
    "Sports & Fitness",
    "Weddings & Events",
    "Non-Profit & NGO",
  ],
  "Healthcare": [
    "Healthcare & Medical",
  ],
};

// Flat sectors list for filtering
export const sectors = [
  "All Sectors",
  ...Object.values(sectorCategories).flat(),
];

// User personas grouped by type
export const personaCategories = {
  "Business Roles": [
    "Business Owner",
    "Manager",
    "Accountant",
  ],
  "Professional Services": [
    "Consultant",
    "Freelancer",
    "Specialist",
  ],
  "Industry-Specific": [
    "Restaurant Owner",
    "Salon Owner",
    "Builder",
    "Real Estate Agent",
    "Coaching Center",
    "Online Tutor",
    "Caterer",
    "Auto Dealer",
    "Dairy Farmer",
    "Crop Farmer",
  ],
};

export const inputModes = [
  "All Personas",
  ...Object.values(personaCategories).flat(),
];

// Consolidated departments (removed duplicates)
export const departments = [
  "All Departments",
  "Finance & Accounting",
  "Legal & Compliance",
  "Marketing & Sales",
  "Operations & Inventory",
  "HR & Staffing",
  "Customer Service",
];

// Core tool definitions (shared across all personas/sectors)
const coreTools = [
  // Finance & Accounting
  { toolName: "Invoice Generator", department: "Finance & Accounting", baseDescription: "Create a tax-compliant bill instantly with GST calculations" },
  { toolName: "Expense Tracker", department: "Finance & Accounting", baseDescription: "Log daily cash expenses to stop leakage and track spending" },
  { toolName: "Profit Calculator", department: "Finance & Accounting", baseDescription: "Calculate true margin after all hidden costs" },
  { toolName: "Tax Estimator", department: "Finance & Accounting", baseDescription: "Estimate GST/TDS liability for this month" },
  { toolName: "Bad Debt Recovery", department: "Finance & Accounting", baseDescription: "Draft a strict message for unpaid dues" },
  
  // Legal & Compliance
  { toolName: "Contract Drafter", department: "Legal & Compliance", baseDescription: "Create a standard service agreement" },
  { toolName: "Compliance Checklist", department: "Legal & Compliance", baseDescription: "List of licenses/permits needed to operate" },
  { toolName: "Notice Reply Bot", department: "Legal & Compliance", baseDescription: "Draft a formal reply to a government notice" },
  { toolName: "Dispute Letter", department: "Legal & Compliance", baseDescription: "Write a formal complaint letter for bad service" },
  { toolName: "Safety Protocol", department: "Legal & Compliance", baseDescription: "Generate a safety checklist for the workplace" },
  
  // Marketing & Sales
  { toolName: "Cold Outreach", department: "Marketing & Sales", baseDescription: "Write a message to pitch services to new clients" },
  { toolName: "Offer Generator", department: "Marketing & Sales", baseDescription: "Create a festival discount strategy" },
  { toolName: "Review Replier", department: "Marketing & Sales", baseDescription: "Draft professional replies to Google/Amazon reviews" },
  { toolName: "Customer Follow-up", department: "Marketing & Sales", baseDescription: "Schedule polite reminders for leads" },
  { toolName: "Social Media Plan", department: "Marketing & Sales", baseDescription: "Create a weekly content calendar" },
  { toolName: "Campaign Manager", department: "Marketing & Sales", baseDescription: "Launch SMS/WhatsApp marketing campaigns" },
  { toolName: "Loyalty Program", department: "Marketing & Sales", baseDescription: "Manage customer reward points and tiers" },
  { toolName: "Lead Magnet", department: "Marketing & Sales", baseDescription: "Capture and qualify potential customer leads" },
  { toolName: "Discount Strategist", department: "Marketing & Sales", baseDescription: "Calculate optimal discount rates to maintain margin" },
  
  // Operations & Inventory
  { toolName: "Stock Audit", department: "Operations & Inventory", baseDescription: "Checklist to count physical inventory" },
  { toolName: "Wastage Log", department: "Operations & Inventory", baseDescription: "Track damaged/expired items to reduce loss" },
  { toolName: "Supplier Order", department: "Operations & Inventory", baseDescription: "Draft a purchase order for restocking" },
  { toolName: "Maintenance Log", department: "Operations & Inventory", baseDescription: "Track equipment repair dates" },
  { toolName: "Shift Handover", department: "Operations & Inventory", baseDescription: "Note for the next shift manager" },
  { toolName: "Stock Watchdog", department: "Operations & Inventory", baseDescription: "Alerts when inventory hits re-order levels" },
  { toolName: "Vendor Rater", department: "Operations & Inventory", baseDescription: "Score suppliers on quality and timeliness" },
  { toolName: "Quality Check", department: "Operations & Inventory", baseDescription: "Digital checklist for product quality inspection" },
  
  // HR & Staffing
  { toolName: "Hiring Job Post", department: "HR & Staffing", baseDescription: "Write a job description to find good staff" },
  { toolName: "Interview Guide", department: "HR & Staffing", baseDescription: "List of questions to ask candidates" },
  { toolName: "Salary Calculator", department: "HR & Staffing", baseDescription: "Calculate payout after leave/advance deductions" },
  { toolName: "Warning Letter", department: "HR & Staffing", baseDescription: "Draft a formal warning for bad behavior" },
  { toolName: "Daily Task List", department: "HR & Staffing", baseDescription: "Assign duties to staff members" },
  { toolName: "Shift Planner", department: "HR & Staffing", baseDescription: "Auto-schedule staff shifts based on traffic" },
  { toolName: "Payroll Engine", department: "HR & Staffing", baseDescription: "Calculate salaries, overtime, and deductions" },
  { toolName: "Attendance Tracker", department: "HR & Staffing", baseDescription: "Selfie-based attendance with location tagging" },
  { toolName: "Performance Scorecard", department: "HR & Staffing", baseDescription: "Rate employee performance based on tasks" },
  
  // Customer Service
  { toolName: "Ticket Manager", department: "Customer Service", baseDescription: "Track and resolve customer complaints efficiently" },
  { toolName: "FAQ Builder", department: "Customer Service", baseDescription: "Create answers for common customer questions" },
  { toolName: "Feedback Collector", department: "Customer Service", baseDescription: "Gather and analyze customer feedback" },
];

// Sector-Persona combinations (updated to use clean sector names)
const sectorPersonaCombinations = [
  // Services & Professional
  { sector: "Banking & Finance", personas: ["Business Owner", "Manager", "Consultant", "Specialist", "Freelancer", "Accountant"] },
  { sector: "Legal Services", personas: ["Business Owner", "Manager", "Consultant", "Specialist", "Freelancer"] },
  { sector: "Professional Services", personas: ["Business Owner", "Manager", "Consultant", "Specialist", "Freelancer"] },
  { sector: "IT & Software", personas: ["Business Owner", "Manager", "Consultant", "Specialist", "Freelancer"] },
  { sector: "Education & Training", personas: ["Coaching Center", "Online Tutor", "Business Owner", "Manager", "Consultant"] },
  
  // Retail & Commerce
  { sector: "Retail", personas: ["Business Owner", "Manager", "Accountant"] },
  { sector: "Food & Beverage", personas: ["Restaurant Owner", "Caterer", "Business Owner", "Manager"] },
  { sector: "Beauty & Wellness", personas: ["Salon Owner", "Business Owner", "Manager"] },
  { sector: "Hospitality & Tourism", personas: ["Business Owner", "Manager", "Consultant"] },
  
  // Industrial & Production
  { sector: "Manufacturing", personas: ["Business Owner", "Manager", "Accountant"] },
  { sector: "Agriculture & Farming", personas: ["Dairy Farmer", "Crop Farmer", "Business Owner", "Manager"] },
  { sector: "Construction & Real Estate", personas: ["Builder", "Real Estate Agent", "Business Owner", "Manager"] },
  { sector: "Energy & Utilities", personas: ["Business Owner", "Manager", "Specialist"] },
  
  // Logistics & Transport
  { sector: "Logistics", personas: ["Business Owner", "Manager", "Accountant"] },
  { sector: "Automotive & Transport", personas: ["Auto Dealer", "Business Owner", "Manager"] },
  { sector: "Telecommunications", personas: ["Business Owner", "Manager", "Specialist"] },
  
  // Lifestyle & Entertainment
  { sector: "Entertainment & Media", personas: ["Business Owner", "Manager", "Freelancer"] },
  { sector: "Gaming & E-sports", personas: ["Business Owner", "Manager", "Freelancer"] },
  { sector: "Sports & Fitness", personas: ["Business Owner", "Manager", "Consultant"] },
  { sector: "Weddings & Events", personas: ["Business Owner", "Manager", "Freelancer"] },
  { sector: "Non-Profit & NGO", personas: ["Business Owner", "Manager", "Consultant"] },
  
  // Healthcare
  { sector: "Healthcare & Medical", personas: ["Business Owner", "Manager", "Consultant", "Specialist"] },
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

  // Generate tools for all sector-persona combinations
  for (const combo of sectorPersonaCombinations) {
    for (const persona of combo.personas) {
      for (const tool of coreTools) {
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
