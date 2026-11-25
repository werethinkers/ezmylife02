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
  ChevronDown,
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
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { getToolNamesForType } from "@/data/toolsDatabase";
import { CARD, BTN_PRIMARY, BTN_OUTLINE } from "@/components/modern/styles";

interface CategoryBrowserProps {
  onSelectDepartment: (department: string) => void;
  onSelectSector: (sector: string) => void;
  selectedDepartment: string;
  selectedSector: string;
  onSelectToolType?: (toolType: string) => void;
  selectedToolType?: string;
}

// EZ brand accent chips — solid colours from the brand palette (no gradients)
type BrandAccent = "bg-pink" | "bg-sun" | "bg-teal" | "bg-sky" | "bg-lime" | "bg-sand" | "bg-ink";

// Department icons mapped to EZ brand accent colours
const departmentData: Record<string, { icon: LucideIcon; accent: BrandAccent; subcategories: string[] }> = {
  "Finance & Accounting": {
    icon: Calculator,
    accent: "bg-lime",
    subcategories: ["Billing & Invoicing", "Expense Tracking", "Tax & Compliance", "Profit Analysis", "Debt Recovery", "Budgeting", "Financial Reports", "Payroll", "Banking"]
  },
  "Legal & Compliance": {
    icon: Scale,
    accent: "bg-sky",
    subcategories: ["Contract Management", "Regulatory Compliance", "Dispute Resolution", "Safety & Audits", "Documentation", "IP Protection", "GDPR Tools", "Legal Templates", "E-Signatures"]
  },
  "Marketing & Sales": {
    icon: Megaphone,
    accent: "bg-pink",
    subcategories: ["Outreach & Campaigns", "Customer Engagement", "Social Media", "Lead Generation", "Promotions & Offers", "SEO Tools", "Email Marketing", "Content Marketing", "Influencer Tools", "Affiliate Marketing"]
  },
  "Operations & Inventory": {
    icon: Package,
    accent: "bg-sun",
    subcategories: ["Stock Management", "Supplier Relations", "Quality Control", "Maintenance", "Shift Operations", "Logistics", "Warehouse", "Order Fulfillment", "Asset Tracking"]
  },
  "HR & Staffing": {
    icon: Users,
    accent: "bg-teal",
    subcategories: ["Recruitment", "Payroll & Benefits", "Performance", "Scheduling", "Discipline & Compliance", "Training", "Onboarding", "Employee Engagement", "Remote Work", "Workforce Analytics"]
  },
  "Customer Service": {
    icon: MessageSquare,
    accent: "bg-sky",
    subcategories: ["Ticket Management", "FAQ & Knowledge Base", "Feedback & Reviews", "Live Chat", "Chatbots", "Call Center", "Help Desk", "Customer Success"]
  },
  "IT & Technology": {
    icon: Code,
    accent: "bg-sand",
    subcategories: ["Development", "Security", "Cloud Services", "DevOps", "API Management", "Data Analytics", "System Admin", "Network Management", "IT Support"]
  },
  "Design & Creative": {
    icon: Palette,
    accent: "bg-pink",
    subcategories: ["Graphic Design", "UI/UX", "Branding", "Video Production", "Animation", "3D Design", "Illustration", "Photo Editing", "Motion Graphics"]
  },
  "Research & Development": {
    icon: Lightbulb,
    accent: "bg-sun",
    subcategories: ["Market Research", "Product Development", "Innovation", "Testing & QA", "Prototyping", "Data Science", "Competitive Analysis"]
  },
  "Project Management": {
    icon: Target,
    accent: "bg-teal",
    subcategories: ["Task Management", "Timeline Planning", "Resource Allocation", "Collaboration", "Reporting", "Agile Tools", "Kanban Boards", "Gantt Charts"]
  },
  "Education & Training": {
    icon: GraduationCap,
    accent: "bg-lime",
    subcategories: ["E-Learning", "Course Creation", "Quiz & Assessment", "Certification", "LMS Tools", "Student Management", "Educational Content"]
  },
  "Executive & Strategy": {
    icon: Trophy,
    accent: "bg-pink",
    subcategories: ["Business Planning", "Strategic Analysis", "Executive Dashboards", "OKR Tracking", "Investor Relations", "Board Management"]
  },
};

