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
  Truck,
  Heart,
  GraduationCap,
  Utensils,
  Home,
  Laptop,
  Stethoscope,
  Palette,
  Music,
  Camera,
  Plane,
  ShoppingBag,
  Coins,
  Target,
  BarChart,
  Briefcase,
  Building,
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
};

// Icon mapping for tool names
const toolIcons: Record<string, LucideIcon> = {
  "Invoice Generator": Receipt,
  "Expense Tracker": Wallet,
  "Profit Calculator": Calculator,
  "Tax Estimator": FileText,
  "Bad Debt Recovery": CreditCard,
  "Contract Drafter": FileCheck,
  "Compliance Checklist": ClipboardList,
  "Notice Reply Bot": MessageSquare,
  "Dispute Letter": AlertCircle,
  "Safety Protocol": Shield,
  "Cold Outreach": Megaphone,
  "Offer Generator": Gift,
  "Review Replier": Star,
  "Customer Follow-up": UserCheck,
  "Social Media Plan": Calendar,
  "Stock Audit": Package,
  "Wastage Log": Trash2,
  "Supplier Order": ShoppingCart,
  "Maintenance Log": Wrench,
  "Shift Handover": Repeat,
  "Hiring Job Post": Briefcase,
  "Interview Guide": HelpCircle,
  "Salary Calculator": DollarSign,
  "Warning Letter": AlertTriangle,
  "Daily Task List": ClipboardList,
};

