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
  type LucideIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

interface CategoryBrowserProps {
  onSelectDepartment: (department: string) => void;
  onSelectSector: (sector: string) => void;
  selectedDepartment: string;
  selectedSector: string;
}

// Department icons and colors
const departmentData: Record<string, { icon: LucideIcon; gradient: string; glow: string; color: string; subcategories: string[] }> = {
  "Finance & Accounting": { 
    icon: Calculator, 
    gradient: "from-emerald-500 to-teal-600",
    glow: "group-hover:shadow-emerald-500/25",
    color: "text-emerald-500",
    subcategories: ["Billing & Invoicing", "Expense Tracking", "Tax & Compliance", "Profit Analysis", "Debt Recovery"]
  },
  "Legal & Compliance": { 
    icon: Scale, 
    gradient: "from-blue-500 to-indigo-600",
    glow: "group-hover:shadow-blue-500/25",
    color: "text-blue-500",
    subcategories: ["Contract Management", "Regulatory Compliance", "Dispute Resolution", "Safety & Audits", "Documentation"]
  },
  "Marketing & Sales": { 
    icon: Megaphone, 
    gradient: "from-pink-500 to-rose-600",
    glow: "group-hover:shadow-pink-500/25",
    color: "text-pink-500",
    subcategories: ["Outreach & Campaigns", "Customer Engagement", "Social Media", "Lead Generation", "Promotions & Offers"]
  },
  "Operations & Inventory": { 
    icon: Package, 
    gradient: "from-amber-500 to-orange-600",
    glow: "group-hover:shadow-amber-500/25",
    color: "text-amber-500",
    subcategories: ["Stock Management", "Supplier Relations", "Quality Control", "Maintenance", "Shift Operations"]
  },
  "HR & Staffing": { 
    icon: Users, 
    gradient: "from-violet-500 to-purple-600",
    glow: "group-hover:shadow-violet-500/25",
    color: "text-violet-500",
    subcategories: ["Recruitment", "Payroll & Benefits", "Performance", "Scheduling", "Discipline & Compliance"]
  },
  "Customer Service": { 
    icon: MessageSquare, 
    gradient: "from-cyan-500 to-sky-600",
    glow: "group-hover:shadow-cyan-500/25",
    color: "text-cyan-500",
    subcategories: ["Ticket Management", "FAQ & Knowledge Base", "Feedback & Reviews"]
  },
};

// Industry category icons
const industryData: Record<string, { icon: LucideIcon; gradient: string; glow: string; color: string; sectors: string[] }> = {
  "Services & Professional": {
    icon: Briefcase,
    gradient: "from-indigo-500 to-blue-600",
    glow: "group-hover:shadow-indigo-500/25",
    color: "text-indigo-500",
    sectors: ["Banking & Finance", "Legal Services", "Professional Services", "IT & Software", "Education & Training"]
  },
  "Retail & Commerce": {
    icon: Building2,
    gradient: "from-orange-500 to-red-600",
    glow: "group-hover:shadow-orange-500/25",
    color: "text-orange-500",
    sectors: ["Retail", "Food & Beverage", "Beauty & Wellness", "Hospitality & Tourism"]
  },
  "Industrial & Production": {
    icon: Factory,
    gradient: "from-slate-500 to-zinc-600",
    glow: "group-hover:shadow-slate-500/25",
    color: "text-slate-500",
    sectors: ["Manufacturing", "Agriculture & Farming", "Construction & Real Estate", "Energy & Utilities"]
  },
  "Logistics & Transport": {
    icon: Truck,
    gradient: "from-teal-500 to-emerald-600",
    glow: "group-hover:shadow-teal-500/25",
    color: "text-teal-500",
    sectors: ["Logistics", "Automotive & Transport", "Telecommunications"]
  },
  "Lifestyle & Entertainment": {
    icon: Heart,
    gradient: "from-rose-500 to-pink-600",
    glow: "group-hover:shadow-rose-500/25",
    color: "text-rose-500",
    sectors: ["Entertainment & Media", "Gaming & E-sports", "Sports & Fitness", "Weddings & Events", "Non-Profit & NGO"]
  },
  "Healthcare": {
    icon: Heart,
    gradient: "from-red-500 to-rose-600",
    glow: "group-hover:shadow-red-500/25",
    color: "text-red-500",
    sectors: ["Healthcare & Medical"]
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
  selectedSector 
}: CategoryBrowserProps) => {
  const [expandedDepartment, setExpandedDepartment] = useState<string | null>(null);
  const [expandedIndustry, setExpandedIndustry] = useState<string | null>(null);

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

  return (
    <div className="space-y-12">
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
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {Object.entries(departmentData).map(([dept, data]) => {
            const Icon = data.icon;
            const isSelected = selectedDepartment === dept;
            const isExpanded = expandedDepartment === dept;
            
            return (
              <motion.div key={dept} variants={itemVariants}>
                <Card 
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
                    "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500",
                    `bg-gradient-to-br ${data.gradient}`
                  )} />
                  
                  <CardContent className="p-0">
                    {/* Main clickable area */}
                    <div 
                      className="p-5 flex items-center gap-4"
                      onClick={() => handleDepartmentClick(dept)}
                    >
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
              <Building2 className="h-5 w-5 text-accent" />
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
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {Object.entries(industryData).map(([industry, data]) => {
            const Icon = data.icon;
            const isExpanded = expandedIndustry === industry;
            const hasSelectedSector = data.sectors.includes(selectedSector);
            
            return (
              <motion.div key={industry} variants={itemVariants}>
                <Card 
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
                    "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500",
                    `bg-gradient-to-br ${data.gradient}`
                  )} />
                  
                  <CardContent className="p-0">
                    {/* Main clickable area */}
                    <div 
                      className="p-5 flex items-center gap-4"
                      onClick={() => handleIndustryClick(industry)}
                    >
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

export { departmentData };