// Tool Types — EZ brand accent mapping
const toolTypeVisualConfig: Record<string, { icon: LucideIcon; accent: BrandAccent; description: string }> = {
  "Image Tools":      { icon: Image,      accent: "bg-teal", description: "Edit, enhance, and transform images" },
  "Document Tools":   { icon: FileText,   accent: "bg-sky",  description: "Create, convert, and manage documents" },
  "Video Tools":      { icon: Video,      accent: "bg-pink", description: "Edit and enhance video content" },
  "Audio Tools":      { icon: Mic,        accent: "bg-lime", description: "Process and edit audio files" },
  "AI & Automation":  { icon: Bot,        accent: "bg-teal", description: "AI-powered tools for automation" },
  "Analytics Tools":  { icon: BarChart3,  accent: "bg-sky",  description: "Track, analyze, and visualize data" },
  "Developer Tools":  { icon: Code,       accent: "bg-sand", description: "Tools for developers and tech teams" },
  "Communication":    { icon: Mail,       accent: "bg-sky",  description: "Email, messaging, and outreach tools" },
  "Security Tools":   { icon: Shield,     accent: "bg-sun",  description: "Protect and secure your digital assets" },
  "Productivity":     { icon: Zap,        accent: "bg-sun",  description: "Boost efficiency and save time" },
  "Text Tools":       { icon: Type,       accent: "bg-pink", description: "Format, convert, and analyze text" },
  "QR & Barcode":     { icon: QrCode,     accent: "bg-sand", description: "Generate and scan QR codes & barcodes" },
  "Calculators":      { icon: Calculator, accent: "bg-lime", description: "Calculate anything you need" },
  "Converters":       { icon: RefreshCw,  accent: "bg-teal", description: "Convert between formats and units" },
  "Social Media":     { icon: Share2,     accent: "bg-pink", description: "Tools for social media management" },
  "SEO Tools":        { icon: Search,     accent: "bg-sun",  description: "Optimize for search engines" },
  "File Management":  { icon: Database,   accent: "bg-teal", description: "Organize and manage your files" },
  "Design Tools":     { icon: Paintbrush, accent: "bg-pink", description: "Create stunning visual designs" },
  "Writing Tools":    { icon: PenTool,    accent: "bg-lime", description: "Write better content faster" },
  "Data Tools":       { icon: Table,      accent: "bg-sky",  description: "Process and analyze data" },
};

// Build tool type data with real tool names from the database
const toolTypeData: Record<string, { icon: LucideIcon; accent: BrandAccent; description: string; examples: string[] }> = Object.fromEntries(
  Object.entries(toolTypeVisualConfig).map(([type, visual]) => {
    const realToolNames = getToolNamesForType(type);
    return [type, { ...visual, examples: realToolNames.slice(0, 8) }];
  })
);

// Industry categories — EZ brand accent mapping
const industryData: Record<string, { icon: LucideIcon; accent: BrandAccent; sectors: string[] }> = {
  "Services & Professional": {
    icon: Briefcase, accent: "bg-sky",
    sectors: ["Banking & Finance", "Legal Services", "Professional Services", "IT & Software", "Education & Training", "Consulting", "Accounting", "Insurance"]
  },
  "Retail & Commerce": {
    icon: ShoppingCart, accent: "bg-sun",
    sectors: ["Retail", "E-commerce", "Food & Beverage", "Beauty & Wellness", "Hospitality & Tourism", "Fashion", "Grocery", "Luxury Goods"]
  },
  "Industrial & Production": {
    icon: Factory, accent: "bg-sand",
    sectors: ["Manufacturing", "Agriculture & Farming", "Construction & Real Estate", "Energy & Utilities", "Mining", "Chemicals", "Textiles", "Machinery"]
  },
  "Logistics & Transport": {
    icon: Truck, accent: "bg-teal",
    sectors: ["Logistics", "Automotive & Transport", "Telecommunications", "Shipping", "Aviation", "Railways", "Courier Services", "Fleet Management"]
  },
  "Lifestyle & Entertainment": {
    icon: Heart, accent: "bg-pink",
    sectors: ["Entertainment & Media", "Gaming & E-sports", "Sports & Fitness", "Weddings & Events", "Non-Profit & NGO", "Travel", "Art & Culture", "Hobbies"]
  },
  "Healthcare & Wellness": {
    icon: Activity, accent: "bg-lime",
    sectors: ["Healthcare & Medical", "Pharmaceuticals", "Mental Health", "Fitness & Nutrition", "Elder Care", "Dental", "Veterinary", "Alternative Medicine"]
  },
  "Technology & Digital": {
    icon: Cpu, accent: "bg-sky",
    sectors: ["SaaS", "Fintech", "EdTech", "HealthTech", "AI & ML", "Blockchain", "Cybersecurity", "IoT", "Cloud Services"]
  },
  "Creative & Media": {
    icon: Film, accent: "bg-pink",
    sectors: ["Advertising", "Publishing", "Film & TV", "Music Industry", "Photography", "Design Agencies", "Streaming", "Content Creation"]
  },
  "Food & Hospitality": {
    icon: Utensils, accent: "bg-sun",
    sectors: ["Restaurants", "Hotels", "Cafes & Bakeries", "Catering", "Food Delivery", "Bars & Nightlife", "Quick Service", "Fine Dining"]
  },
  "Real Estate & Property": {
    icon: Home, accent: "bg-lime",
    sectors: ["Residential", "Commercial", "Property Management", "Real Estate Agents", "Architecture", "Interior Design", "Facility Management"]
  },
  "Education & Learning": {
    icon: BookOpen, accent: "bg-teal",
    sectors: ["K-12 Schools", "Higher Education", "Online Courses", "Coaching Centers", "Vocational Training", "Corporate Training", "Test Prep"]
  },
  "Government & Public": {
    icon: Landmark, accent: "bg-sand",
    sectors: ["Government", "Public Administration", "Defense", "Law Enforcement", "Public Health", "Social Services", "Civic Organizations"]
  },
};