// Raw tool data from Excel
const rawToolsData: Array<{
  sector: string;
  userPersona: string;
  department: string;
  toolName: string;
  description: string;
}> = [
  // Agriculture & Farming - Dairy Farmer
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create a tax-compliant bill instantly for Agriculture & Farming industry" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Finance & Tax", toolName: "Expense Tracker", description: "Log daily cash expenses to stop leakage for Dairy Farmer" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Finance & Tax", toolName: "Profit Calculator", description: "Calculate true margin after all hidden costs" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Finance & Tax", toolName: "Tax Estimator", description: "Estimate GST/TDS liability for this month" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Finance & Tax", toolName: "Bad Debt Recovery", description: "Draft a strict message for unpaid dues" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Legal & Compliance", toolName: "Contract Drafter", description: "Create a standard service agreement" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Legal & Compliance", toolName: "Compliance Checklist", description: "List of licenses/permits needed to operate" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Legal & Compliance", toolName: "Notice Reply Bot", description: "Draft a formal reply to a government notice" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Legal & Compliance", toolName: "Dispute Letter", description: "Write a formal complaint letter for bad service" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Legal & Compliance", toolName: "Safety Protocol", description: "Generate a safety checklist for the workplace" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Write a message to pitch services to new clients" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Marketing & Sales", toolName: "Offer Generator", description: "Create a festival discount strategy" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Marketing & Sales", toolName: "Review Replier", description: "Draft professional replies to Google/Amazon reviews" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Marketing & Sales", toolName: "Customer Follow-up", description: "Schedule polite reminders for leads" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Marketing & Sales", toolName: "Social Media Plan", description: "Create a weekly content calendar" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Ops & Inventory", toolName: "Stock Audit", description: "Checklist to count physical inventory" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Ops & Inventory", toolName: "Wastage Log", description: "Track damaged/expired items to reduce loss" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Ops & Inventory", toolName: "Supplier Order", description: "Draft a purchase order for restocking" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Ops & Inventory", toolName: "Maintenance Log", description: "Track equipment repair dates" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "Ops & Inventory", toolName: "Shift Handover", description: "Note for the next shift manager" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "HR & Staff", toolName: "Hiring Job Post", description: "Write a job description to find good staff" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "HR & Staff", toolName: "Interview Guide", description: "List of questions to ask candidates" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "HR & Staff", toolName: "Salary Calculator", description: "Calculate payout after leave/advance deductions" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "HR & Staff", toolName: "Warning Letter", description: "Draft a formal warning for bad behavior" },
  { sector: "Agriculture & Farming", userPersona: "Dairy Farmer", department: "HR & Staff", toolName: "Daily Task List", description: "Assign duties to staff members" },

  // Agriculture & Farming - Crop Farmer
  { sector: "Agriculture & Farming", userPersona: "Crop Farmer", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create a tax-compliant bill for crop sales" },
  { sector: "Agriculture & Farming", userPersona: "Crop Farmer", department: "Finance & Tax", toolName: "Expense Tracker", description: "Log daily farm expenses to optimize costs" },
  { sector: "Agriculture & Farming", userPersona: "Crop Farmer", department: "Finance & Tax", toolName: "Profit Calculator", description: "Calculate true margin for crop harvest" },
  { sector: "Agriculture & Farming", userPersona: "Crop Farmer", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Pitch to mandis and bulk buyers" },
  { sector: "Agriculture & Farming", userPersona: "Crop Farmer", department: "Ops & Inventory", toolName: "Stock Audit", description: "Track grain storage and quality" },

  // Automotive & Transport - Auto Dealer
  { sector: "Automotive & Transport", userPersona: "Auto Dealer", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create tax-compliant vehicle sale invoices" },
  { sector: "Automotive & Transport", userPersona: "Auto Dealer", department: "Finance & Tax", toolName: "Expense Tracker", description: "Track showroom and inventory expenses" },
  { sector: "Automotive & Transport", userPersona: "Auto Dealer", department: "Finance & Tax", toolName: "Profit Calculator", description: "Calculate margins on vehicle sales" },
  { sector: "Automotive & Transport", userPersona: "Auto Dealer", department: "Finance & Tax", toolName: "Tax Estimator", description: "Estimate GST on automotive sales" },
  { sector: "Automotive & Transport", userPersona: "Auto Dealer", department: "Legal & Compliance", toolName: "Contract Drafter", description: "Draft vehicle purchase agreements" },
  { sector: "Automotive & Transport", userPersona: "Auto Dealer", department: "Legal & Compliance", toolName: "Compliance Checklist", description: "RTO and vehicle registration compliance" },
  { sector: "Automotive & Transport", userPersona: "Auto Dealer", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Reach potential car buyers" },
  { sector: "Automotive & Transport", userPersona: "Auto Dealer", department: "Marketing & Sales", toolName: "Offer Generator", description: "Create festive vehicle discounts" },
  { sector: "Automotive & Transport", userPersona: "Auto Dealer", department: "Ops & Inventory", toolName: "Stock Audit", description: "Track vehicle inventory" },
  { sector: "Automotive & Transport", userPersona: "Auto Dealer", department: "HR & Staff", toolName: "Hiring Job Post", description: "Hire sales executives" },

  // Automotive & Transport - Spare Parts Shop
  { sector: "Automotive & Transport", userPersona: "Spare Parts Shop", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create invoices for auto parts sales" },
  { sector: "Automotive & Transport", userPersona: "Spare Parts Shop", department: "Ops & Inventory", toolName: "Stock Audit", description: "Track spare parts inventory" },
  { sector: "Automotive & Transport", userPersona: "Spare Parts Shop", department: "Ops & Inventory", toolName: "Supplier Order", description: "Order parts from manufacturers" },

  // Automotive & Transport - Car Wash Owner
  { sector: "Automotive & Transport", userPersona: "Car Wash Owner", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create car wash service invoices" },
  { sector: "Automotive & Transport", userPersona: "Car Wash Owner", department: "Marketing & Sales", toolName: "Offer Generator", description: "Create wash package discounts" },
  { sector: "Automotive & Transport", userPersona: "Car Wash Owner", department: "HR & Staff", toolName: "Daily Task List", description: "Assign cleaning duties to staff" },

  // Beauty & Wellness - Salon Owner
  { sector: "Beauty & Wellness", userPersona: "Salon Owner", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create invoices for salon services" },
  { sector: "Beauty & Wellness", userPersona: "Salon Owner", department: "Finance & Tax", toolName: "Expense Tracker", description: "Track product and utility expenses" },
  { sector: "Beauty & Wellness", userPersona: "Salon Owner", department: "Finance & Tax", toolName: "Profit Calculator", description: "Calculate profit per service" },
  { sector: "Beauty & Wellness", userPersona: "Salon Owner", department: "Legal & Compliance", toolName: "Contract Drafter", description: "Create client agreements" },
  { sector: "Beauty & Wellness", userPersona: "Salon Owner", department: "Marketing & Sales", toolName: "Social Media Plan", description: "Plan Instagram content calendar" },
  { sector: "Beauty & Wellness", userPersona: "Salon Owner", department: "Marketing & Sales", toolName: "Offer Generator", description: "Create seasonal beauty offers" },
  { sector: "Beauty & Wellness", userPersona: "Salon Owner", department: "Ops & Inventory", toolName: "Stock Audit", description: "Track beauty product inventory" },
  { sector: "Beauty & Wellness", userPersona: "Salon Owner", department: "HR & Staff", toolName: "Hiring Job Post", description: "Hire beauticians and stylists" },

  // Beauty & Wellness - Spa Manager
  { sector: "Beauty & Wellness", userPersona: "Spa Manager", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create spa treatment invoices" },
  { sector: "Beauty & Wellness", userPersona: "Spa Manager", department: "Marketing & Sales", toolName: "Customer Follow-up", description: "Follow up for repeat bookings" },
  { sector: "Beauty & Wellness", userPersona: "Spa Manager", department: "Ops & Inventory", toolName: "Supplier Order", description: "Order massage oils and products" },

  // Construction & Real Estate - Builder
  { sector: "Construction & Real Estate", userPersona: "Builder", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create construction milestone invoices" },
  { sector: "Construction & Real Estate", userPersona: "Builder", department: "Finance & Tax", toolName: "Expense Tracker", description: "Track material and labor costs" },
  { sector: "Construction & Real Estate", userPersona: "Builder", department: "Finance & Tax", toolName: "Profit Calculator", description: "Calculate project profitability" },
  { sector: "Construction & Real Estate", userPersona: "Builder", department: "Legal & Compliance", toolName: "Contract Drafter", description: "Draft construction contracts" },
  { sector: "Construction & Real Estate", userPersona: "Builder", department: "Legal & Compliance", toolName: "Compliance Checklist", description: "RERA and building permits" },
  { sector: "Construction & Real Estate", userPersona: "Builder", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Reach property investors" },
  { sector: "Construction & Real Estate", userPersona: "Builder", department: "Ops & Inventory", toolName: "Stock Audit", description: "Track construction materials" },
  { sector: "Construction & Real Estate", userPersona: "Builder", department: "HR & Staff", toolName: "Hiring Job Post", description: "Hire site supervisors" },

  // Construction & Real Estate - Real Estate Agent
  { sector: "Construction & Real Estate", userPersona: "Real Estate Agent", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create commission invoices" },
  { sector: "Construction & Real Estate", userPersona: "Real Estate Agent", department: "Legal & Compliance", toolName: "Contract Drafter", description: "Draft property agreements" },
  { sector: "Construction & Real Estate", userPersona: "Real Estate Agent", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Reach property buyers" },
  { sector: "Construction & Real Estate", userPersona: "Real Estate Agent", department: "Marketing & Sales", toolName: "Social Media Plan", description: "Market properties on social media" },

  // Education & Training - Coaching Center
  { sector: "Education & Training", userPersona: "Coaching Center", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create fee receipts for students" },
  { sector: "Education & Training", userPersona: "Coaching Center", department: "Finance & Tax", toolName: "Expense Tracker", description: "Track teaching materials cost" },
  { sector: "Education & Training", userPersona: "Coaching Center", department: "Legal & Compliance", toolName: "Contract Drafter", description: "Create enrollment agreements" },
  { sector: "Education & Training", userPersona: "Coaching Center", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Reach parents and students" },
  { sector: "Education & Training", userPersona: "Coaching Center", department: "Marketing & Sales", toolName: "Social Media Plan", description: "Promote classes on social media" },
  { sector: "Education & Training", userPersona: "Coaching Center", department: "HR & Staff", toolName: "Hiring Job Post", description: "Hire qualified teachers" },

  // Education & Training - Online Tutor
  { sector: "Education & Training", userPersona: "Online Tutor", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create tutoring session invoices" },
  { sector: "Education & Training", userPersona: "Online Tutor", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Find new students online" },
  { sector: "Education & Training", userPersona: "Online Tutor", department: "Marketing & Sales", toolName: "Social Media Plan", description: "Build education content calendar" },

  // Food & Beverage - Restaurant Owner
  { sector: "Food & Beverage", userPersona: "Restaurant Owner", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create food service invoices" },
  { sector: "Food & Beverage", userPersona: "Restaurant Owner", department: "Finance & Tax", toolName: "Expense Tracker", description: "Track food and utility costs" },
  { sector: "Food & Beverage", userPersona: "Restaurant Owner", department: "Finance & Tax", toolName: "Profit Calculator", description: "Calculate dish profitability" },
  { sector: "Food & Beverage", userPersona: "Restaurant Owner", department: "Legal & Compliance", toolName: "Compliance Checklist", description: "FSSAI and health permits" },
  { sector: "Food & Beverage", userPersona: "Restaurant Owner", department: "Marketing & Sales", toolName: "Social Media Plan", description: "Post food content on Instagram" },
  { sector: "Food & Beverage", userPersona: "Restaurant Owner", department: "Marketing & Sales", toolName: "Review Replier", description: "Reply to Zomato/Swiggy reviews" },
  { sector: "Food & Beverage", userPersona: "Restaurant Owner", department: "Ops & Inventory", toolName: "Stock Audit", description: "Track kitchen inventory" },
  { sector: "Food & Beverage", userPersona: "Restaurant Owner", department: "Ops & Inventory", toolName: "Wastage Log", description: "Track food wastage" },
  { sector: "Food & Beverage", userPersona: "Restaurant Owner", department: "HR & Staff", toolName: "Hiring Job Post", description: "Hire kitchen and service staff" },
  { sector: "Food & Beverage", userPersona: "Restaurant Owner", department: "HR & Staff", toolName: "Shift Handover", description: "Kitchen shift handover notes" },

  // Food & Beverage - Caterer
  { sector: "Food & Beverage", userPersona: "Caterer", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create catering event invoices" },
  { sector: "Food & Beverage", userPersona: "Caterer", department: "Finance & Tax", toolName: "Profit Calculator", description: "Calculate event profitability" },
  { sector: "Food & Beverage", userPersona: "Caterer", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Reach event planners" },
  { sector: "Food & Beverage", userPersona: "Caterer", department: "Ops & Inventory", toolName: "Supplier Order", description: "Order bulk ingredients" },

  // Healthcare & Pharma - Clinic Owner
  { sector: "Healthcare & Pharma", userPersona: "Clinic Owner", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create patient billing invoices" },
  { sector: "Healthcare & Pharma", userPersona: "Clinic Owner", department: "Finance & Tax", toolName: "Expense Tracker", description: "Track medical supplies cost" },
  { sector: "Healthcare & Pharma", userPersona: "Clinic Owner", department: "Legal & Compliance", toolName: "Compliance Checklist", description: "Medical license requirements" },
  { sector: "Healthcare & Pharma", userPersona: "Clinic Owner", department: "Legal & Compliance", toolName: "Contract Drafter", description: "Patient consent forms" },
  { sector: "Healthcare & Pharma", userPersona: "Clinic Owner", department: "HR & Staff", toolName: "Hiring Job Post", description: "Hire medical staff" },

  // Healthcare & Pharma - Pharmacy
  { sector: "Healthcare & Pharma", userPersona: "Pharmacy", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create medicine sale invoices" },
  { sector: "Healthcare & Pharma", userPersona: "Pharmacy", department: "Ops & Inventory", toolName: "Stock Audit", description: "Track medicine inventory" },
  { sector: "Healthcare & Pharma", userPersona: "Pharmacy", department: "Ops & Inventory", toolName: "Wastage Log", description: "Track expired medicines" },

  // Retail & E-commerce - Shop Owner
  { sector: "Retail & E-commerce", userPersona: "Shop Owner", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create retail sale invoices" },
  { sector: "Retail & E-commerce", userPersona: "Shop Owner", department: "Finance & Tax", toolName: "Expense Tracker", description: "Track shop expenses" },
  { sector: "Retail & E-commerce", userPersona: "Shop Owner", department: "Finance & Tax", toolName: "Profit Calculator", description: "Calculate product margins" },
  { sector: "Retail & E-commerce", userPersona: "Shop Owner", department: "Finance & Tax", toolName: "Tax Estimator", description: "Estimate GST liability" },
  { sector: "Retail & E-commerce", userPersona: "Shop Owner", department: "Marketing & Sales", toolName: "Offer Generator", description: "Create festive discounts" },
  { sector: "Retail & E-commerce", userPersona: "Shop Owner", department: "Marketing & Sales", toolName: "Customer Follow-up", description: "Follow up with regular customers" },
  { sector: "Retail & E-commerce", userPersona: "Shop Owner", department: "Ops & Inventory", toolName: "Stock Audit", description: "Track shop inventory" },
  { sector: "Retail & E-commerce", userPersona: "Shop Owner", department: "Ops & Inventory", toolName: "Supplier Order", description: "Order from wholesalers" },
  { sector: "Retail & E-commerce", userPersona: "Shop Owner", department: "HR & Staff", toolName: "Hiring Job Post", description: "Hire sales staff" },

  // Retail & E-commerce - E-commerce Seller
  { sector: "Retail & E-commerce", userPersona: "E-commerce Seller", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create online sale invoices" },
  { sector: "Retail & E-commerce", userPersona: "E-commerce Seller", department: "Finance & Tax", toolName: "Profit Calculator", description: "Calculate after marketplace fees" },
  { sector: "Retail & E-commerce", userPersona: "E-commerce Seller", department: "Marketing & Sales", toolName: "Social Media Plan", description: "Plan product promotion" },
  { sector: "Retail & E-commerce", userPersona: "E-commerce Seller", department: "Marketing & Sales", toolName: "Review Replier", description: "Reply to product reviews" },

  // IT & Software - Freelance Developer
  { sector: "IT & Software", userPersona: "Freelance Developer", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create project invoices" },
  { sector: "IT & Software", userPersona: "Freelance Developer", department: "Finance & Tax", toolName: "Tax Estimator", description: "Estimate freelance taxes" },
  { sector: "IT & Software", userPersona: "Freelance Developer", department: "Legal & Compliance", toolName: "Contract Drafter", description: "Create project contracts" },
  { sector: "IT & Software", userPersona: "Freelance Developer", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Pitch to potential clients" },
  { sector: "IT & Software", userPersona: "Freelance Developer", department: "Marketing & Sales", toolName: "Social Media Plan", description: "Build developer personal brand" },

  // IT & Software - Software Agency
  { sector: "IT & Software", userPersona: "Software Agency", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create software project invoices" },
  { sector: "IT & Software", userPersona: "Software Agency", department: "Finance & Tax", toolName: "Profit Calculator", description: "Calculate project profitability" },
  { sector: "IT & Software", userPersona: "Software Agency", department: "Legal & Compliance", toolName: "Contract Drafter", description: "Draft NDA and MSA" },
  { sector: "IT & Software", userPersona: "Software Agency", department: "HR & Staff", toolName: "Hiring Job Post", description: "Hire developers" },
  { sector: "IT & Software", userPersona: "Software Agency", department: "HR & Staff", toolName: "Interview Guide", description: "Technical interview questions" },

  // Professional Services - CA/Accountant
  { sector: "Professional Services", userPersona: "CA/Accountant", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create professional fee invoices" },
  { sector: "Professional Services", userPersona: "CA/Accountant", department: "Finance & Tax", toolName: "Tax Estimator", description: "Estimate client taxes" },
  { sector: "Professional Services", userPersona: "CA/Accountant", department: "Legal & Compliance", toolName: "Compliance Checklist", description: "Tax filing deadlines" },
  { sector: "Professional Services", userPersona: "CA/Accountant", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Acquire new clients" },

  // Professional Services - Lawyer
  { sector: "Professional Services", userPersona: "Lawyer", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create legal fee invoices" },
  { sector: "Professional Services", userPersona: "Lawyer", department: "Legal & Compliance", toolName: "Contract Drafter", description: "Draft legal agreements" },
  { sector: "Professional Services", userPersona: "Lawyer", department: "Legal & Compliance", toolName: "Notice Reply Bot", description: "Draft legal notices" },
  { sector: "Professional Services", userPersona: "Lawyer", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Reach potential clients" },

  // Hospitality & Tourism - Hotel Owner
  { sector: "Hospitality & Tourism", userPersona: "Hotel Owner", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create hotel booking invoices" },
  { sector: "Hospitality & Tourism", userPersona: "Hotel Owner", department: "Finance & Tax", toolName: "Expense Tracker", description: "Track hotel operational costs" },
  { sector: "Hospitality & Tourism", userPersona: "Hotel Owner", department: "Marketing & Sales", toolName: "Review Replier", description: "Reply to OTA reviews" },
  { sector: "Hospitality & Tourism", userPersona: "Hotel Owner", department: "Marketing & Sales", toolName: "Offer Generator", description: "Create seasonal offers" },
  { sector: "Hospitality & Tourism", userPersona: "Hotel Owner", department: "HR & Staff", toolName: "Shift Handover", description: "Front desk handover" },

  // Hospitality & Tourism - Travel Agent
  { sector: "Hospitality & Tourism", userPersona: "Travel Agent", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create travel booking invoices" },
  { sector: "Hospitality & Tourism", userPersona: "Travel Agent", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Reach travelers" },
  { sector: "Hospitality & Tourism", userPersona: "Travel Agent", department: "Marketing & Sales", toolName: "Offer Generator", description: "Create tour packages" },

  // Creative & Design - Graphic Designer
  { sector: "Creative & Design", userPersona: "Graphic Designer", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create design project invoices" },
  { sector: "Creative & Design", userPersona: "Graphic Designer", department: "Legal & Compliance", toolName: "Contract Drafter", description: "Draft design contracts" },
  { sector: "Creative & Design", userPersona: "Graphic Designer", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Pitch to agencies" },
  { sector: "Creative & Design", userPersona: "Graphic Designer", department: "Marketing & Sales", toolName: "Social Media Plan", description: "Showcase portfolio" },

  // Photography & Video - Photographer
  { sector: "Photography & Video", userPersona: "Photographer", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create photography invoices" },
  { sector: "Photography & Video", userPersona: "Photographer", department: "Legal & Compliance", toolName: "Contract Drafter", description: "Draft shoot agreements" },
  { sector: "Photography & Video", userPersona: "Photographer", department: "Marketing & Sales", toolName: "Social Media Plan", description: "Post work samples" },
  { sector: "Photography & Video", userPersona: "Photographer", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Reach event planners" },

  // Marketing & Advertising - Digital Marketer
  { sector: "Marketing & Advertising", userPersona: "Digital Marketer", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create campaign invoices" },
  { sector: "Marketing & Advertising", userPersona: "Digital Marketer", department: "Finance & Tax", toolName: "Profit Calculator", description: "Calculate ROAS" },
  { sector: "Marketing & Advertising", userPersona: "Digital Marketer", department: "Marketing & Sales", toolName: "Social Media Plan", description: "Create content calendars" },
  { sector: "Marketing & Advertising", userPersona: "Digital Marketer", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Pitch to brands" },

  // Home Services - Plumber
  { sector: "Home Services", userPersona: "Plumber", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create service invoices" },
  { sector: "Home Services", userPersona: "Plumber", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Reach local customers" },
  { sector: "Home Services", userPersona: "Plumber", department: "Marketing & Sales", toolName: "Review Replier", description: "Reply to service reviews" },

  // Home Services - Electrician
  { sector: "Home Services", userPersona: "Electrician", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create electrical work invoices" },
  { sector: "Home Services", userPersona: "Electrician", department: "Legal & Compliance", toolName: "Safety Protocol", description: "Electrical safety checklist" },
  { sector: "Home Services", userPersona: "Electrician", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Reach homeowners" },

  // Manufacturing - Factory Owner
  { sector: "Manufacturing", userPersona: "Factory Owner", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create manufacturing invoices" },
  { sector: "Manufacturing", userPersona: "Factory Owner", department: "Finance & Tax", toolName: "Expense Tracker", description: "Track production costs" },
  { sector: "Manufacturing", userPersona: "Factory Owner", department: "Legal & Compliance", toolName: "Compliance Checklist", description: "Factory licenses and permits" },
  { sector: "Manufacturing", userPersona: "Factory Owner", department: "Legal & Compliance", toolName: "Safety Protocol", description: "Factory safety guidelines" },
  { sector: "Manufacturing", userPersona: "Factory Owner", department: "Ops & Inventory", toolName: "Stock Audit", description: "Track raw materials" },
  { sector: "Manufacturing", userPersona: "Factory Owner", department: "Ops & Inventory", toolName: "Maintenance Log", description: "Track machine maintenance" },
  { sector: "Manufacturing", userPersona: "Factory Owner", department: "HR & Staff", toolName: "Hiring Job Post", description: "Hire factory workers" },
  { sector: "Manufacturing", userPersona: "Factory Owner", department: "HR & Staff", toolName: "Shift Handover", description: "Production shift notes" },

  // Consulting - Business Consultant
  { sector: "Consulting", userPersona: "Business Consultant", department: "Finance & Tax", toolName: "Invoice Generator", description: "Create consulting invoices" },
  { sector: "Consulting", userPersona: "Business Consultant", department: "Legal & Compliance", toolName: "Contract Drafter", description: "Draft consulting agreements" },
  { sector: "Consulting", userPersona: "Business Consultant", department: "Marketing & Sales", toolName: "Cold Outreach", description: "Pitch to businesses" },
  { sector: "Consulting", userPersona: "Business Consultant", department: "Marketing & Sales", toolName: "Social Media Plan", description: "Build thought leadership" },
];

// Generate icons based on department or tool name
const getIconForTool = (toolName: string, department: string): ReactNode => {
  const IconComponent = toolIcons[toolName] || departmentIcons[department] || FileText;
  return <IconComponent className="h-6 w-6" />;
};

// Generate expanded tools from raw data
export const generateExpandedTools = (): ExpandedTool[] => {
  return rawToolsData.map((tool, index) => ({
    id: `tool-${index + 1}`,
    name: `${tool.toolName} - ${tool.userPersona}`,
    description: tool.description,
    sector: tool.sector,
    userPersona: tool.userPersona,
    department: tool.department,
    isLive: false, // All tools from CSV are coming soon
    icon: getIconForTool(tool.toolName, tool.department),
  }));
};

// Get unique tools
export const getUniqueTools = (): ExpandedTool[] => {
  return generateExpandedTools();
};

// Export expanded tools array
export const expandedTools = generateExpandedTools();

// Get unique sectors
export const sectors = [
  "All Sectors",
  "Agriculture & Farming",
  "Automotive & Transport",
  "Beauty & Wellness",
  "Construction & Real Estate",
  "Consulting",
  "Creative & Design",
  "Education & Training",
  "Food & Beverage",
  "Healthcare & Pharma",
  "Home Services",
  "Hospitality & Tourism",
  "IT & Software",
  "Manufacturing",
  "Marketing & Advertising",
  "Photography & Video",
  "Professional Services",
  "Retail & E-commerce",
];

// Get unique departments
export const departments = [
  "All Departments",
  "Finance & Tax",
  "Legal & Compliance",
  "Marketing & Sales",
  "Ops & Inventory",
  "HR & Staff",
];

// Get unique user personas
export const inputModes = [
  "All Personas",
  "Dairy Farmer",
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
  "Clinic Owner",
  "Pharmacy",
  "Shop Owner",
  "E-commerce Seller",
  "Freelance Developer",
  "Software Agency",
  "CA/Accountant",
  "Lawyer",
  "Hotel Owner",
  "Travel Agent",
  "Graphic Designer",
  "Photographer",
  "Digital Marketer",
  "Plumber",
  "Electrician",
  "Factory Owner",
  "Business Consultant",
];

// Total tool count
export const totalToolCount = 50000;

// Filter tools by sector
export const filterToolsBySector = (tools: ExpandedTool[], sector: string): ExpandedTool[] => {
  if (sector === "All Sectors") return tools;
  return tools.filter(tool => tool.sector === sector);
};

// Filter tools by department
export const filterToolsByDepartment = (tools: ExpandedTool[], department: string): ExpandedTool[] => {
  if (department === "All Departments") return tools;
  return tools.filter(tool => tool.department === department);
};

// Filter tools by user persona
export const filterToolsByPersona = (tools: ExpandedTool[], persona: string): ExpandedTool[] => {
  if (persona === "All Personas") return tools;
  return tools.filter(tool => tool.userPersona === persona);
};
