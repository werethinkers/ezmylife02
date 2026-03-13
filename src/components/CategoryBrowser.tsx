import { 
  Calculator, 
  Scale, 
  Megaphone, 
  Package, 
  Users, 
  MessageSquare,
  Building2,
  Briefcase,
  Factory,
  Truck,
  Heart,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Image,
  FileText,
  Video,
  Mic,
  Code,
  PenTool,
  Palette,
  BarChart3,
  Shield,
  Globe,
  Zap,
  Database,
  Bot,
  Cpu,
  Layers,
  Settings,
  Smartphone,
  Mail,
  Calendar,
  Scissors,
  Type,
  QrCode,
  Hash,
  Ruler,
  Eraser,
  Wand2,
  Scan,
  FileImage,
  FileVideo,
  FileAudio,
  Link,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Crop,
  RotateCw,
  Maximize,
  Minimize,
  Move,
  Copy,
  Clipboard,
  Search,
  Filter,
  SortAsc,
  Grid,
  List,
  Table,
  PieChart,
  TrendingUp,
  DollarSign,
  CreditCard,
  Receipt,
  Wallet,
  Landmark,
  GraduationCap,
  BookOpen,
  Lightbulb,
  Target,
  Award,
  Trophy,
  Medal,
  Star,
  ThumbsUp,
  MessageCircle,
  Phone,
  AtSign,
  Send,
  Bell,
  Clock,
  Timer,
  Hourglass,
  Activity,
  Gauge,
  Workflow,
  GitBranch,
  Terminal,
  Bug,
  Wrench,
  Hammer,
  Paintbrush,
  Brush,
  Camera,
  Film,
  Music,
  Headphones,
  Radio,
  Tv,
  Monitor,
  Laptop,
  Tablet,
  Watch,
  Gamepad2,
  Dumbbell,
  Utensils,
  Coffee,
  Wine,
  ShoppingCart,
  ShoppingBag,
  Gift,
  Plane,
  Car,
  Train,
  Ship,
  Bike,
  Home,
  MapPin,
  Map,
  Compass,
  Sun,
  Moon,
  Cloud,
  Leaf,
  Flower2,
  TreeDeciduous,
  Mountain,
  Waves,
  Droplet,
  Flame,
  Wind,
  Snowflake,
  Umbrella,
  type LucideIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { getToolNamesForType } from "@/data/toolsDatabase";

interface CategoryBrowserProps {
  onSelectDepartment: (department: string) => void;
  onSelectSector: (sector: string) => void;
  selectedDepartment: string;
  selectedSector: string;
  onSelectToolType?: (toolType: string) => void;
  selectedToolType?: string;
}

// Department icons and colors - Enhanced with more categories
const departmentData: Record<string, { icon: LucideIcon; gradient: string; glow: string; color: string; subcategories: string[] }> = {
  "Finance & Accounting": { 
    icon: Calculator, 
    gradient: "from-emerald-500 to-teal-600",
    glow: "group-hover:shadow-emerald-500/25",
    color: "text-emerald-500",
    subcategories: ["Billing & Invoicing", "Expense Tracking", "Tax & Compliance", "Profit Analysis", "Debt Recovery", "Budgeting", "Financial Reports", "Payroll", "Banking"]
  },
  "Legal & Compliance": { 
    icon: Scale, 
    gradient: "from-blue-500 to-indigo-600",
    glow: "group-hover:shadow-blue-500/25",
    color: "text-blue-500",
    subcategories: ["Contract Management", "Regulatory Compliance", "Dispute Resolution", "Safety & Audits", "Documentation", "IP Protection", "GDPR Tools", "Legal Templates", "E-Signatures"]
  },
  "Marketing & Sales": { 
    icon: Megaphone, 
    gradient: "from-pink-500 to-rose-600",
    glow: "group-hover:shadow-pink-500/25",
    color: "text-pink-500",
    subcategories: ["Outreach & Campaigns", "Customer Engagement", "Social Media", "Lead Generation", "Promotions & Offers", "SEO Tools", "Email Marketing", "Content Marketing", "Influencer Tools", "Affiliate Marketing"]
  },
  "Operations & Inventory": { 
    icon: Package, 
    gradient: "from-amber-500 to-orange-600",
    glow: "group-hover:shadow-amber-500/25",
    color: "text-amber-500",
    subcategories: ["Stock Management", "Supplier Relations", "Quality Control", "Maintenance", "Shift Operations", "Logistics", "Warehouse", "Order Fulfillment", "Asset Tracking"]
  },
  "HR & Staffing": { 
    icon: Users, 
    gradient: "from-violet-500 to-purple-600",
    glow: "group-hover:shadow-violet-500/25",
    color: "text-violet-500",
    subcategories: ["Recruitment", "Payroll & Benefits", "Performance", "Scheduling", "Discipline & Compliance", "Training", "Onboarding", "Employee Engagement", "Remote Work", "Workforce Analytics"]
  },
  "Customer Service": { 
    icon: MessageSquare, 
    gradient: "from-cyan-500 to-sky-600",
    glow: "group-hover:shadow-cyan-500/25",
    color: "text-cyan-500",
    subcategories: ["Ticket Management", "FAQ & Knowledge Base", "Feedback & Reviews", "Live Chat", "Chatbots", "Call Center", "Help Desk", "Customer Success"]
  },
  "IT & Technology": { 
    icon: Code, 
    gradient: "from-gray-500 to-slate-600",
    glow: "group-hover:shadow-gray-500/25",
    color: "text-gray-500",
    subcategories: ["Development", "Security", "Cloud Services", "DevOps", "API Management", "Data Analytics", "System Admin", "Network Management", "IT Support"]
  },
  "Design & Creative": { 
    icon: Palette, 
    gradient: "from-fuchsia-500 to-purple-600",
    glow: "group-hover:shadow-fuchsia-500/25",
    color: "text-fuchsia-500",
    subcategories: ["Graphic Design", "UI/UX", "Branding", "Video Production", "Animation", "3D Design", "Illustration", "Photo Editing", "Motion Graphics"]
  },
  "Research & Development": { 
    icon: Lightbulb, 
    gradient: "from-yellow-500 to-amber-600",
    glow: "group-hover:shadow-yellow-500/25",
    color: "text-yellow-500",
    subcategories: ["Market Research", "Product Development", "Innovation", "Testing & QA", "Prototyping", "Data Science", "Competitive Analysis"]
  },
  "Project Management": { 
    icon: Target, 
    gradient: "from-indigo-500 to-blue-600",
    glow: "group-hover:shadow-indigo-500/25",
    color: "text-indigo-500",
    subcategories: ["Task Management", "Timeline Planning", "Resource Allocation", "Collaboration", "Reporting", "Agile Tools", "Kanban Boards", "Gantt Charts"]
  },
  "Education & Training": { 
    icon: GraduationCap, 
    gradient: "from-teal-500 to-green-600",
    glow: "group-hover:shadow-teal-500/25",
    color: "text-teal-500",
    subcategories: ["E-Learning", "Course Creation", "Quiz & Assessment", "Certification", "LMS Tools", "Student Management", "Educational Content"]
  },
  "Executive & Strategy": { 
    icon: Trophy, 
    gradient: "from-rose-500 to-red-600",
    glow: "group-hover:shadow-rose-500/25",
    color: "text-rose-500",
    subcategories: ["Business Planning", "Strategic Analysis", "Executive Dashboards", "OKR Tracking", "Investor Relations", "Board Management"]
  },
};

// Tool Types - dynamically built from database
const toolTypeVisualConfig: Record<string, { icon: LucideIcon; gradient: string; glow: string; color: string; description: string }> = {
  "Image Tools": { icon: Image, gradient: "from-violet-500 to-purple-600", glow: "group-hover:shadow-violet-500/25", color: "text-violet-500", description: "Edit, enhance, and transform images" },
  "Document Tools": { icon: FileText, gradient: "from-blue-500 to-cyan-600", glow: "group-hover:shadow-blue-500/25", color: "text-blue-500", description: "Create, convert, and manage documents" },
  "Video Tools": { icon: Video, gradient: "from-red-500 to-orange-600", glow: "group-hover:shadow-red-500/25", color: "text-red-500", description: "Edit and enhance video content" },
  "Audio Tools": { icon: Mic, gradient: "from-green-500 to-emerald-600", glow: "group-hover:shadow-green-500/25", color: "text-green-500", description: "Process and edit audio files" },
  "AI & Automation": { icon: Bot, gradient: "from-indigo-500 to-violet-600", glow: "group-hover:shadow-indigo-500/25", color: "text-indigo-500", description: "AI-powered tools for automation" },
  "Analytics Tools": { icon: BarChart3, gradient: "from-teal-500 to-cyan-600", glow: "group-hover:shadow-teal-500/25", color: "text-teal-500", description: "Track, analyze, and visualize data" },
  "Developer Tools": { icon: Code, gradient: "from-gray-600 to-zinc-700", glow: "group-hover:shadow-gray-500/25", color: "text-gray-400", description: "Tools for developers and tech teams" },
  "Communication": { icon: Mail, gradient: "from-sky-500 to-blue-600", glow: "group-hover:shadow-sky-500/25", color: "text-sky-500", description: "Email, messaging, and outreach tools" },
  "Security Tools": { icon: Shield, gradient: "from-amber-500 to-yellow-600", glow: "group-hover:shadow-amber-500/25", color: "text-amber-500", description: "Protect and secure your digital assets" },
  "Productivity": { icon: Zap, gradient: "from-yellow-500 to-orange-600", glow: "group-hover:shadow-yellow-500/25", color: "text-yellow-500", description: "Boost efficiency and save time" },
  "Text Tools": { icon: Type, gradient: "from-rose-500 to-pink-600", glow: "group-hover:shadow-rose-500/25", color: "text-rose-500", description: "Format, convert, and analyze text" },
  "QR & Barcode": { icon: QrCode, gradient: "from-slate-500 to-gray-600", glow: "group-hover:shadow-slate-500/25", color: "text-slate-500", description: "Generate and scan QR codes & barcodes" },
  "Calculators": { icon: Calculator, gradient: "from-emerald-500 to-green-600", glow: "group-hover:shadow-emerald-500/25", color: "text-emerald-500", description: "Calculate anything you need" },
  "Converters": { icon: RefreshCw, gradient: "from-cyan-500 to-teal-600", glow: "group-hover:shadow-cyan-500/25", color: "text-cyan-500", description: "Convert between formats and units" },
  "Social Media": { icon: Share2, gradient: "from-pink-500 to-fuchsia-600", glow: "group-hover:shadow-pink-500/25", color: "text-pink-500", description: "Tools for social media management" },
  "SEO Tools": { icon: Search, gradient: "from-orange-500 to-red-600", glow: "group-hover:shadow-orange-500/25", color: "text-orange-500", description: "Optimize for search engines" },
  "File Management": { icon: Database, gradient: "from-purple-500 to-indigo-600", glow: "group-hover:shadow-purple-500/25", color: "text-purple-500", description: "Organize and manage your files" },
  "Design Tools": { icon: Paintbrush, gradient: "from-fuchsia-500 to-pink-600", glow: "group-hover:shadow-fuchsia-500/25", color: "text-fuchsia-500", description: "Create stunning visual designs" },
  "Writing Tools": { icon: PenTool, gradient: "from-lime-500 to-green-600", glow: "group-hover:shadow-lime-500/25", color: "text-lime-500", description: "Write better content faster" },
  "Data Tools": { icon: Table, gradient: "from-blue-600 to-indigo-700", glow: "group-hover:shadow-blue-600/25", color: "text-blue-600", description: "Process and analyze data" },
};

// Build tool type data with real tool names from the database
const toolTypeData: Record<string, { icon: LucideIcon; gradient: string; glow: string; color: string; description: string; examples: string[] }> = Object.fromEntries(
  Object.entries(toolTypeVisualConfig).map(([type, visual]) => {
    const realToolNames = getToolNamesForType(type);
    return [type, {
      ...visual,
      examples: realToolNames.slice(0, 8), // Show up to 8 real tool names
    }];
  })
);

// Industry category icons - Enhanced with more categories
const industryData: Record<string, { icon: LucideIcon; gradient: string; glow: string; color: string; sectors: string[] }> = {
  "Services & Professional": {
    icon: Briefcase,
    gradient: "from-indigo-500 to-blue-600",
    glow: "group-hover:shadow-indigo-500/25",
    color: "text-indigo-500",
    sectors: ["Banking & Finance", "Legal Services", "Professional Services", "IT & Software", "Education & Training", "Consulting", "Accounting", "Insurance"]
  },
  "Retail & Commerce": {
    icon: ShoppingCart,
    gradient: "from-orange-500 to-red-600",
    glow: "group-hover:shadow-orange-500/25",
    color: "text-orange-500",
    sectors: ["Retail", "E-commerce", "Food & Beverage", "Beauty & Wellness", "Hospitality & Tourism", "Fashion", "Grocery", "Luxury Goods"]
  },
  "Industrial & Production": {
    icon: Factory,
    gradient: "from-slate-500 to-zinc-600",
    glow: "group-hover:shadow-slate-500/25",
    color: "text-slate-500",
    sectors: ["Manufacturing", "Agriculture & Farming", "Construction & Real Estate", "Energy & Utilities", "Mining", "Chemicals", "Textiles", "Machinery"]
  },
  "Logistics & Transport": {
    icon: Truck,
    gradient: "from-teal-500 to-emerald-600",
    glow: "group-hover:shadow-teal-500/25",
    color: "text-teal-500",
    sectors: ["Logistics", "Automotive & Transport", "Telecommunications", "Shipping", "Aviation", "Railways", "Courier Services", "Fleet Management"]
  },
  "Lifestyle & Entertainment": {
    icon: Heart,
    gradient: "from-rose-500 to-pink-600",
    glow: "group-hover:shadow-rose-500/25",
    color: "text-rose-500",
    sectors: ["Entertainment & Media", "Gaming & E-sports", "Sports & Fitness", "Weddings & Events", "Non-Profit & NGO", "Travel", "Art & Culture", "Hobbies"]
  },
  "Healthcare & Wellness": {
    icon: Activity,
    gradient: "from-red-500 to-rose-600",
    glow: "group-hover:shadow-red-500/25",
    color: "text-red-500",
    sectors: ["Healthcare & Medical", "Pharmaceuticals", "Mental Health", "Fitness & Nutrition", "Elder Care", "Dental", "Veterinary", "Alternative Medicine"]
  },
  "Technology & Digital": {
    icon: Cpu,
    gradient: "from-cyan-500 to-blue-600",
    glow: "group-hover:shadow-cyan-500/25",
    color: "text-cyan-500",
    sectors: ["SaaS", "Fintech", "EdTech", "HealthTech", "AI & ML", "Blockchain", "Cybersecurity", "IoT", "Cloud Services"]
  },
  "Creative & Media": {
    icon: Film,
    gradient: "from-pink-500 to-fuchsia-600",
    glow: "group-hover:shadow-pink-500/25",
    color: "text-pink-500",
    sectors: ["Advertising", "Publishing", "Film & TV", "Music Industry", "Photography", "Design Agencies", "Streaming", "Content Creation"]
  },
  "Food & Hospitality": {
    icon: Utensils,
    gradient: "from-amber-500 to-orange-600",
    glow: "group-hover:shadow-amber-500/25",
    color: "text-amber-500",
    sectors: ["Restaurants", "Hotels", "Cafes & Bakeries", "Catering", "Food Delivery", "Bars & Nightlife", "Quick Service", "Fine Dining"]
  },
  "Real Estate & Property": {
    icon: Home,
    gradient: "from-green-500 to-emerald-600",
    glow: "group-hover:shadow-green-500/25",
    color: "text-green-500",
    sectors: ["Residential", "Commercial", "Property Management", "Real Estate Agents", "Architecture", "Interior Design", "Facility Management"]
  },
  "Education & Learning": {
    icon: BookOpen,
    gradient: "from-violet-500 to-purple-600",
    glow: "group-hover:shadow-violet-500/25",
    color: "text-violet-500",
    sectors: ["K-12 Schools", "Higher Education", "Online Courses", "Coaching Centers", "Vocational Training", "Corporate Training", "Test Prep"]
  },
  "Government & Public": {
    icon: Landmark,
    gradient: "from-gray-600 to-slate-700",
    glow: "group-hover:shadow-gray-600/25",
    color: "text-gray-600",
    sectors: ["Government", "Public Administration", "Defense", "Law Enforcement", "Public Health", "Social Services", "Civic Organizations"]
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const CategoryBrowser = ({ 
  onSelectDepartment, 
  onSelectSector,
  selectedDepartment,
  selectedSector,
  onSelectToolType,
  selectedToolType = "All Types"
}: CategoryBrowserProps) => {
  const [expandedDepartment, setExpandedDepartment] = useState<string | null>(null);
  const [expandedIndustry, setExpandedIndustry] = useState<string | null>(null);
  const [expandedToolType, setExpandedToolType] = useState<string | null>(null);

  const handleDepartmentClick = (dept: string) => {
    if (expandedDepartment === dept) {
      setExpandedDepartment(null);
    } else {
      setExpandedDepartment(dept);
    }
  };

  const handleIndustryClick = (industry: string) => {
    if (expandedIndustry === industry) {
      setExpandedIndustry(null);
    } else {
      setExpandedIndustry(industry);
    }
  };

  const handleToolTypeClick = (type: string) => {
    if (expandedToolType === type) {
      setExpandedToolType(null);
    } else {
      setExpandedToolType(type);
    }
  };

  return (
    <div className="space-y-12">
      {/* Browse by Tool Type - NEW SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/10">
              <Layers className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Browse by Tool Type</h2>
              <p className="text-sm text-muted-foreground">Find tools by what they do</p>
            </div>
          </div>
          {selectedToolType !== "All Types" && onSelectToolType && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => onSelectToolType("All Types")}
              className="text-muted-foreground hover:text-primary"
            >
              Clear selection
            </Button>
          )}
        </div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {Object.entries(toolTypeData).map(([type, data]) => {
            const Icon = data.icon;
            const isSelected = selectedToolType === type;
            const isExpanded = expandedToolType === type;
            
            return (
              <motion.div key={type} variants={itemVariants}>
                <Card 
                  onClick={() => handleToolTypeClick(type)}
                  className={cn(
                    "group cursor-pointer transition-all duration-300 overflow-hidden relative",
                    "bg-card/80 backdrop-blur-sm border-border/50",
                    "hover:-translate-y-1 hover:shadow-xl",
                    data.glow,
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  {/* Gradient overlay */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none",
                    `bg-gradient-to-br ${data.gradient}`
                  )} />
                  
                  <CardContent className="p-0">
                    {/* Main clickable area */}
                    <div className="p-4 flex flex-col items-center gap-3 text-center">
                      <div className={cn(
                        "p-3 rounded-xl transition-all duration-300 shrink-0",
                        `bg-gradient-to-br ${data.gradient}`,
                        "group-hover:scale-110 group-hover:shadow-lg"
                      )}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                          {type}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {data.description}
                        </p>
                      </div>
                    </div>

                    {/* Expandable examples */}
                    <motion.div
                      initial={false}
                      animate={{ 
                        height: isExpanded ? "auto" : 0,
                        opacity: isExpanded ? 1 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-border/50">
                        <div className="flex flex-wrap gap-1.5 pt-3">
                          {data.examples.map((example) => (
                            <Badge 
                              key={example} 
                              variant="secondary" 
                              className={cn(
                                "text-xs cursor-pointer transition-all duration-200",
                                "hover:bg-primary hover:text-primary-foreground"
                              )}
                            >
                              {example}
                            </Badge>
                          ))}
                        </div>
                        {onSelectToolType && (
                          <Button 
                            size="sm" 
                            className="w-full mt-3 gap-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectToolType(type);
                            }}
                          >
                            Browse {type}
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Browse by Department */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Browse by Department</h2>
              <p className="text-sm text-muted-foreground">Find tools organized by business function</p>
            </div>
          </div>
          {selectedDepartment !== "All Departments" && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => onSelectDepartment("All Departments")}
              className="text-muted-foreground hover:text-primary"
            >
              Clear selection
            </Button>
          )}
        </div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {Object.entries(departmentData).map(([dept, data]) => {
            const Icon = data.icon;
            const isSelected = selectedDepartment === dept;
            const isExpanded = expandedDepartment === dept;
            
            return (
              <motion.div key={dept} variants={itemVariants}>
                <Card 
                  onClick={() => handleDepartmentClick(dept)}
                  className={cn(
                    "group cursor-pointer transition-all duration-300 overflow-hidden relative",
                    "bg-card/80 backdrop-blur-sm border-border/50",
                    "hover:-translate-y-1 hover:shadow-xl",
                    data.glow,
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  {/* Gradient overlay */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none",
                    `bg-gradient-to-br ${data.gradient}`
                  )} />
                  
                  <CardContent className="p-0">
                    {/* Main clickable area */}
                    <div className="p-5 flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl transition-all duration-300 shrink-0",
                        `bg-gradient-to-br ${data.gradient}`,
                        "group-hover:scale-110 group-hover:shadow-lg"
                      )}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-base group-hover:text-primary transition-colors truncate">
                            {dept}
                          </h3>
                          <ChevronRight className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform duration-300 shrink-0",
                            isExpanded && "rotate-90"
                          )} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {data.subcategories.length} subcategories
                        </p>
                      </div>
                    </div>

                    {/* Expandable subcategories */}
                    <motion.div
                      initial={false}
                      animate={{ 
                        height: isExpanded ? "auto" : 0,
                        opacity: isExpanded ? 1 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pt-0 border-t border-border/50">
                        <div className="flex flex-wrap gap-2 pt-4">
                          {data.subcategories.map((sub) => (
                            <Badge 
                              key={sub} 
                              variant="secondary" 
                              className={cn(
                                "text-xs cursor-pointer transition-all duration-200",
                                "hover:bg-primary hover:text-primary-foreground hover:scale-105"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectDepartment(dept);
                              }}
                            >
                              {sub}
                            </Badge>
                          ))}
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full mt-4 gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDepartment(dept);
                          }}
                        >
                          View All {dept} Tools
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Browse by Industry */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/10">
              <Globe className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Browse by Industry</h2>
              <p className="text-sm text-muted-foreground">Explore tools tailored to your sector</p>
            </div>
          </div>
          {selectedSector !== "All Sectors" && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => onSelectSector("All Sectors")}
              className="text-muted-foreground hover:text-primary"
            >
              Clear selection
            </Button>
          )}
        </div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {Object.entries(industryData).map(([industry, data]) => {
            const Icon = data.icon;
            const isExpanded = expandedIndustry === industry;
            const hasSelectedSector = data.sectors.includes(selectedSector);
            
            return (
              <motion.div key={industry} variants={itemVariants}>
                <Card 
                  onClick={() => handleIndustryClick(industry)}
                  className={cn(
                    "group cursor-pointer transition-all duration-300 overflow-hidden relative",
                    "bg-card/80 backdrop-blur-sm border-border/50",
                    "hover:-translate-y-1 hover:shadow-xl",
                    data.glow,
                    hasSelectedSector && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  {/* Gradient overlay */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none",
                    `bg-gradient-to-br ${data.gradient}`
                  )} />
                  
                  <CardContent className="p-0">
                    {/* Main clickable area */}
                    <div className="p-5 flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl transition-all duration-300 shrink-0",
                        `bg-gradient-to-br ${data.gradient}`,
                        "group-hover:scale-110 group-hover:shadow-lg"
                      )}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-base group-hover:text-primary transition-colors truncate">
                            {industry}
                          </h3>
                          <ChevronRight className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform duration-300 shrink-0",
                            isExpanded && "rotate-90"
                          )} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {data.sectors.length} sectors
                        </p>
                      </div>
                    </div>

                    {/* Expandable sectors */}
                    <motion.div
                      initial={false}
                      animate={{ 
                        height: isExpanded ? "auto" : 0,
                        opacity: isExpanded ? 1 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pt-0 border-t border-border/50">
                        <div className="space-y-2 pt-4">
                          {data.sectors.map((sector) => (
                            <button 
                              key={sector}
                              className={cn(
                                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                                "flex items-center justify-between group/sector",
                                selectedSector === sector 
                                  ? "bg-primary text-primary-foreground shadow-md" 
                                  : "bg-secondary/50 hover:bg-secondary text-foreground"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSector(selectedSector === sector ? "All Sectors" : sector);
                              }}
                            >
                              <span className="font-medium">{sector}</span>
                              <ArrowRight className={cn(
                                "h-4 w-4 transition-transform",
                                selectedSector === sector 
                                  ? "translate-x-0" 
                                  : "-translate-x-2 opacity-0 group-hover/sector:translate-x-0 group-hover/sector:opacity-100"
                              )} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
};

export { departmentData, toolTypeData, industryData };