// Section header chip — solid EZ brand accent box for the icon
function SectionChip({ icon: Icon, accent }: { icon: LucideIcon; accent: BrandAccent }) {
  return (
    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink shadow-block-sm", accent)}>
      <Icon className="h-4 w-4 text-ink" />
    </div>
  );
}

export const CategoryBrowser = ({
  onSelectDepartment,
  onSelectSector,
  selectedDepartment,
  selectedSector,
  onSelectToolType,
  selectedToolType = "All Types"
}: CategoryBrowserProps) => {
  // Accordion state — only one open at a time per section
  const [expandedDepartment, setExpandedDepartment] = useState<string | null>(null);
  const [expandedIndustry, setExpandedIndustry] = useState<string | null>(null);
  const [expandedToolType, setExpandedToolType] = useState<string | null>(null);

  const toggleDept = (dept: string) =>
    setExpandedDepartment(prev => (prev === dept ? null : dept));
  const toggleIndustry = (ind: string) =>
    setExpandedIndustry(prev => (prev === ind ? null : ind));
  const toggleToolType = (t: string) =>
    setExpandedToolType(prev => (prev === t ? null : t));

  return (
    <div className="space-y-14">

      {/* ── Browse by AI App Type ─────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SectionChip icon={Layers} accent="bg-teal" />
            <div>
              <h2 className="font-unbounded text-xl font-black text-ink">Browse by AI App Type</h2>
              <p className="text-xs text-ink/60">Find AI Apps by what they do</p>
            </div>
          </div>
          {selectedToolType !== "All Types" && onSelectToolType && (
            <button
              onClick={() => onSelectToolType("All Types")}
              className={cn(BTN_OUTLINE, "text-xs")}
            >
              Clear
            </button>
          )}
        </div>

        {/* Horizontal scroll row */}
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Object.entries(toolTypeData)
            .filter(([, d]) => d.examples.length > 0)
            .map(([type, data]) => {
              const Icon = data.icon;
              const isSelected = selectedToolType === type;
              const isExpanded = expandedToolType === type;

              return (
                <div key={type} className="shrink-0 w-[160px]">
                  {/* Card */}
                  <div
                    onClick={() => toggleToolType(type)}
                    className={cn(
                      CARD,
                      "cursor-pointer overflow-hidden transition-shadow hover:shadow-block-lg",
                      isSelected && "bg-sun/10 border-sun"
                    )}
                  >
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink",
                        data.accent
                      )}>
                        <Icon className="h-5 w-5 text-ink" />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-snug text-ink">{type}</p>
                        <p className="text-[10px] text-ink/50">{data.examples.length} apps</p>
                      </div>
                    </div>

                    {/* Accordion */}
                    <motion.div
                      initial={false}
                      animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t-2 border-ink px-3 pb-3 pt-2">
                        <div className="flex flex-wrap gap-1">
                          {data.examples.map(ex => (
                            <span
                              key={ex}
                              className="inline-block rounded-full border border-ink/30 bg-background px-2 py-0.5 text-[10px] font-medium text-ink/70"
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                        {onSelectToolType && (
                          <button
                            className={cn(BTN_PRIMARY, "mt-2 w-full text-[10px]")}
                            onClick={e => { e.stopPropagation(); onSelectToolType(type); }}
                          >
                            Browse <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* ── Browse by Department ──────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SectionChip icon={Sparkles} accent="bg-sun" />
            <div>
              <h2 className="font-unbounded text-xl font-black text-ink">Browse by Department</h2>
              <p className="text-xs text-ink/60">Find AI Apps organised by business function</p>
            </div>
          </div>
          {selectedDepartment !== "All Departments" && (
            <button
              onClick={() => onSelectDepartment("All Departments")}
              className={cn(BTN_OUTLINE, "text-xs")}
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Object.entries(departmentData).map(([dept, data]) => {
            const Icon = data.icon;
            const isSelected = selectedDepartment === dept;
            const isExpanded = expandedDepartment === dept;

            return (
              <div key={dept} className="shrink-0 w-[220px]">
                <div
                  onClick={() => toggleDept(dept)}
                  className={cn(
                    CARD,
                    "cursor-pointer overflow-hidden transition-shadow hover:shadow-block-lg",
                    isSelected && "bg-sun/10 border-sun"
                  )}
                >
                  {/* Header row */}
                  <div className="flex items-center gap-3 p-4">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink",
                      data.accent
                    )}>
                      <Icon className="h-5 w-5 text-ink" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink leading-tight">{dept}</p>
                      <p className="text-[11px] text-ink/50">{data.subcategories.length} subcategories</p>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 shrink-0 text-ink/40 transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )} />
                  </div>

                  {/* Accordion */}
                  <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t-2 border-ink px-4 pb-4 pt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {data.subcategories.map(sub => (
                          <button
                            key={sub}
                            onClick={e => { e.stopPropagation(); onSelectDepartment(dept); }}
                            className="inline-flex items-center rounded-full border border-ink/30 bg-background px-2.5 py-1 text-[10px] font-medium text-ink/70 transition hover:border-ink hover:bg-sand"
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                      <button
                        className={cn(BTN_PRIMARY, "mt-3 w-full gap-1.5 text-xs")}
                        onClick={e => { e.stopPropagation(); onSelectDepartment(dept); }}
                      >
                        View all <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Browse by Industry ────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SectionChip icon={Globe} accent="bg-sky" />
            <div>
              <h2 className="font-unbounded text-xl font-black text-ink">Browse by Industry</h2>
              <p className="text-xs text-ink/60">Explore AI Apps tailored to your sector</p>
            </div>
          </div>
          {selectedSector !== "All Sectors" && (
            <button
              onClick={() => onSelectSector("All Sectors")}
              className={cn(BTN_OUTLINE, "text-xs")}
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Object.entries(industryData).map(([industry, data]) => {
            const Icon = data.icon;
            const isExpanded = expandedIndustry === industry;
            const hasSelectedSector = data.sectors.includes(selectedSector);

            return (
              <div key={industry} className="shrink-0 w-[220px]">
                <div
                  onClick={() => toggleIndustry(industry)}
                  className={cn(
                    CARD,
                    "cursor-pointer overflow-hidden transition-shadow hover:shadow-block-lg",
                    hasSelectedSector && "bg-sun/10 border-sun"
                  )}
                >
                  {/* Header row */}
                  <div className="flex items-center gap-3 p-4">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink",
                      data.accent
                    )}>
                      <Icon className="h-5 w-5 text-ink" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink leading-tight">{industry}</p>
                      <p className="text-[11px] text-ink/50">{data.sectors.length} sectors</p>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 shrink-0 text-ink/40 transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )} />
                  </div>

                  {/* Accordion */}
                  <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t-2 border-ink px-4 pb-3 pt-3 space-y-1">
                      {data.sectors.map(sector => (
                        <button
                          key={sector}
                          onClick={e => {
                            e.stopPropagation();
                            onSelectSector(selectedSector === sector ? "All Sectors" : sector);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition",
                            selectedSector === sector
                              ? "border-ink bg-ink text-cream"
                              : "border-ink/20 bg-background text-ink hover:border-ink hover:bg-sand"
                          )}
                        >
                          <span>{sector}</span>
                          <ArrowRight className="h-3 w-3 opacity-50" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export { departmentData, toolTypeData, industryData };
